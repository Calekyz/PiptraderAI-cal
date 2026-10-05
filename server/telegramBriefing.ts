// ============================================================================
// TELEGRAM DAILY BRIEFING
// ----------------------------------------------------------------------------
// Sends a market briefing to the briefing channel (default @calekyz) at
// 6am and 4pm EAT. Each message auto-deletes after 5 hours.
// ============================================================================

import { fetchRealCandles } from './marketData';
import { analyzeMarket } from './engine';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BRIEFING_CHANNEL = process.env.TELEGRAM_BRIEFING_CHANNEL_ID || '@calekyz';
const DELETE_AFTER_MS = 5 * 60 * 60 * 1000; // 5 hours

// ── Admin contact info ────────────────────────────────────────────────
const CONTACTS = {
  telegram: ['@mentor_calekyz', '@peshy'],
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
  session: 'asian' | 'nyc',
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

    const sessionLabel = session === 'asian' ? 'Asian session' : 'New York session';

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
async function buildBriefingMessage(session: 'asian' | 'nyc'): Promise<string> {
  // 1. Fetch events
  let events: Array<any> = [];
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    const raw: any[] = await res.json();
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
  const sessionLabel = session === 'asian' ? 'Asian Session · 06:00 EAT' : 'New York Session · 16:00 EAT';
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

    // Schedule deletion
    setTimeout(async () => {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: BRIEFING_CHANNEL, message_id: messageId }),
        });
        console.log(`[Briefing] Deleted msg ${messageId}`);
      } catch (err: any) {
        console.warn('[Briefing] Delete failed:', err?.message);
      }
    }, DELETE_AFTER_MS);
  } catch (err: any) {
    console.error('[Briefing] Send failed:', err?.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────
export async function sendDailyBriefing(session: 'asian' | 'nyc'): Promise<{ ok: boolean; error?: string }> {
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

// ── Scheduler: fires at 6am + 4pm EAT (UTC+3) ─────────────────────────
const sentBriefings = new Set<string>();
let schedulerInterval: NodeJS.Timeout | null = null;

export function startBriefingScheduler(): void {
  if (schedulerInterval) return;
  console.log(`[Briefing] Scheduler started (6am + 4pm EAT → ${BRIEFING_CHANNEL})`);

  // Check every 5 minutes
  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      const offsetHours = 3; // EAT = UTC+3
      const nairobiHour = (now.getUTCHours() + offsetHours) % 24;
      const nairobiDate = new Date(now.getTime() + offsetHours * 3600 * 1000).toISOString().slice(0, 10);

      // Asian session: 6am–9am EAT
      if (nairobiHour >= 6 && nairobiHour < 9) {
        const key = `asian:${nairobiDate}`;
        if (!sentBriefings.has(key)) {
          sentBriefings.add(key);
          await sendDailyBriefing('asian');
        }
      }

      // NYC session: 4pm–7pm EAT
      if (nairobiHour >= 16 && nairobiHour < 19) {
        const key = `nyc:${nairobiDate}`;
        if (!sentBriefings.has(key)) {
          sentBriefings.add(key);
          await sendDailyBriefing('nyc');
        }
      }

      // Prune entries older than 7 days
      if (sentBriefings.size > 30) {
        const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
        for (const k of sentBriefings) {
          if (k.split(':')[1] < cutoff) sentBriefings.delete(k);
        }
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
