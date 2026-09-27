// ============================================================================
// PIPNEX TRADING ENGINE — PUBLIC API
// ----------------------------------------------------------------------------
// Single import point for the whole engine. server.ts imports from here only.
//
// Usage:
//   import {
//     analyzeMarket,
//     scanSymbols,
//     analyzeNews,
//     isNewsLockoutActive,
//     respondToUser,
//   } from './server/engine';
// ============================================================================

// ─── Types ───
export type { Candle, SwingPoint, Trend, SessionWindow } from './indicators';
export type {
  StrategySignal,
} from './strategies';
export type {
  TradePlan,
  SessionFilterOptions,
  ScanResult,
} from './signalEngine';
export type {
  ForexFactoryEvent,
  CurrencyScore,
  NewsBias,
  PairBias,
} from './newsEngine';
export type {
  AssistantContext,
  AssistantReply,
} from './assistantEngine';

// ─── Indicators (lower-level utilities — exposed for advanced use) ───
export {
  atr,
  rsi,
  ema,
  sma,
  findSwings,
  recentSwings,
  classifyTrend,
  findSupportLevels,
  findResistanceLevels,
  getAsianRange,
  getLatestAsianSession,
  isInSession,
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
  isDoji,
  isMarubozu,
  aggregateCandles,
  lastValid,
  isValidNumber,
  stddev,
  SESSIONS,
} from './indicators';

// ─── Strategies ───
export {
  detectAsianSweep,
  detectSMC,
  detectCRT,
  detectPriceAction,
} from './strategies';

// ─── Signal Engine ───
export {
  analyzeMarket,
  scanSymbols,
  DEFAULT_SESSION_FILTER,
} from './signalEngine';

// ─── News Engine ───
export {
  analyzeNews,
  isNewsLockoutActive,
} from './newsEngine';

// ─── Assistant Engine ───
export {
  respondToUser,
  respondToUserSync,
  classifyIntent,
  extractSymbol,
  extractTimeframe,
  KNOWLEDGE_BASE,
} from './assistantEngine';

// ============================================================================
// ENGINE VERSION — bump when you change behaviour
// ============================================================================
export const ENGINE_VERSION = '1.0.0';
