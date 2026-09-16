import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  Copy, 
  Check, 
  Zap, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Lock,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { 
  fetchPaymentConfig, 
  fetchProductsCatalogue, 
  initiateMpesaStkPush, 
  submitManualPayment, 
  pollPaymentStatus, 
  PaymentConfig, 
  ProductPlanInfo, 
  PaymentRecordDTO 
} from '../lib/paymentService';

interface DynamicPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string; // Dynamic product ID e.g. 'starter', 'pro', 'elite', etc.
  user?: UserProfile | null;
  onPaymentSuccess: (planName: string, paymentRecord?: PaymentRecordDTO) => void;
}

type PaymentStep = 
  | 'SELECT_METHOD'      // Binance vs M-Pesa
  | 'MPESA_OPTIONS'      // Automated vs Manual
  | 'MPESA_AUTOMATED'    // STK Push flow with phone input & live polling
  | 'MPESA_MANUAL'       // Till info + SMS input
  | 'BINANCE_MANUAL'     // Wallet info + TxID input
  | 'CONFIRMED';         // Success screen

export const DynamicPaymentModal: React.FC<DynamicPaymentModalProps> = ({
  isOpen,
  onClose,
  productId,
  user,
  onPaymentSuccess
}) => {
  const [step, setStep] = useState<PaymentStep>('SELECT_METHOD');
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [products, setProducts] = useState<ProductPlanInfo[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [manualKesAmount, setManualKesAmount] = useState<string>('');
  const [mpesaSmsMessage, setMpesaSmsMessage] = useState('');
  const [binanceAmount, setBinanceAmount] = useState<string>('');
  const [binanceId, setBinanceId] = useState('');
  const [binanceTxHash, setBinanceTxHash] = useState('');

  // Processing & Polling states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentRecordDTO | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load config & catalogue from backend (backend is SOURCE OF TRUTH)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);
    setStep('SELECT_METHOD');
    setActivePayment(null);

    Promise.all([fetchPaymentConfig(), fetchProductsCatalogue()])
      .then(([cfg, prods]) => {
        if (!isMounted) return;
        setConfig(cfg);
        setProducts(prods);

        // Find verified product by ID or fallback to first
        const normalizedId = (productId || 'pro').toLowerCase();
        const found = prods.find((p) => p.id.toLowerCase() === normalizedId) || prods[0];
        
        if (found) {
          setCurrentProduct(found);
          setManualKesAmount(found.kesAmount.toString());
          setBinanceAmount(found.usdPrice.toString());
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load payment details:', err);
        setErrorMsg('Unable to load payment configuration from server.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId]);

  // STK Push Status Polling
  useEffect(() => {
    if (step !== 'MPESA_AUTOMATED' || !activePayment || activePayment.status === 'COMPLETED') {
      return;
    }

    const currentId = activePayment.id;
    const interval = setInterval(async () => {
      const result = await pollPaymentStatus(currentId);
      if (result.success && result.payment) {
        if (result.payment.status === 'COMPLETED') {
          clearInterval(interval);
          setActivePayment(result.payment);
          triggerSuccessConfetti();
          setStep('CONFIRMED');
          onPaymentSuccess(result.payment.productName, result.payment);
        } else if (result.payment.status === 'FAILED' || result.payment.status === 'CANCELLED') {
          setActivePayment(result.payment);
          setErrorMsg(result.payment.statusMessage || 'Payment was cancelled or failed.');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, activePayment?.id, activePayment?.status, onPaymentSuccess]);

  if (!isOpen) return null;

  const triggerSuccessConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Submit Automated M-Pesa STK Push
  const handleInitiateStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!mpesaPhone || mpesaPhone.trim().length < 9) {
      setErrorMsg('Please enter a valid Safaricom M-Pesa phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const response = await initiateMpesaStkPush({
      productId: currentProduct.id,
      phoneNumber: mpesaPhone,
      userId: user?.email || 'guest',
      userEmail: user?.email || 'trader@pipnex.ai',
      userName: user ? `${user.firstName} ${user.lastName}` : 'PipNex Trader'
    });

    setIsSubmitting(false);

    if (response.success && response.paymentId) {
      setActivePayment({
        id: response.paymentId,
        userId: user?.email || 'guest',
        userEmail: user?.email || 'trader@pipnex.ai',
        productId: currentProduct.id,
        productName: currentProduct.name,
        usdPrice: currentProduct.usdPrice,
        exchangeRate: config?.exchangeRate || 129,
        kesAmount: response.kesAmount || currentProduct.kesAmount,
        paymentMethod: 'mpesa_automated',
        phoneNumber: mpesaPhone,
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      setErrorMsg(response.error || 'Failed to initiate STK push prompt. Please check your number or try manual payment.');
    }
  };

  // 2. Submit Manual M-Pesa Payment
  const handleSubmitManualMpesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!mpesaSmsMessage || mpesaSmsMessage.trim().length < 5) {
      setErrorMsg('Please paste your complete M-Pesa confirmation SMS or 10-character code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const response = await submitManualPayment({
      productId: currentProduct.id,
      paymentMethod: 'mpesa_manual',
      amountSent: manualKesAmount || currentProduct.kesAmount,
      smsMessage: mpesaSmsMessage,
      userId: user?.email || 'guest',
      userEmail: user?.email || 'trader@pipnex.ai',
      userName: user ? `${user.firstName} ${user.lastName}` : 'PipNex Trader'
    });

    setIsSubmitting(false);

    if (response.success && response.payment) {
      setActivePayment(response.payment);
      triggerSuccessConfetti();
      setStep('CONFIRMED');
      onPaymentSuccess(currentProduct.name, response.payment);
    } else {
      setErrorMsg(response.error || 'Failed to verify confirmation. Please check the receipt code or SMS.');
    }
  };

  // 3. Submit Binance USDT Payment
  const handleSubmitBinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!binanceTxHash || binanceTxHash.trim().length < 6) {
      setErrorMsg('Please enter your Binance Transaction Hash (TxID).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const response = await submitManualPayment({
      productId: currentProduct.id,
      paymentMethod: 'binance_usdt',
      amountSent: binanceAmount || currentProduct.usdPrice,
      transactionRef: binanceTxHash.trim(),
      binanceId: binanceId.trim(),
      userId: user?.email || 'guest',
      userEmail: user?.email || 'trader@pipnex.ai',
      userName: user ? `${user.firstName} ${user.lastName}` : 'PipNex Trader'
    });

    setIsSubmitting(false);

    if (response.success && response.payment) {
      setActivePayment(response.payment);
      triggerSuccessConfetti();
      setStep('CONFIRMED');
      onPaymentSuccess(currentProduct.name, response.payment);
    } else {
      setErrorMsg(response.error || 'Failed to submit TxID for verification.');
    }
  };

  const exchangeRate = config?.exchangeRate || 129;
  const verifiedUsd = currentProduct?.usdPrice || 95;
  const verifiedKes = currentProduct?.kesAmount || Math.round(verifiedUsd * exchangeRate);
  const rawTillName = config?.mpesa.businessName || 'Pipnex Payment Agent';
  const mpesaTillName = /peak\s*markets|pipnex ai till/i.test(rawTillName) ? 'Pipnex Payment Agent' : rawTillName;
  const rawTillNumber = config?.mpesa.tillNumber || '372203';
  const mpesaTillNumber = rawTillNumber === '3722030' ? '372203' : rawTillNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="dynamic-payment-modal-container"
        className="w-full max-w-[490px] bg-white dark:bg-[#0c0e18] rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white relative flex flex-col font-sans transition-all border border-slate-200 dark:border-[#1e2338]"
      >
        {/* Close Button */}
        <button
          id="close-payment-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16192b] transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Verifying secure pricing...</p>
          </div>
        ) : (
          <>
            {/* Top Product Price Badge */}
            {currentProduct && step !== 'CONFIRMED' && (
              <div className="mb-4 pr-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3e8ff] dark:bg-[#1a1630] border border-purple-200 dark:border-purple-500/30 text-xs font-semibold text-purple-800 dark:text-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{currentProduct.name} Plan:</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">${verifiedUsd} USD</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">KES {verifiedKes.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
                <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SCREENSHOT 1: SELECT PAYMENT METHOD (Deposit funds) */}
            {/* ========================================================================= */}
            {step === 'SELECT_METHOD' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Choose a payment method</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pay for {currentProduct?.name || 'your'} plan. Activation starts as soon as we confirm the transfer.</p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    id="select-mpesa-payment-card"
                    type="button"
                    onClick={() => setStep('MPESA_AUTOMATED')}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-[#2d3250] bg-white dark:bg-[#121524] hover:border-emerald-400/60 hover:bg-emerald-50/60 dark:hover:bg-[#13241c] transition-all cursor-pointer flex items-center gap-3.5 text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#dcf2e5] dark:bg-[#10301d] flex items-center justify-center shrink-0 border border-[#a8dfbe] dark:border-[#1d5935]">
                      <span className="text-[9px] font-black tracking-tighter text-[#0ca84f] dark:text-[#32d574]">M-PESA</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">M-Pesa STK</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Fastest</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant prompt on your phone. Enter PIN to complete.</div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />
                  </button>

                  <button
                    id="select-pipnex-agent-payment-card"
                    type="button"
                    onClick={() => setStep('MPESA_MANUAL')}
                    className="w-full p-4 rounded-2xl border border-purple-300 dark:border-purple-500/40 bg-[#faf5ff] dark:bg-[#1a1630] hover:border-purple-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all cursor-pointer flex items-center gap-3.5 text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-300 dark:border-purple-400/40">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Pipnex Payment Agent</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-purple-600 text-white">Recommended</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pay till {mpesaTillNumber}, then paste your M-Pesa confirmation.</div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-purple-300 rotate-180 shrink-0" />
                  </button>

                  <button
                    id="select-binance-payment-card"
                    type="button"
                    onClick={() => setStep('BINANCE_MANUAL')}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-[#2d3250] bg-white dark:bg-[#121524] hover:border-amber-400/50 hover:bg-amber-50/40 dark:hover:bg-[#241c10] transition-all cursor-pointer flex items-center gap-3.5 text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#fcf5e5] dark:bg-[#2b2413] flex items-center justify-center shrink-0 border border-[#f5d78e] dark:border-[#5a481d]">
                      <svg className="w-5 h-5 text-[#f3ba2f]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L6.5 7.5L8.6 9.6L12 6.2L15.4 9.6L17.5 7.5L12 2ZM2 12L7.5 6.5L9.6 8.6L6.2 12L9.6 15.4L7.5 17.5L2 12ZM12 22L17.5 16.5L15.4 14.4L12 17.8L8.6 14.4L6.5 16.5L12 22ZM22 12L16.5 17.5L14.4 15.4L17.8 12L14.4 8.6L16.5 6.5L22 12ZM12 14.8L9.2 12L12 9.2L14.8 12L12 14.8Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Binance / USDT</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">TRC20 transfer. Submit your TxID after sending.</div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />
                  </button>
                </div>

                <div className="pt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Encrypted checkout · Pipnex Payment Agent verified
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SCREENSHOT 3: M-PESA OPTIONS (M-Pesa deposit) */}
            {/* ========================================================================= */}
            {step === 'MPESA_OPTIONS' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-tighter text-[#0ca84f] bg-[#e4f7eb] dark:bg-[#10301d] dark:text-[#32d574] px-2 py-0.5 rounded">M-PESA</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">M-Pesa deposit</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 -mt-3">Pick how you want to pay.</p>

                <div className="space-y-3 pt-1">
                  {/* Automated Option */}
                  <div
                    id="choose-mpesa-automated-btn"
                    onClick={() => setStep('MPESA_AUTOMATED')}
                    className="p-4.5 rounded-2xl border border-slate-200 dark:border-[#22273e] bg-[#f4f8fa] dark:bg-[#121524] hover:bg-[#eaf3f7] dark:hover:bg-[#171b30] transition-all cursor-pointer flex items-center gap-4 shadow-sm hover:shadow active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#cef5e2] dark:bg-[#10301d] flex items-center justify-center shrink-0 text-[#00b05b] dark:text-[#32d574]">
                      <Zap className="w-5 h-5 fill-current text-[#00b05b] dark:text-[#32d574]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-slate-900 dark:text-white">Automated</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get an instant M-Pesa prompt on your phone (STK push)</div>
                    </div>
                  </div>

                  {/* Manual Option */}
                  <div
                    id="choose-mpesa-manual-btn"
                    onClick={() => setStep('MPESA_MANUAL')}
                    className="p-4.5 rounded-2xl border border-slate-200 dark:border-[#22273e] bg-[#f4f8fa] dark:bg-[#121524] hover:bg-[#eaf3f7] dark:hover:bg-[#171b30] transition-all cursor-pointer flex items-center gap-4 shadow-sm hover:shadow active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#cef5e2] dark:bg-[#10301d] flex items-center justify-center shrink-0 text-[#00b05b] dark:text-[#32d574]">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-slate-900 dark:text-white">Pipnex Payment Agent</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pay to our till, then submit your M-Pesa confirmation code</div>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep('SELECT_METHOD')}
                    className="w-full py-3 rounded-2xl border border-slate-200 dark:border-[#22273e] bg-white dark:bg-[#121524] hover:bg-slate-50 dark:hover:bg-[#171b30] text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SCREENSHOT 4: M-PESA MANUAL PAYMENT */}
            {/* ========================================================================= */}
            {step === 'MPESA_MANUAL' && (
              <form onSubmit={handleSubmitManualMpesa} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-tighter text-[#0ca84f] dark:text-[#32d574] bg-[#e4f7eb] dark:bg-[#10301d] px-1.5 py-0.5 rounded">M-PESA</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pipnex Payment Agent</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 -mt-2">
                  Pay to the till below, then submit your confirmation message for instant automated activation.
                </p>

                {/* Info Card with Till Number & Steps */}
                <div className="p-4 rounded-2xl bg-[#f4f8fa] dark:bg-[#121524] border border-slate-200/80 dark:border-[#22273e] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {mpesaTillName} — Till number
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                        {mpesaTillName}
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                        {mpesaTillNumber}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(mpesaTillNumber, 'till')}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181c30] border border-slate-200 dark:border-[#2c3252] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f243d] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedKey === 'till' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-200/70 dark:border-[#22273e]">
                    <div>1. Open M-Pesa → Lipa na M-Pesa → Buy Goods and Services</div>
                    <div>2. Enter till number <strong className="text-slate-800 dark:text-white">{mpesaTillNumber}</strong> and amount</div>
                    <div>3. Complete with your PIN, then paste the confirmation SMS below</div>
                  </div>
                </div>

                {/* Amount Sent Input */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">Amount sent (KES)</label>
                  <input
                    id="manual-mpesa-amount-input"
                    type="number"
                    value={manualKesAmount}
                    onChange={(e) => setManualKesAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#121524]"
                    placeholder="100"
                    required
                  />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Credited in USD at 1 USD = {exchangeRate} KES
                  </div>
                </div>

                {/* Confirmation SMS Textarea */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">M-Pesa confirmation message / 10-char code</label>
                  <textarea
                    id="manual-mpesa-sms-textarea"
                    rows={3}
                    value={mpesaSmsMessage}
                    onChange={(e) => setMpesaSmsMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#121524] resize-none"
                    placeholder={`e.g. TDF4H2K9LM Confirmed. Ksh${verifiedKes}.00 paid to ${mpesaTillName} on ...`}
                    required
                  />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Paste the full SMS from M-PESA. Each receipt code is single-use and expires once activated.
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('SELECT_METHOD')}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-[#2c3252] bg-white dark:bg-[#121524] hover:bg-slate-50 dark:hover:bg-[#171b30] text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    id="submit-manual-mpesa-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Submit and Activate</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* SCREENSHOT 2: BINANCE USDT PAYMENT */}
            {/* ========================================================================= */}
            {step === 'BINANCE_MANUAL' && (
              <form onSubmit={handleSubmitBinance} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#f3ba2f]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L6.5 7.5L8.6 9.6L12 6.2L15.4 9.6L17.5 7.5L12 2ZM2 12L7.5 6.5L9.6 8.6L6.2 12L9.6 15.4L7.5 17.5L2 12ZM12 22L17.5 16.5L15.4 14.4L12 17.8L8.6 14.4L6.5 16.5L12 22ZM22 12L16.5 17.5L14.4 15.4L17.8 12L14.4 8.6L16.5 6.5L22 12ZM12 14.8L9.2 12L12 9.2L14.8 12L12 14.8Z" />
                  </svg>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Deposit via Binance</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 -mt-2">
                  Send crypto from your Binance account using the details below.
                </p>

                {/* Crypto Wallet Details Box */}
                <div className="p-4 rounded-2xl bg-[#f4f8fa] dark:bg-[#121524] border border-slate-200/80 dark:border-[#22273e] space-y-3">
                  {/* Binance Pay ID */}
                  <div className="pb-2 border-b border-slate-200/70 dark:border-[#22273e]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f3ba2f]" />
                        <span>Binance ID (Pay ID / UID)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config?.binance.binanceId || '1067841957', 'binance_id')}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'binance_id' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-wider mt-0.5">
                      {config?.binance.binanceId || '1067841957'}
                    </div>
                  </div>

                  {/* OKX USDT Token TRC20 Address */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{config?.binance.walletProvider || 'OKX USDT Token Address (TRC20)'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config?.binance.walletAddress || 'TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s', 'binance_wallet')}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'binance_wallet' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono break-all mt-1">
                      {config?.binance.walletAddress || 'TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 dark:border-[#22273e]">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Network</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {config?.binance.network || 'USDT (TRC20)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Minimum deposit</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {verifiedUsd} USDT
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  After sending, paste the transaction hash (TxID) and the amount you sent below. TxID is single-use and expires once claimed.
                </div>

                {/* Amount Sent Input */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">Amount sent (USDT)</label>
                  <input
                    id="binance-amount-input"
                    type="number"
                    value={binanceAmount}
                    onChange={(e) => setBinanceAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#121524]"
                    placeholder="10"
                    required
                  />
                </div>

                {/* Binance ID Input */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Binance ID (Pay ID / User ID)
                  </label>
                  <input
                    id="binance-user-id-input"
                    type="text"
                    value={binanceId}
                    onChange={(e) => setBinanceId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#121524]"
                    placeholder="e.g. 29381729 or your Binance nickname/ID"
                  />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your Binance Pay ID, UID, or sender account nickname.
                  </div>
                </div>

                {/* Transaction Hash Input */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">Transaction hash (TxID)</label>
                  <input
                    id="binance-txhash-input"
                    type="text"
                    value={binanceTxHash}
                    onChange={(e) => setBinanceTxHash(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-[#121524]"
                    placeholder="e.g. 0x9f3c...b21a"
                    required
                  />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Find this in your Binance transaction history under "TxID" or "Transaction ID".
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('SELECT_METHOD')}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-[#2c3252] bg-white dark:bg-[#121524] hover:bg-slate-50 dark:hover:bg-[#171b30] text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    id="submit-binance-verification-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Submit and Activate</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* AUTOMATED M-PESA STK PUSH FLOW */}
            {/* ========================================================================= */}
            {step === 'MPESA_AUTOMATED' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-tighter text-[#0ca84f] dark:text-[#32d574] bg-[#e4f7eb] dark:bg-[#10301d] px-1.5 py-0.5 rounded">M-PESA</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">M-Pesa STK push</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 -mt-2">
                  Get an instant PIN prompt on your phone for automated activation.
                </p>

                {/* Amount details */}
                <div className="p-4 rounded-2xl bg-[#f4f8fa] dark:bg-[#121524] border border-slate-200 dark:border-[#22273e] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payable Amount</div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                      KES {verifiedKes.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">${verifiedUsd} USD</div>
                    <div className="text-[11px]">@ 1 USD = {exchangeRate} KES</div>
                  </div>
                </div>

                {!activePayment ? (
                  <form onSubmit={handleInitiateStkPush} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                        M-Pesa Phone Number
                      </label>
                      <input
                        id="mpesa-phone-input"
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2c3252] text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00b05b] bg-white dark:bg-[#121524]"
                        placeholder="e.g. 0712345678 or 254712345678"
                        required
                      />
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Enter the Safaricom line that holds your M-Pesa funds.
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('MPESA_OPTIONS')}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-[#2c3252] bg-white dark:bg-[#121524] hover:bg-slate-50 dark:hover:bg-[#171b30] text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0"
                        title="Back"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <button
                        id="send-stk-push-btn"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-2xl bg-[#00b05b] hover:bg-[#009b50] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-white text-white" />
                            <span>Send M-Pesa Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Active Polling & Live Safaricom STK Push Confirmation Screen */
                  <div className="py-4 space-y-5 text-center">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="w-16 h-16 rounded-full bg-[#d5fae8] dark:bg-[#10301d] flex items-center justify-center text-[#00b05b] dark:text-[#32d574] animate-pulse">
                        <Smartphone className="w-8 h-8 stroke-[2.2]" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-full border-2 border-[#00b05b]/40 animate-ping" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        M-Pesa STK Prompt Dispatched
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                        Please check your phone <strong className="text-slate-900 dark:text-white font-mono">{activePayment.phoneNumber}</strong> for the Safaricom STK popup.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <span>Enter your M-Pesa PIN on your screen to complete</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121524] border border-slate-200 dark:border-[#22273e] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Amount Due:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          KES {verifiedKes.toLocaleString()} (${verifiedUsd} USD)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Ref / Account:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{activePayment.id.slice(0, 16)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-[#1a1e30] flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Loader2 className="w-4 h-4 text-[#00b05b] dark:text-[#32d574] animate-spin shrink-0" />
                        <span>Awaiting real-time Safaricom callback...</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-center gap-4 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePayment(null);
                          setErrorMsg(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend STK Prompt / Change Number</span>
                      </button>

                      <span className="text-slate-300 dark:text-slate-700">•</span>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePayment(null);
                          setErrorMsg(null);
                          setStep('MPESA_MANUAL');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        Switch to Pipnex Payment Agent
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUCCESS / CONFIRMED SCREEN */}
            {/* ========================================================================= */}
            {step === 'CONFIRMED' && (
              <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Verified!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your upgrade to <strong className="text-slate-900 dark:text-white">{currentProduct?.name || 'Pro'}</strong> has been processed successfully.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f4f8fa] dark:bg-[#121524] border border-slate-200 dark:border-[#22273e] text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Transaction Ref:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {activePayment?.mpesaReceiptNumber || activePayment?.transactionHash || activePayment?.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Plan Activated:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{currentProduct?.name} Plan</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Amount Paid:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      KES {verifiedKes.toLocaleString()} (${verifiedUsd} USD)
                    </span>
                  </div>
                </div>

                <button
                  id="finish-upgrade-and-close-btn"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Start Trading with {currentProduct?.name || 'Pro'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
