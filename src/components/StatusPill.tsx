import React, { useEffect, useState } from 'react';
import { Coins, Calendar, MessageSquare, ChevronRight } from 'lucide-react';

interface Props {
  credits?: number;
  plan?: string;
  subscriptionExpiry?: string | null;
  onOpenCredits?: () => void;
  onOpenSubscription?: () => void;
  className?: string;
}

interface PillItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad';
  onClick?: () => void;
}

export const StatusPill: React.FC<Props> = ({
  credits = 0,
  plan = 'Pending',
  subscriptionExpiry,
  onOpenCredits,
  onOpenSubscription,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Compute days left (timezone-safe, calendar-day diff)
  let daysLeft = 0;
  if (subscriptionExpiry) {
    const exp = new Date(subscriptionExpiry);
    if (!isNaN(exp.getTime())) {
      const todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      const expMid = new Date(exp);
      expMid.setHours(0, 0, 0, 0);
      daysLeft = Math.max(0, Math.round((expMid.getTime() - todayMid.getTime()) / 86400000));
    }
  }

  const planIsPaid = plan === 'Starter' || plan === 'Pro' || plan === 'Elite';

  // Pulse the pill when credits are low or plan expires soon
  const creditsLow = credits > 0 && credits <= 10;
  const daysCritical = planIsPaid && daysLeft <= 3;

  useEffect(() => {
    if (creditsLow || daysCritical) {
      const t = setInterval(() => setPulse((p) => !p), 1500);
      return () => clearInterval(t);
    }
  }, [creditsLow, daysCritical]);

  const items: PillItem[] = [
    {
      id: 'credits',
      icon: <Coins className="w-3.5 h-3.5" />,
      label: 'Credits',
      value: credits.toString(),
      tone: creditsLow ? 'bad' : credits <= 50 ? 'warn' : 'good',
      onClick: onOpenCredits,
    },
    {
      id: 'days',
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: 'Days left',
      value: planIsPaid ? daysLeft.toString() : '—',
      tone: !planIsPaid ? 'warn' : daysCritical ? 'bad' : daysLeft <= 7 ? 'warn' : 'good',
      onClick: onOpenSubscription,
    },
    {
      id: 'tickets',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      label: 'Support',
      value: 'Open',
      tone: 'good',
      onClick: onOpenSubscription,
    },
  ];

  const toneColor = {
    good: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    warn: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    bad: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Compact pill (visible on desktop) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e5e7eb] dark:border-[#22273d] bg-white dark:bg-[#141624] hover:bg-gray-50 dark:hover:bg-[#1c2035] transition-all shadow-xs cursor-pointer ${
          pulse ? 'ring-2 ring-purple-500/40' : ''
        }`}
        title="Account status"
      >
        {/* Plan badge */}
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
          plan === 'Elite' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : plan === 'Pro' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          : plan === 'Starter' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
        }`}>
          {plan === 'Pending' ? 'FREE' : plan}
        </span>

        {/* Credits */}
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${toneColor[items[0].tone]}`}>
          <Coins className="w-3 h-3" />
          {credits}
        </span>

        {/* Days left */}
        {planIsPaid && (
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${toneColor[items[1].tone]}`}>
            <Calendar className="w-3 h-3" />
            {daysLeft}d
          </span>
        )}
      </button>

      {/* Compact icon-only version (mobile) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`sm:hidden flex items-center gap-1 px-2 py-2 rounded-xl border border-[#e5e7eb] dark:border-[#22273d] bg-white dark:bg-[#141624] text-gray-700 dark:text-gray-200 active:scale-95 transition-all cursor-pointer ${
          pulse ? 'ring-2 ring-purple-500/40' : ''
        }`}
        title="Account status"
      >
        <Coins className="w-4 h-4" />
        <span className="text-[11px] font-bold">{credits}</span>
      </button>

      {/* Popover with details */}
      {open && (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-50 bg-white dark:bg-[#0e101d] border border-[#e5e7eb] dark:border-[#20243d] rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5e7eb] dark:border-[#20243d]">
              <span className="text-xs font-black uppercase tracking-wider text-[#0f172a] dark:text-white font-mono">Account Status</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                plan === 'Elite' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                : plan === 'Pro' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40'
                : plan === 'Starter' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40'
                : 'bg-gray-500/20 text-gray-500 dark:text-gray-400 border border-gray-500/40'
              }`}>
                {plan === 'Pending' ? 'FREE' : plan}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { item.onClick?.(); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f8f9fc] dark:hover:bg-[#151829] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${toneColor[item.tone]}`}>
                      {item.icon}
                    </span>
                    <span className="text-xs text-[#334155] dark:text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-black font-mono ${item.tone === 'bad' ? 'text-rose-500' : item.tone === 'warn' ? 'text-amber-500' : 'text-[#0f172a] dark:text-white'}`}>
                      {item.value}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            {planIsPaid && (
              <div className="mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#20243d] text-[10px] text-gray-500 dark:text-slate-400 flex justify-between">
                <span>Plan expires</span>
                <span className="font-mono text-gray-700 dark:text-slate-300">
                  {subscriptionExpiry ? new Date(subscriptionExpiry).toLocaleDateString() : '—'}
                </span>
              </div>
            )}
            {!planIsPaid && (
              <button
                onClick={() => { onOpenSubscription?.(); setOpen(false); }}
                className="mt-3 w-full py-2 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white text-xs font-bold hover:shadow-md transition-all cursor-pointer"
              >
                Upgrade plan →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
