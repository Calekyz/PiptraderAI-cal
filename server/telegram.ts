// ============================================================================
// TELEGRAM SIGNAL BROADCASTING
// ----------------------------------------------------------------------------
// Sends AI-verified, high-confidence signals to a Telegram channel.
// Fire-and-forget — never blocks API responses.
// ============================================================================

interface TelegramSignalInput {
  symbol: string;
  timeframe?: string;
  direction: 'BUY' | 'SELL';
  confidence: number;
  setupType: string;
  entry?: number | string;
  stopLoss?: number | string;
  takeProfit1?: number | string;
  takeProfit2?: number | string;
  riskReward?: number;
  reasons?: string[];
  aiVerdict?: 'AGREE' | 'CAUTION' | 'DISAGREE';
  aiConfidence?: number;
  aiSummary?: string;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@peshyFx';
const ENABLED = process.env.TELEGRAM_SIGNALS_ENABLED !== 'false'; // default ON if token exists

// ── Deduplication (don't spam the same signal) ─────────────────────
const DEDUPE_WINDOW_MS = 15 * 60 * 1000; // 15 min
const dedupeCache: Map<string, number> = new Map();

function dedupeKey(sig: TelegramSignalInput): string {
  const confBucket = Math.round((sig.confidence || 0) / 5) * 5;
  return `${sig.symbol}|${sig.direction}|${confBucket}|${sig.timeframe || 'M15'}`;
}

function isDuplicate(key: string): boolean {
  const last = dedupeCache.get(key);
  if (last && Date.now() - last < DEDUPE_WINDOW_MS) return true;
  dedupeCache.set(key, Date.now());
  // Prune old entries
  if (dedupeCache.size > 200) {
    const cutoff = Date.now() - DEDUPE_WINDOW_MS;
    for (const [k, v] of dedupeCache) if (v < cutoff) dedupeCache.delete(k);
  }
  return false;
}

// ── HTML escape (Telegram parse_mode: HTML is safer than Markdown) ──
function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Build the message ─────────────────────────────────────────────
function buildMessage(sig: TelegramSignalInput): string {
  const emoji = sig.direction === 'BUY' ? '🟢' : '🔴';
  const arrow = sig.direction === 'BUY' ? '📈' : '📉';

  const lines: string[] = [];
  lines.push(`${emoji} <b>${sig.direction} ${esc(sig.symbol)}</b> · ${esc(sig.timeframe || 'M15')}`);
  lines.push(`${arrow} Confidence: <b>${sig.confidence}%</b>`);
  lines.push(`🎯 Setup: ${esc(sig.setupType || 'Standard')}`);
  lines.push('');

  if (sig.entry !== undefined) lines.push(`📍 Entry: <code>${esc(sig.entry)}</code>`);
  if (sig.stopLoss !== undefined) lines.push(`🛑 SL: <code>${esc(sig.stopLoss)}</code>`);
  if (sig.takeProfit1 !== undefined) lines.push(`✅ TP1: <code>${esc(sig.takeProfit1)}</code>`);
  if (sig.takeProfit2 !== undefined) lines.push(`✅ TP2: <code>${esc(sig.takeProfit2)}</code>`);
  if (sig.riskReward) lines.push(`⚖️ R:R 1:${sig.riskReward.toFixed(1)}`);

  if (sig.reasons && sig.reasons.length > 0) {
    lines.push('');
    lines.push('<b>Why:</b>');
    sig.reasons.slice(0, 4).forEach((r) => lines.push(`• ${esc(r)}`));
  }

  if (sig.aiVerdict) {
    lines.push('');
    const aiEmoji = sig.aiVerdict === 'AGREE' ? '✅' : sig.aiVerdict === 'CAUTION' ? '⚠️' : '❌';
    lines.push(`${aiEmoji} AI Verifier: <b>${sig.aiVerdict}</b>${sig.aiConfidence ? ` (${sig.aiConfidence}%)` : ''}`);
    if (sig.aiSummary) lines.push(`<i>${esc(sig.aiSummary)}</i>`);
  }

  lines.push('');
  lines.push('<i>PipTraderAI · piptraderai.com</i>');

  return lines.join('\n');
}

// ── Public API ────────────────────────────────────────────────────
export async function sendSignalToTelegram(sig: TelegramSignalInput): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  // Fail-safe: never throw, always return a result
  try {
    if (!BOT_TOKEN) return { ok: false, skipped: true, error: 'TELEGRAM_BOT_TOKEN not set' };
    if (!ENABLED) return { ok: false, skipped: true, error: 'Telegram signals disabled' };

    // Gate: only BUY/SELL with confidence >= 75
    if (sig.direction !== 'BUY' && sig.direction !== 'SELL') return { ok: false, skipped: true };
    if ((sig.confidence || 0) < 75) return { ok: false, skipped: true, error: 'confidence below 75' };

    // Dedupe
    const key = dedupeKey(sig);
    if (isDuplicate(key)) return { ok: false, skipped: true, error: 'duplicate within 15min' };

    const text = buildMessage(sig);
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      console.warn('[Telegram] sendMessage failed:', data?.description || res.status);
      return { ok: false, error: data?.description || `HTTP ${res.status}` };
    }

    console.log(`[Telegram] Sent ${sig.direction} ${sig.symbol} (${sig.confidence}%) to ${CHANNEL_ID}`);
    return { ok: true };
  } catch (err: any) {
    console.warn('[Telegram] error:', err?.message);
    return { ok: false, error: err?.message };
  }
}

export function isTelegramConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}
