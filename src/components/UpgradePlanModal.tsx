import React, { useState } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '../types';
import { DynamicPaymentModal } from './DynamicPaymentModal';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: 'Starter' | 'Pro' | 'Elite' | string;
  user?: UserProfile | null;
  onUpgradeSuccess?: (planName: string) => void;
}

const PLANS = [
  { id: 'starter', name: 'Starter', priceUsd: 45, tagline: 'For getting started' },
  { id: 'pro', name: 'Pro', priceUsd: 95, tagline: 'Most popular' },
  { id: 'elite', name: 'Elite', priceUsd: 195, tagline: 'Maximum performance' },
];

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  defaultTier = 'Pro',
  user,
  onUpgradeSuccess,
}) => {
  const [selected, setSelected] = useState<string>(String(defaultTier).toLowerCase());
  const [showPayment, setShowPayment] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = PLANS.find((p) => p.id === selected) || PLANS[1];

  const handleContinue = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (planName: string) => {
    setShowPayment(false);
    onUpgradeSuccess?.(planName);
    onClose();
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  // When user proceeds to payment, render DynamicPaymentModal
  if (showPayment) {
    return (
      <DynamicPaymentModal
        isOpen={true}
        onClose={handlePaymentClose}
        productId={selected}
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0e1224] border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Upgrade Your Plan</h2>
            <p className="text-xs text-slate-400 mt-1">Choose the plan that fits your trading goals</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#16192b]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((plan) => {
            const isSel = plan.id === selected;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  isSel
                    ? 'border-purple-500 bg-purple-500/15'
                    : 'border-[#1e233d] bg-[#0f1224] hover:border-purple-500/40'
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-wide ${isSel ? 'text-purple-300' : 'text-slate-500'}`}>
                  {plan.name}
                </div>
                <div className={`text-2xl font-extrabold mt-1 ${isSel ? 'text-white' : 'text-slate-300'}`}>
                  ${plan.priceUsd}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{plan.tagline}</div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-bold"
          >
            Continue with {selectedPlan.name} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;
