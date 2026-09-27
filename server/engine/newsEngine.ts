// ============================================================================
// PIPNEX TRADING ENGINE — NEWS ENGINE
// ----------------------------------------------------------------------------
// Reads ForexFactory calendar events (already fetched by your app) and:
//   1. Computes a USD strength score (-10 to +10)
//   2. Scores news bias per currency
//   3. Recommends pair direction for upcoming high-impact events
//   4. Warns about imminent releases (news lockout)
//
// No external APIs. No AI. Pure rules.
// ============================================================================

export interface ForexFactoryEvent {
  id: string;
  title: string;
  currency: string;         // USD, EUR, GBP, JPY, etc.
  country: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | 'Non-Economic';
  actual?: string;
  forecast?: string;
  previous?: string;
  timestamp?: number;       // unix ms of scheduled release
  countdown?: string;
  betterThanForecast?: 'better' | 'worse' | 'neutral' | 'pending';
}

export interface CurrencyScore {
  currency: string;
  score: number;               // -10 to +10
  label: 'Strong' | 'Mild Bullish' | 'Neutral' | 'Mild Bearish' | 'Weak';
  events: number;              // how many events contributed
  reasons: string[];
}

export interface NewsBias {
  timestamp: string;
  usd: CurrencyScore;
  otherCurrencies: CurrencyScore[];
  pairBiases: PairBias[];
  upcomingHighImpact: ForexFactoryEvent[];
  warnings: string[];
}

export interface PairBias {
  pair: string;                // 'EURUSD'
  bias: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reason: string;
}

// ============================================================================
// CURRENCY WEIGHTS
// Base currencies (USD strongest weight, then majors)
// ============================================================================
const CURRENCY_WEIGHTS: Record<string, number> = {
  USD: 1.0,
  EUR: 0.9,
  GBP: 0.85,
  JPY: 0.8,
  CHF: 0.75,
  CAD: 0.7,
  AUD: 0.7,
  NZD: 0.6,
  CNY: 0.5,
};

// ============================================================================
// KEYWORD SENTIMENT — for parsing news-style events
// ============================================================================
const HAWKISH_KEYWORDS = [
  'rate hike', 'hawkish', 'tightening', 'above expectations', 'beat',
  'raised forecast', 'strong jobs', 'inflation up', 'higher than expected',
  'bullish', 'upgraded',
];

const DOVISH_KEYWORDS = [
  'rate cut', 'dovish', 'easing', 'below expectations', 'miss',
  'lowered forecast', 'weak jobs', 'inflation down', 'lower than expected',
  'bearish', 'downgraded',
];

function sentimentFromTitle(title: string): number {
  const t = title.toLowerCase();
  let score = 0;
  for (const kw of HAWKISH_KEYWORDS) if (t.includes(kw)) score += 1;
  for (const kw of DOVISH_KEYWORDS) if (t.includes(kw)) score -= 1;
  return Math.max(-1, Math.min(1, score));
}

// ============================================================================
// EVENT IMPACT WEIGHT
// ============================================================================
function impactWeight(impact: string): number {
  switch (impact) {
    case 'High': return 3;
    case 'Medium': return 1.5;
    case 'Low': return 0.5;
    default: return 0;
  }
}

// ============================================================================
// PARSE NUMERIC VALUES — "208K" → 208000, "3.5%" → 3.5
// ============================================================================
function parseNumericValue(v?: string): number | null {
  if (!v) return null;
  const clean = v.trim().replace(/,/g, '').replace(/\s/g, '');
  if (clean === '' || clean === '-' || clean.toUpperCase() === 'N/A') return null;

  // Percent
  if (clean.endsWith('%')) {
    const n = parseFloat(clean.slice(0, -1));
    return isNaN(n) ? null : n;
  }

  // Thousands / Millions / Billions
  const mults: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
  const lastChar = clean.slice(-1).toUpperCase();
  if (mults[lastChar]) {
    const n = parseFloat(clean.slice(0, -1));
    return isNaN(n) ? null : n * mults[lastChar];
  }

  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

// ============================================================================
// SCORE A SINGLE EVENT
// Returns -3 to +3 for its currency (positive = bullish for that currency)
// ============================================================================
function scoreEvent(event: ForexFactoryEvent): { score: number; reason: string } | null {
  const impact = impactWeight(event.impact);
  if (impact === 0) return null;

  const actual = parseNumericValue(event.actual);
  const forecast = parseNumericValue(event.forecast);
  const previous = parseNumericValue(event.previous);

  // If we have actual vs forecast → measure surprise
  if (actual !== null && forecast !== null) {
    const surprise = actual - forecast;
    const magnitude = forecast !== 0 ? Math.abs(surprise) / Math.abs(forecast) : 0;

    // Any positive surprise = bullish for the currency
    let direction = Math.sign(surprise);
    if (direction === 0) direction = 0;

    // Scale by magnitude and impact weight
    const scaled = direction * Math.min(1, magnitude * 10) * impact;

    const label = direction > 0 ? 'beat forecast' : direction < 0 ? 'missed forecast' : 'in line';
    const reason = `${event.currency} ${event.title}: ${event.actual} vs ${event.forecast} (${label})`;

    return { score: scaled, reason };
  }

  // If no actual yet, use keyword sentiment from title
  const sentiment = sentimentFromTitle(event.title);
  if (sentiment !== 0) {
    return {
      score: sentiment * impact * 0.5,
      reason: `${event.currency} ${event.title} (${sentiment > 0 ? 'hawkish tone' : 'dovish tone'})`,
    };
  }

  return null;
}

// ============================================================================
// COMPUTE CURRENCY SCORE FROM EVENTS
// ============================================================================
function scoreCurrency(currency: string, events: ForexFactoryEvent[]): CurrencyScore {
  const currencyEvents = events.filter(e => e.currency === currency);
  let total = 0;
  const reasons: string[] = [];
  let contributingEvents = 0;

  for (const evt of currencyEvents) {
    const result = scoreEvent(evt);
    if (result) {
      total += result.score;
      reasons.push(result.reason);
      contributingEvents++;
    }
  }

  // Clamp to -10..+10
  const clamped = Math.max(-10, Math.min(10, total));

  let label: CurrencyScore['label'];
  if (clamped >= 4) label = 'Strong';
  else if (clamped >= 1.5) label = 'Mild Bullish';
  else if (clamped <= -4) label = 'Weak';
  else if (clamped <= -1.5) label = 'Mild Bearish';
  else label = 'Neutral';

  return {
    currency,
    score: Number(clamped.toFixed(2)),
    label,
    events: contributingEvents,
    reasons: reasons.slice(0, 5),  // keep top 5
  };
}

// ============================================================================
// PAIR BIAS — compare USD score vs the other currency's score
// ============================================================================
function computePairBias(pair: string, usdScore: number, otherScore: number): PairBias {
  // Split pair into base/quote (e.g., EURUSD → EUR, USD)
  const base = pair.slice(0, 3);
  const quote = pair.slice(3, 6);

  let usdBias = usdScore;
  let otherBias = otherScore;

  // Determine which side USD is on
  let strongCurrency: 'USD' | 'OTHER' | 'EQUAL' = 'EQUAL';
  let strengthDiff = 0;

  if (base === 'USD') {
    // USD is the base — pair goes up if USD strong and other weak
    strengthDiff = usdBias - otherBias;
  } else if (quote === 'USD') {
    // USD is the quote — pair goes down if USD strong and other weak
    strengthDiff = otherBias - usdBias;
  } else {
    // Non-USD pair — this shouldn't be called for pure crosses
    return { pair, bias: 'WAIT', confidence: 0, reason: 'Non-USD pair — check cross-currency strengths' };
  }

  // Confidence: strength difference × 10, capped
  const confidence = Math.min(100, Math.abs(strengthDiff) * 10);

  if (Math.abs(strengthDiff) < 0.5) {
    return {
      pair,
      bias: 'WAIT',
      confidence: 0,
      reason: `USD and ${base === 'USD' ? quote : base} scores are too close (${strengthDiff.toFixed(2)})`,
    };
  }

  const bias: 'BUY' | 'SELL' = strengthDiff > 0 ? 'BUY' : 'SELL';
  const drivingSide = base === 'USD' ? (bias === 'BUY' ? 'USD strong' : 'USD weak') : (bias === 'BUY' ? 'USD weak' : 'USD strong');

  return {
    pair,
    bias,
    confidence: Number(confidence.toFixed(1)),
    reason: `USD score ${usdScore.toFixed(2)} vs ${otherScore.toFixed(2)} — ${drivingSide}`,
  };
}

// ============================================================================
// MAIN ENTRY
// ============================================================================
export function analyzeNews(events: ForexFactoryEvent[]): NewsBias {
  const timestamp = new Date().toISOString();
  const warnings: string[] = [];

  // 1. Score each currency that appears in the events
  const currencies = Array.from(
    new Set(events.map(e => e.currency).filter(c => c && CURRENCY_WEIGHTS[c] !== undefined))
  );

  const currencyScores: CurrencyScore[] = currencies.map(c => scoreCurrency(c, events));
  const usdScore = currencyScores.find(c => c.currency === 'USD') || {
    currency: 'USD', score: 0, label: 'Neutral' as const, events: 0, reasons: [],
  };

  const otherScores = currencyScores.filter(c => c.currency !== 'USD');

  // 2. Compute pair biases for USD pairs
  const usdPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
  ];

  const pairBiases: PairBias[] = usdPairs.map(pair => {
    const base = pair.slice(0, 3);
    const quote = pair.slice(3, 6);
    const otherCurrency = base === 'USD' ? quote : base;
    const other = otherScores.find(c => c.currency === otherCurrency);
    const otherScore = other?.score ?? 0;
    return computePairBias(pair, usdScore.score, otherScore);
  }).filter(b => b.confidence > 0);

  // Sort pairBiases by confidence
  pairBiases.sort((a, b) => b.confidence - a.confidence);

  // 3. Find upcoming high-impact events (next 24h)
  const now = Date.now();
  const next24h = now + 24 * 60 * 60 * 1000;
  const upcomingHighImpact = events.filter(e => {
    if (e.impact !== 'High') return false;
    if (!e.timestamp) return false;
    return e.timestamp > now && e.timestamp < next24h;
  }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // 4. Warnings
  for (const evt of upcomingHighImpact) {
    if (!evt.timestamp) continue;
    const minutesToEvent = (evt.timestamp - now) / 60000;
    if (minutesToEvent <= 30 && minutesToEvent > 0) {
      warnings.push(`⚠️ ${evt.currency} ${evt.title} in ${Math.round(minutesToEvent)} min — expect volatility`);
    }
  }

  if (usdScore.score >= 4) {
    warnings.push('USD is strong today — favor USD longs / risk-off');
  } else if (usdScore.score <= -4) {
    warnings.push('USD is weak today — favor USD shorts / risk-on');
  }

  return {
    timestamp,
    usd: usdScore,
    otherCurrencies: otherScores,
    pairBiases,
    upcomingHighImpact: upcomingHighImpact.slice(0, 5),
    warnings,
  };
}

// ============================================================================
// CONVENIENCE — check if news lockout is active right now
// ============================================================================
export function isNewsLockoutActive(
  events: ForexFactoryEvent[],
  minutesBefore = 15,
  minutesAfter = 15
): { isLocked: boolean; reason?: string; minutesRemaining?: number } {
  const now = Date.now();
  const before = minutesBefore * 60 * 1000;
  const after = minutesAfter * 60 * 1000;

  for (const evt of events) {
    if (evt.impact !== 'High') continue;
    if (!evt.timestamp) continue;

    const diff = evt.timestamp - now;
    if (diff >= -after && diff <= before) {
      const label = diff > 0 ? 'before' : 'after';
      const mins = Math.round(Math.abs(diff) / 60000);
      return {
        isLocked: true,
        reason: `${evt.currency} ${evt.title} — ${mins} min ${label} release`,
        minutesRemaining: label === 'before' ? mins : 0,
      };
    }
  }

  return { isLocked: false };
}
