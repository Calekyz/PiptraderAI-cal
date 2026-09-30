import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface PendingPayment {
  id: string;
  productName: string;
  productId: string;
  usdPrice?: number;
  kesAmount?: number;
  paymentMethod: string;
  status: string;
  statusMessage?: string;
  createdAt: string;
}

interface Props {
  userEmail?: string;
  onOpenSubscription?: () => void;
}

export const PendingPaymentBanner: React.FC<Props> = ({ userEmail, onOpenSubscription }) => {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const load = async (showSpinner = false) => {
    if (!userEmail) return;
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(`/api/payments/user/${encodeURIComponent(userEmail)}/pending`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.pending)) {
        setPending(data.pending);
      }
    } catch {
      // silent
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const poll = setInterval(() => load(), 30000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [userEmail]);

  // Refresh age label every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (pending.length === 0) return null;

  const p = pending[0];
  const ageMs = Date.now() - new Date(p.createdAt).getTime();
  const ageMin = Math.floor(ageMs / 60000);
  const ageLabel = ageMin < 1 ? 'just now' : ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ${ageMin % 60}m ago`;
  const isHighValue = (p.usdPrice || 0) >= 90;
  const methodLabel = p.paymentMethod === 'mpesa_manual' ? 'M-Pesa' : p.paymentMethod === 'binance_usdt' ? 'Binance USDT' : p.paymentMethod || 'Manual';

  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-transparent p-4 sm:p-5 mb-5 shadow-lg animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 animate-pulse">
          <Clock className="w-5 h-5 text-amber-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-black text-white tracking-tight">
                Payment under audit · {p.productName}
              </div>
              <div className="text-[11px] text-amber-200/80 mt-0.5">
                {methodLabel} · Submitted {ageLabel}
              </div>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <p className="text-xs text-amber-100/90 leading-relaxed mt-2.5">
            {isHighValue
              ? 'High-value payment — our team is reviewing the details. This usually completes within 1–30 minutes during business hours.'
              : 'Your payment is being verified by our audit team. This usually completes within 1–30 minutes. You will receive a notification when activated.'}
          </p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Audit in progress
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
              <AlertCircle className="w-3 h-3" />
              Do not re-submit the same receipt
            </span>
            {onOpenSubscription && (
              <button
                onClick={onOpenSubscription}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 hover:text-amber-100 transition-colors cursor-pointer"
              >
                View subscription <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {p.statusMessage && (
            <div className="mt-2 text-[10px] text-amber-300/60 font-mono">
              {p.statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
