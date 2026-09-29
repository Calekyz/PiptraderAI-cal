// ============================================================================
// PIPNEX TRADING ENGINE — SIGNAL ENGINE
// ----------------------------------------------------------------------------
// Orchestrates all 4 strategies:
//   1. Fetch candles
//   2. Run each strategy
//   3. Filter by session
//   4. Filter by confidence
//   5. Pick the best signal (or none)
//   6. Return one clean trade plan
// ============================================================================

import { Candle, atr, rsi, ema, lastValid, findSwings, classifyTrend } from './indicators';
import {
  StrategySignal,
  detectAsianSweep,
  detectSMC,
  detectCRT,
  detectPriceAction,
  detectFibonacci,
  detectSRFlip,
} from './strategies';

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface TradePlan {
  symbol: string;
  timeframe: string;
  timestamp: string;

  // Signal
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;         // 0–100
  setupType: string;          // "Asian Sweep + OB", "SMC BOS + FVG", etc.
  strategy: string;           // which strategy fired (or 'None')
  session: string;            // Asian | London | NewYork | Off-Hours | Overlap

  // Trade levels
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  // Pip distances
  slPips: number;
  tp1Pips: number;
  tp2Pips: number;

  // Context
  currentPrice: number;
  atr: number;
  rsi: number | null;
  trend: string;              // Bullish | Bearish | Sideways

  // Narrative
  reasons: string[];
  warnings: string[];

  // Meta
  allSignals: StrategySignal[];  // every signal found (for reference)
  marketSummary: string;         // one-line summary
}

export interface SessionFilterOptions {
  mode: 'conservative' | 'balanced' | 'aggressive' | 'all' | 'custom';
  customSessions?: string[];     // ['London', 'NewYork'] etc.
}

export const DEFAULT_SESSION_FILTER: SessionFilterOptions = {
  mode: 'balanced',
};

// ============================================================================
// SESSION GATE — decides if trading is allowed right now
// ============================================================================

function isSessionAllowed(session: string, filter: SessionFilterOptions): boolean {
  const s = session.toLowerCase();

  switch (filter.mode) {
    case 'conservative':
      // Only London open + NY open
      return s === 'london' || s === 'newyork';

    case 'balanced':
      // London, NY, and their overlap — skip Asian and off-hours
      return (
        s === 'london' ||
        s === 'newyork' ||
        s === 'london/ny overlap'
      );

    case 'aggressive':
      // Everything except late NY / off-hours
      return s !== 'off-hours';

    case 'all':
      return true;

    case 'custom':
      if (!filter.customSessions || filter.customSessions.length === 0) return true;
      return filter.customSessions.some(cs => cs.toLowerCase() === s);

    default:
      return true;
  }
}

// ============================================================================
// CONFIDENCE GATE
// ============================================================================

const MIN_CONFIDENCE_DEFAULT = 75;
const MIN_CONFIDENCE_AGGRESSIVE = 70;
const MIN_CONFIDENCE_CONSERVATIVE = 80;

function getMinConfidence(filter: SessionFilterOptions): number {
  if (filter.mode === 'conservative') return MIN_CONFIDENCE_CONSERVATIVE;
  if (filter.mode === 'aggressive' || filter.mode === 'all') return MIN_CONFIDENCE_AGGRESSIVE;
  return MIN_CONFIDENCE_DEFAULT;
}

// ============================================================================
// MARKET SUMMARY
// ============================================================================

function buildMarketSummary(
  direction: 'BUY' | 'SELL' | 'WAIT',
  session: string,
  trend: string,
  confidence: number,
  reasons: string[]
): string {
  if (direction === 'WAIT') {
    return `No clean setup right now. ${session} session — ${trend} structure. Waiting for confirmation.`;
  }

  const firstReason = reasons[0] || 'Setup detected';
  return `${direction} setup on ${session} session — ${trend} trend. ${firstReason}. Confidence ${confidence}%.`;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeMarket(params: {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  sessionFilter?: SessionFilterOptions;
}): TradePlan {
  const { symbol, timeframe, candles } = params;
  const filter = params.sessionFilter || DEFAULT_SESSION_FILTER;

  // ─── Compute basics ────────────────────────────────────────────────
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const atrArr = atr(candles, 14);
  const currentAtr = lastValid(atrArr) || 0;
  const rsiArr = rsi(candles, 14);
  const currentRsi = lastValid(rsiArr);
  const swings = findSwings(candles, 2);
  const trend = swings.length >= 4 ? classifyTrend(swings) : 'Sideways';

  // ─── Session detection ─────────────────────────────────────────────
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] as any : null;
  const lastCandleTime = lastCandle ? (Number(lastCandle.timestamp) || Number(lastCandle.time) || Date.now()) : Date.now();
  const session = detectSession(lastCandleTime);

  // ─── Run all 4 strategies ──────────────────────────────────────────
  const signals: StrategySignal[] = [];

  const asianSignal = safeRun(() => detectAsianSweep(candles, symbol, timeframe));
  if (asianSignal) signals.push(asianSignal);

  const smcSignal = safeRun(() => detectSMC(candles, symbol, timeframe));
  if (smcSignal) signals.push(smcSignal);

  const crtSignal = safeRun(() => detectCRT(candles, symbol, timeframe));
  if (crtSignal) signals.push(crtSignal);

  const paSignal = safeRun(() => detectPriceAction(candles, symbol, timeframe));
  if (paSignal) signals.push(paSignal);

  const fibSignal = safeRun(() => detectFibonacci(candles, symbol, timeframe));
  if (fibSignal) signals.push(fibSignal);

  const srFlipSignal = safeRun(() => detectSRFlip(candles, symbol, timeframe));
  if (srFlipSignal) signals.push(srFlipSignal);

  // ─── Sort by confidence (highest first) ────────────────────────────
  signals.sort((a, b) => b.confidence - a.confidence);

  // ─── Pick the best signal that passes filters ──────────────────────
  const minConf = getMinConfidence(filter);
  const allowed = isSessionAllowed(session, filter);

  let best: StrategySignal | null = null;
  if (allowed) {
    best = signals.find(s => s.confidence >= minConf) || null;
  }

  // ─── Build the trade plan ──────────────────────────────────────────
  if (!best) {
    return {
      symbol,
      timeframe,
      timestamp: new Date().toISOString(),
      direction: 'WAIT',
      confidence: 0,
      setupType: 'No setup',
      strategy: 'None',
      session,
      entry: roundPrice(currentPrice),
      stopLoss: 0,
      takeProfit1: 0,
      takeProfit2: 0,
      riskReward: 0,
      slPips: 0,
      tp1Pips: 0,
      tp2Pips: 0,
      currentPrice: roundPrice(currentPrice),
      atr: currentAtr,
      rsi: currentRsi,
      trend,
      reasons: [
        !allowed
          ? `${session} session is outside your active trading window`
          : 'No strategy met the minimum confidence threshold',
      ],
      warnings: allowed
        ? ['Wait for a cleaner setup — do not force trades']
        : ['Enable more sessions in Settings if you want signals now'],
      allSignals: signals,
      marketSummary: buildMarketSummary('WAIT', session, trend, 0, []),
    };
  }

  // ─── Add ATR-based sanity warnings ────────────────────────────────
  const warnings = [...best.warnings];
  const slDistance = Math.abs(best.entry - best.stopLoss);
  if (currentAtr > 0 && slDistance > currentAtr * 3) {
    warnings.push('Stop loss is unusually wide — consider reducing position size');
  }
  if (currentAtr > 0 && slDistance < currentAtr * 0.3) {
    warnings.push('Stop loss is very tight — risk of being stopped out by noise');
  }

  return {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    direction: best.direction,
    confidence: best.confidence,
    setupType: best.setupType,
    strategy: best.strategy,
    session,
    entry: best.entry,
    stopLoss: best.stopLoss,
    takeProfit1: best.takeProfit1,
    takeProfit2: best.takeProfit2,
    riskReward: best.riskReward,
    slPips: best.slPips,
    tp1Pips: best.tp1Pips,
    tp2Pips: best.tp2Pips,
    currentPrice: roundPrice(currentPrice),
    atr: currentAtr,
    rsi: currentRsi,
    trend,
    reasons: best.reasons,
    warnings,
    allSignals: signals,
    marketSummary: buildMarketSummary(
      best.direction,
      session,
      trend,
      best.confidence,
      best.reasons
    ),
  };
}

// ============================================================================
// MULTI-SYMBOL SCANNER
// ============================================================================

export interface ScanResult {
  symbol: string;
  timeframe: string;
  plan: TradePlan;
}

/**
 * Scan a list of symbols on a given timeframe and return all with a signal.
 * Signals are sorted by confidence (highest first).
 */
export function scanSymbols(params: {
  symbols: string[];
  timeframe: string;
  candlesBySymbol: Record<string, Candle[]>;
  sessionFilter?: SessionFilterOptions;
  minConfidence?: number;
}): ScanResult[] {
  const { symbols, timeframe, candlesBySymbol } = params;
  const minConf = params.minConfidence ?? 75;
  const filter = params.sessionFilter || DEFAULT_SESSION_FILTER;

  const results: ScanResult[] = [];

  for (const symbol of symbols) {
    const candles = candlesBySymbol[symbol];
    if (!candles || candles.length < 30) continue;

    const plan = analyzeMarket({ symbol, timeframe, candles, sessionFilter: filter });
    if (plan.direction !== 'WAIT' && plan.confidence >= minConf) {
      results.push({ symbol, timeframe, plan });
    }
  }

  // Highest confidence first
  results.sort((a, b) => b.plan.confidence - a.plan.confidence);

  return results;
}

// ============================================================================
// HELPERS
// ============================================================================

function detectSession(timestamp: number): string {
  const h = new Date(timestamp).getUTCHours();
  if (h >= 0  && h < 7)  return 'Asian';
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 16) return 'London/NY Overlap';
  if (h >= 16 && h < 21) return 'NewYork';
  return 'Off-Hours';
}

function roundPrice(p: number): number {
  if (p === 0) return 0;
  if (p > 500) return Number(p.toFixed(2));
  if (p > 50)  return Number(p.toFixed(2));
  if (p > 5)   return Number(p.toFixed(3));
  return Number(p.toFixed(5));
}

/**
 * Run a strategy and catch any error so one bad strategy doesn't
 * break the whole analysis.
 */
function safeRun<T>(fn: () => T | null): T | null {
  try {
    return fn();
  } catch (err) {
    console.warn('[signalEngine] Strategy error:', err);
    return null;
  }
}
