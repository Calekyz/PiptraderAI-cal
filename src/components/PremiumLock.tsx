import React from 'react';
import { UserProfile, TrialStatusResponse } from '../types';
import { Lock, Zap, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface PremiumLockProps {
  featureName: string;
  featureDescription?: string;
  user: UserProfile | null;
  trialStatus?: TrialStatusResponse | null;
  onUpgradeClick: () => void;
  onSignInClick?: () => void;
  children: React.ReactNode;
  benefits?: string[];
}

export const PremiumLock: React.FC<PremiumLockProps> = ({
  featureName,
  featureDescription,
  user,
  trialStatus,
  onUpgradeClick,
  onSignInClick,
  children,
  benefits
}) => {
  // Determine if unlocked
  const isPaid = Boolean(user && user.plan && user.plan !== 'Free Trial');
  const isEarlyAccess = Boolean(user?.isEarlyAccessUser || trialStatus?.isEarlyAccessUser);
  
  // Calculate if trial is actively valid
  let isTrialValid = false;
  if (isEarlyAccess && user) {
    if (trialStatus?.isTrialActive !== undefined) {
      isTrialValid = trialStatus.isTrialActive;
    } else {
      const startedAt = user.trialStartedAt || user.createdAt;
      const expiresAt = user.trialExpiresAt || (startedAt ? new Date(new Date(startedAt).getTime() + 72 * 3600 * 1000).toISOString() : null);
      if (expiresAt) {
        isTrialValid = new Date(expiresAt).getTime() > Date.now();
      }
    }
  }

  const isUnlocked = isPaid || isTrialValid;

  // If unlocked, render child feature directly
  if (isUnlocked) {
    return <>{children}</>;
  }

  const isExpired = isEarlyAccess && !isTrialValid;

  const defaultBenefits = benefits || [
    'Institutional Gemini 3.7 Market Pattern & Liquidity Analysis',
    'Real-time automated Take-Profit & Stop-Loss risk calculation',
    'High-frequency scalp signals & MT5 low-latency execution',
    'Prop firm passing guardrails (FTMO, MFF, FundedNext compatible)'
  ];

  return (
    <div className="relative w-full min-h-[500px] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background preview container with heavy blur & reduced opacity */}
      <div className="absolute inset-0 opacity-20 pointer-events-none filter blur-sm overflow-hidden select-none" aria-hidden="true">
        {children}
      </div>

      {/* Foreground Modern High-Conversion Lock Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative z-20 max-w-xl w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center"
      >
        {/* Top Floating Badge */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-full text-slate-950 shadow">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Feature Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>PRO & ELITE FEATURE</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {featureName} is Locked
        </h2>

        <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
          {isExpired ? (
            <span className="text-rose-300 font-medium">
              Your 3-day early-access free trial has ended. Upgrade to an active plan to continue using this tool.
            </span>
          ) : !user ? (
            <span>
              Sign in with your pre-approved early-access account for a 3-day free trial, or upgrade to PipNex Pro for instant access.
            </span>
          ) : (
            <span>
              {featureDescription || 'This institutional trading module requires an active PipNex Pro or Elite subscription.'}
            </span>
          )}
        </p>

        {/* Feature Benefits List */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-6 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>What you unlock with PipNex Pro</span>
          </h4>
          <ul className="space-y-2.5">
            {defaultBenefits.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onUpgradeClick}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Upgrade to Pro / Elite</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!user && onSignInClick && (
            <button
              onClick={onSignInClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <span>Sign In / Early Access</span>
            </button>
          )}
        </div>

        {/* Guarantee note */}
        <p className="text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Automated M-Pesa & Card activation • Instant unlocked access</span>
        </p>
      </motion.div>
    </div>
  );
};
