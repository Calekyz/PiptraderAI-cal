export type PlanTier = 'Pending' | 'Starter' | 'Pro' | 'Elite';

export interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  referralCode?: string;
  isVerified: boolean;
  authProvider: 'email' | 'google';
  avatarUrl?: string;
  plan?: PlanTier;
  mt5Connected?: boolean;
  createdAt?: string;
}

// Kept for API compat. Trial semantics removed — isUnlocked simply means
// the user has an admin-assigned paid plan.
export interface TrialStatusResponse {
  isTrialActive: boolean;       // always false now
  isEarlyAccessUser: boolean;   // always false now
  isUnlocked: boolean;          // true when plan is Starter/Pro/Elite
  trialStatus: 'ACTIVE' | 'EXPIRED' | 'NOT_ELIGIBLE' | 'UPGRADED';
  plan: string;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  totalDurationHours: number;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  serverTimeUtc: string;
  formattedRemainingTime: string;
}

export interface PricingPlan {
  id: 'starter' | 'pro' | 'elite';
  name: string;
  subtitle: string;
  monthlyUsd: number;
  monthlyKes: number;
  annualUsd: number;
  annualKes: number;
  annualDiscountPercent: number;
  features: string[];
  badge?: string;
  highlighted?: boolean;
  color: string;
}

export interface CountryItem {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export interface ForexPair {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down';
  high?: number;
  low?: number;
}

export interface MacroEvent {
  id: string;
  title: string;
  country: string;
  countryFlag: string;
  currency?: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | 'Non-Economic';
  category: string;
  date?: string;
  dateStr?: string;
  time?: string;
  dayDate?: string;
  dayName?: string;
  formattedDate?: string;
  countdown: string;
  timestamp?: number;
  consensus?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  betterThanForecast?: 'better' | 'worse' | 'neutral' | 'pending';
  analysis?: string;
  detail?: string;
  sourceUrl?: string;
  sourceName?: string;
  affectedPairs?: string[];
  bias?: string;
  analysisSummary?: string;
}

export interface BotTrade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  profitPips: number;
  pnlUsd: number;
  status: 'OPEN' | 'CLOSED';
  botStrategy: string;
  timestamp: string;
}

export interface BotStrategy {
  id: string;
  name: string;
  version: string;
  winRate: number;
  totalPips: number;
  status: 'active' | 'paused';
  riskLevel: 'Low' | 'Medium' | 'Aggressive';
  pairs: string[];
  description: string;
}

export interface PulseSignal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  riskReward: string;
  confidence: number;
  timeframe: string;
  timeAgo: string;
  status: 'ACTIVE' | 'HIT_TP1' | 'HIT_TP2' | 'CLOSED';
  gainPips: number;
}
