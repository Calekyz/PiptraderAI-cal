// ============================================================================
// GEMINI VERIFIER — silent quality check on engine signals
// ----------------------------------------------------------------------------
// Called by server routes ONLY. Never user-facing.
// Fails closed: any error → 'SKIPPED', engine signal is shown unchanged.
// ============================================================================

import { GoogleGenAI } from '@google/genai';

export interface VerifyInput {
  symbol: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  setupType: string;
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  riskReward?: number;
  reasons: string[];
  // Optional context
  trend?: string;
  session?: string;
  rsi?: number;
  newsContext?: string;
  chartImageBase64?: string;
}

export interface VerifyResult {
  verdict: 'AGREE' | 'CAUTION' | 'DISAGREE' | 'SKIPPED';
  aiConfidence: number;
  summary: string;
  reasoning: string;
  alternative?: string;
  model: string;
  latencyMs: number;
  cached?: boolean;
}

// ── Rate limit / dedupe state (in-memory, process-scoped) ──────────────────
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;   // 5 min
const GLOBAL_LIMIT_PER_HOUR = 60;         // safety cap
const HOUR_MS = 60 * 60 * 1000;

const dedupeCache: Map<string, { at: number; result: VerifyResult }> = new Map();
let hourlyCount = 0;
let hourWindowStart = Date.now();

function dedupeKey(i: VerifyInput): string {
  return `${i.symbol}|${i.direction}|${Math.round(i.confidence / 5) * 5}|${i.timeframe}`;
}

function checkGlobalCap(): boolean {
  const now = Date.now();
  if (now - hourWindowStart >= HOUR_MS) {
    hourlyCount = 0;
    hourWindowStart = now;
  }
  return hourlyCount < GLOBAL_LIMIT_PER_HOUR;
}

// ── Gemini client (lazy, mirrors server.ts pattern) ────────────────────────
let aiClient: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY missing');
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt(i: VerifyInput): string {
  const ctx: string[] = [];
  if (i.trend) ctx.push(`Trend: ${i.trend}`);
  if (i.session) ctx.push(`Session: ${i.session}`);
  if (i.rsi !== undefined) ctx.push(`RSI: ${i.rsi.toFixed(1)}`);
  if (i.newsContext) ctx.push(`News context: ${i.newsContext}`);

  return `You are a silent trading-signal auditor. A rule-based engine produced the signal below. Your ONLY job is to sanity-check it. Do NOT invent levels. Do NOT give financial advice. Be honest and terse.

ENGINE SIGNAL
- Symbol: ${i.symbol} (${i.timeframe})
- Direction: ${i.direction}
- Confidence: ${i.confidence}%
- Setup: ${i.setupType}
- Entry: ${i.entry ?? 'n/a'}
- Stop Loss: ${i.stopLoss ?? 'n/a'}
- TP1: ${i.takeProfit1 ?? 'n/a'}
- TP2: ${i.takeProfit2 ?? 'n/a'}
- R:R: ${i.riskReward ? `1:${i.riskReward.toFixed(1)}` : 'n/a'}

ENGINE REASONS
${i.reasons.length ? i.reasons.map(r => `- ${r}`).join('\n') : '- (none provided)'}

MARKET CONTEXT
${ctx.length ? ctx.map(c => `- ${c}`).join('\n') : '- (none)'}

Respond in STRICT JSON only, no markdown, no code fences:
{
  "verdict": "AGREE" | "CAUTION" | "DISAGREE",
  "aiConfidence": <integer 0-100>,
  "summary": "<one short sentence>",
  "reasoning": "<2-4 sentences explaining your verdict>",
  "alternative": "<if DISAGREE, a concrete alternative; else empty string>"
}`;
}

// ── Verdict parser ─────────────────────────────────────────────────────────
function parseVerdict(raw: string): { verdict: 'AGREE'|'CAUTION'|'DISAGREE'; aiConfidence: number; summary: string; reasoning: string; alternative?: string } {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  const json = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
  const obj = JSON.parse(json);
  const v = String(obj.verdict || '').toUpperCase();
  const verdict = (v === 'AGREE' || v === 'CAUTION' || v === 'DISAGREE') ? v : 'CAUTION';
  return {
    verdict: verdict as any,
    aiConfidence: Math.max(0, Math.min(100, Number(obj.aiConfidence) || 0)),
    summary: String(obj.summary || '').slice(0, 240),
    reasoning: String(obj.reasoning || '').slice(0, 800),
    alternative: obj.alternative ? String(obj.alternative).slice(0, 400) : undefined,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function verifySignal(input: VerifyInput): Promise<VerifyResult> {
  const t0 = Date.now();
  const model = 'gemini-flash-latest';  // auto-updates to newest Flash model

  // 1. Dedupe check
  const key = dedupeKey(input);
  const cached = dedupeCache.get(key);
  if (cached && Date.now() - cached.at < DEDUPE_WINDOW_MS) {
    return { ...cached.result, cached: true, latencyMs: Date.now() - t0 };
  }

  // 2. Global cap check
  if (!checkGlobalCap()) {
    console.warn('[GeminiVerifier] hourly cap reached — skipping');
    return {
      verdict: 'SKIPPED',
      aiConfidence: 0,
      summary: 'AI verification temporarily unavailable.',
      reasoning: 'Rate limit reached — engine signal stands on its own.',
      model,
      latencyMs: Date.now() - t0,
    };
  }

  // 3. Call Gemini — retry across multiple models to survive 503 spikes
  // Ordered by reliability on free tier (tested 2026-09-30):
  //   gemini-flash-lite-latest  → always 200, ~1.1s
  //   gemini-3.1-flash-lite     → always 200, ~3s
  //   gemini-flash-latest       → sometimes 429
  //   gemini-3.8-flash          → often 503, last resort
  const MODEL_CHAIN = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  try {
    const ai = getClient();
    const parts: any[] = [{ text: buildPrompt(input) }];
    if (input.chartImageBase64) {
      const b64 = input.chartImageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({ inlineData: { mimeType: 'image/png', data: b64 } });
    }

    // Hard cap: 9 seconds total for the entire retry chain.
    // If Gemini is slow (503 spikes), we bail to SKIPPED so user never waits.
    const HARD_TIMEOUT_MS = 9000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('verifier hard timeout')), HARD_TIMEOUT_MS)
    );

    const attemptAll = async (): Promise<VerifyResult> => {
    let lastErr: any = null;

    for (const tryModel of MODEL_CHAIN) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const resp = await ai.models.generateContent({
            model: tryModel,
            contents: [{ role: 'user', parts }],
          });

          const raw = (resp as any)?.text
            || (resp as any)?.candidates?.[0]?.content?.parts?.[0]?.text
            || '';
          if (!raw) throw new Error('empty response');

          const parsed = parseVerdict(raw);
          const result: VerifyResult = {
            ...parsed,
            model: tryModel,
            latencyMs: Date.now() - t0,
          };

          hourlyCount += 1;
          dedupeCache.set(key, { at: Date.now(), result });
          if (dedupeCache.size > 500) {
            const cutoff = Date.now() - DEDUPE_WINDOW_MS;
            for (const [k, v] of dedupeCache) if (v.at < cutoff) dedupeCache.delete(k);
          }

          console.log(`[GeminiVerifier] OK via ${tryModel} in ${result.latencyMs}ms`);
          return result;
        } catch (err: any) {
          lastErr = err;
          const msg = String(err?.message || '');
          const retryable = msg.includes('503')
            || msg.includes('UNAVAILABLE')
            || msg.includes('high demand')
            || msg.includes('429')
            || msg.includes('RESOURCE_EXHAUSTED');

          if (retryable && attempt === 0) {
            const delay = 500;
            console.warn(`[GeminiVerifier] ${tryModel} busy — retry in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          // Non-retryable OR 2nd attempt failed → next model
          console.warn(`[GeminiVerifier] ${tryModel} failed: ${msg.slice(0, 120)}`);
          break;
        }
      }
    }

    // All models exhausted
    throw lastErr || new Error('all Gemini models exhausted');
    }; // end attemptAll

    return await Promise.race([attemptAll(), timeoutPromise]);
  } catch (err: any) {
    console.warn('[GeminiVerifier] all attempts failed — returning SKIPPED:', err?.message);
    return {
      verdict: 'SKIPPED',
      aiConfidence: 0,
      summary: 'AI verification unavailable.',
      reasoning: 'Engine signal stands on its own.',
      model,
      latencyMs: Date.now() - t0,
    };
  }
}
