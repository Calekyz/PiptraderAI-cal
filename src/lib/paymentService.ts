export interface PaymentConfig {
  exchangeRate: number;
  mpesa: {
    tillNumber: string;
    businessName: string;
    paybillNumber?: string;
    accountName?: string;
  };
  binance: {
    binanceId?: string;
    walletAddress: string;
    walletProvider: string;
    network: string;
    minDeposit: string;
  };
  stkPushConfigured: boolean;
  isSimulationMode: boolean;
}

export interface ProductPlanInfo {
  id: string;
  name: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  formattedKes: string;
  billing: string;
  subtitle: string;
  badge?: string;
  highlighted?: boolean;
  color?: string;
  features: string[];
}

export interface PaymentRecordDTO {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productName: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  paymentMethod: 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  transactionHash?: string;
  binanceId?: string;
  smsMessage?: string;
  notes?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const DEFAULT_PRODUCTS: ProductPlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    usdPrice: 45,
    exchangeRate: 129,
    kesAmount: 5805,
    formattedKes: '5,805',
    billing: '/ ½ month',
    subtitle: 'Perfect for getting started',
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
    usdPrice: 95,
    exchangeRate: 129,
    kesAmount: 12255,
    formattedKes: '12,255',
    billing: '/ month',
    subtitle: 'For serious traders',
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
    usdPrice: 195,
    exchangeRate: 129,
    kesAmount: 25155,
    formattedKes: '25,155',
    billing: '/ 3 months',
    subtitle: 'Maximum performance',
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
  },
  {
    id: 'platinum',
    name: 'Platinum VIP',
    usdPrice: 349,
    exchangeRate: 129,
    kesAmount: 45021,
    formattedKes: '45,021',
    billing: '/ 6 months',
    subtitle: 'Institutional grade trading',
    badge: 'INSTITUTIONAL',
    highlighted: false,
    features: [
      'All Elite Plan Features',
      'Dedicated Gemina AI Bot Engine (DeepSeek)',
      'Institutional Liquidity Heatmaps',
      'High-Frequency News Execution',
      'Direct 1-on-1 Trading Desk Access'
    ]
  },
  {
    id: 'ultimate',
    name: 'Ultimate Lifetime',
    usdPrice: 599,
    exchangeRate: 129,
    kesAmount: 77271,
    formattedKes: '77,271',
    billing: 'one-time',
    subtitle: 'Unlimited lifetime access',
    badge: 'LIFETIME ACCESS',
    highlighted: false,
    features: [
      'Lifetime Access to all future updates',
      'Unlimited Cloud Bots & VPS',
      'Institutional AI Alpha Models',
      'VIP Mastermind Access'
    ]
  }
];

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch('/api/payments/config', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.success && data.config) {
      return data.config;
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }
  return {
    exchangeRate: 129,
    mpesa: {
      tillNumber: '372203',
      businessName: 'Pipnex Payment Agent'
    },
    binance: {
      binanceId: '1067841957',
      walletAddress: 'TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s',
      walletProvider: 'OKX USDT (TRC20)',
      network: 'USDT (TRC20)',
      minDeposit: '10 USDT'
    },
    stkPushConfigured: false,
    isSimulationMode: true
  };
}

export async function fetchProductsCatalogue(): Promise<ProductPlanInfo[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch('/api/payments/products', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      return data.products;
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }
  return DEFAULT_PRODUCTS;
}

export async function initiateMpesaStkPush(params: {
  productId: string;
  phoneNumber: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  customKesAmount?: number;
  customUsdPrice?: number;
}): Promise<{
  success: boolean;
  paymentId?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  kesAmount?: number;
  usdPrice?: number;
  productName?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/payments/mpesa/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function submitManualPayment(params: {
  productId: string;
  paymentMethod: 'mpesa_manual' | 'binance_usdt';
  amountSent: string | number;
  transactionRef?: string;
  binanceId?: string;
  smsMessage?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}): Promise<{
  success: boolean;
  payment?: PaymentRecordDTO;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/payments/manual/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function pollPaymentStatus(paymentId: string, forceComplete = false): Promise<{
  success: boolean;
  payment?: PaymentRecordDTO;
  isCompleted?: boolean;
  isFailed?: boolean;
  plan?: string;
  error?: string;
}> {
  try {
    const url = forceComplete 
      ? `/api/payments/status/${paymentId}?forceComplete=true`
      : `/api/payments/status/${paymentId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function verifyMpesaStkPush(paymentId: string, receiptCode?: string): Promise<{
  success: boolean;
  payment?: PaymentRecordDTO;
  isCompleted?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/payments/verify-stk/${paymentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptCode })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function simulateCompletePayment(paymentId: string, receiptNumber?: string): Promise<{
  success: boolean;
  payment?: PaymentRecordDTO;
  message?: string;
}> {
  try {
    const res = await fetch('/api/payments/simulate-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, receiptNumber })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false };
  }
}

export async function fetchUserPaymentHistory(userEmail: string): Promise<PaymentRecordDTO[]> {
  try {
    const res = await fetch(`/api/payments/user/${encodeURIComponent(userEmail)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.payments)) {
      return data.payments;
    }
  } catch (err) {
    console.error('Error fetching user payment history:', err);
  }
  return [];
}

export async function fetchAdminPayments(): Promise<PaymentRecordDTO[]> {
  try {
    const res = await fetch('/api/payments/admin/all');
    const data = await res.json();
    if (data.success && Array.isArray(data.payments)) {
      return data.payments;
    }
  } catch (err) {
    console.error('Error fetching admin payments:', err);
  }
  return [];
}

export async function adminVerifyPayment(paymentId: string, action: 'approve' | 'reject', notes?: string) {
  try {
    const res = await fetch('/api/payments/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action, notes })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
