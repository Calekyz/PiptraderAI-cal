import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, Sparkles, Rocket, ChevronDown, Copy, CheckCheck, Smartphone, CreditCard, Building2 } from 'lucide-react';
import { UserProfile } from '../types';

const WHATSAPP_NUMBER = '254116081230';

interface PaymentOption {
  key: string;
  label: string;
  detail: string;
  sub?: string;
  icon: 'phone' | 'card' | 'bank';
  copyValue: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    key: 'mpesa',
    label: 'M-Pesa',
    detail: '254799045699',
    sub: 'Caleb Orenge · M-Pesa network · Kenya',
    icon: 'phone',
    copyValue: '254799045699',
  },
  {
    key: 'airtel',
    label: 'Airtel Money',
    detail: '254789889573',
    sub: 'Predamah Ragira · Airtel Kenya',
    icon: 'phone',
    copyValue: '254789889573',
  },
  {
    key: 'mukuru',
    label: 'Mukuru',
    detail: '254799045699',
    sub: 'Caleb Orenge · M-Pesa network · Kenya',
    icon: 'bank',
    copyValue: '254799045699',
  },
  {
    key: 'neteller',
    label: 'Neteller',
    detail: 'caleborenge08@gmail.com',
    icon: 'card',
    copyValue: 'caleborenge08@gmail.com',
  },
];

interface Plan {
  key: string;
  name: string;
  price: number;
  tagline: string;
  popular?: boolean;
}

const FALLBACK_PLANS: Plan[] = [
  { key: 'starter', name: 'Starter', price: 195, tagline: 'For getting started' },
  { key: 'pro',     name: 'Pro',     price: 349, tagline: 'Most popular', popular: true },
  { key: 'elite',   name: 'Elite',   price: 599, tagline: 'Unlimited access' },
];

interface Props {
  user?: UserProfile;
  /** Optional: hide on plans that are already paid */
  compact?: boolean;
}

export const UpgradeWhatsAppCard: React.FC<Props> = ({ user, compact }) => {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selected, setSelected] = useState<string>('pro');
  const [showPayments, setShowPayments] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch { /* silent */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const { fetchProductsCatalogue } = await import('../lib/paymentService');
        const prods = await fetchProductsCatalogue();
        if (Array.isArray(prods) && prods.length > 0) {
          const mapped: Plan[] = prods
            .filter((p: any) => p.usdPrice && p.name)
            .map((p: any, i: number) => ({
              key: String(p.tier || p.name || '').toLowerCase() || `plan-${i}`,
              name: String(p.name).replace(/\s*Plan\s*/i, '').trim(),
              price: Number(p.usdPrice),
              tagline: p.description || (i === 1 ? 'Most popular' : ''),
              popular: i === 1,
            }));
          if (mapped.length > 0) setPlans(mapped);
        }
      } catch { /* keep fallback */ }
    })();
  }, []);

  const selectedPlan = plans.find(p => p.key === selected) || plans[1];

  const waHref = (() => {
    const lines = [
      `Hi, I'd like to subscribe to the ${selectedPlan.name} plan ($${selectedPlan.price}/mo).`,
      user?.email ? `My email: ${user.email}` : '',
      (user?.firstName || user?.lastName)
        ? `My name: ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`
        : '',
      '',
      'I will send payment via one of your payment options. Please assist with activation.',
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  })();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#0e1224] to-[#0e1224] p-4 sm:p-5 shadow-lg">
      {/* Glow accent */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            Upgrade via WhatsApp
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          </h3>
          <p className="text-[11px] text-emerald-200/70 mt-0.5">
            Pick a plan, we'll help you pay and activate instantly.
          </p>
        </div>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {plans.map((p) => {
          const isSel = p.key === selected;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              className={`relative p-2.5 rounded-xl border text-left transition-all ${
                isSel
                  ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'border-[#1e233d] bg-[#0f1224] hover:border-emerald-500/40'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[8px] font-bold text-black">
                  POPULAR
                </div>
              )}
              <div className={`text-[10px] font-bold uppercase tracking-wide ${isSel ? 'text-emerald-300' : 'text-slate-500'}`}>
                {p.name}
              </div>
              <div className={`text-sm font-extrabold mt-0.5 ${isSel ? 'text-white' : 'text-slate-300'}`}>
                ${p.price}
                <span className="text-[9px] font-normal text-slate-500">/mo</span>
              </div>
              {isSel && (
                <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-emerald-300" />
              )}
            </button>
          );
        })}
      </div>

      {/* Payment Options — expandable */}
      <div className="mb-3 rounded-xl border border-[#1e233d] bg-[#0a0d1c] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPayments((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#0f1224] transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-300">
            Payment options ({PAYMENT_OPTIONS.length})
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showPayments ? 'rotate-180' : ''}`}
          />
        </button>

        {showPayments && (
          <div className="px-2 pb-2 space-y-1.5">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon =
                opt.icon === 'phone' ? Smartphone :
                opt.icon === 'card'  ? CreditCard :
                                       Building2;
              const isCopied = copiedKey === opt.key;
              return (
                <div
                  key={opt.key}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#0f1224] border border-[#1a1f36]"
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-300 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                      {opt.label}
                    </div>
                    <div className="text-[11px] font-mono text-white truncate">
                      {opt.detail}
                    </div>
                    {opt.sub && (
                      <div className="text-[9px] text-slate-500 truncate">{opt.sub}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(opt.key, opt.copyValue)}
                    className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                      isCopied
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-[#181d38] hover:bg-[#22294e] text-slate-300'
                    }`}
                  >
                    {isCopied ? (
                      <><CheckCheck className="w-3 h-3" />Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" />Copy</>
                    )}
                  </button>
                </div>
              );
            })}
            <div className="text-[10px] text-slate-500 text-center pt-1">
              After sending payment, share the confirmation on WhatsApp ↓
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp CTA */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
      >
        <MessageCircle className="w-4 h-4" />
        Chat on WhatsApp — {selectedPlan.name} (${selectedPlan.price}/mo)
      </a>

      {!compact && (
        <div className="mt-2 text-[10px] text-slate-500 text-center">
          No card needed. Pay via M-Pesa, bank, or crypto.
        </div>
      )}
    </div>
  );
};

export default UpgradeWhatsAppCard;
