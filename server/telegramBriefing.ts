// ============================================================================
// TELEGRAM DAILY BRIEFING
// ----------------------------------------------------------------------------
// Sends a market briefing to the briefing channel (default @calekyz) at
// 6am, 12pm, and 5pm EAT. Each message auto-deletes after 5 hours.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fetchRealCandles } from './marketData';
import { analyzeMarket } from './engine';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BRIEFING_CHANNEL = process.env.TELEGRAM_BRIEFING_CHANNEL_ID || '@calekyz';
const DELETE_AFTER_MS = 5 * 60 * 60 * 1000; // 5 hours
const STATE_FILE = path.join(
  process.env.PAYMENTS_DATA_DIR || process.cwd(),
  'briefing-state.json'
);

interface PendingDeletion { channel: string; messageId: number; deleteAt: number; }
let pendingDeletions: PendingDeletion[] = [];
const sentBriefings = new Set<string>();

function loadPendingDeletions(): void {
  try {
    if (!fs.existsSync(STATE_FILE)) return;
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (Array.isArray(data?.pendingDeletions)) {
      pendingDeletions = data.pendingDeletions.filter(
        (d: any) => d && typeof d.channel === 'string' && typeof d.messageId === 'number' && typeof d.deleteAt === 'number'
      );
    }
    if (Array.isArray(data?.sentBriefings)) {
      for (const k of data.sentBriefings) {
        if (typeof k === 'string') sentBriefings.add(k);
      }
    }
    console.log(`[Briefing] Loaded ${pendingDeletions.length} pending deletion(s), ${sentBriefings.size} sent marker(s)`);
  } catch (e: any) {
    console.warn('[Briefing] state load failed:', e?.message);
  }
}

function savePendingDeletions(): void {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ pendingDeletions, sentBriefings: [...sentBriefings] }, null, 2));
  } catch (e: any) {
    console.warn('[Briefing] state save failed:', e?.message);
  }
}

function scheduleDeletion(channel: string, messageId: number): void {
  pendingDeletions.push({ channel, messageId, deleteAt: Date.now() + DELETE_AFTER_MS });
  savePendingDeletions();
}

async function sweepDeletions(): Promise<void> {
  if (pendingDeletions.length === 0) return;
  const now = Date.now();
  const remaining: PendingDeletion[] = [];
  for (const d of pendingDeletions) {
    if (d.deleteAt > now) { remaining.push(d); continue; }
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: d.channel, message_id: d.messageId }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data?.ok) console.log(`[Briefing] Deleted msg ${d.messageId} from ${d.channel}`);
      else console.warn(`[Briefing] delete failed (${d.channel} ${d.messageId}):`, data?.description);
    } catch (e: any) {
      console.warn('[Briefing] delete failed:', e?.message);
      if (now - d.deleteAt < 24 * 3600 * 1000) remaining.push(d);
    }
  }
  pendingDeletions = remaining;
  savePendingDeletions();
}

loadPendingDeletions();

// ── Admin contact info ────────────────────────────────────────────────
const CONTACTS = {
  telegram: ['@mentor_calekyz', '@Peshfx'],
  whatsapp: ['+254726222093', '+254116081230'],
  email: 'piptraderaicustomer@gmail.com',
};

function escHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Format a date/time in EAT (Africa/Nairobi = UTC+3) ────────────────
function fmtEAT(ts?: number): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-KE', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return new Date(ts).toISOString().slice(11, 16);
  }
}

// ── Only these event titles qualify for the briefing ──────────────────
const TARGET_EVENT_RE = /(NFP|NON-?FARM|CPI|FOMC|PPI|FED FUNDS|INTEREST RATE|RATE DECISION|UNEMPLOYMENT|GDP)/i;

function isTargetEvent(ev: any): boolean {
  const t = String(ev?.title || '').toUpperCase();
  return TARGET_EVENT_RE.test(t);
}

// ── Get the engine's directional bias for key symbols ─────────────────
async function getEngineBiases(): Promise<Array<{ symbol: string; direction: string; confidence: number; trend: string; rsi: number; price: number }>> {
  const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'];
  const results: Array<any> = [];

  for (const sym of symbols) {
    try {
      const data = await fetchRealCandles(sym, 'H1');
      if (!data?.candles || data.candles.length < 30) continue;
      const plan = analyzeMarket({ symbol: sym, timeframe: 'H1', candles: data.candles });
      if (!plan) continue;
      results.push({
        symbol: sym,
        direction: plan.direction || 'WAIT',
        confidence: plan.confidence || 0,
        trend: plan.trend || 'Sideways',
        rsi: plan.rsi || 50,
        price: plan.currentPrice || 0,
      });
    } catch (e: any) {
      console.warn(`[Briefing] Failed to analyze ${sym}:`, e?.message);
    }
  }
  return results;
}

// ── Ask Gemini to write a summary + tip ───────────────────────────────
async function generateAISummary(
  session: 'asian' | 'noon' | 'nyc',
  events: Array<any>,
  biases: Array<any>
): Promise<{ summary: string; tip: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { summary: '', tip: '' };

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const eventLines = events.length
      ? events.map((e) => `${fmtEAT(e.timestamp)} EAT — ${e.title} (${e.currency || 'USD'})`).join('\n')
      : '(no high-impact events today)';

    const biasLines = biases.length
      ? biases.map((b) => `${b.symbol}: ${b.direction} @ ${b.confidence}% · Trend ${b.trend} · RSI ${b.rsi?.toFixed(1)} · Price ${b.price}`).join('\n')
      : '(no live bias available)';

    const sessionLabel = session === 'asian' ? 'Asian session' : session === 'noon' ? 'Midday session' : 'New York session';

    const prompt = `You are Nova, a market briefing writer for PipTraderAI. Write a SHORT ${sessionLabel} briefing.

TODAY'S HIGH-IMPACT EVENTS (EAT):
${eventLines}

LIVE ENGINE BIAS:
${biasLines}

Reply in STRICT format with two sections:

SUMMARY: 2-3 sentences describing the overall market outlook for this session. Be specific (name symbols and direction expectations like "bullish continuation on XAUUSD" or "breakout to the downside on EURUSD"). Reference the events if relevant.

TIP: 1 actionable trader tip (single sentence). Focus on risk, timing, or a specific level.

Keep it concise, professional, no fluff. No emojis in the text body.`;

    const resp = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.5, maxOutputTokens: 400 },
    });

    const text = (resp as any)?.text || '';
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=TIP:|$)/i);
    const tipMatch = text.match(/TIP:\s*([\s\S]*?)$/i);
    return {
      summary: (summaryMatch?.[1] || '').trim(),
      tip: (tipMatch?.[1] || '').trim(),
    };
  } catch (err: any) {
    console.warn('[Briefing] Gemini summary failed:', err?.message);
    return { summary: '', tip: '' };
  }
}

// ── Compose the full briefing message ─────────────────────────────────
async function buildBriefingMessage(session: 'asian' | 'noon' | 'nyc'): Promise<string> {
  // 1. Fetch events — try Deno proxy first (bypasses FF IP block on Render),
  //    then fall back to the direct FF URL (same strategy as the main engine)
  let events: Array<any> = [];
  const SOURCES = [
    'https://ready-chicken-5023.calekyz.deno.net',
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  ];
  try {
    let raw: any[] = [];
    for (const url of SOURCES) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.forexfactory.com/',
          },
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('json')) {
          console.warn(`[Briefing] ${url} returned ${contentType} (not JSON) — trying next`);
          continue;
        }
        const parsed = await res.json();
        if (Array.isArray(parsed) && parsed.length > 0) {
          raw = parsed;
          console.log(`[Briefing] Fetched ${raw.length} events from ${url}`);
          break;
        }
      } catch (e: any) {
        console.warn(`[Briefing] ${url} failed: ${e?.message}`);
      }
    }

    if (raw.length === 0) {
      console.warn('[Briefing] All event sources failed — no events will be shown');
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
    events = (Array.isArray(raw) ? raw : [])
      .filter((e) => isTargetEvent(e))
      .map((e: any) => ({
        title: e.title,
        currency: (e.country || 'USD').toUpperCase(),
        timestamp: e.date ? new Date(e.date).getTime() : 0,
      }))
      .filter((e) => e.timestamp >= today.getTime() && e.timestamp < tomorrow.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (err: any) {
    console.warn('[Briefing] Failed to fetch events:', err?.message);
  }

  // 2. Get engine bias
  const biases = await getEngineBiases();

  // 3. AI summary + tip
  const { summary, tip } = await generateAISummary(session, events, biases);

  // 4. Compose
  const sessionLabel = session === 'asian' ? 'Asian Session · 06:00 EAT' : session === 'noon' ? 'Midday Session · 12:00 EAT' : 'New York Session · 17:00 EAT';
  const lines: string[] = [];

  lines.push(`📊 <b>PIPTRADERAI MARKET BRIEFING</b>`);
  lines.push(`<i>${sessionLabel}</i>`);
  lines.push('');

  // Events section
  if (events.length > 0) {
    lines.push(`📅 <b>HIGH-IMPACT EVENTS TODAY</b>`);
    for (const e of events.slice(0, 6)) {
      lines.push(`• <b>${fmtEAT(e.timestamp)}</b> — ${escHtml(e.title)} · <i>${e.currency}</i>`);
    }
    lines.push('');
  } else {
    lines.push(`📅 <i>No high-impact events scheduled today.</i>`);
    lines.push('');
  }

  // Engine bias section
  if (biases.length > 0) {
    lines.push(`🎯 <b>ENGINE DIRECTIONAL BIAS (H1)</b>`);
    for (const b of biases) {
      const arrow = b.direction === 'BUY' ? '🟢' : b.direction === 'SELL' ? '🔴' : '⚪';
      lines.push(`${arrow} <b>${b.symbol}</b> · ${b.direction} @ ${b.confidence}% · Trend: ${b.trend}`);
    }
    lines.push('');
  }

  // AI summary
  if (summary) {
    lines.push(`⚠️ <b>WHAT TO WATCH</b>`);
    lines.push(escHtml(summary));
    lines.push('');
  }

  if (tip) {
    lines.push(`💡 <b>TRADER TIP</b>`);
    lines.push(`<i>${escHtml(tip)}</i>`);
    lines.push('');
  }

  // CTA + contacts
  lines.push('━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`🚀 <b>Want AI-verified live signals?</b>`);
  lines.push(`Subscribe to PipTraderAI → <a href="https://piptraderai.com">piptraderai.com</a>`);
  lines.push('');
  lines.push(`❓ <b>Questions? Reach us:</b>`);
  lines.push(`Telegram: ${CONTACTS.telegram.join(' · ')}`);
  lines.push(`WhatsApp: ${CONTACTS.whatsapp.join(' · ')}`);
  lines.push(`Email: ${CONTACTS.email}`);
  lines.push('');
  lines.push(`⏱ <i>This message auto-deletes in 5 hours.</i>`);

  return lines.join('\n');
}

// ── Send + schedule deletion ──────────────────────────────────────────
async function sendAndScheduleDeletion(text: string): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn('[Briefing] TELEGRAM_BOT_TOKEN not set');
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: BRIEFING_CHANNEL,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      console.error('[Briefing] sendMessage FAILED:', data?.description || res.status);
      return;
    }

    const messageId = data?.result?.message_id;
    if (!messageId) {
      console.warn('[Briefing] No message_id returned');
      return;
    }

    console.log(`[Briefing] Sent to ${BRIEFING_CHANNEL} (msg ${messageId}), will delete in 5h`);
    scheduleDeletion(BRIEFING_CHANNEL, messageId);
  } catch (err: any) {
    console.error('[Briefing] Send failed:', err?.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────
export async function sendDailyBriefing(session: 'asian' | 'noon' | 'nyc'): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log(`[Briefing] Building ${session} briefing...`);
    const msg = await buildBriefingMessage(session);
    await sendAndScheduleDeletion(msg);
    return { ok: true };
  } catch (err: any) {
    console.error('[Briefing] Failed:', err?.message);
    return { ok: false, error: err?.message };
  }
}

// ── Scheduler: fires at 6am + 12pm + 5pm EAT (UTC+3) ───────────────────
let schedulerInterval: NodeJS.Timeout | null = null;

const SESSIONS: Array<{ id: 'asian' | 'noon' | 'nyc'; startHour: number; endHour: number }> = [
  { id: 'asian', startHour: 6, endHour: 9 },
  { id: 'noon', startHour: 12, endHour: 15 },
  { id: 'nyc', startHour: 17, endHour: 20 },
];

export function startBriefingScheduler(): void {
  if (schedulerInterval) return;
  console.log(`[Briefing] Scheduler started (6am + 12pm + 5pm EAT → ${BRIEFING_CHANNEL})`);
  sweepDeletions().catch(() => {});

  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      const offsetHours = 3; // EAT = UTC+3
      const nairobiHour = (now.getUTCHours() + offsetHours) % 24;
      const nairobiDate = new Date(now.getTime() + offsetHours * 3600 * 1000).toISOString().slice(0, 10);

      for (const sess of SESSIONS) {
        if (nairobiHour >= sess.startHour && nairobiHour < sess.endHour) {
          const key = `${sess.id}:${nairobiDate}`;
          if (!sentBriefings.has(key)) {
            sentBriefings.add(key);
            savePendingDeletions(); // persist BEFORE send so a crash mid-send doesn't duplicate
            await sendDailyBriefing(sess.id);
          }
        }
      }

      await sweepDeletions();

      if (sentBriefings.size > 30) {
        const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
        for (const k of sentBriefings) {
          if (k.split(':')[1] < cutoff) sentBriefings.delete(k);
        }
        savePendingDeletions();
      }
    } catch (err: any) {
      console.warn('[Briefing] Scheduler tick failed:', err?.message);
    }
  }, 5 * 60 * 1000);
}

export function stopBriefingScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

export function isBriefingConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}
