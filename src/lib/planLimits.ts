// ============================================================================
// PLAN LIMITS — single source of truth
// ----------------------------------------------------------------------------
// Used by both client (for UI counters) and server (for enforcement).
// Chart uploads, pulse signals, custom setups are PER-DAY, per user.
// ============================================================================

export type PlanTier = 'Pending' | 'Starter' | 'Pro' | 'Elite';

export interface PlanLimits {
  chartUploadsPerDay: number;
  pulseSignalsPerDay: number;
  customSetupsPerDay: number;
  // Boolean feature gates
  signalOfTheDay: boolean;
  mt5Connection: boolean;
  autoTrading: boolean;
  propPass: boolean;
  cloudBots: boolean;
  voiceInteraction: boolean;
  promptTrading: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  Pending: {
    chartUploadsPerDay: 0,
    pulseSignalsPerDay: 0,
    customSetupsPerDay: 0,
    signalOfTheDay: false,
    mt5Connection: false,
    autoTrading: false,
    propPass: false,
    cloudBots: false,
    voiceInteraction: false,
    promptTrading: false,
  },
  Starter: {
    chartUploadsPerDay: 10,
    pulseSignalsPerDay: 2,
    customSetupsPerDay: 3,
    signalOfTheDay: false,
    mt5Connection: false,
    autoTrading: false,
    propPass: false,
    cloudBots: false,
    voiceInteraction: false,
    promptTrading: false,
  },
  Pro: {
    chartUploadsPerDay: 24,
    pulseSignalsPerDay: 2,
    customSetupsPerDay: Number.POSITIVE_INFINITY,
    signalOfTheDay: true,
    mt5Connection: true,
    autoTrading: true,
    propPass: true,
    cloudBots: true,
    voiceInteraction: true,
    promptTrading: true,
  },
  Elite: {
    chartUploadsPerDay: Number.POSITIVE_INFINITY,
    pulseSignalsPerDay: Number.POSITIVE_INFINITY,
    customSetupsPerDay: Number.POSITIVE_INFINITY,
    signalOfTheDay: true,
    mt5Connection: true,
    autoTrading: true,
    propPass: true,
    cloudBots: true,
    voiceInteraction: true,
    promptTrading: true,
  },
};

/** Get limits for a plan (safe fallback to Pending). */
export function getLimits(plan: string | undefined | null): PlanLimits {
  const key = (plan || 'Pending') as PlanTier;
  return PLAN_LIMITS[key] || PLAN_LIMITS.Pending;
}

/** True if user's plan can perform at least 1 of the given action. */
export function canUploadChart(plan: string | undefined | null): boolean {
  return getLimits(plan).chartUploadsPerDay > 0;
}

/** Human-readable limit label. */
export function limitLabel(limit: number): string {
  if (limit === 0) return 'Not available';
  if (!isFinite(limit)) return 'Unlimited';
  return `${limit}/day`;
}
