// ============================================================================
// TELEGRAM SIGNAL BROADCASTING (v2)
// ----------------------------------------------------------------------------
// • Multi-channel: TELEGRAM_SIGNAL_GROUPS=@a,@b (falls back to TELEGRAM_CHANNEL_ID)
// • Auto-deletes previous signal per channel before next one lands
// • 4-hour dedupe window (TELEGRAM_DEDUPE_MINUTES, default 240)
// • Persistent state file so restarts don't wipe dedupe / last-msg-id
// ============================================================================

import fs from 'fs';
import path from 'path';

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

const BOT_TOKEN = process.env.TELEGRAM_SIGNAL_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';

function resolveChannels(): string[] {
  const raw =
    process.env.TELEGRAM_SIGNAL_GROUPS ||
    process.env.TELEGRAM_CHANNEL_ID ||
    '@peshfx';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
const CHANNELS = resolveChannels();

const ENABLED = process.env.TELEGRAM_SIGNALS_ENABLED !== 'false';
const DEDUPE_WINDOW_MS =
  Number(process.env.TELEGRAM_DEDUPE_MINUTES || 240) * 60 * 1000;
const DELETE_PREVIOUS = process.env.TELEGRAM_DELETE_PREVIOUS !== 'false';

const STATE_FILE = path.join(
  process.env.PAYMENTS_DATA_DIR || process.cwd(),
  'telegram-state.json'
);

const dedupeCache: Map<string, number> = new Map();
const lastMessageId: Map<string, number> = new Map();

// ── Persistence ───────────────────────────────────────────────────
function loadState(): void {
  try {
    if (!fs.existsSync(STATE_FILE)) return;
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const now = Date.now();
    if (data?.dedupe) {
      for (const [k, v] of Object.entries(data.dedupe)) {
        if (typeof v === 'number' && now - v < DEDUPE_WINDOW_MS) {
          dedupeCache.set(k, v);
        }
      }
    }
    if (data?.lastMessageId) {
      for (const [k, v] of Object.entries(data.lastMessageId)) {
        if (typeof v === 'number') lastMessageId.set(k, v);
      }
    }
    console.log(
      `[Telegram] Loaded state: ${dedupeCache.size} dedupe, ${lastMessageId.size} msgIds`
    );
  } catch (e: any) {
    console.warn('[Telegram] state load failed:', e?.message);
  }
}

function saveState(): void {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(
        {
          dedupe: Object.fromEntries(dedupeCache),
          lastMessageId: Object.fromEntries(lastMessageId),
        },
        null,
        2
      )
    );
  } catch (e: any) {
    console.warn('[Telegram] state save failed:', e?.message);
  }
}

loadState();

// ── Dedupe ────────────────────────────────────────────────────────
function dedupeKey(sig: TelegramSignalInput): string {
  // No confidence bucket — any same-symbol/direction/timeframe within window is a dup
  return `${sig.symbol}|${sig.direction}|${sig.timeframe || 'M15'}`;
}

function isDuplicate(key: string): boolean {
  const last = dedupeCache.get(key);
  if (last && Date.now() - last < DEDUPE_WINDOW_MS) return true;
  dedupeCache.set(key, Date.now());
  if (dedupeCache.size > 500) {
    const cutoff = Date.now() - DEDUPE_WINDOW_MS;
    for (const [k, v] of dedupeCache) if (v < cutoff) dedupeCache.delete(k);
  }
  return false;
}

// ── HTML escape ───────────────────────────────────────────────────
function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Message builder ──────────────────────────────────────────────
function buildMessage(sig: TelegramSignalInput): string {
  const emoji = sig.direction === 'BUY' ? '🟢' : '🔴';
  const arrow = sig.direction === 'BUY' ? '📈' : '📉';

  const lines: string[] = [];
  lines.push(
    `${emoji} <b>${sig.direction} ${esc(sig.symbol)}</b> · ${esc(
      sig.timeframe || 'M15'
    )}`
  );
  lines.push(`${arrow} Confidence: <b>${sig.confidence}%</b>`);
  lines.push(`🎯 Setup: ${esc(sig.setupType || 'Standard')}`);
  lines.push('');

  if (sig.entry !== undefined) lines.push(`📍 Entry: <code>${esc(sig.entry)}</code>`);
  if (sig.stopLoss !== undefined) lines.push(`🛑 SL: <code>${esc(sig.stopLoss)}</code>`);
  if (sig.takeProfit1 !== undefined)
    lines.push(`✅ TP1: <code>${esc(sig.takeProfit1)}</code>`);
  if (sig.takeProfit2 !== undefined)
    lines.push(`✅ TP2: <code>${esc(sig.takeProfit2)}</code>`);
  if (sig.riskReward) lines.push(`⚖️ R:R 1:${sig.riskReward.toFixed(1)}`);

  if (sig.reasons && sig.reasons.length > 0) {
    lines.push('');
    lines.push('<b>Why:</b>');
    sig.reasons.slice(0, 4).forEach((r) => lines.push(`• ${esc(r)}`));
  }

  if (sig.aiVerdict) {
    lines.push('');
    const aiEmoji =
      sig.aiVerdict === 'AGREE' ? '✅' : sig.aiVerdict === 'CAUTION' ? '⚠️' : '❌';
    lines.push(
      `${aiEmoji} AI Verifier: <b>${sig.aiVerdict}</b>${
        sig.aiConfidence ? ` (${sig.aiConfidence}%)` : ''
      }`
    );
    if (sig.aiSummary) lines.push(`<i>${esc(sig.aiSummary)}</i>`);
  }

  lines.push('');
  lines.push('<i>PipTraderAI · piptraderai.com</i>');
  return lines.join('\n');
}

// ── Telegram API wrapper ─────────────────────────────────────────
async function tgApi(method: string, body: object): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.description || `HTTP ${res.status}`);
  }
  return data;
}

async function sendToChannel(channel: string, text: string): Promise<void> {
  const prevId = lastMessageId.get(channel);

  // 1. Send new message FIRST so a failure doesn't lose the old one
  const data = await tgApi('sendMessage', {
    chat_id: channel,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  const newId = data?.result?.message_id;
  if (newId) {
    lastMessageId.set(channel, newId);
    saveState();
  }

  // 2. Delete the previous signal message (only after new one succeeded)
  if (DELETE_PREVIOUS && prevId && prevId !== newId) {
    try {
      await tgApi('deleteMessage', { chat_id: channel, message_id: prevId });
      console.log(`[Telegram] Deleted previous msg ${prevId} in ${channel}`);
    } catch (e: any) {
      console.warn(`[Telegram] delete failed (${channel}):`, e?.message);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────
export async function sendSignalToTelegram(
  sig: TelegramSignalInput
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    if (!BOT_TOKEN)
      return { ok: false, skipped: true, error: 'TELEGRAM_BOT_TOKEN not set' };
    if (!ENABLED) return { ok: false, skipped: true, error: 'signals disabled' };
    if (sig.direction !== 'BUY' && sig.direction !== 'SELL')
      return { ok: false, skipped: true };
    if ((sig.confidence || 0) < 75)
      return { ok: false, skipped: true, error: 'confidence below 75' };

    const key = dedupeKey(sig);
    if (isDuplicate(key)) {
      return {
        ok: false,
        skipped: true,
        error: `duplicate within ${DEDUPE_WINDOW_MS / 60000}min`,
      };
    }

    const text = buildMessage(sig);
    const results = await Promise.allSettled(
      CHANNELS.map((ch) => sendToChannel(ch, text))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(
          `[Telegram] ${CHANNELS[i]} failed:`,
          (r.reason as any)?.message
        );
      }
    });

    if (failed.length === CHANNELS.length)
      return { ok: false, error: 'all channels failed' };

    console.log(
      `[Telegram] Sent ${sig.direction} ${sig.symbol} (${sig.confidence}%) to ${CHANNELS.length - failed.length}/${CHANNELS.length} channel(s)`
    );
    return { ok: true };
  } catch (err: any) {
    console.warn('[Telegram] error:', err?.message);
    return { ok: false, error: err?.message };
  }
}

export function isTelegramConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}
