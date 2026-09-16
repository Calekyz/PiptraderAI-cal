import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  Shield, 
  Zap, 
  Mail, 
  Phone,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Check,
  XCircle,
  Clock3
} from 'lucide-react';
import { UserProfile } from '../../types';
import { 
  fetchProductsCatalogue, 
  fetchUserPaymentHistory, 
  fetchAdminPayments, 
  adminVerifyPayment, 
  ProductPlanInfo, 
  PaymentRecordDTO 
} from '../../lib/paymentService';

interface SubscriptionViewProps {
  user: UserProfile;
  onOpenUpgrade?: (tier?: any) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  user,
  onOpenUpgrade
}) => {
  const [downloading, setDownloading] = useState(false);
  const [products, setProducts] = useState<ProductPlanInfo[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentRecordDTO[]>([]);
  const [adminPayments, setAdminPayments] = useState<PaymentRecordDTO[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoadingHistory(true);
    const [prods, userPays, allPays] = await Promise.all([
      fetchProductsCatalogue(),
      fetchUserPaymentHistory(user.email),
      fetchAdminPayments()
    ]);
    setProducts(prods);
    setUserPayments(userPays);
    setAdminPayments(allPays);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadData();
  }, [user.email]);

  const handleAdminVerify = async (paymentId: string, action: 'approve' | 'reject') => {
    setAdminActionLoading(paymentId);
    await adminVerifyPayment(paymentId, action);
    await loadData();
    setAdminActionLoading(null);
  };

  const handleExportPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const latestPayment = userPayments[0];
      const blob = new Blob([
        `PIPNEX AI - OFFICIAL SUBSCRIPTION & INVOICE RECEIPT\n` +
        `===================================================\n` +
        `Invoice Date: ${new Date().toLocaleDateString()}\n` +
        `Customer: ${user.firstName} ${user.lastName}\n` +
        `Email: ${user.email}\n` +
        `Phone: ${user.phone || 'N/A'}\n` +
        `Current Plan: ${user.plan || 'Pro'}\n` +
        `Plan Status: Active / Verified\n` +
        `Payment Method: ${latestPayment?.paymentMethod || 'M-Pesa Verified / Binance USDT'}\n` +
        `Transaction Ref: ${latestPayment?.mpesaReceiptNumber || latestPayment?.transactionHash || 'chk_5u4g0IIZoSxkx2Dt'}\n` +
        `Amount Paid: ${latestPayment ? `$${latestPayment.usdPrice} USD (KES ${latestPayment.kesAmount.toLocaleString()})` : '$95.00 USD (KES 12,255)'}\n` +
        `Support Contact: Pipnexaicustomer@gmail.com | +254726222093\n` +
        `===================================================\n` +
        `All PipNex plan upgrades feature real-time AI chart intelligence, Gemina AI (DeepSeek) bot execution, and 24/7 priority support.`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PipNex-Receipt-${user.firstName}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 600);
  };

  const currentPlanName = user.plan || 'Pro';

  const getStatusBadge = (status: PaymentRecordDTO['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-400 text-[10px] font-mono font-bold">
            <Clock3 className="w-3 h-3 animate-spin" />
            PROCESSING
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Subscription Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your PipNex membership, view real-time payment records, and upgrade plans.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-[#11121d] hover:bg-[#181a29] border border-[#222638] text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh payment status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportPDF}
            disabled={downloading}
            className="px-3.5 py-2 rounded-xl bg-[#11121d] hover:bg-[#181a29] border border-[#222638] text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>{downloading ? 'Exporting...' : 'Export Invoice'}</span>
          </button>

          <button
            onClick={() => onOpenUpgrade?.('pro')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer active:scale-[0.98]"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Card 1: Current Plan */}
      <div className="bg-[#080911] border border-[#161828] rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Current Plan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">
                {currentPlanName} Plan
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                Active & Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenUpgrade?.('starter')}
              className="px-4 py-2 rounded-xl bg-[#121420] hover:bg-[#1a1d2e] border border-[#23273c] text-white text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
            >
              Change Tier
            </button>
            <button
              onClick={() => onOpenUpgrade?.('pro')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      {/* Available Plans Overview Matrix (Dynamic Prices) */}
      <div className="bg-[#080911] border border-[#161828] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#161826] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              PipNex Membership Tiers
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Source of truth dynamic pricing with automated M-Pesa STK push & Binance TRC20 verification
            </p>
          </div>
          <button
            onClick={() => onOpenUpgrade?.('pro')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
          >
            Compare All Features
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Starter Tier */}
          <div className="p-4.5 rounded-2xl bg-[#0d0e18] border border-[#1b1e30] space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-white">Starter</div>
              <div className="text-[11px] text-gray-400">Perfect for getting started</div>
              <div className="mt-2">
                <span className="text-2xl font-extrabold font-mono text-white">$45</span>
                <span className="text-xs text-gray-400 font-mono"> / ½ month</span>
                <div className="text-[11px] font-mono text-gray-400 mt-0.5">≈ KES 5,805</div>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-3 border-t border-[#181b2a] mt-3">
                <li>✓ 10 Chart Uploads / day</li>
                <li>✓ Advanced Chart Analysis</li>
                <li>✓ Multi-Timeframe Analysis</li>
                <li>✓ PipNex Pulse Signals (2/day)</li>
                <li>✓ Smart Chart Analyzer</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade?.('starter')}
              className="w-full py-2.5 rounded-xl bg-[#141624] hover:bg-[#1a1e32] border border-[#23273c] text-xs font-semibold text-white transition-all cursor-pointer mt-3"
            >
              Select Starter ($45)
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-4.5 rounded-2xl bg-[#121426] border border-purple-500/50 space-y-3 relative shadow-lg shadow-purple-950/30 flex flex-col justify-between">
            <span className="absolute -top-2.5 right-4 text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-purple-600 text-white font-bold">
              ⭐ MOST POPULAR
            </span>
            <div>
              <div className="text-sm font-bold text-white">Pro</div>
              <div className="text-[11px] text-purple-300">For serious traders</div>
              <div className="mt-2">
                <span className="text-2xl font-extrabold font-mono text-white">$95</span>
                <span className="text-xs text-gray-400 font-mono"> / month</span>
                <div className="text-[11px] font-mono text-purple-300 mt-0.5">≈ KES 12,255</div>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-3 border-t border-[#1f2338] mt-3">
                <li>✓ 24 Chart Uploads / day</li>
                <li>✓ Signal of the Day (90%+ accurate)</li>
                <li>✓ AI Auto trading</li>
                <li>✓ PipNex PropPass</li>
                <li>✓ Unlimited Custom Setups</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade?.('pro')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md mt-3"
            >
              Select Pro ($95)
            </button>
          </div>

          {/* Elite Tier */}
          <div className="p-4.5 rounded-2xl bg-[#0d0e18] border border-amber-500/30 space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-white">Elite</div>
              <div className="text-[11px] text-amber-300">Maximum performance</div>
              <div className="mt-2">
                <span className="text-2xl font-extrabold font-mono text-white">$195</span>
                <span className="text-xs text-gray-400 font-mono"> / 3 months</span>
                <div className="text-[11px] font-mono text-amber-300 mt-0.5">≈ KES 25,155</div>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 pt-3 border-t border-[#181b2a] mt-3">
                <li>✓ Unlimited Pulse Signals</li>
                <li>✓ 🤖 Cloud Bots (No PC needed)</li>
                <li>✓ 🚀 Auto Trading (2000 credits)</li>
                <li>✓ ☁️ FREE VPS Included ($50/mo)</li>
                <li>✓ Unlimited MT5 accounts (10)</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenUpgrade?.('elite')}
              className="w-full py-2.5 rounded-xl bg-[#141624] hover:bg-[#1a1e32] border border-[#23273c] text-xs font-semibold text-white transition-all cursor-pointer mt-3"
            >
              Select Elite ($195)
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Real Payment History & Verification Records */}
      <div className="bg-[#080911] border border-[#161828] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Payment & Upgrade Records</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live audit trail of your automated STK pushes and manual payment submissions
            </p>
          </div>

          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="text-xs text-slate-400 hover:text-purple-400 transition-colors underline cursor-pointer"
          >
            {showAdminPanel ? 'Hide Admin Desk' : 'Verification Desk'}
          </button>
        </div>

        {userPayments.length === 0 ? (
          <div className="bg-[#0b0c15] border border-[#1a1d2d] rounded-2xl p-5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
            <div className="text-sm font-bold text-white">Active Plan: {currentPlanName}</div>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Your account has full access to the {currentPlanName} features. Any future manual or automated upgrade payments will appear here with live status tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-x-auto">
            {userPayments.map((payment) => (
              <div 
                key={payment.id}
                className="bg-[#0b0c15] border border-[#1a1d2d] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    payment.status === 'COMPLETED' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' :
                    payment.status === 'PROCESSING' ? 'bg-blue-950/80 text-blue-400 border border-blue-500/30' :
                    'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {payment.paymentMethod === 'binance_usdt' ? '₿' : 'M'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <span>{payment.productName} Upgrade</span>
                      <span className="text-xs text-gray-400">(${payment.usdPrice} USD / KES {payment.kesAmount.toLocaleString()})</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Ref: {payment.mpesaReceiptNumber || payment.transactionHash || payment.id}
                      <span className="text-gray-600"> • </span>
                      {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin / Verification Desk (For review and testing) */}
      {showAdminPanel && (
        <div className="bg-[#0b0d18] border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#181b2e] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Admin Payment Verification Desk</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Review submitted M-Pesa till receipts and Binance transaction hashes to approve or reject upgrades.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400">{adminPayments.length} Total Records</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {adminPayments.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-6">No payments recorded yet.</div>
            ) : (
              adminPayments.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-[#07080f] border border-[#1a1d2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white">
                      {p.userEmail} — {p.productName} (${p.usdPrice} / KES {p.kesAmount.toLocaleString()})
                    </div>
                    <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                      Method: <strong className="text-gray-300">{p.paymentMethod}</strong> | Ref: {p.mpesaReceiptNumber || p.transactionHash || p.id}
                    </div>
                    {p.smsMessage && (
                      <div className="text-[11px] text-gray-300 bg-[#121422] p-1.5 rounded mt-1 max-w-md break-all font-mono">
                        "{p.smsMessage}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(p.status)}

                    {p.status === 'PROCESSING' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdminVerify(p.id, 'approve')}
                          disabled={adminActionLoading === p.id}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdminVerify(p.id, 'reject')}
                          disabled={adminActionLoading === p.id}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Card 3: Support Contact Section */}
      <div className="bg-[#080911] border border-[#161828] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-sm font-bold text-white">Need Help With Your Subscription?</div>
          <p className="text-xs text-gray-400">
            Reach out to our customer support desk anytime for instant assistance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="mailto:Pipnexaicustomer@gmail.com"
            className="px-3.5 py-2 rounded-xl bg-[#121422] hover:bg-[#1a1e32] border border-[#23273c] text-white text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>Pipnexaicustomer@gmail.com</span>
          </a>
          <a
            href="tel:+254726222093"
            className="px-3.5 py-2 rounded-xl bg-[#121422] hover:bg-[#1a1e32] border border-[#23273c] text-white text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-purple-400" />
            <span>+254726222093</span>
          </a>
        </div>
      </div>
    </div>
  );
};
