// ============================================================================
// TELEGRAM SIGNAL BROADCASTING (v3 — DB-backed state)
// ----------------------------------------------------------------------------
// • Multi-channel: TELEGRAM_SIGNAL_GROUPS=@a,@b (falls back to TELEGRAM_CHANNEL_ID)
// • Auto-deletes previous signal per channel before next one lands
// • 4-hour dedupe window (TELEGRAM_DEDUPE_MINUTES, default 240)
// • Persistent state in Postgres (pipnex_kv_store) — survives deploys/restarts
// ============================================================================

import { kvGet, kvSet } from './db';

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
    '@peshyFx';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
const CHANNELS = resolveChannels();

const ENABLED = process.env.TELEGRAM_SIGNALS_ENABLED !== 'false';
const DEDUPE_WINDOW_MS =
  Number(process.env.TELEGRAM_DEDUPE_MINUTES || 240) * 60 * 1000;
// Each signal lives for this long, then auto-deletes. 0 = never delete.
const SIGNAL_TTL_MS = Number(process.env.TELEGRAM_SIGNAL_TTL_MINUTES || 60) * 60 * 1000;

const STATE_KEY = 'telegram:signal-state';

const dedupeCache: Map<string, number> = new Map();
const lastMessageId: Map<string, number> = new Map();

interface PendingDeletion { channel: string; messageId: number; deleteAt: number; }
let pendingDeletions: PendingDeletion[] = [];

// ── DB-backed state ───────────────────────────────────────────────
export async function initTelegramSignalState(): Promise<void> {
  try {
    const data = await kvGet<{
      dedupe: Record<string, number>;
      lastMessageId: Record<string, number>;
    }>(STATE_KEY);
    if (!data) {
      console.log('[Telegram] No persisted state — starting fresh');
      return;
    }
    const now = Date.now();
    if (data.dedupe) {
      for (const [k, v] of Object.entries(data.dedupe)) {
        if (typeof v === 'number' && now - v < DEDUPE_WINDOW_MS) dedupeCache.set(k, v);
      }
    }
    if (data.lastMessageId) {
      for (const [k, v] of Object.entries(data.lastMessageId)) {
        if (typeof v === 'number') lastMessageId.set(k, v);
      }
    }
    if (Array.isArray((data as any).pendingDeletions)) {
      pendingDeletions = ((data as any).pendingDeletions as any[]).filter(
        (d) => d && typeof d.channel === 'string' && typeof d.messageId === 'number' && typeof d.deleteAt === 'number'
      );
    }
    console.log(
      `[Telegram] Loaded state from DB: ${dedupeCache.size} dedupe, ${lastMessageId.size} msgIds, ${pendingDeletions.length} pending deletes`
    );
  } catch (e: any) {
    console.warn('[Telegram] state load failed:', e?.message);
  }
}

async function persistState(): Promise<void> {
  try {
    await kvSet(STATE_KEY, {
      dedupe: Object.fromEntries(dedupeCache),
      lastMessageId: Object.fromEntries(lastMessageId),
      pendingDeletions,
    });
  } catch (e: any) {
    console.warn('[Telegram] state save failed:', e?.message);
  }
}

// ── Dedupe ────────────────────────────────────────────────────────
function dedupeKey(sig: TelegramSignalInput): string {
  return `${sig.symbol}|${sig.direction}|${sig.timeframe || 'M15'}`;
}

function isDuplicate(key: string): boolean {
  const last = dedupeCache.get(key);
  if (last && Date.now() - last < DEDUPE_WINDOW_MS) return true;
  return false;
}

function markSent(key: string): void {
  dedupeCache.set(key, Date.now());
  if (dedupeCache.size > 500) {
    const cutoff = Date.now() - DEDUPE_WINDOW_MS;
    for (const [k, v] of dedupeCache) if (v < cutoff) dedupeCache.delete(k);
  }
  persistState().catch(() => {});
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
  const data = await tgApi('sendMessage', {
    chat_id: channel,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  const newId = data?.result?.message_id;
  if (newId) {
    lastMessageId.set(channel, newId);
    if (SIGNAL_TTL_MS > 0) {
      pendingDeletions.push({
        channel,
        messageId: newId,
        deleteAt: Date.now() + SIGNAL_TTL_MS,
      });
      console.log(`[Telegram] Scheduled delete of msg ${newId} in ${channel} (TTL ${SIGNAL_TTL_MS / 60000}min)`);
    }
    await persistState();
  }
}

// ── Sweeper: delete expired signals ────────────────────────────
export async function sweepTelegramSignalDeletions(): Promise<void> {
  if (pendingDeletions.length === 0) return;
  const now = Date.now();
  const remaining: PendingDeletion[] = [];
  for (const d of pendingDeletions) {
    if (d.deleteAt > now) { remaining.push(d); continue; }
    try {
      await tgApi('deleteMessage', { chat_id: d.channel, message_id: d.messageId });
      console.log(`[Telegram] TTL delete: msg ${d.messageId} from ${d.channel}`);
    } catch (e: any) {
      const msg = String(e?.message || '');
      // Permanent errors — don't retry. Message is already gone or unreachable.
      const isPermanent =
        /message to delete not found/i.test(msg) ||
        /message can't be deleted/i.test(msg) ||
        /message_id_invalid/i.test(msg) ||
        /chat not found/i.test(msg);

      if (isPermanent) {
        console.log(`[Telegram] TTL drop (permanent error): msg ${d.messageId} from ${d.channel} — ${msg}`);
        // don't push to remaining → it gets removed
      } else {
        console.warn(`[Telegram] TTL delete failed (${d.channel} ${d.messageId}):`, msg);
        // Retry only if less than 24h old
        if (now - d.deleteAt < 24 * 3600 * 1000) remaining.push(d);
      }
    }
  }
  if (remaining.length !== pendingDeletions.length) {
    pendingDeletions = remaining;
    await persistState();
  }
}

// ── Start a 5-min sweeper for signal TTL deletions ─────────────
let signalSweeper: NodeJS.Timeout | null = null;
export function startSignalDeletionSweeper(): void {
  if (signalSweeper) return;
  console.log(`[Telegram] Signal deletion sweeper started (every 5 min)`);
  signalSweeper = setInterval(() => {
    sweepTelegramSignalDeletions().catch((e) => console.warn('[Telegram] sweep failed:', e?.message));
  }, 5 * 60 * 1000);
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

    if (failed.length === CHANNELS.length) {
      // All channels failed — do NOT mark dedupe so retries can succeed later
      console.warn(`[Telegram] All channels failed — dedupe NOT recorded`);
      return { ok: false, error: 'all channels failed' };
    }

    // Only mark as sent if at least one channel succeeded
    markSent(key);

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
