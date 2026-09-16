import fs from 'fs';
import path from 'path';

export type PaymentMethod = 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface ProductPlan {
  id: string;
  name: string;
  usdPrice: number;
  billing: string;
  subtitle: string;
  badge?: string;
  highlighted?: boolean;
  color?: string;
  features: string[];
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productName: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  mpesaReceiptNumber?: string;
  transactionHash?: string;
  binanceId?: string;
  smsMessage?: string;
  notes?: string;
  status: PaymentStatus;
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ==========================================
// SERVER-SIDE PRODUCT CATALOGUE (SOURCE OF TRUTH)
// ==========================================

export const PRODUCTS_CATALOGUE: Record<string, ProductPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    usdPrice: 45,
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
  pro: {
    id: 'pro',
    name: 'Pro',
    usdPrice: 95,
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
  elite: {
    id: 'elite',
    name: 'Elite',
    usdPrice: 195,
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
  }
};

export function getProduct(productId: string): ProductPlan | undefined {
  if (!productId) return undefined;
  const key = productId.trim().toLowerCase();
  if (PRODUCTS_CATALOGUE[key]) return PRODUCTS_CATALOGUE[key];

  for (const prod of Object.values(PRODUCTS_CATALOGUE)) {
    if (prod.name.toLowerCase() === key || prod.id.toLowerCase() === key) {
      return prod;
    }
  }
  return undefined;
}

// ==========================================
// CONFIGURATION & EXCHANGE RATE
// ==========================================

export function getExchangeRate(): number {
  // Accept both env var names for compatibility
  const envRate = process.env.USD_TO_KES_RATE || process.env.USD_KES_RATE;
  if (envRate && !isNaN(Number(envRate))) {
    return Number(envRate);
  }
  return 129;
}

export function calculateKesAmount(usdPrice: number): number {
  const rate = getExchangeRate();
  return Math.round(usdPrice * rate);
}

// ==========================================
// PAYWAVEXPRESS CREDENTIALS
// ==========================================
// PayWaveXpress handles STK Push on your behalf.
// Set in deployment .env:
//   PAYWAVEXPRESS_API_KEY=...
//   PAYWAVEXPRESS_EMAIL=...
//   PAYWAVEXPRESS_BASE_URL=https://paywavexpress.co.ke   (optional, defaults to this)

export function getPayWaveXpressApiKey(): string | undefined {
  const key = process.env.PAYWAVEXPRESS_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

export function getPayWaveXpressEmail(): string | undefined {
  const email = process.env.PAYWAVEXPRESS_EMAIL;
  return email && email.trim() ? email.trim() : undefined;
}

export function getPayWaveXpressBaseUrl(): string {
  return (process.env.PAYWAVEXPRESS_BASE_URL || 'https://paywavexpress.co.ke').replace(/\/+$/, '');
}

// ==========================================
// PAYHERO CREDENTIALS (api.payhero.africa v2)
// ==========================================

export function getPayHeroAuthHeader(): string | undefined {
  const direct = process.env.PAYHERO_BASIC_AUTH;
  if (direct && direct.trim()) {
    return direct.trim().startsWith('Basic ') ? direct.trim() : `Basic ${direct.trim()}`;
  }
  const username = process.env.PAYHERO_USERNAME;
  const password = process.env.PAYHERO_PASSWORD;
  if (username && password) {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }
  return undefined;
}

export function getCallbackUrl(reqHost?: string): string {
  const explicit = process.env.MPESA_CALLBACK_URL || process.env.PAYHERO_CALLBACK_URL;
  if (explicit && explicit.trim()) return explicit.trim();
  
  if (reqHost && reqHost.trim()) {
    const proto = reqHost.includes('localhost') ? 'http' : 'https';
    return `${proto}://${reqHost.replace(/\/+$/, '')}/api/payments/mpesa/callback`;
  }

  const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
  if (appUrl) return `${appUrl}/api/payments/mpesa/callback`;

  // ⚠️ Fallback — set MPESA_CALLBACK_URL or APP_URL in production!
  console.error('[paymentEngine] CRITICAL: MPESA_CALLBACK_URL and APP_URL are both unset. Using https://piptraderai.com as last-resort fallback.');
  return 'https://piptraderai.com/api/payments/mpesa/callback';
}

/**
 * Queries PayHero Africa API directly for payment status by reference or checkout ID.
 */
export async function queryPayHeroPaymentStatus(referenceOrCheckoutId: string): Promise<{
  isSuccess: boolean;
  status?: string;
  receiptNumber?: string;
  amount?: number;
  phone?: string;
  error?: string;
}> {
  const authHeader = getPayHeroAuthHeader();
  if (!authHeader || !referenceOrCheckoutId) {
    return { isSuccess: false };
  }

  const payHeroBaseUrl = (process.env.PAYHERO_BASE_URL || 'https://api.payhero.africa').replace(/\/+$/, '');
  const cleanRef = encodeURIComponent(referenceOrCheckoutId.trim());

  try {
    const endpoints = [
      `${payHeroBaseUrl}/api/v2/payments?reference=${cleanRef}`,
      `${payHeroBaseUrl}/api/v2/transactions?reference=${cleanRef}`,
      `${payHeroBaseUrl}/api/v2/payments?checkout_request_id=${cleanRef}`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || data.response || [data]);
          const match = list.find((item: any) => 
            item && (
              item.status === 'Success' || 
              item.status === 'SUCCESS' || 
              item.Status === 'Success' ||
              item.payment_status === 'COMPLETED' ||
              item.is_successful === true
            )
          );

          if (match) {
            const receipt = match.mpesa_receipt_number || match.MpesaReceiptNumber || match.receipt_number || match.reference;
            const amount = Number(match.amount || match.Amount || 0);
            const phone = match.phone_number || match.phone || match.Phone;
            return {
              isSuccess: true,
              status: 'COMPLETED',
              receiptNumber: receipt,
              amount,
              phone
            };
          }
        }
      } catch (innerErr) {
        // continue
      }
    }
  } catch (err: any) {
    console.warn('[PayHero Status Query Warning]:', err?.message || err);
  }

  return { isSuccess: false };
}

// ==========================================
// PAYWAVEXPRESS STATUS QUERY
// ==========================================
export async function queryPayWaveXpressPaymentStatus(reference: string): Promise<{
  isSuccess: boolean;
  status?: string;
  receiptNumber?: string;
  amount?: number;
  phone?: string;
  error?: string;
}> {
  const apiKey = getPayWaveXpressApiKey();
  if (!apiKey || !reference) return { isSuccess: false };

  const baseUrl = getPayWaveXpressBaseUrl();
  const cleanRef = encodeURIComponent(reference.trim());

  try {
    const res = await fetch(`${baseUrl}/v1/status?reference=${cleanRef}&api_key=${encodeURIComponent(apiKey)}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      const status = data.status || data.Status || data.payment_status;
      const isSuccess = status === 'Success' || status === 'SUCCESS' || status === 'COMPLETED';
      return {
        isSuccess,
        status: isSuccess ? 'COMPLETED' : (status || 'PENDING'),
        receiptNumber: data.mpesa_receipt_number || data.receipt || data.MpesaReceiptNumber,
        amount: Number(data.amount || 0),
        phone: data.phone || data.msisdn
      };
    }
  } catch (err: any) {
    console.warn('[PayWaveXpress Status Query Warning]:', err?.message || err);
  }

  return { isSuccess: false };
}

export function getPaymentConfig() {
  const hasPayWave = Boolean(getPayWaveXpressApiKey() && getPayWaveXpressEmail());
  const hasPayHero = Boolean(getPayHeroAuthHeader());
  const hasDaraja = Boolean(
    process.env.MPESA_CONSUMER_KEY && 
    process.env.MPESA_CONSUMER_SECRET && 
    process.env.MPESA_PASSKEY
  );

  return {
    exchangeRate: getExchangeRate(),
    mpesa: {
      tillNumber: process.env.MPESA_TILL_NUMBER || '372203',
      businessName: process.env.MPESA_BUSINESS_NAME || 'Pipnex Payment Agent',
      paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '',
      accountName: process.env.MPESA_ACCOUNT_NAME || ''
    },
    paywavexpress: {
      baseUrl: getPayWaveXpressBaseUrl(),
      configured: hasPayWave,
      email: getPayWaveXpressEmail() || ''
    },
    payhero: {
      baseUrl: process.env.PAYHERO_BASE_URL || 'https://api.payhero.africa',
      channelId: Number(process.env.PAYHERO_CHANNEL_ID || 11916),
      accountId: Number(process.env.PAYHERO_ACCOUNT_ID || 10242),
      provider: process.env.PAYHERO_PROVIDER || 'm-pesa',
      networkCode: process.env.PAYHERO_NETWORK_CODE || '63902',
      configured: hasPayHero
    },
    binance: {
      binanceId: process.env.BINANCE_ID || '1067841957',
      walletAddress: process.env.BINANCE_WALLET_ADDRESS || 'TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s',
      walletProvider: process.env.BINANCE_WALLET_PROVIDER || 'OKX USDT (TRC20)',
      network: process.env.BINANCE_NETWORK || 'USDT (TRC20)',
      minDeposit: process.env.BINANCE_MIN_DEPOSIT || '10 USDT'
    },
    callbackUrl: getCallbackUrl(),
    stkPushConfigured: hasPayWave || hasPayHero || hasDaraja,
    isSimulationMode: !(hasPayWave || hasPayHero || hasDaraja)
  };
}

// ==========================================
// PERSISTENT PAYMENT DATABASE
// ==========================================

const DATA_DIR = process.env.PAYMENTS_DATA_DIR || path.join(process.cwd(), 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const CLAIMED_RECEIPTS_FILE = path.join(DATA_DIR, 'claimed_receipts.json');
const PAYMENTS_TABLE = process.env.DB_PAYMENTS_TABLE || 'payments';

let paymentsStore: Map<string, PaymentRecord> = new Map();
let claimedReceiptsStore: Map<string, { paymentId: string; userEmail: string; claimedAt: string }> = new Map();
let pool: any = null;
let dbReady = false;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

async function getPool(): Promise<any> {
  if (pool) return pool;
  if (!isDatabaseConfigured()) return null;
  try {
    const mysql: any = await import('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
      charset: 'utf8mb4_general_ci'
    });
    return pool;
  } catch (err: any) {
    console.warn('[Payments DB] mysql2 package not found or connection failed:', err?.message || err);
    return null;
  }
}

const CREATE_PAYMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`${PAYMENTS_TABLE}\` (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(128) NOT NULL DEFAULT '',
  user_email VARCHAR(191) NOT NULL DEFAULT '',
  user_name VARCHAR(191) NULL,
  product_id VARCHAR(64) NOT NULL DEFAULT '',
  product_name VARCHAR(191) NOT NULL DEFAULT '',
  usd_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(12,4) NOT NULL DEFAULT 0,
  kes_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'mpesa_automated',
  phone_number VARCHAR(20) NULL,
  merchant_request_id VARCHAR(128) NULL,
  checkout_request_id VARCHAR(128) NULL,
  external_reference VARCHAR(128) NULL,
  mpesa_receipt_number VARCHAR(64) NULL,
  transaction_hash VARCHAR(191) NULL,
  binance_id VARCHAR(64) NULL,
  sms_message TEXT NULL,
  notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  status_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_user_email (user_email),
  KEY idx_status (status),
  KEY idx_phone (phone_number),
  KEY idx_external_reference (external_reference),
  KEY idx_checkout_request_id (checkout_request_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

function toMysqlDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function fromDbRow(row: any): PaymentRecord {
  const iso = (v: any) => (v ? new Date(v).toISOString() : undefined);
  return {
    id: row.id,
    userId: row.user_id || '',
    userEmail: row.user_email || '',
    userName: row.user_name || undefined,
    productId: row.product_id || '',
    productName: row.product_name || '',
    usdPrice: Number(row.usd_price),
    exchangeRate: Number(row.exchange_rate),
    kesAmount: Number(row.kes_amount),
    paymentMethod: row.payment_method as PaymentMethod,
    phoneNumber: row.phone_number || undefined,
    merchantRequestId: row.merchant_request_id || undefined,
    checkoutRequestId: row.checkout_request_id || undefined,
    externalReference: row.external_reference || undefined,
    mpesaReceiptNumber: row.mpesa_receipt_number || undefined,
    transactionHash: row.transaction_hash || undefined,
    binanceId: row.binance_id || undefined,
    smsMessage: row.sms_message || undefined,
    notes: row.notes || undefined,
    status: (row.status || 'PENDING') as PaymentStatus,
    statusMessage: row.status_message || undefined,
    createdAt: iso(row.created_at) || new Date().toISOString(),
    updatedAt: iso(row.updated_at) || new Date().toISOString(),
    completedAt: iso(row.completed_at)
  };
}

export async function initPaymentsDatabase(): Promise<{ driver: 'mysql' | 'json'; loaded: number }> {
  initPaymentsStorage();

  const p = await getPool().catch((err) => {
    console.error('[Payments DB] mysql2 not available or pool failed:', err?.message || err);
    return null;
  });

  if (!p) {
    console.log('[Payments DB] Running in JSON file mode (data/payments.json).');
    return { driver: 'json', loaded: paymentsStore.size };
  }

  try {
    await p.query(CREATE_PAYMENTS_TABLE_SQL);
    const [rows] = await p.query(`SELECT * FROM \`${PAYMENTS_TABLE}\``);
    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        const rec = fromDbRow(row);
        paymentsStore.set(rec.id, rec);
      }
    }
    dbReady = true;
    console.log(`[Payments DB] MySQL ready. Table "${PAYMENTS_TABLE}" ensured. Loaded ${paymentsStore.size} payments.`);
    return { driver: 'mysql', loaded: paymentsStore.size };
  } catch (err: any) {
    console.error('[Payments DB] Failed to prepare MySQL, falling back to JSON:', err?.message || err);
    return { driver: 'json', loaded: paymentsStore.size };
  }
}

async function upsertToDb(record: PaymentRecord): Promise<void> {
  if (!dbReady) return;
  try {
    const p = await getPool();
    if (!p) return;
    await p.query(
      `INSERT INTO \`${PAYMENTS_TABLE}\`
        (id, user_id, user_email, user_name, product_id, product_name, usd_price, exchange_rate, kes_amount,
         payment_method, phone_number, merchant_request_id, checkout_request_id, external_reference,
         mpesa_receipt_number, transaction_hash, binance_id, sms_message, notes, status, status_message,
         created_at, updated_at, completed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         user_id=VALUES(user_id), user_email=VALUES(user_email), user_name=VALUES(user_name),
         product_id=VALUES(product_id), product_name=VALUES(product_name), usd_price=VALUES(usd_price),
         exchange_rate=VALUES(exchange_rate), kes_amount=VALUES(kes_amount), payment_method=VALUES(payment_method),
         phone_number=VALUES(phone_number), merchant_request_id=VALUES(merchant_request_id),
         checkout_request_id=VALUES(checkout_request_id), external_reference=VALUES(external_reference),
         mpesa_receipt_number=VALUES(mpesa_receipt_number), transaction_hash=VALUES(transaction_hash),
         binance_id=VALUES(binance_id), sms_message=VALUES(sms_message), notes=VALUES(notes),
         status=VALUES(status), status_message=VALUES(status_message),
         updated_at=VALUES(updated_at), completed_at=VALUES(completed_at)`,
      [
        record.id,
        record.userId || '',
        record.userEmail || '',
        record.userName || null,
        record.productId || '',
        record.productName || '',
        record.usdPrice || 0,
        record.exchangeRate || 0,
        record.kesAmount || 0,
        record.paymentMethod,
        record.phoneNumber || null,
        record.merchantRequestId || null,
        record.checkoutRequestId || null,
        record.externalReference || null,
        record.mpesaReceiptNumber || null,
        record.transactionHash || null,
        record.binanceId || null,
        record.smsMessage || null,
        record.notes || null,
        record.status,
        record.statusMessage || null,
        toMysqlDate(record.createdAt),
        toMysqlDate(record.updatedAt),
        toMysqlDate(record.completedAt)
      ]
    );
  } catch (err: any) {
    console.error('[Payments DB] Upsert failed:', err?.message || err);
  }
}

function initPaymentsStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(PAYMENTS_FILE)) {
      const raw = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      const parsed: PaymentRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        paymentsStore = new Map(parsed.map((p) => [p.id, p]));
      }
    }

    if (fs.existsSync(CLAIMED_RECEIPTS_FILE)) {
      const raw = fs.readFileSync(CLAIMED_RECEIPTS_FILE, 'utf-8');
      const parsed: Record<string, { paymentId: string; userEmail: string; claimedAt: string }> = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        claimedReceiptsStore = new Map(Object.entries(parsed));
      }
    } else {
      for (const p of paymentsStore.values()) {
        if (p.status === 'COMPLETED' && p.mpesaReceiptNumber) {
          const code = p.mpesaReceiptNumber.trim().toUpperCase();
          if (code) {
            claimedReceiptsStore.set(code, {
              paymentId: p.id,
              userEmail: p.userEmail,
              claimedAt: p.completedAt || p.createdAt
            });
          }
        }
      }
      saveClaimedReceiptsToDisk();
    }
  } catch (err) {
    console.error('[Payments Engine] Error initializing storage:', err);
  }
}

function savePaymentsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(paymentsStore.values());
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Payments Engine] Error persisting payments to disk:', err);
  }
}

function saveClaimedReceiptsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj = Object.fromEntries(claimedReceiptsStore);
    fs.writeFileSync(CLAIMED_RECEIPTS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Payments Engine] Error persisting claimed receipts to disk:', err);
  }
}

initPaymentsStorage();

export function isReceiptClaimed(receiptCode: string): boolean {
  if (!receiptCode) return false;
  const normalized = receiptCode.trim().toUpperCase();
  return claimedReceiptsStore.has(normalized);
}

export function claimReceipt(receiptCode: string, paymentId: string, userEmail: string): boolean {
  if (!receiptCode) return false;
  const normalized = receiptCode.trim().toUpperCase();
  if (claimedReceiptsStore.has(normalized)) {
    return false;
  }
  claimedReceiptsStore.set(normalized, {
    paymentId,
    userEmail,
    claimedAt: new Date().toISOString()
  });
  saveClaimedReceiptsToDisk();
  return true;
}

export function extractAndValidateMpesaReceipt(smsOrCode: string, expectedTill?: string): {
  isValid: boolean;
  code?: string;
  amount?: number;
  error?: string;
} {
  if (!smsOrCode || typeof smsOrCode !== 'string') {
    return { isValid: false, error: 'Payment receipt confirmation is required.' };
  }

  const trimmed = smsOrCode.trim();

  const directCodeMatch = trimmed.toUpperCase().match(/^[A-Z0-9]{10}$/);
  if (directCodeMatch) {
    const code = directCodeMatch[0];
    if (isReceiptClaimed(code)) {
      return { isValid: false, error: `M-Pesa receipt ${code} has already been used and is expired.` };
    }
    return { isValid: true, code };
  }

  const codeRegex = /\b([A-Z0-9]{10})\b/i;
  const codeMatch = trimmed.match(codeRegex);
  if (!codeMatch || !codeMatch[1]) {
    return { 
      isValid: false, 
      error: 'Could not find a valid 10-character M-Pesa transaction code in the message. Please check the SMS and try again.' 
    };
  }

  const code = codeMatch[1].toUpperCase();

  if (isReceiptClaimed(code)) {
    return { 
      isValid: false, 
      error: `This M-Pesa receipt code (${code}) has already been used and is expired.` 
    };
  }

  let amount: number | undefined;
  const amountMatch = trimmed.match(/(?:Ksh\.?|KES)\s*([\d,]+(?:\.\d{2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(parsedAmount)) {
      amount = parsedAmount;
    }
  }

  return {
    isValid: true,
    code,
    amount
  };
}

export function createPaymentRecord(record: PaymentRecord): PaymentRecord {
  paymentsStore.set(record.id, record);
  savePaymentsToDisk();
  void upsertToDb(record);
  return record;
}

export function getPaymentRecord(id: string): PaymentRecord | undefined {
  return paymentsStore.get(id);
}

export function updatePaymentRecord(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
  const existing = paymentsStore.get(id);
  if (!existing) return undefined;

  const updated: PaymentRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  paymentsStore.set(id, updated);
  savePaymentsToDisk();
  void upsertToDb(updated);
  return updated;
}

export function getAllPayments(): PaymentRecord[] {
  return Array.from(paymentsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPaymentsByUser(userEmail: string): PaymentRecord[] {
  const normalized = userEmail.trim().toLowerCase();
  return getAllPayments().filter(
    (p) => p.userEmail.toLowerCase() === normalized
  );
}

export function findPaymentByReference(reference: string): PaymentRecord | undefined {
  if (!reference) return undefined;
  const ref = reference.trim();
  for (const record of paymentsStore.values()) {
    if (
      record.id === ref ||
      record.externalReference === ref ||
      record.checkoutRequestId === ref ||
      record.merchantRequestId === ref
    ) {
      return record;
    }
  }
  return undefined;
}

// ==========================================
// PHONE NUMBER HANDLING
// ==========================================

export function normalizeMpesaPhone(phone: string): { normalized: string; isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { normalized: '', isValid: false, error: 'Phone number is required' };
  }

  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    // already normalized
  } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    cleaned = '254' + cleaned;
  }

  const isValid = /^2547[0-9]{8}$/.test(cleaned) || /^2541[0-9]{8}$/.test(cleaned);

  if (!isValid) {
    return {
      normalized: cleaned,
      isValid: false,
      error: 'Invalid M-Pesa number. Please enter a valid 07XX or 01XX Safaricom number.'
    };
  }

  return { normalized: cleaned, isValid: true };
}

export function formatMpesaPhoneNumber(phone: string): string {
  const { normalized } = normalizeMpesaPhone(phone);
  return normalized || phone.replace(/\D/g, '');
}

export function toLocalKenyanPhone(phone: string): string {
  const { normalized } = normalizeMpesaPhone(phone);
  const digits = normalized || phone.replace(/\D/g, '');
  return digits.startsWith('254') ? '0' + digits.substring(3) : digits;
}

export function generatePaymentReference(prefix = 'PIPNEX'): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
}

export function checkRecentDuplicatePayment(phone: string, windowSeconds = 20): PaymentRecord | undefined {
  const normalizedPhone = formatMpesaPhoneNumber(phone);
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;

  for (const record of paymentsStore.values()) {
    if (
      record.paymentMethod === 'mpesa_automated' &&
      record.phoneNumber === normalizedPhone &&
      (record.status === 'PENDING' || record.status === 'PROCESSING') &&
      new Date(record.createdAt).getTime() > cutoff
    ) {
      return record;
    }
  }
  return undefined;
}

// ==========================================
// PAYWAVEXPRESS STK PUSH DISPATCHER
// ==========================================
async function initiatePayWaveXpressStkPush(params: {
  phoneNumber: string;
  amount: number;
  externalReference: string;
  productName: string;
}): Promise<{
  success: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  responseDescription?: string;
  gateway?: 'paywavexpress';
  error?: string;
}> {
  const apiKey = getPayWaveXpressApiKey();
  const email = getPayWaveXpressEmail();

  if (!apiKey || !email) {
    return { success: false, error: 'PayWaveXpress not configured' };
  }

  const baseUrl = getPayWaveXpressBaseUrl();
  const { normalized } = normalizeMpesaPhone(params.phoneNumber);

  try {
    console.log(`[PayWaveXpress STK Push] POST ${baseUrl}/v1/stkpush | KES ${params.amount} | ${normalized} | ref=${params.externalReference} | email=${email}`);

    const payload = {
      api_key: apiKey,
      email,
      amount: Math.round(params.amount),
      msisdn: normalized,
      reference: params.externalReference
    };

    const response = await fetch(`${baseUrl}/v1/stkpush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    console.log('[PayWaveXpress STK Response]:', JSON.stringify(data));

    // The PayWaveXpress payment page checks for ResponseCode === '0' or success === '200'
    const isSuccess =
      response.ok && (
        data.ResponseCode === '0' ||
        data.success === '200' ||
        data.success === true ||
        data.status === 'Success' ||
        data.status === 'SUCCESS'
      );

    if (isSuccess) {
      const checkoutId =
        data.CheckoutRequestID ||
        data.checkout_request_id ||
        data.checkoutRequestId ||
        data.reference ||
        params.externalReference;

      const merchantId =
        data.MerchantRequestID ||
        data.merchant_request_id ||
        data.merchantRequestId ||
        params.externalReference;

      return {
        success: true,
        merchantRequestId: merchantId,
        checkoutRequestId: checkoutId,
        externalReference: params.externalReference,
        responseDescription:
          data.message ||
          data.CustomerMessage ||
          'M-Pesa STK push prompt sent successfully to your phone.',
        gateway: 'paywavexpress'
      };
    }

    // Failure path
    const errDesc =
      data.errorMessage ||
      data.message ||
      data.error ||
      data.ResponseDescription ||
      'Failed to dispatch PayWaveXpress STK Push';

    console.warn('[PayWaveXpress API Error Response]:', data);
    return { success: false, error: errDesc, gateway: 'paywavexpress' };
  } catch (err: any) {
    console.error('[PayWaveXpress Gateway Exception]:', err);
    return {
      success: false,
      error: err?.message || 'PayWaveXpress gateway connection failed',
      gateway: 'paywavexpress'
    };
  }
}

/**
 * Executes STK Push via PayWaveXpress (primary), then PayHero, then Daraja,
 * then falls back to safe Simulation.
 */
export async function initiateMpesaStkPushGateway(params: {
  paymentId: string;
  phoneNumber: string;
  amount: number;
  productName: string;
  accountReference: string;
  userId?: string;
  userEmail?: string;
}): Promise<{
  success: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  responseDescription?: string;
  gateway?: 'paywavexpress' | 'payhero' | 'daraja' | 'heropay' | 'simulation';
  error?: string;
}> {
  const { normalized, isValid, error } = normalizeMpesaPhone(params.phoneNumber);
  if (!isValid) {
    return { success: false, error: error || 'Invalid M-Pesa phone number.' };
  }

  if (params.amount < 1) {
    return { success: false, error: 'Minimum deposit amount is KES 1' };
  }

  const externalRef = params.accountReference || params.paymentId;

  // -------------------------------------------------------------
  // GATEWAY 1: PAYWAVEXPRESS (PRIMARY)
  // -------------------------------------------------------------
  const hasPayWave = Boolean(getPayWaveXpressApiKey() && getPayWaveXpressEmail());
  if (hasPayWave) {
    const pwResult = await initiatePayWaveXpressStkPush({
      phoneNumber: params.phoneNumber,
      amount: params.amount,
      externalReference: externalRef,
      productName: params.productName
    });

    if (pwResult.success) {
      return pwResult;
    }

    // If PayWaveXpress fails with a network/connection error, fall back
    // to PayHero or Daraja. If it fails with a business error (invalid phone,
    // bad amount, etc.), return the error directly so the user can fix it.
    const isNetworkError = /network|timeout|connect|ENOTFOUND|ECONNREFUSED|fetch failed/i.test(pwResult.error || '');
    if (!isNetworkError) {
      console.warn('[PayWaveXpress rejected request — not retrying with other gateways]:', pwResult.error);
      return {
        success: false,
        error: pwResult.error || 'PayWaveXpress STK push failed',
        gateway: 'paywavexpress'
      };
    }

    console.warn('[PayWaveXpress unreachable — trying PayHero fallback]:', pwResult.error);
    // Fall through to PayHero
  }

  // -------------------------------------------------------------
  // GATEWAY 2: PAYHERO AFRICA v2 API (fallback if PayWaveXpress not configured)
  // -------------------------------------------------------------
  const callbackUrl = getCallbackUrl();
  const payHeroAuth = getPayHeroAuthHeader();
  const payHeroBaseUrl = (process.env.PAYHERO_BASE_URL || 'https://api.payhero.africa').replace(/\/+$/, '');
  const payHeroChannelId = Number(process.env.PAYHERO_CHANNEL_ID || 11916);
  const payHeroAccountId = Number(process.env.PAYHERO_ACCOUNT_ID || 10242);
  const payHeroNetworkCode = process.env.PAYHERO_NETWORK_CODE || '63902';
  const localPhone = toLocalKenyanPhone(params.phoneNumber);

  if (payHeroAuth) {
    try {
      console.log(`[PayHero Africa STK Push] Sending KES ${params.amount} prompt to ${localPhone} (${normalized})`);

      const payHeroPayload = {
        amount: Number(params.amount),
        phone_number: localPhone,
        channel_id: payHeroChannelId,
        account_id: payHeroAccountId,
        provider: 'm-pesa',
        network_code: payHeroNetworkCode,
        external_reference: externalRef,
        callback_url: callbackUrl
      };

      const response = await fetch(`${payHeroBaseUrl}/api/v2/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': payHeroAuth
        },
        body: JSON.stringify(payHeroPayload)
      });

      const data = await response.json();
      console.log('[PayHero STK Response]:', JSON.stringify(data));

      if (response.ok && (data.status === 'Success' || data.success || data.Reference || data.reference || data.checkout_request_id)) {
        const checkoutId = data.checkout_request_id || data.CheckoutRequestID || data.reference || data.Reference || externalRef;
        const merchantId = data.merchant_request_id || data.MerchantRequestID || externalRef;
        return {
          success: true,
          merchantRequestId: merchantId,
          checkoutRequestId: checkoutId,
          externalReference: externalRef,
          responseDescription: data.message || 'M-Pesa STK push prompt sent successfully to phone.',
          gateway: 'payhero'
        };
      } else {
        const errDesc = data.message || data.error || data.errorMessage || 'Failed to dispatch PayHero STK Push';
        console.warn('[PayHero API Error Response]:', data);
        return {
          success: false,
          error: errDesc,
          gateway: 'payhero'
        };
      }
    } catch (payHeroErr: any) {
      console.error('[PayHero Gateway Exception]:', payHeroErr);
    }
  }

  // -------------------------------------------------------------
  // GATEWAY 3: SAFARICOM DARAJA DIRECT API
  // -------------------------------------------------------------
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  // Accept both MPESA_ENV and MPESA_ENVIRONMENT for compatibility
  const environment = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase();

  if (consumerKey && consumerSecret && passkey) {
    try {
      const baseUrl = environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

      const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${authHeader}` }
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error('Failed to acquire M-Pesa OAuth access token');
      }

      const date = new Date();
      const timestamp = date.getFullYear().toString() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);

      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

      const stkPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(params.amount),
        PartyA: normalized,
        PartyB: shortcode,
        PhoneNumber: normalized,
        CallBackURL: callbackUrl,
        AccountReference: externalRef.substring(0, 12),
        TransactionDesc: `PipNex ${params.productName.substring(0, 10)}`
      };

      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPayload)
      });

      const stkData = await stkRes.json();
      if (stkData.ResponseCode === '0') {
        return {
          success: true,
          merchantRequestId: stkData.MerchantRequestID,
          checkoutRequestId: stkData.CheckoutRequestID,
          externalReference: externalRef,
          responseDescription: stkData.ResponseDescription || 'Success. Request accepted for processing',
          gateway: 'daraja'
        };
      } else {
        return {
          success: false,
          error: stkData.ResponseDescription || stkData.errorMessage || 'M-Pesa STK Push rejected',
          gateway: 'daraja'
        };
      }
    } catch (err: any) {
      console.error('[M-Pesa Daraja Gateway Error]:', err);
      return {
        success: false,
        error: err.message || 'M-Pesa Gateway Connection Failed',
        gateway: 'daraja'
      };
    }
  }

  // -------------------------------------------------------------
  // GATEWAY 4: SANDBOX / SIMULATION DISPATCHER
  // -------------------------------------------------------------
  const mockMerchantId = `MR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const mockCheckoutId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  console.warn('[paymentEngine] No gateway configured — returning SIMULATION response. Set PAYWAVEXPRESS_API_KEY + PAYWAVEXPRESS_EMAIL or PAYHERO_* env vars for real STK push.');
  return {
    success: true,
    merchantRequestId: mockMerchantId,
    checkoutRequestId: mockCheckoutId,
    externalReference: externalRef,
    responseDescription: 'Simulation mode — no real STK prompt was sent.',
    gateway: 'simulation'
  };
}

export const initiateDarajaStkPush = initiateMpesaStkPushGateway;
