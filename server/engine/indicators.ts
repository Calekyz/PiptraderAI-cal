// ============================================================================
// PIPNEX TRADING ENGINE — INDICATORS & MARKET STRUCTURE
// ----------------------------------------------------------------------------
// Pure mathematical foundation. No strategy logic. No AI. No external APIs.
//
// Contains:
//   • Candle type
//   • ATR, RSI, EMA, SMA
//   • Swing high/low detection
//   • Session boundaries (Asian / London / NY)
//   • Candle patterns (engulfing, pin bar, inside bar, doji, marubozu)
//   • Trend structure classification
//   • Support/Resistance from swing points
// ============================================================================

export interface Candle {
  time: number;      // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Trend = 'Bullish' | 'Bearish' | 'Sideways';

export interface SwingPoint {
  index: number;      // index in candle array
  time: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

export interface SessionWindow {
  name: 'Asian' | 'London' | 'NewYork';
  startUtcHour: number;
  endUtcHour: number;
  startUtcMinute: number;
  endUtcMinute: number;
}

// ────────────────────────────────────────────────────────────────────────────
// SESSION DEFINITIONS (UTC/GMT times, standard Forex sessions)
// ────────────────────────────────────────────────────────────────────────────
export const SESSIONS: Record<string, SessionWindow> = {
  Asian:   { name: 'Asian',   startUtcHour: 0,  endUtcHour: 8,  startUtcMinute: 0, endUtcMinute: 0 },
  London:  { name: 'London',  startUtcHour: 7,  endUtcHour: 16, startUtcMinute: 0, endUtcMinute: 0 },
  NewYork: { name: 'NewYork', startUtcHour: 12, endUtcHour: 21, startUtcMinute: 0, endUtcMinute: 0 }
};

// ────────────────────────────────────────────────────────────────────────────
// SESSION HELPERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns the UTC hour of a candle.
 */
export function getUtcHour(candle: Candle): number {
  return new Date(candle.time).getUTCHours();
}

/**
 * Returns true if the candle falls inside the given session (by UTC hour).
 */
export function isInSession(candle: Candle, sessionName: 'Asian' | 'London' | 'NewYork'): boolean {
  const s = SESSIONS[sessionName];
  const h = getUtcHour(candle);
  return h >= s.startUtcHour && h < s.endUtcHour;
}

/**
 * Returns candles that belong to today's Asian session (00:00–08:00 UTC).
 * Uses the last 24h of data.
 */
export function getLatestAsianSession(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];

  // Find the latest completed Asian session by scanning backwards
  // A session is defined as 00:00–08:00 UTC of a given day.
  const now = candles[candles.length - 1];
  const nowDate = new Date(now.time);
  const todayUtcMidnight = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
    0, 0, 0, 0
  );

  const sessionStart = todayUtcMidnight;
  const sessionEnd = todayUtcMidnight + 8 * 60 * 60 * 1000; // 08:00 UTC

  const inSession = candles.filter(c => c.time >= sessionStart && c.time < sessionEnd);

  // If today's session hasn't started yet, use yesterday's
  if (inSession.length === 0) {
    const yStart = sessionStart - 24 * 60 * 60 * 1000;
    const yEnd = sessionEnd - 24 * 60 * 60 * 1000;
    return candles.filter(c => c.time >= yStart && c.time < yEnd);
  }

  return inSession;
}

/**
 * Compute Asian session High, Low, Mid from candle array.
 */
export function getAsianRange(candles: Candle[]): {
  high: number;
  low: number;
  mid: number;
  highCandleIndex: number;
  lowCandleIndex: number;
} | null {
  const asian = getLatestAsianSession(candles);
  if (asian.length < 3) return null;

  let high = -Infinity;
  let low = Infinity;
  let highIdx = 0;
  let lowIdx = 0;

  for (let i = 0; i < asian.length; i++) {
    if (asian[i].high > high) { high = asian[i].high; highIdx = i; }
    if (asian[i].low < low)   { low = asian[i].low;   lowIdx = i; }
  }

  return {
    high,
    low,
    mid: (high + low) / 2,
    highCandleIndex: highIdx,
    lowCandleIndex: lowIdx
  };
}

// ────────────────────────────────────────────────────────────────────────────
// CANDLE HELPERS
// ────────────────────────────────────────────────────────────────────────────

export function candleRange(c: Candle): number {
  return c.high - c.low;
}

export function candleBody(c: Candle): number {
  return Math.abs(c.close - c.open);
}

export function candleBodyTop(c: Candle): number {
  return Math.max(c.open, c.close);
}

export function candleBodyBottom(c: Candle): number {
  return Math.min(c.open, c.close);
}

export function upperWick(c: Candle): number {
  return c.high - candleBodyTop(c);
}

export function lowerWick(c: Candle): number {
  return candleBodyBottom(c) - c.low;
}

export function isBullish(c: Candle): boolean {
  return c.close > c.open;
}

export function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

// ────────────────────────────────────────────────────────────────────────────
// MOVING AVERAGES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Simple Moving Average. Returns array of same length as input (NaN for
 * positions where there isn't enough data).
 */
export function sma(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (values.length < period) return out;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential Moving Average. Standard formula: k = 2 / (period + 1).
 * Seeds with SMA of first `period` values.
 */
export function ema(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (values.length < period) return out;

  const k = 2 / (period + 1);

  // Seed with SMA
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  seed /= period;
  out[period - 1] = seed;

  // EMA from period onward
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// ATR — Average True Range (Wilder's smoothing)
// ────────────────────────────────────────────────────────────────────────────

export function trueRange(candles: Candle[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      out.push(candles[i].high - candles[i].low);
      continue;
    }
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - prevClose),
      Math.abs(candles[i].low - prevClose)
    );
    out.push(tr);
  }
  return out;
}

/**
 * Wilder's ATR. Uses RMA (running moving average) smoothing.
 */
export function atr(candles: Candle[], period = 14): number[] {
  const tr = trueRange(candles);
  const out = new Array(candles.length).fill(NaN);
  if (candles.length < period) return out;

  // Seed with simple average of first `period` TRs
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  out[period - 1] = sum / period;

  // Wilder's smoothing
  for (let i = period; i < candles.length; i++) {
    out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// RSI — Relative Strength Index (Wilder's smoothing)
// ────────────────────────────────────────────────────────────────────────────

export function rsi(candles: Candle[], period = 14): number[] {
  const out = new Array(candles.length).fill(NaN);
  if (candles.length <= period) return out;

  // Compute price changes
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  out[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    out[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// SWING HIGH / LOW DETECTION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Detect swing highs and lows using N-bar left/right lookback.
 * A swing high at index i has a high greater than the `lookback` candles
 * before and after it. Same logic inverted for swing lows.
 *
 * @param lookback how many candles on each side (default 2 = 5-candle swing)
 */
export function findSwings(candles: Candle[], lookback = 2): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (candles.length < lookback * 2 + 1) return swings;

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isLow = false;
      }
    }

    if (isHigh) {
      swings.push({ index: i, time: candles[i].time, price: candles[i].high, type: 'HIGH' });
    }
    if (isLow) {
      swings.push({ index: i, time: candles[i].time, price: candles[i].low, type: 'LOW' });
    }
  }

  return swings.sort((a, b) => a.index - b.index);
}

/**
 * Get the most recent N swings of a given type.
 */
export function recentSwings(swings: SwingPoint[], type: 'HIGH' | 'LOW', count = 3): SwingPoint[] {
  return swings.filter(s => s.type === type).slice(-count);
}

// ────────────────────────────────────────────────────────────────────────────
// TREND STRUCTURE CLASSIFICATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Classify trend from the last N swing highs and lows.
 *   • Higher Highs AND Higher Lows → Bullish
 *   • Lower Highs AND Lower Lows   → Bearish
 *   • Otherwise                    → Sideways
 */
export function classifyTrend(swings: SwingPoint[]): Trend {
  const highs = recentSwings(swings, 'HIGH', 3);
  const lows = recentSwings(swings, 'LOW', 3);

  if (highs.length < 2 || lows.length < 2) return 'Sideways';

  const hh = highs[highs.length - 1].price > highs[highs.length - 2].price;
  const hl = lows[lows.length - 1].price > lows[lows.length - 2].price;
  const lh = highs[highs.length - 1].price < highs[highs.length - 2].price;
  const ll = lows[lows.length - 1].price < lows[lows.length - 2].price;

  if (hh && hl) return 'Bullish';
  if (lh && ll) return 'Bearish';
  return 'Sideways';
}

// ────────────────────────────────────────────────────────────────────────────
// SUPPORT & RESISTANCE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Return the nearest N support levels below current price (from swing lows).
 */
export function findSupportLevels(swings: SwingPoint[], currentPrice: number, maxLevels = 3): number[] {
  const lows = swings
    .filter(s => s.type === 'LOW' && s.price < currentPrice)
    .map(s => s.price);
  // Deduplicate within 0.1% tolerance, keep nearest
  return dedupeLevels(lows.sort((a, b) => b - a), currentPrice).slice(0, maxLevels);
}

/**
 * Return the nearest N resistance levels above current price (from swing highs).
 */
export function findResistanceLevels(swings: SwingPoint[], currentPrice: number, maxLevels = 3): number[] {
  const highs = swings
    .filter(s => s.type === 'HIGH' && s.price > currentPrice)
    .map(s => s.price);
  return dedupeLevels(highs.sort((a, b) => a - b), currentPrice).slice(0, maxLevels);
}

function dedupeLevels(levels: number[], reference: number): number[] {
  const tolerance = reference * 0.001; // 0.1%
  const out: number[] = [];
  for (const lvl of levels) {
    if (out.every(existing => Math.abs(existing - lvl) > tolerance)) {
      out.push(lvl);
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// CANDLE PATTERNS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Bullish engulfing: current candle body fully engulfs previous bearish candle body.
 */
export function isBullishEngulfing(prev: Candle, curr: Candle): boolean {
  return (
    isBearish(prev) &&
    isBullish(curr) &&
    candleBodyBottom(curr) <= candleBodyBottom(prev) &&
    candleBodyTop(curr) >= candleBodyTop(prev)
  );
}

/**
 * Bearish engulfing: current candle body fully engulfs previous bullish candle body.
 */
export function isBearishEngulfing(prev: Candle, curr: Candle): boolean {
  return (
    isBullish(prev) &&
    isBearish(curr) &&
    candleBodyBottom(curr) <= candleBodyBottom(prev) &&
    candleBodyTop(curr) >= candleBodyTop(prev)
  );
}

/**
 * Pin bar (hammer / shooting star).
 * A candle whose body is < 30% of range and one wick is > 2× the other.
 */
export function isPinBar(c: Candle): { isPin: boolean; direction: 'BULLISH' | 'BEARISH' | 'NONE' } {
  const range = candleRange(c);
  if (range === 0) return { isPin: false, direction: 'NONE' };

  const body = candleBody(c);
  const bodyRatio = body / range;
  if (bodyRatio > 0.35) return { isPin: false, direction: 'NONE' };

  const uw = upperWick(c);
  const lw = lowerWick(c);

  // Hammer: long lower wick, small upper wick
  if (lw > uw * 2 && lw > range * 0.6) {
    return { isPin: true, direction: 'BULLISH' };
  }
  // Shooting star: long upper wick, small lower wick
  if (uw > lw * 2 && uw > range * 0.6) {
    return { isPin: true, direction: 'BEARISH' };
  }
  return { isPin: false, direction: 'NONE' };
}

/**
 * Inside bar: current candle's range is entirely inside previous candle's range.
 */
export function isInsideBar(prev: Candle, curr: Candle): boolean {
  return curr.high <= prev.high && curr.low >= prev.low;
}

/**
 * Doji: body < 10% of range.
 */
export function isDoji(c: Candle): boolean {
  const range = candleRange(c);
  if (range === 0) return false;
  return candleBody(c) / range < 0.1;
}

/**
 * Marubozu: body > 90% of range (almost no wicks).
 */
export function isMarubozu(c: Candle): boolean {
  const range = candleRange(c);
  if (range === 0) return false;
  return candleBody(c) / range > 0.9;
}

// ────────────────────────────────────────────────────────────────────────────
// HIGHER-TIMEFRAME AGGREGATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate M1 candles into a higher timeframe (e.g., M5 = 5 minutes).
 * @param candles input candles
 * @param minutes target timeframe in minutes
 */
export function aggregateCandles(candles: Candle[], minutes: number): Candle[] {
  if (candles.length === 0) return [];
  const msPerBucket = minutes * 60 * 1000;

  const buckets = new Map<number, Candle[]>();
  for (const c of candles) {
    const bucket = Math.floor(c.time / msPerBucket) * msPerBucket;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(c);
  }

  const out: Candle[] = [];
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  for (const key of sortedKeys) {
    const group = buckets.get(key)!;
    out.push({
      time: key,
      open: group[0].open,
      high: Math.max(...group.map(g => g.high)),
      low: Math.min(...group.map(g => g.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, g) => s + g.volume, 0)
    });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────────────────────

/**
 * Safe numeric check for NaN / Infinity.
 */
export function isValidNumber(n: number): boolean {
  return typeof n === 'number' && isFinite(n) && !isNaN(n);
}

/**
 * Get the last valid (non-NaN) value from an indicator array.
 */
export function lastValid(arr: number[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (isValidNumber(arr[i])) return arr[i];
  }
  return null;
}

/**
 * Standard deviation — used in volatility filters.
 */
export function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ────────────────────────────────────────────────────────────────────────────
// PIP CALCULATION (standard industry pip sizes)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Returns the pip size for a given symbol.
 *   • XAUUSD / XAGUSD: 0.10 (1 pip = $0.10 move)
 *   • JPY pairs: 0.01
 *   • Non-JPY forex: 0.0001
 *   • Crypto (BTC, ETH): 1.00
 *   • Indices (US30, NAS100): 1.00
 */
export function getPipSize(symbol: string): number {
  const s = symbol.toUpperCase().replace('/', '');

  // Gold, Silver — $0.10 move = 1 pip
  if (s.includes('XAU') || s.includes('XAG')) return 0.10;

  // JPY pairs
  if (s.includes('JPY')) return 0.01;

  // Crypto
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL')) return 1.0;

  // Indices
  if (s.includes('US30') || s.includes('NAS100') || s.includes('SPX500')) return 1.0;

  // Oil
  if (s.includes('WTI') || s.includes('OIL') || s.includes('USOIL')) return 0.01;

  // Standard forex pairs
  return 0.0001;
}

/**
 * Calculate pip distance between two prices for a given symbol.
 */
export function calculatePips(from: number, to: number, symbol: string): number {
  const pipSize = getPipSize(symbol);
  return Number((Math.abs(to - from) / pipSize).toFixed(1));
}

// ────────────────────────────────────────────────────────────────────────────
// TIMEFRAME-AWARE SL/TP MULTIPLIERS
// ────────────────────────────────────────────────────────────────────────────
/**
 * Scalp-friendly SL/TP ratios per timeframe.
 *   slMultiplier: how many ATRs to risk
 *   tp1Ratio: TP1 = SL distance × this
 *   tp2Ratio: TP2 = SL distance × this
 *
 * Realistic targets:
 *   M5:  SL 0.5 ATR, TP1 1.5R, TP2 2.5R  → 15-30 min trades
 *   M15: SL 0.8 ATR, TP1 2.0R, TP2 3.0R  → 30 min - 2 hr trades
 *   M30: SL 1.0 ATR, TP1 2.0R, TP2 3.5R
 *   H1:  SL 1.5 ATR, TP1 2.5R, TP2 4.0R  → 2-6 hr trades
 */
export function getTimeframeMultipliers(tf: string): {
  sl: number;
  tp1: number;
  tp2: number;
} {
  const t = (tf || 'M15').toUpperCase();
  switch (t) {
    case 'M1':  return { sl: 0.4, tp1: 1.5, tp2: 2.5 };
    case 'M5':  return { sl: 0.5, tp1: 1.5, tp2: 2.5 };
    case 'M15': return { sl: 0.8, tp1: 2.0, tp2: 3.0 };
    case 'M30': return { sl: 1.0, tp1: 2.0, tp2: 3.5 };
    case 'H1':  return { sl: 1.5, tp1: 2.5, tp2: 4.0 };
    case 'H4':  return { sl: 2.0, tp1: 3.0, tp2: 5.0 };
    case 'D1':  return { sl: 2.5, tp1: 3.0, tp2: 5.0 };
    default:    return { sl: 0.8, tp1: 2.0, tp2: 3.0 };
  }
}
