// ============================================================================
// PIPNEX PLAN ACCESS CONTROL
// ----------------------------------------------------------------------------
// Single source of truth for what each plan unlocks.
// Plan names: 'Pending' | 'Starter' | 'Pro' | 'Elite'
// ============================================================================

export type PlanTier = 'Pending' | 'Starter' | 'Pro' | 'Elite';

export interface PlanFeatures {
  // Core
  chartAnalysis: boolean;
  pulseSignals: 'none' | 'limited' | 'unlimited';
  newsAnalysis: boolean;

  // Pro tier
  autoTrading: boolean;
  propPass: boolean;

  // Elite tier
  promptTrading: boolean;
  mt5Connection: boolean;
  cloudBots: boolean;
  customSetups: 'limited' | 'unlimited';

  // Support
  prioritySupport: boolean;
  dedicatedDesk: boolean;
}

const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  Pending: {
    chartAnalysis: false,
    pulseSignals: 'none',
    newsAnalysis: false,
    autoTrading: false,
    propPass: false,
    promptTrading: false,
    mt5Connection: false,
    cloudBots: false,
    customSetups: 'limited',
    prioritySupport: false,
    dedicatedDesk: false,
  },
  Starter: {
    chartAnalysis: true,
    pulseSignals: 'limited',
    newsAnalysis: true,
    autoTrading: false,
    propPass: false,
    promptTrading: false,
    mt5Connection: false,
    cloudBots: false,
    customSetups: 'limited',
    prioritySupport: true,
    dedicatedDesk: false,
  },
  Pro: {
    chartAnalysis: true,
    pulseSignals: 'limited',
    newsAnalysis: true,
    autoTrading: true,
    propPass: true,
    promptTrading: false,
    mt5Connection: false,
    cloudBots: false,
    customSetups: 'unlimited',
    prioritySupport: true,
    dedicatedDesk: false,
  },
  Elite: {
    chartAnalysis: true,
    pulseSignals: 'unlimited',
    newsAnalysis: true,
    autoTrading: true,
    propPass: true,
    promptTrading: true,
    mt5Connection: true,
    cloudBots: true,
    customSetups: 'unlimited',
    prioritySupport: true,
    dedicatedDesk: true,
  },
};

/** Get all features for a plan */
export function getPlanFeatures(plan?: string | null): PlanFeatures {
  const p = (plan || 'Pending') as PlanTier;
  return PLAN_FEATURES[p] || PLAN_FEATURES.Pending;
}

/** Is this a paid plan? */
export function isPaidPlan(plan?: string | null): boolean {
  return plan === 'Starter' || plan === 'Pro' || plan === 'Elite';
}

/** Does this user have access to a named feature? */
export function hasFeature(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan);
  const value = features[feature];
  if (typeof value === 'boolean') return value;
  // 'limited' or 'unlimited' → both count as true; 'none' → false
  return value !== 'none';
}

/** Get display label for plan (for badges) */
export function getPlanLabel(plan?: string | null): string {
  if (!plan || plan === 'Pending') return 'Trial';
  return plan;
}
