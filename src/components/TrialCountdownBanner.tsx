import React, { useState, useEffect } from 'react';
import { Clock, Crown, X, AlertCircle } from 'lucide-react';
import { UserProfile, TrialStatusResponse } from '../types';

interface TrialCountdownBannerProps {
  user: UserProfile;
  trialStatus: TrialStatusResponse | null;
  onUpgradeClick: () => void;
  onTrialExpired?: () => void;
}

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({
  user,
  trialStatus,
  onUpgradeClick,
  onTrialExpired,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [timeString, setTimeString] = useState<string>('');

  const plan = user?.plan || 'Pending';
  const isPending = plan === 'Pending';
  const isPaid = !isPending;

  useEffect(() => {
    if (isPending) return;

    const update = () => {
      if (trialStatus?.formattedRemainingTime) {
        setTimeString(trialStatus.formattedRemainingTime);
      } else {
        setTimeString('Active Plan');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isPending, trialStatus]);

  // If user already has a paid plan, show a small green "Active" pill, not a banner
  if (isPaid) {
    if (dismissed) return null;
    return (
      <div className="w-full px-4 md:px-6 pt-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              {plan} Plan Active — Full platform access unlocked
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Pending state — waiting for admin plan assignment
  return (
    <div className="w-full px-4 md:px-6 pt-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100">
              Account Pending Activation
            </div>
            <div className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Your account is waiting for plan approval. Unlock all features by choosing a plan.
            </div>
          </div>
        </div>

        <button
          onClick={onUpgradeClick}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-md shadow-amber-600/30 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Choose a Plan</span>
        </button>
      </div>
    </div>
  );
};
