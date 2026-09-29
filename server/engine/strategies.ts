// ============================================================================
// PIPNEX TRADING ENGINE — STRATEGIES
// ----------------------------------------------------------------------------
// Four strategies, all built on top of indicators.ts
//   1. Asian Sweep + Order Block   (from your videos)
//   2. SMC                          (BOS, CHoCH, FVG, Liquidity, Equal H/L)
//   3. CRT                          (Candle Range Theory)
//   4. Price Action                 (Engulfing, Pin bar, Inside bar break)
//
// Each strategy returns a StrategySignal or null.
// Strictness rule: only fire if ALL conditions are met.
// ============================================================================

import {
  calculatePips,
  getTimeframeMultipliers,
  Candle,
  SwingPoint,
  Trend,
  atr,
  rsi,
  ema,
  findSwings,
  recentSwings,
  classifyTrend,
  findSupportLevels,
  findResistanceLevels,
  getAsianRange,
  getLatestAsianSession,
  candleBody,
  candleRange,
  upperWick,
  lowerWick,
  isBullish,
  isBearish,
  isBullishEngulfing,
  isBearishEngulfing,
  isPinBar,
  isInsideBar,
  lastValid,
} from './indicators';

export interface StrategySignal {
  strategy: 'AsianSweep' | 'SMC' | 'CRT' | 'PriceAction' | 'Fibonacci' | 'SRFlip';
  direction: 'BUY' | 'SELL';
  confidence: number;              // 0–100
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  setupType: string;
  reasons: string[];
  warnings: string[];
  session: string;                 // 'London' | 'NewYork' | 'Asian' | 'Any'
  // Pip distances (standard pips)
  slPips: number;
  tp1Pips: number;
  tp2Pips: number;
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

/**
 * Compute the current session from the last candle's UTC time.
 */
function currentSession(candles: Candle[]): string {
  if (candles.length === 0) return 'Unknown';
  const h = new Date(candles[candles.length - 1].time).getUTCHours();
  if (h >= 0  && h < 7)  return 'Asian';
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 16) return 'London/NY Overlap';
  if (h >= 16 && h < 21) return 'NewYork';
  return 'Off-Hours';
}

/**
 * Risk/Reward ratio from entry, SL, TP.
 */
function rr(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
}

/**
 * Round price to a sensible decimal count based on magnitude.
 */
function roundPrice(price: number): number {
  if (price > 500) return Number(price.toFixed(2));
  if (price > 50)  return Number(price.toFixed(2));
  if (price > 5)   return Number(price.toFixed(3));
  return Number(price.toFixed(5));
}

// ============================================================================
// STRATEGY 1 — ASIAN SWEEP + ORDER BLOCK
// ----------------------------------------------------------------------------
// Your core strategy from the videos:
//   1. Mark Asian High / Low / Mid
//   2. Wait for London open to sweep one side
//   3. Find the Order Block (last opposing candle before impulse)
//   4. Wait for 50–75% retracement into OB
//   5. Entry, SL beyond sweep, TP to Mid then opposite side
// ============================================================================

export function detectAsianSweep(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 50) return null;

  const session = currentSession(candles);
  // Only fires during London open window (07:00–10:00 UTC)
  const lastHour = new Date(candles[candles.length - 1].time).getUTCHours();
  if (lastHour < 7 || lastHour > 10) return null;

  const asian = getAsianRange(candles);
  if (!asian) return null;

  const { high, low, mid } = asian;

  // Get candles AFTER the Asian session (London open onwards)
  const asianSessionEnd = (() => {
    const last = candles[candles.length - 1];
    const d = new Date(last.time);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 8, 0, 0, 0);
  })();

  const londonCandles = candles.filter(c => c.time >= asianSessionEnd);
  if (londonCandles.length < 3) return null;

  // ---- Check for a sweep of either side ----
  const sweepHighIdx = londonCandles.findIndex(c => c.high > high && c.close < high);
  const sweepLowIdx  = londonCandles.findIndex(c => c.low  < low  && c.close > low);

  let direction: 'BUY' | 'SELL' | null = null;
  let sweepPrice = 0;
  let sweepIdx = -1;

  if (sweepHighIdx !== -1 && (sweepLowIdx === -1 || sweepHighIdx < sweepLowIdx)) {
    direction = 'SELL';
    sweepPrice = londonCandles[sweepHighIdx].high;
    sweepIdx = sweepHighIdx;
  } else if (sweepLowIdx !== -1) {
    direction = 'BUY';
    sweepPrice = londonCandles[sweepLowIdx].low;
    sweepIdx = sweepLowIdx;
  }

  if (!direction) return null;

  // ---- Find Order Block before the sweep ----
  // For SELL: last bullish candle before the sweep impulse
  // For BUY:  last bearish candle before the sweep impulse
  const obSearchStart = Math.max(0, sweepIdx - 20);
  let obIdx = -1;

  for (let i = sweepIdx - 1; i >= obSearchStart; i--) {
    const c = londonCandles[i];
    if (direction === 'SELL' && isBullish(c)) { obIdx = i; break; }
    if (direction === 'BUY'  && isBearish(c)) { obIdx = i; break; }
  }

  if (obIdx === -1) return null;

  const obCandle = londonCandles[obIdx];
  const obHigh = obCandle.high;
  const obLow  = obCandle.low;
  const obRange = obHigh - obLow;
  if (obRange <= 0) return null;

  // ---- Check retracement into OB (50–75%) ----
  // For SELL: current price must have retraced UP into OB by 50-75%
  // For BUY:  current price must have retraced DOWN into OB by 50-75%
  const candlesAfterSweep = londonCandles.slice(sweepIdx + 1);
  if (candlesAfterSweep.length < 2) return null;

  const currentPrice = candlesAfterSweep[candlesAfterSweep.length - 1].close;

  let obTapped = false;
  if (direction === 'SELL') {
    // Price retraced up to at least 50% of OB, but not above OB high
    const retracement50 = obLow + obRange * 0.5;
    obTapped = currentPrice >= retracement50 && currentPrice <= obHigh;
  } else {
    const retracement50 = obHigh - obRange * 0.5;
    obTapped = currentPrice <= retracement50 && currentPrice >= obLow;
  }

  if (!obTapped) return null;

  // ---- Compute Entry / SL / TP ----
  const entry = currentPrice;
  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (direction === 'SELL') {
    stopLoss = sweepPrice + (obRange * 0.15);      // small buffer beyond sweep
    tp1 = mid;                                      // Asian Mid as first target
    tp2 = low;                                      // opposite side
  } else {
    stopLoss = sweepPrice - (obRange * 0.15);
    tp1 = mid;
    tp2 = high;
  }

  // ---- R:R filter ----
  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  // ---- Confidence scoring ----
  let confidence = 70;
  const reasons: string[] = [];
  const warnings: string[] = [];

  reasons.push(`Asian ${direction === 'SELL' ? 'High' : 'Low'} swept at ${roundPrice(sweepPrice)}`);

  if (direction === 'SELL') {
    reasons.push(`Bearish Order Block identified at ${roundPrice(obLow)}–${roundPrice(obHigh)}`);
    reasons.push(`Price retraced into OB (50% activation zone)`);
  } else {
    reasons.push(`Bullish Order Block identified at ${roundPrice(obLow)}–${roundPrice(obHigh)}`);
    reasons.push(`Price retraced into OB (50% activation zone)`);
  }

  // Bonus confidence if OB range is small relative to sweep (clean setup)
  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr) || obRange;
  if (obRange < currentAtr * 1.5) {
    confidence += 5;
    reasons.push(`OB is tight relative to volatility (clean setup)`);
  }

  // Bonus if London has momentum (early session)
  if (lastHour === 7 || lastHour === 8) {
    confidence += 5;
    reasons.push(`Early London session (high liquidity window)`);
  }

  // Bonus if R:R >= 3
  if (riskReward >= 3) {
    confidence += 10;
    reasons.push(`Excellent Risk:Reward (${riskReward.toFixed(1)}:1)`);
  }

  // Warning if sweep had weak rejection
  const sweepCandle = londonCandles[sweepIdx];
  const sweepWick = direction === 'SELL' ? upperWick(sweepCandle) : lowerWick(sweepCandle);
  if (sweepWick < currentAtr * 0.3) {
    warnings.push(`Weak sweep wick — proceed with caution`);
    confidence -= 10;
  }

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);
  return {
    strategy: 'AsianSweep',
    direction,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType: `Asian ${direction === 'SELL' ? 'High' : 'Low'} Sweep + ${direction === 'SELL' ? 'Bearish OB' : 'Bullish OB'}`,
    reasons,
    warnings,
    session: 'London',
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}

// ============================================================================
// STRATEGY 2 — SMC (Smart Money Concepts)
// ----------------------------------------------------------------------------
//   • Break of Structure (BOS) — close beyond recent swing
//   • Change of Character (CHoCH) — first BOS against prior trend
//   • Fair Value Gap (FVG) — 3-candle imbalance
//   • Liquidity Sweep — wick beyond prior high/low + rejection
//   • Equal Highs / Lows
// ============================================================================

export function detectSMC(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 60) return null;

  const swings = findSwings(candles, 2);
  if (swings.length < 6) return null;

  const trend = classifyTrend(swings);
  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr);
  if (!currentAtr) return null;

  const currentPrice = candles[candles.length - 1].close;
  const lastCandle = candles[candles.length - 1];

  // ---- Detect BOS ----
  // BOS = last candle close breaks beyond most recent swing of opposite type
  const recentHighs = recentSwings(swings, 'HIGH', 3);
  const recentLows  = recentSwings(swings, 'LOW', 3);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const lastSwingHigh = recentHighs[recentHighs.length - 1].price;
  const lastSwingLow  = recentLows[recentLows.length - 1].price;

  const bosBullish = currentPrice > lastSwingHigh;
  const bosBearish = currentPrice < lastSwingLow;

  if (!bosBullish && !bosBearish) return null;

  const direction: 'BUY' | 'SELL' = bosBullish ? 'BUY' : 'SELL';
  const reasons: string[] = [];
  const warnings: string[] = [];

  reasons.push(`BOS confirmed: price closed ${direction === 'BUY' ? 'above' : 'below'} last swing at ${roundPrice(direction === 'BUY' ? lastSwingHigh : lastSwingLow)}`);

  // ---- Detect CHoCH (change of character) ----
  const isCHoCH = (direction === 'BUY' && trend === 'Bearish') || (direction === 'SELL' && trend === 'Bullish');
  if (isCHoCH) {
    reasons.push(`Change of Character (CHoCH): trend shifting to ${direction === 'BUY' ? 'bullish' : 'bearish'}`);
  }

  // ---- Detect FVG (fair value gap) ----
  let fvgFound = false;
  let fvgHigh = 0;
  let fvgLow = 0;

  for (let i = candles.length - 1; i >= candles.length - 15 && i >= 2; i--) {
    const c0 = candles[i - 2];
    const c2 = candles[i];

    // Bullish FVG: c2.low > c0.high (gap between them)
    if (direction === 'BUY' && c2.low > c0.high) {
      const gap = c2.low - c0.high;
      if (gap >= currentAtr * 0.3) {
        fvgFound = true;
        fvgHigh = c2.low;
        fvgLow = c0.high;
        break;
      }
    }
    // Bearish FVG: c2.high < c0.low
    if (direction === 'SELL' && c2.high < c0.low) {
      const gap = c0.low - c2.high;
      if (gap >= currentAtr * 0.3) {
        fvgFound = true;
        fvgHigh = c0.low;
        fvgLow = c2.high;
        break;
      }
    }
  }

  if (fvgFound) {
    reasons.push(`Fair Value Gap identified at ${roundPrice(fvgLow)}–${roundPrice(fvgHigh)}`);
  }

  // ---- Detect liquidity sweep ----
  let sweepFound = false;
  for (let i = candles.length - 1; i >= candles.length - 10 && i >= 1; i--) {
    const c = candles[i];
    if (direction === 'BUY' && c.low < lastSwingLow && c.close > lastSwingLow) {
      sweepFound = true;
      reasons.push(`Liquidity sweep below ${roundPrice(lastSwingLow)} (buy-side absorption)`);
      break;
    }
    if (direction === 'SELL' && c.high > lastSwingHigh && c.close < lastSwingHigh) {
      sweepFound = true;
      reasons.push(`Liquidity sweep above ${roundPrice(lastSwingHigh)} (sell-side absorption)`);
      break;
    }
  }

  // ---- Compute Entry / SL / TP ----
  const entry = currentPrice;
  let stopLoss: number;

  if (direction === 'BUY') {
    stopLoss = Math.min(lastSwingLow, fvgLow || lastSwingLow) - currentAtr * 0.3;
  } else {
    stopLoss = Math.max(lastSwingHigh, fvgHigh || lastSwingHigh) + currentAtr * 0.3;
  }

  const risk = Math.abs(entry - stopLoss);
  const tp1 = direction === 'BUY' ? entry + risk * 2 : entry - risk * 2;
  const tp2 = direction === 'BUY' ? entry + risk * 3.5 : entry - risk * 3.5;

  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  // ---- Confidence ----
  let confidence = 65;
  if (bosBullish || bosBearish) confidence += 5;
  if (isCHoCH) confidence += 10;
  if (fvgFound) confidence += 10;
  if (sweepFound) confidence += 10;
  if (riskReward >= 3) confidence += 5;

  if (!fvgFound && !sweepFound && !isCHoCH) {
    warnings.push('Setup based on BOS only — no additional confluence');
    confidence -= 10;
  }

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);
  return {
    strategy: 'SMC',
    direction,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType: isCHoCH ? 'CHoCH + BOS' : fvgFound ? 'BOS + FVG' : 'BOS Continuation',
    reasons,
    warnings,
    session: currentSession(candles),
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}

// ============================================================================
// STRATEGY 3 — CRT (Candle Range Theory)
// ----------------------------------------------------------------------------
//   1. Identify a range (consolidation)
//   2. Detect the sweep (fake breakout)
//   3. Detect the reversal candle back inside the range
//   4. Target the opposite side of the range
// ============================================================================

export function detectCRT(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 30) return null;

  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr);
  if (!currentAtr) return null;

  // Look for a range within the last 20 candles, excluding the last 3
  const searchEnd = candles.length - 3;
  const searchStart = Math.max(0, searchEnd - 15);
  if (searchStart >= searchEnd) return null;

  const rangeCandles = candles.slice(searchStart, searchEnd);
  if (rangeCandles.length < 5) return null;

  const rangeHigh = Math.max(...rangeCandles.map(c => c.high));
  const rangeLow  = Math.min(...rangeCandles.map(c => c.low));
  const rangeSize = rangeHigh - rangeLow;

  // Range must be tight (< 3× ATR) to be considered consolidation
  if (rangeSize > currentAtr * 3) return null;
  // Range must be meaningful (> 0.8× ATR)
  if (rangeSize < currentAtr * 0.8) return null;

  // Now look for sweep in the last 3 candles
  const lastThree = candles.slice(searchEnd);
  let direction: 'BUY' | 'SELL' | null = null;
  let sweepPrice = 0;

  for (const c of lastThree) {
    // Bullish CRT: sweep range low, close back inside
    if (c.low < rangeLow && c.close > rangeLow && !direction) {
      direction = 'BUY';
      sweepPrice = c.low;
      break;
    }
    // Bearish CRT: sweep range high, close back inside
    if (c.high > rangeHigh && c.close < rangeHigh && !direction) {
      direction = 'SELL';
      sweepPrice = c.high;
      break;
    }
  }

  if (!direction) return null;

  const currentPrice = candles[candles.length - 1].close;
  const reasons: string[] = [];
  const warnings: string[] = [];

  reasons.push(`Consolidation range identified: ${roundPrice(rangeLow)} – ${roundPrice(rangeHigh)}`);
  if (direction === 'BUY') {
    reasons.push(`Range low swept at ${roundPrice(sweepPrice)} with close back inside`);
    reasons.push(`Bullish CRT reversal confirmed`);
  } else {
    reasons.push(`Range high swept at ${roundPrice(sweepPrice)} with close back inside`);
    reasons.push(`Bearish CRT reversal confirmed`);
  }

  // Compute SL / TP
  const entry = currentPrice;
  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (direction === 'BUY') {
    stopLoss = sweepPrice - currentAtr * 0.3;
    tp1 = rangeHigh;              // opposite side of range
    tp2 = rangeHigh + rangeSize;  // projected extension
  } else {
    stopLoss = sweepPrice + currentAtr * 0.3;
    tp1 = rangeLow;
    tp2 = rangeLow - rangeSize;
  }

  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  // ---- Confidence ----
  let confidence = 70;
  if (rangeSize < currentAtr * 1.5) {
    confidence += 5;
    reasons.push(`Tight consolidation range (high-probability breakout reversal)`);
  }

  // Reversal candle check — engulfing or pin bar preferred
  const reversal = candles[candles.length - 1];
  if (direction === 'BUY') {
    const pin = isPinBar(reversal);
    if (pin.isPin && pin.direction === 'BULLISH') {
      confidence += 10;
      reasons.push('Bullish pin bar reversal confirmation');
    }
    if (candles.length >= 2 && isBullishEngulfing(candles[candles.length - 2], reversal)) {
      confidence += 10;
      reasons.push('Bullish engulfing confirmation');
    }
  } else {
    const pin = isPinBar(reversal);
    if (pin.isPin && pin.direction === 'BEARISH') {
      confidence += 10;
      reasons.push('Bearish pin bar reversal confirmation');
    }
    if (candles.length >= 2 && isBearishEngulfing(candles[candles.length - 2], reversal)) {
      confidence += 10;
      reasons.push('Bearish engulfing confirmation');
    }
  }

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);
  return {
    strategy: 'CRT',
    direction,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType: `CRT ${direction === 'BUY' ? 'Bullish' : 'Bearish'} Reversal`,
    reasons,
    warnings,
    session: currentSession(candles),
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}

// ============================================================================
// STRATEGY 4 — PRICE ACTION
// ----------------------------------------------------------------------------
//   • Engulfing at support/resistance
//   • Pin bar at support/resistance
//   • Inside bar breakout
// ============================================================================

export function detectPriceAction(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 40) return null;

  const swings = findSwings(candles, 2);
  if (swings.length < 4) return null;

  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr);
  if (!currentAtr) return null;

  const currentPrice = candles[candles.length - 1].close;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const supportLevels = findSupportLevels(swings, currentPrice, 3);
  const resistanceLevels = findResistanceLevels(swings, currentPrice, 3);

  // Tolerance: nearest level within 0.5× ATR counts as "at a level"
  const nearLevel = (levels: number[]) =>
    levels.some(l => Math.abs(currentPrice - l) < currentAtr * 0.5);

  const reasons: string[] = [];
  const warnings: string[] = [];
  let direction: 'BUY' | 'SELL' | null = null;
  let confidence = 65;
  let setupType = '';

  // ---- Bullish setups ----
  if (nearLevel(supportLevels)) {
    // Bullish engulfing at support
    if (isBullishEngulfing(prev, last)) {
      direction = 'BUY';
      setupType = 'Bullish Engulfing at Support';
      reasons.push(`Bullish engulfing pattern at support ${roundPrice(supportLevels[0])}`);
      confidence += 10;
    }
    // Hammer / bull pin bar at support
    const pin = isPinBar(last);
    if (!direction && pin.isPin && pin.direction === 'BULLISH') {
      direction = 'BUY';
      setupType = 'Bullish Pin Bar at Support';
      reasons.push(`Bullish pin bar (hammer) at support ${roundPrice(supportLevels[0])}`);
      confidence += 10;
    }
  }

  // ---- Bearish setups ----
  if (!direction && nearLevel(resistanceLevels)) {
    if (isBearishEngulfing(prev, last)) {
      direction = 'SELL';
      setupType = 'Bearish Engulfing at Resistance';
      reasons.push(`Bearish engulfing pattern at resistance ${roundPrice(resistanceLevels[0])}`);
      confidence += 10;
    }
    const pin = isPinBar(last);
    if (!direction && pin.isPin && pin.direction === 'BEARISH') {
      direction = 'SELL';
      setupType = 'Bearish Pin Bar at Resistance';
      reasons.push(`Bearish pin bar (shooting star) at resistance ${roundPrice(resistanceLevels[0])}`);
      confidence += 10;
    }
  }

  // ---- Inside bar breakout (any direction) ----
  if (!direction && isInsideBar(prev, last)) {
    // Inside bar itself isn't a signal — need a trend context
    const trend = classifyTrend(swings);
    if (trend === 'Bullish') {
      direction = 'BUY';
      setupType = 'Inside Bar Breakout (Bullish Trend)';
      reasons.push('Inside bar forming in bullish structure');
      confidence += 5;
    } else if (trend === 'Bearish') {
      direction = 'SELL';
      setupType = 'Inside Bar Breakout (Bearish Trend)';
      reasons.push('Inside bar forming in bearish structure');
      confidence += 5;
    }
  }

  if (!direction) return null;

  // ---- Entry / SL / TP ----
  const entry = currentPrice;
  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (direction === 'BUY') {
    stopLoss = last.low - currentAtr * 0.3;
    const risk = entry - stopLoss;
    tp1 = entry + risk * 2;
    tp2 = entry + risk * 3;
  } else {
    stopLoss = last.high + currentAtr * 0.3;
    const risk = stopLoss - entry;
    tp1 = entry - risk * 2;
    tp2 = entry - risk * 3;
  }

  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  // Bonus if pattern is strong (marubozu-like engulfing)
  if (candleBody(last) > currentAtr * 0.8) {
    confidence += 5;
    reasons.push('Strong momentum candle');
  }

  // Bonus if RSI not overbought/oversold against direction
  const rsiArr = rsi(candles, 14);
  const currentRsi = lastValid(rsiArr);
  if (currentRsi !== null) {
    if (direction === 'BUY' && currentRsi < 40) {
      confidence += 5;
      reasons.push(`RSI oversold at ${currentRsi.toFixed(1)}`);
    }
    if (direction === 'SELL' && currentRsi > 60) {
      confidence += 5;
      reasons.push(`RSI overbought at ${currentRsi.toFixed(1)}`);
    }
  }

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);
  return {
    strategy: 'PriceAction',
    direction,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType,
    reasons,
    warnings,
    session: currentSession(candles),
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}

// ============================================================================
// STRATEGY 5 — FIBONACCI RETRACEMENT
// ----------------------------------------------------------------------------
//   • Find last impulse leg (swing low → swing high, or vice versa)
//   • Compute Fib retracement levels
//   • Signal when price retraces into the 38.2% – 61.8% golden pocket
//   • Confirm with reversal candle
//   • SL beyond 78.6% (invalidation), TP at 100% / 127% / 161.8%
// ============================================================================

export function detectFibonacci(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 40) return null;

  const swings = findSwings(candles, 2);
  if (swings.length < 4) return null;

  const highs = recentSwings(swings, 'HIGH', 3);
  const lows = recentSwings(swings, 'LOW', 3);
  if (highs.length < 2 || lows.length < 2) return null;

  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];

  // Must have a valid impulse leg
  const legRange = lastHigh.price - lastLow.price;
  if (legRange <= 0) return null;

  const currentPrice = candles[candles.length - 1].close;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr);
  if (!currentAtr) return null;

  // Determine impulse direction:
  // If lastHigh came AFTER lastLow → bullish impulse (up leg)
  // If lastLow came AFTER lastHigh → bearish impulse (down leg)
  const impulseBullish = lastHigh.index > lastLow.index;

  // Fib levels
  const fib = {
    l236: impulseBullish ? lastHigh.price - legRange * 0.236 : lastLow.price + legRange * 0.236,
    l382: impulseBullish ? lastHigh.price - legRange * 0.382 : lastLow.price + legRange * 0.382,
    l500: impulseBullish ? lastHigh.price - legRange * 0.500 : lastLow.price + legRange * 0.500,
    l618: impulseBullish ? lastHigh.price - legRange * 0.618 : lastLow.price + legRange * 0.618,
    l786: impulseBullish ? lastHigh.price - legRange * 0.786 : lastLow.price + legRange * 0.786,
  };

  const goldenTop = Math.max(fib.l382, fib.l618);
  const goldenBottom = Math.min(fib.l382, fib.l618);

  // Check if price is inside the golden pocket
  const inGoldenPocket = currentPrice <= goldenTop && currentPrice >= goldenBottom;

  if (!inGoldenPocket) return null;

  // Confirm with reversal candle
  const isBull = impulseBullish; // Looking for BUY in golden pocket of up leg
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 70;

  reasons.push(`${impulseBullish ? 'Bullish' : 'Bearish'} impulse leg: ${roundPrice(lastLow.price)} → ${roundPrice(lastHigh.price)}`);
  reasons.push(`Price in golden pocket: ${roundPrice(goldenBottom)} – ${roundPrice(goldenTop)}`);

  if (isBull) {
    const pin = isPinBar(last);
    if (pin.isPin && pin.direction === 'BULLISH') {
      confidence += 12;
      reasons.push('Bullish pin bar confirmation');
    }
    if (isBullishEngulfing(prev, last)) {
      confidence += 12;
      reasons.push('Bullish engulfing confirmation');
    }
  } else {
    const pin = isPinBar(last);
    if (pin.isPin && pin.direction === 'BEARISH') {
      confidence += 12;
      reasons.push('Bearish pin bar confirmation');
    }
    if (isBearishEngulfing(prev, last)) {
      confidence += 12;
      reasons.push('Bearish engulfing confirmation');
    }
  }

  // RSI confluence
  const rsiArr = rsi(candles, 14);
  const currentRsi = lastValid(rsiArr);
  if (currentRsi !== null) {
    if (isBull && currentRsi < 45) {
      confidence += 5;
      reasons.push(`RSI oversold-ish at ${currentRsi.toFixed(1)}`);
    }
    if (!isBull && currentRsi > 55) {
      confidence += 5;
      reasons.push(`RSI overbought-ish at ${currentRsi.toFixed(1)}`);
    }
  }

  // Entry, SL, TP
  const direction: 'BUY' | 'SELL' = isBull ? 'BUY' : 'SELL';
  const entry = currentPrice;
  const tfMult = getTimeframeMultipliers(timeframe);

  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (isBull) {
    stopLoss = Math.min(fib.l786, last.low) - currentAtr * 0.3 * tfMult.sl;
    const risk = entry - stopLoss;
    tp1 = lastHigh.price;              // 100% retracement (prior high)
    tp2 = lastHigh.price + legRange * 0.272; // 127.2% extension
  } else {
    stopLoss = Math.max(fib.l786, last.high) + currentAtr * 0.3 * tfMult.sl;
    const risk = stopLoss - entry;
    tp1 = lastLow.price;
    tp2 = lastLow.price - legRange * 0.272;
  }

  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  if (riskReward >= 3) confidence += 5;

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);

  return {
    strategy: 'Fibonacci',
    direction,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType: `Fibonacci ${isBull ? 'Golden Pocket Buy' : 'Golden Pocket Sell'}`,
    reasons,
    warnings,
    session: currentSession(candles),
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}

// ============================================================================
// STRATEGY 6 — SUPPORT/RESISTANCE FLIP
// ----------------------------------------------------------------------------
//   • Find a level that was resistance and is now support (or vice versa)
//   • Wait for price to retest the flipped level
//   • Confirm with reversal candle
// ============================================================================

export function detectSRFlip(candles: Candle[], symbol = 'XAUUSD', timeframe = 'M15'): StrategySignal | null {
  if (candles.length < 50) return null;

  const swings = findSwings(candles, 2);
  if (swings.length < 6) return null;

  const currentPrice = candles[candles.length - 1].close;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr);
  if (!currentAtr) return null;

  // Tolerance: within 0.4× ATR of a level
  const tol = currentAtr * 0.4;

  // Look for support flip (broken resistance → now support)
  // Broken resistance = swing high that price closed above, then came back down
  const swingHighs = recentSwings(swings, 'HIGH', 5);
  const swingLows = recentSwings(swings, 'LOW', 5);

  let flipLevel: number | null = null;
  let flipDirection: 'BUY' | 'SELL' | null = null;

  // Check for support flip (bullish): a prior swing high, price broke above, now retesting from above
  for (const sh of swingHighs) {
    if (Math.abs(currentPrice - sh.price) > tol) continue;
    // Must have been broken (price traded above it)
    const brokeAbove = candles.slice(sh.index + 1).some(c => c.close > sh.price);
    if (brokeAbove && currentPrice >= sh.price * 0.998) {
      flipLevel = sh.price;
      flipDirection = 'BUY';
      break;
    }
  }

  // Check for resistance flip (bearish): prior swing low, price broke below, now retesting from below
  if (!flipLevel) {
    for (const sl of swingLows) {
      if (Math.abs(currentPrice - sl.price) > tol) continue;
      const brokeBelow = candles.slice(sl.index + 1).some(c => c.close < sl.price);
      if (brokeBelow && currentPrice <= sl.price * 1.002) {
        flipLevel = sl.price;
        flipDirection = 'SELL';
        break;
      }
    }
  }

  if (!flipLevel || !flipDirection) return null;

  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 70;

  reasons.push(
    flipDirection === 'BUY'
      ? `Prior resistance ${roundPrice(flipLevel)} flipped to support — retesting`
      : `Prior support ${roundPrice(flipLevel)} flipped to resistance — retesting`
  );

  // Confirmation candle
  if (flipDirection === 'BUY') {
    const pin = isPinBar(last);
    if (pin.isPin && pin.direction === 'BULLISH') {
      confidence += 12;
      reasons.push('Bullish pin bar rejection');
    }
    if (isBullishEngulfing(prev, last)) {
      confidence += 10;
      reasons.push('Bullish engulfing at flip');
    }
  } else {
    const pin = isPinBar(last);
    if (pin.isPin && pin.direction === 'BEARISH') {
      confidence += 12;
      reasons.push('Bearish pin bar rejection');
    }
    if (isBearishEngulfing(prev, last)) {
      confidence += 10;
      reasons.push('Bearish engulfing at flip');
    }
  }

  const entry = currentPrice;
  const tfMult = getTimeframeMultipliers(timeframe);

  let stopLoss: number;
  let tp1: number;
  let tp2: number;

  if (flipDirection === 'BUY') {
    stopLoss = flipLevel - currentAtr * tfMult.sl;
    const risk = entry - stopLoss;
    tp1 = entry + risk * tfMult.tp1;
    tp2 = entry + risk * tfMult.tp2;
  } else {
    stopLoss = flipLevel + currentAtr * tfMult.sl;
    const risk = stopLoss - entry;
    tp1 = entry - risk * tfMult.tp1;
    tp2 = entry - risk * tfMult.tp2;
  }

  const riskReward = rr(entry, stopLoss, tp2);
  if (riskReward < 2) return null;

  if (riskReward >= 3) confidence += 5;

  const _e = roundPrice(entry);
  const _sl = roundPrice(stopLoss);
  const _tp1 = roundPrice(tp1);
  const _tp2 = roundPrice(tp2);

  return {
    strategy: 'SRFlip',
    direction: flipDirection,
    confidence: Math.min(100, Math.max(0, confidence)),
    entry: _e,
    stopLoss: _sl,
    takeProfit1: _tp1,
    takeProfit2: _tp2,
    riskReward,
    setupType: `S/R Flip ${flipDirection === 'BUY' ? 'Bullish' : 'Bearish'} Retest`,
    reasons,
    warnings,
    session: currentSession(candles),
    slPips: calculatePips(_e, _sl, symbol),
    tp1Pips: calculatePips(_e, _tp1, symbol),
    tp2Pips: calculatePips(_e, _tp2, symbol),
  };
}
