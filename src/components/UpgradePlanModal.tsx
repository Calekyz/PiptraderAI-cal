import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Shield, Crown, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { DynamicPaymentModal } from './DynamicPaymentModal';
import { fetchProductsCatalogue, ProductPlanInfo } from '../lib/paymentService';

export type PlanTierType = 'Starter' | 'Pro' | 'Elite';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: PlanTierType;
  user?: UserProfile | null;
  onUpgradeSuccess: (tier: any) => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  defaultTier = 'Pro',
  user,
  onUpgradeSuccess
}) => {
  const initialTier: string =
    defaultTier === 'Elite' ? 'elite' :
    defaultTier === 'Starter' ? 'starter' :
    'pro';

  const [selectedProductId, setSelectedProductId] = useState<string>(initialTier);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductPlanInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProductsCatalogue().then((prods) => {
        if (prods.length > 0) {
          setProducts(prods);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fallbackTiers: ProductPlanInfo[] = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Perfect for getting started',
      usdPrice: 45,
      exchangeRate: 129,
      kesAmount: 5805,
      formattedKes: 'KES 5,805',
      billing: '/ ½ month',
      badge: '',
      highlighted: false,
      color: 'from-blue-600 to-indigo-600',
      features: [
        '10 Chart Uploads per day',
        'Advanced Chart Analysis',
        'Multi-Timeframe Analysis',
        'PipNex Pulse Signals (2/day)',
        'AI News Trading Analysis',
        'Position Size Calculator',
        '3 Custom AI Setups per day',
        'Smart Chart Analyzer',
        'Trading Journal',
        '24/7 Priority Support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: 'For serious traders',
      usdPrice: 95,
      exchangeRate: 129,
      kesAmount: 12255,
      formattedKes: 'KES 12,255',
      billing: '/ month',
      badge: '⭐ MOST POPULAR',
      highlighted: true,
      color: 'from-purple-600 to-indigo-600',
      features: [
        '24 Chart Uploads per day',
        'Multi-Timeframe Analysis',
        'Signal of the Day (90%+ accurate)',
        'PipNex Pulse Signals (2/day)',
        'AI News Trading Analysis (NFP/CPI)',
        'AI Auto trading',
        'PipNex PropPass',
        'Smart Chart Analyzer',
        'Unlimited Custom Setups',
        '24/7 Priority Support'
      ]
    },
    {
      id: 'elite',
      name: 'Elite',
      subtitle: 'Maximum performance',
      usdPrice: 195,
      exchangeRate: 129,
      kesAmount: 25155,
      formattedKes: 'KES 25,155',
      billing: '/ 3 months',
      badge: 'MAX PERFORMANCE',
      highlighted: false,
      color: 'from-amber-600 to-orange-600',
      features: [
        'Unlimited PipNex Pulse Signals',
        'Direct AI Chart Analysis (no uploads)',
        'Prompt Trading UI',
        'MT5 Account Connection',
        '🤖 Run Bots Without PC (Cloud Bots)',
        '🚀 Auto Trading (2000 AI credits)',
        '☁️ FREE VPS Included ($50/mo value)',
        'Voice-based AI Interaction',
        'AI reads account for journaling',
        'AI generates & executes strategies',
        'Unlimited MT5 accounts (10)',
        '24/7 Bot Monitoring & Alerts',
        'Priority AI processing',
        'White-glove support'
      ]
    }
  ];

  const activeTiers = products.length > 0 ? products.slice(0, 3) : fallbackTiers;
  const currentSelected = activeTiers.find((t) => t.id === selectedProductId) || activeTiers[1];

  const handleProceedToPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentCompleted = (planName: string) => {
    onUpgradeSuccess(planName);
    setIsPaymentModalOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div 
          id="upgrade-plan-modal"
          className="w-full max-w-5xl bg-[#0b0c14] border border-white/8 rounded-[28px] p-5 sm:p-7 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)] text-white relative max-h-[92vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-[10px] font-semibold tracking-wide uppercase text-purple-300 mb-2.5">
                <Sparkles className="w-3 h-3" />
                PipNex Membership
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Choose your plan</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Unlock AI chart intelligence, automated bots, and institutional signals. Select a plan, then pay with Pipnex Payment Agent.
              </p>
            </div>
            <button
              id="close-upgrade-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto pr-0.5 custom-scrollbar">
            {activeTiers.map((tier) => {
              const isSelected = selectedProductId === tier.id;
              return (
                <button
                  key={tier.id}
                  id={`tier-card-${tier.id}`}
                  type="button"
                  onClick={() => setSelectedProductId(tier.id)}
                  className={`text-left rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all duration-200 relative flex flex-col min-h-[280px] ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#2a2144] to-[#151228] border-purple-400/70 shadow-[0_0_28px_rgba(139,92,246,0.28)] ring-1 ring-purple-400/40'
                      : 'bg-[#12141f] border-white/8 hover:border-purple-400/35 hover:bg-[#16182a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-purple-300/80 font-semibold">{tier.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{tier.subtitle}</div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-purple-500 border-purple-300 text-white'
                        : 'border-white/20 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </div>

                  {tier.badge && (
                    <span className={`self-start mb-3 text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold ${
                      tier.highlighted
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-400/20'
                    }`}>
                      {tier.badge.replace(/^⭐\s*/, '')}
                    </span>
                  )}

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-white">${tier.usdPrice}</span>
                    <span className="text-[11px] text-slate-400">{tier.billing}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 mb-3">
                    ≈ KES {tier.kesAmount.toLocaleString()}
                  </div>

                  <div className="space-y-1.5 text-xs flex-1 overflow-y-auto max-h-44 custom-scrollbar pr-1">
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug text-[12px]">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`mt-4 w-full py-2 rounded-xl text-center text-[11px] font-semibold ${
                    isSelected
                      ? 'bg-purple-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]'
                      : 'bg-white/5 text-slate-300 border border-white/8'
                  }`}>
                    {isSelected ? 'Selected' : `Select ${tier.name}`}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-5 mt-4 border-t border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-[11px] text-slate-400 max-w-sm">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Pay securely via Pipnex Payment Agent, M-Pesa STK, or Binance USDT.</span>
            </div>

            <button
              id="confirm-upgrade-plan-btn"
              onClick={handleProceedToPayment}
              className="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9] hover:from-[#c4b5fd] hover:via-[#a78bfa] hover:to-[#7c3aed] active:scale-[0.98] text-white font-bold text-sm shadow-[0_8px_28px_rgba(139,92,246,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-[#fde68a]" />
              <span>Pay {currentSelected.name} · ${currentSelected.usdPrice}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <DynamicPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        productId={selectedProductId}
        user={user}
        onPaymentSuccess={handlePaymentCompleted}
      />
    </>
  );
};
