import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, CheckCircle2, RefreshCw, XCircle, Sparkles } from 'lucide-react';

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
  mpesaReceiptNumber?: string;
  transactionHash?: string;
}

interface Props {
  userEmail?: string;
  onApproved: () => void;
  onRejected: () => void;
}

export const AuditLockScreen: React.FC<Props> = ({ userEmail, onApproved, onRejected }) => {
  const [payment, setPayment] = useState<PendingPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [tick, setTick] = useState(0);

  const checkStatus = async (silent = false) => {
    if (!userEmail) return;
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/payments/user/${encodeURIComponent(userEmail)}/pending`);
      const data = await res.json();
      const pending = Array.isArray(data?.pending) ? data.pending : [];

      if (pending.length > 0) {
        setPayment(pending[0]);
        setLoading(false);
      } else {
        // No more pending — check if we previously had one (means approved)
        if (payment) {
          // Approval detected — show celebration
          setCelebrating(true);
          setTimeout(() => onApproved(), 3500);
        } else {
          // No pending at all — user shouldn't see the lock. Bail out.
          setLoading(false);
          onApproved(); // parent will hide lock
        }
      }
    } catch {
      // silent
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const poll = setInterval(() => checkStatus(true), 15000);
    const ageTick = setInterval(() => setTick((x) => x + 1), 30000);
    const onVis = () => { if (document.visibilityState === 'visible') checkStatus(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(poll);
      clearInterval(ageTick);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Don't show anything if no pending payment
  if (loading || (!payment && !celebrating)) return null;

  // ── APPROVED CELEBRATION SCREEN ──
  if (celebrating) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
        <div className="max-w-lg w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)] animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Account Approved! 🎉
            </h1>
            <p className="text-sm text-emerald-200/80 max-w-md mx-auto leading-relaxed">
              Your payment has been verified by our audit team. Your <strong className="text-white">{payment?.productName}</strong> plan is now active.
              <br />
              <span className="text-emerald-300 font-semibold">Welcome aboard!</span>
            </p>
          </div>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Loading your dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUDIT IN PROGRESS SCREEN ──
  const ageMin = Math.floor((Date.now() - new Date(payment!.createdAt).getTime()) / 60000);
  const ageLabel = ageMin < 1 ? 'just now' : ageMin < 60 ? `${ageMin} min ago` : `${Math.floor(ageMin / 60)}h ${ageMin % 60}m ago`;

  const isFailed = payment!.status === 'FAILED' || payment!.status === 'CANCELLED';

  if (isFailed) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-[0_0_60px_rgba(244,63,94,0.5)]">
            <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Payment Rejected</h1>
            <p className="text-sm text-rose-200/80 max-w-md mx-auto leading-relaxed">
              Your payment could not be verified. Please contact support or try again with valid payment details.
            </p>
          </div>
          <button
            onClick={onRejected}
            className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white text-sm font-bold shadow-lg hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-300">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 border-amber-500/60 flex items-center justify-center animate-pulse">
              <Clock className="w-12 h-12 text-amber-300" strokeWidth={2} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 border-4 border-black animate-ping" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Payment Under Audit
          </h1>
          <p className="text-sm text-amber-100/70 max-w-lg mx-auto leading-relaxed">
            Your <strong className="text-amber-300">{payment!.productName}</strong> subscription payment is being verified by our audit team.
            This usually completes within <strong className="text-white">1–30 minutes</strong>.
          </p>
        </div>

        {/* Payment details card */}
        <div className="rounded-2xl border border-amber-500/30 bg-[#0f0d1e]/80 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-mono">
              Audit Reference
            </span>
            <span className="text-[10px] text-amber-200/60 font-mono">{ageLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Plan</div>
              <div className="font-bold text-white mt-0.5">{payment!.productName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Method</div>
              <div className="font-bold text-white mt-0.5">
                {payment!.paymentMethod === 'mpesa_automated' ? 'M-Pesa STK'
                  : payment!.paymentMethod === 'mpesa_manual' ? 'M-Pesa Manual'
                  : payment!.paymentMethod === 'binance_usdt' ? 'Binance USDT'
                  : payment!.paymentMethod}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Reference</div>
              <div className="font-mono text-[11px] text-amber-200 mt-0.5 break-all">
                {payment!.mpesaReceiptNumber || payment!.transactionHash || payment!.id}
              </div>
            </div>
          </div>
        </div>

        {/* Warning box */}
        <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-950/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-100/90 leading-relaxed">
              <strong className="text-rose-200">Account access is locked until approval.</strong>{' '}
              The platform is reviewing your payment. If the payment does not reflect, your account will be reviewed by admin.
              Do not close this screen or re-submit the same receipt.
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => checkStatus(false)}
            disabled={refreshing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white text-xs font-bold shadow-lg hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Check status'}
          </button>
          <span className="text-[10px] text-gray-500 font-mono">
            Auto-checks every 15s
          </span>
        </div>
      </div>
    </div>
  );
};
