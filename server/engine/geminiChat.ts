// ============================================================================
// HYBRID GEMINI CHAT
// ----------------------------------------------------------------------------
// Called by /api/engine/chat when the rule engine returns intent='unknown'.
// Gives users real ChatGPT-quality answers for open-ended questions while
// keeping the fast/free rule engine for structured queries.
// ============================================================================

import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiChatContext {
  user?: {
    firstName?: string;
    plan?: string;
    credits?: number;
    mt5Connected?: boolean;
  } | null;
  history?: ChatMessage[];
  // Optional live chart context (set when user is on AI Trading tab)
  chartContext?: {
    symbol?: string;
    timeframe?: string;
    trend?: string;
    rsi?: number;
    price?: number;
  };
}

export interface GeminiChatResult {
  reply: string;
  source: 'gemini' | 'skipped';
  model?: string;
  latencyMs?: number;
}

// ── In-memory client ──
let aiClient: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY missing');
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ── Model chain — same pattern as the verifier ──
const CHAT_MODEL_CHAIN = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

// ── System prompt ──
function buildSystemPrompt(ctx: GeminiChatContext): string {
  const lines: string[] = [];
  lines.push('You are Gemina, an expert trading assistant built into PipTraderAI.');
  lines.push('');
  lines.push('ROLE:');
  lines.push('- Answer trading questions concisely and professionally.');
  lines.push('- You help users understand market structure, indicators, setups, and risk.');
  lines.push('- You NEVER give financial advice — remind users to manage their own risk.');
  lines.push('- You speak in clear, short paragraphs. No fluff.');
  lines.push('');
  lines.push('TRADING TOPICS YOU CAN HELP WITH:');
  lines.push('- Market structure: BOS, CHoCH, order blocks, FVG, liquidity sweeps');
  lines.push('- Indicators: RSI, MACD, EMA, ATR, volume');
  lines.push('- Risk management: position sizing, R:R, drawdown, stop placement');
  lines.push('- News trading: NFP, CPI, FOMC, PPI, and their typical effects');
  lines.push('- Psychology: discipline, patience, journaling');
  lines.push('- Platform help: how to use PipTraderAI features');
  lines.push('');
  lines.push('LIMITS:');
  lines.push('- Do not invent specific prices/levels you were not given.');
  lines.push('- If asked for a trade setup, tell them to use the "Give me a setup for X" command.');
  lines.push('- Keep replies under ~250 words unless the user asks for detail.');
  lines.push('');

  if (ctx.user) {
    lines.push('CURRENT USER:');
    if (ctx.user.firstName) lines.push(`- Name: ${ctx.user.firstName}`);
    if (ctx.user.plan) lines.push(`- Plan: ${ctx.user.plan}`);
    if (typeof ctx.user.credits === 'number') lines.push(`- Credits: ${ctx.user.credits}`);
    if (ctx.user.mt5Connected) lines.push(`- MT5: connected`);
    lines.push('');
  }

  if (ctx.chartContext && (ctx.chartContext.symbol || ctx.chartContext.price)) {
    lines.push('LIVE CHART CONTEXT:');
    if (ctx.chartContext.symbol) lines.push(`- Symbol: ${ctx.chartContext.symbol}`);
    if (ctx.chartContext.timeframe) lines.push(`- Timeframe: ${ctx.chartContext.timeframe}`);
    if (ctx.chartContext.price) lines.push(`- Current price: ${ctx.chartContext.price}`);
    if (ctx.chartContext.trend) lines.push(`- Trend: ${ctx.chartContext.trend}`);
    if (typeof ctx.chartContext.rsi === 'number') lines.push(`- RSI: ${ctx.chartContext.rsi.toFixed(1)}`);
    lines.push('');
  }

  lines.push('If the user\'s question is unclear, ask a short clarifying question.');
  return lines.join('\n');
}

// ── Convert our history to Gemini's format ──
function buildContents(message: string, history: ChatMessage[]) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Last 8 messages max (avoid huge context)
  const recent = (history || []).slice(-8);

  for (const h of recent) {
    if (!h.text || h.text.trim().length === 0) continue;
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text.slice(0, 2000) }],
    });
  }

  // Current user message
  contents.push({
    role: 'user',
    parts: [{ text: message.slice(0, 2000) }],
  });

  return contents;
}

// ── Public API ──
export async function geminiChatReply(
  message: string,
  ctx: GeminiChatContext = {}
): Promise<GeminiChatResult> {
  const t0 = Date.now();

  // Skip trivially short messages that Gemini would only waste tokens on
  if (!message || message.trim().length < 3) {
    return { reply: '', source: 'skipped' };
  }

  const systemPrompt = buildSystemPrompt(ctx);
  const contents = buildContents(message, ctx.history || []);

  const HARD_TIMEOUT_MS = 15000;
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('chat_timeout_15s')), HARD_TIMEOUT_MS)
  );

  const attemptAll = async (): Promise<GeminiChatResult> => {
    let lastErr: any = null;
    const ai = getClient();

    for (const tryModel of CHAT_MODEL_CHAIN) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const resp: any = await ai.models.generateContent({
            model: tryModel,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          });
          const text = (resp?.text || '').trim();
          if (!text) throw new Error('empty response');

          const latencyMs = Date.now() - t0;
          console.log(`[GeminiChat] OK via ${tryModel} in ${latencyMs}ms`);
          return { reply: text, source: 'gemini', model: tryModel, latencyMs };
        } catch (err: any) {
          lastErr = err;
          const msg = String(err?.message || '');
          const is503 = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
          const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');

          if ((is503 || is429) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          console.warn(`[GeminiChat] ${tryModel} failed: ${msg.slice(0, 100)}`);
          break;
        }
      }
    }
    throw lastErr || new Error('all chat models exhausted');
  };

  try {
    return await Promise.race([attemptAll(), timeout]);
  } catch (err: any) {
    console.warn('[GeminiChat] all attempts failed — returning skipped:', err?.message);
    return { reply: '', source: 'skipped' };
  }
}
