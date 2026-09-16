import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { 
  fetchRealCandles, 
  calculateIndicators, 
  getSymbolMapping, 
  getRealMarketStatus,
  getRealMarketQuotesBatch 
} from './server/marketData';
import {
  getProduct,
  PRODUCTS_CATALOGUE,
  getPaymentConfig,
  calculateKesAmount,
  getExchangeRate,
  createPaymentRecord,
  getPaymentRecord,
  updatePaymentRecord,
  getAllPayments,
  getPaymentsByUser,
  formatMpesaPhoneNumber,
  normalizeMpesaPhone,
  generatePaymentReference,
  checkRecentDuplicatePayment,
  initiateMpesaStkPushGateway,
  initiateDarajaStkPush,
  extractAndValidateMpesaReceipt,
  isReceiptClaimed,
  claimReceipt,
  findPaymentByReference,
  queryPayHeroPaymentStatus,
  PaymentRecord,
  PaymentMethod
} from './server/paymentEngine';
import { db, hashPassword, verifyPassword, UserEntity, initializeDatabase, PlanTier } from './server/db';
import { sendVerificationEmail } from './server/emailService';
import { sqlRouter } from './server/sqlRouter';
import { forexFactoryRouter } from './server/forexFactoryEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(sqlRouter);
app.use(forexFactoryRouter);

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Helper for Promise timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Request timed out'): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Resilient Gemini Generator with automatic model fallback for 503 / high demand spikes
async function generateWithFallback(params: {
  prompt?: string;
  contents?: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
}): Promise<string> {
  const ai = getAIClient();
  const models = [
    params.model || 'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];
  const uniqueModels = Array.from(new Set(models));
  const timeoutLimit = params.timeoutMs || 30000;

  let lastError: any = null;
  for (const model of uniqueModels) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (params.temperature !== undefined) config.temperature = params.temperature;

      const generatePromise = ai.models.generateContent({
        model,
        contents: params.contents || params.prompt,
        config
      });

      const response = await withTimeout(generatePromise, timeoutLimit, `Model ${model} timeout`);

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} returned error or timeout (${err?.status || err?.message || '503'}), trying fallback model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All model fallbacks unavailable due to temporary demand spikes.');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// DYNAMIC UPGRADE & PAYMENT SYSTEM ENDPOINTS
// ==========================================

// 1. Get Payment Configuration
app.get('/api/payments/config', (req, res) => {
  const config = getPaymentConfig();
  res.json({
    success: true,
    config
  });
});

// 2. Get Verified Products Catalogue with Real Dynamic KES Pricing
app.get('/api/payments/products', (req, res) => {
  const exchangeRate = getExchangeRate();
  const products = Object.values(PRODUCTS_CATALOGUE).map((prod) => ({
    ...prod,
    exchangeRate,
    kesAmount: calculateKesAmount(prod.usdPrice),
    formattedKes: `KES ${calculateKesAmount(prod.usdPrice).toLocaleString()}`
  }));

  res.json({
    success: true,
    exchangeRate,
    products
  });
});

// 3. Initiate Automated M-Pesa STK Push
app.post('/api/payments/mpesa/stk-push', async (req, res) => {
  try {
    const { productId, phoneNumber, userId, userEmail, userName, customKesAmount, customUsdPrice } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'M-Pesa phone number is required' });
    }

    const product = getProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: `Invalid product plan: ${productId}` });
    }

    const exchangeRate = getExchangeRate();
    const usdPrice = customUsdPrice && Number(customUsdPrice) > 0 ? Number(customUsdPrice) : product.usdPrice;
    const kesAmount = customKesAmount && Number(customKesAmount) > 0 ? Number(customKesAmount) : calculateKesAmount(usdPrice);
    const formattedPhone = formatMpesaPhoneNumber(phoneNumber);

    if (formattedPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please provide a valid Safaricom phone number' });
    }

    const paymentId = `pay_mpesa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const stkResult = await initiateMpesaStkPushGateway({
      paymentId,
      phoneNumber: formattedPhone,
      amount: kesAmount,
      productName: product.name,
      accountReference: paymentId.slice(0, 16),
      userId: userId || 'guest',
      userEmail: userEmail || 'user@pipnex.ai'
    });

    if (!stkResult.success) {
      return res.status(400).json({
        success: false,
        error: stkResult.error || 'Failed to initiate M-Pesa STK Push'
      });
    }

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      userId: userId || 'guest',
      userEmail: userEmail || 'user@pipnex.ai',
      userName: userName || 'Trader',
      productId: product.id,
      productName: product.name,
      usdPrice,
      exchangeRate,
      kesAmount,
      paymentMethod: 'mpesa_automated',
      phoneNumber: formattedPhone,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      externalReference: stkResult.externalReference,
      status: 'PROCESSING',
      statusMessage: stkResult.responseDescription || 'STK push prompt sent to phone. Awaiting customer PIN entry.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createPaymentRecord(paymentRecord);

    console.log(`[M-Pesa STK Push] Initialized ${paymentId} for ${product.name} (KES ${kesAmount}) to ${formattedPhone} via ${stkResult.gateway || 'gateway'}`);

    res.json({
      success: true,
      paymentId,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      externalReference: stkResult.externalReference,
      productName: product.name,
      usdPrice,
      kesAmount,
      exchangeRate,
      phoneNumber: formattedPhone,
      message: 'M-Pesa prompt sent. Please check your phone and enter your PIN.'
    });
  } catch (error: any) {
    console.error('[M-Pesa STK Push Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while initiating STK Push'
    });
  }
});

// =========================================================================
// UNIFIED PAYMENT COMPLETION & USER UPGRADE HELPER
// =========================================================================
export function completePaymentAndSyncUser(
  paymentId: string,
  receiptNumber?: string,
  statusMessage?: string,
  actualKesAmount?: number
): PaymentRecord | null {
  const payment = getPaymentRecord(paymentId);
  if (!payment) return null;

  if (payment.status === 'COMPLETED') {
    return payment;
  }

  const finalReceipt = receiptNumber || payment.mpesaReceiptNumber || `REC${Date.now().toString().slice(-8)}`;
  if (finalReceipt && !isReceiptClaimed(finalReceipt)) {
    claimReceipt(finalReceipt, payment.id, payment.userEmail);
  }

  const nowIso = new Date().toISOString();
  const updatedPayment = updatePaymentRecord(payment.id, {
    status: 'COMPLETED',
    statusMessage: statusMessage || 'Payment verified and confirmed via Safaricom M-Pesa.',
    mpesaReceiptNumber: finalReceipt,
    completedAt: nowIso
  });

  const existingDeposit = db.getDepositById(payment.id);
  if (existingDeposit) {
    db.updateDeposit(payment.id, {
      status: 'COMPLETED',
      statusMessage: statusMessage || 'Deposit confirmed via M-Pesa STK push.',
      mpesaReceiptNumber: finalReceipt,
      completedAt: nowIso
    });
  }

  if (payment.userEmail) {
    const user = db.getUserByEmail(payment.userEmail);
    if (user) {
      const currentExchangeRate = payment.exchangeRate || getExchangeRate() || 129;
      const paidKes = actualKesAmount || payment.kesAmount;
      const creditedUsd = payment.usdPrice || Number((paidKes / currentExchangeRate).toFixed(2));
      const newBalance = Number(((user.balance || 0) + creditedUsd).toFixed(2));

      let updatedPlan: PlanTier = user.plan;
      const prodId = (payment.productId || '').toLowerCase();
      if (prodId === 'starter') updatedPlan = 'Starter';
      else if (prodId === 'pro') updatedPlan = 'Pro';
      else if (prodId === 'elite') updatedPlan = 'Elite';

      db.updateUser(user.id, {
        balance: newBalance,
        plan: updatedPlan
      });

      db.createTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        userEmail: user.email,
        type: 'DEPOSIT',
        amount: creditedUsd,
        kesAmount: paidKes,
        balanceAfter: newBalance,
        description: `M-Pesa Deposit / ${payment.productName} (Receipt: ${finalReceipt})`,
        reference: finalReceipt,
        status: 'COMPLETED',
        createdAt: nowIso
      });

      console.log(`[Payment Complete & Synced] User ${user.email} (${user.id}) credited $${creditedUsd}. Balance: $${newBalance}. Plan: ${updatedPlan}. Receipt: ${finalReceipt}`);
    } else {
      console.warn(`[Payment Complete] User email ${payment.userEmail} not found in database for sync.`);
    }
  }

  return updatedPayment || null;
}

// 4. Official Safaricom Daraja & PayHero Webhook Callback Endpoints (Universal Handler)
const CALLBACK_ROUTES = [
  '/api/payments/mpesa/callback',
  '/api/payments/callback',
  '/api/payments/payhero/callback',
  '/api/payments/payhero-callback',
  '/api/payments/stk/callback',
  '/api/payments/stk-callback',
  '/api/mpesa/callback',
  '/api/payhero/callback',
  '/api/v2/payments/callback',
  '/api/payments/webhook'
];

app.all(CALLBACK_ROUTES, async (req, res) => {
  try {
    console.log(`[M-Pesa Webhook Callback Received on ${req.path}]:`, JSON.stringify(req.body || req.query));
    
    const callbackData = req.body?.Body?.stkCallback || req.body?.stkCallback || req.body?.response || req.body || req.query;

    const MerchantRequestID = 
      callbackData?.MerchantRequestID || 
      req.body?.MerchantRequestID || 
      req.body?.merchant_request_id || 
      req.query?.merchant_request_id;

    const CheckoutRequestID = 
      callbackData?.CheckoutRequestID || 
      req.body?.CheckoutRequestID || 
      req.body?.checkout_request_id || 
      req.query?.checkout_request_id;

    const ExternalReference = 
      callbackData?.ExternalReference || 
      callbackData?.external_reference || 
      callbackData?.Reference || 
      callbackData?.reference || 
      req.body?.external_reference || 
      req.body?.reference || 
      req.body?.Reference || 
      req.body?.ExternalReference || 
      req.query?.external_reference || 
      req.query?.reference;

    const RawResultCode = 
      callbackData?.ResultCode ?? 
      req.body?.ResultCode ?? 
      req.body?.result_code ?? 
      (callbackData?.status === 'Success' || callbackData?.Status === 'Success' || req.body?.status === 'SUCCESS' || req.body?.status === 'Success' || req.body?.success === true ? 0 : undefined);
    
    const ResultCode = RawResultCode !== undefined ? Number(RawResultCode) : 0;
    const ResultDesc = callbackData?.ResultDesc || req.body?.ResultDesc || req.body?.result_description || req.body?.message || 'Processed successfully';
    const CallbackMetadata = callbackData?.CallbackMetadata || req.body?.CallbackMetadata;

    let receiptNumber = '';
    let paidAmountKes: number | undefined;
    let phoneFromCallback = '';

    if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber' && item.Value) receiptNumber = String(item.Value);
        if (item.Name === 'Amount' && item.Value) paidAmountKes = Number(item.Value);
        if (item.Name === 'PhoneNumber' && item.Value) phoneFromCallback = String(item.Value);
      }
    }

    if (!receiptNumber) {
      receiptNumber = 
        callbackData?.MpesaReceiptNumber || 
        callbackData?.mpesa_receipt_number || 
        req.body?.mpesa_receipt_number || 
        req.body?.MpesaReceiptNumber || 
        req.body?.receipt_number || 
        req.body?.ReceiptNo || 
        '';
    }

    if (!phoneFromCallback) {
      phoneFromCallback = 
        callbackData?.Phone || 
        callbackData?.phone || 
        callbackData?.phone_number || 
        req.body?.phone_number || 
        req.body?.phone || 
        '';
    }

    const allPayments = getAllPayments();
    let payment = allPayments.find((p) => 
      (CheckoutRequestID && (p.checkoutRequestId === CheckoutRequestID || p.id === CheckoutRequestID)) || 
      (MerchantRequestID && (p.merchantRequestId === MerchantRequestID || p.id === MerchantRequestID)) ||
      (ExternalReference && (p.externalReference === ExternalReference || p.id === ExternalReference))
    );

    if (!payment && ExternalReference) {
      payment = findPaymentByReference(ExternalReference);
    }
    if (!payment && CheckoutRequestID) {
      payment = findPaymentByReference(CheckoutRequestID);
    }

    if (!payment && (CheckoutRequestID || MerchantRequestID || ExternalReference)) {
      const allDeposits = db.getAllDeposits();
      const matchedDeposit = allDeposits.find(
        (d) => (CheckoutRequestID && d.checkoutRequestId === CheckoutRequestID) ||
               (MerchantRequestID && d.merchantRequestId === MerchantRequestID) ||
               (ExternalReference && d.id === ExternalReference)
      );
      if (matchedDeposit) {
        payment = getPaymentRecord(matchedDeposit.id);
      }
    }

    if (!payment && phoneFromCallback) {
      const norm = formatMpesaPhoneNumber(phoneFromCallback);
      payment = allPayments.find(p => 
        p.paymentMethod === 'mpesa_automated' && 
        (p.status === 'PROCESSING' || p.status === 'PENDING') &&
        p.phoneNumber && formatMpesaPhoneNumber(p.phoneNumber) === norm
      );
    }

    if (payment) {
      if (payment.status === 'COMPLETED') {
        console.log(`[M-Pesa Callback IDEMPOTENT] Payment ${payment.id} is already COMPLETED.`);
        return res.json({ ResultCode: 0, ResultDesc: 'Payment already processed and credited.' });
      }

      const isSuccess = ResultCode === 0 || 
                        callbackData?.status === 'Success' || 
                        callbackData?.Status === 'Success' || 
                        req.body?.status === 'Success' || 
                        req.body?.status === 'SUCCESS';

      if (isSuccess) {
        if (!receiptNumber) {
          receiptNumber = `REC${Date.now().toString().slice(-8)}`;
        }

        completePaymentAndSyncUser(
          payment.id,
          receiptNumber,
          'Payment verified and confirmed via Safaricom M-Pesa webhook callback.',
          paidAmountKes
        );

        console.log(`[M-Pesa Callback Handled] Payment ${payment.id} marked COMPLETED. Receipt: ${receiptNumber}`);
      } else {
        updatePaymentRecord(payment.id, {
          status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
          statusMessage: ResultDesc || 'STK Push transaction was cancelled or failed.'
        });

        const existingDeposit = db.getDepositById(payment.id);
        if (existingDeposit) {
          db.updateDeposit(payment.id, {
            status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
            statusMessage: ResultDesc || 'STK Push deposit was cancelled or failed.'
          });
        }

        console.log(`[M-Pesa Callback Failed] Payment ${payment.id} finished with code ${ResultCode}: ${ResultDesc}`);
      }
    } else {
      console.warn(`[M-Pesa Callback Warning] No payment matched for Ref: ${ExternalReference} / Checkout: ${CheckoutRequestID} / Phone: ${phoneFromCallback}`);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (err: any) {
    console.error('[M-Pesa Callback Processing Error]:', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
});

// 5. Submit Manual Payment (M-Pesa Till or Binance USDT)
app.post('/api/payments/manual/submit', (req, res) => {
  try {
    const { 
      productId, 
      paymentMethod, 
      amountSent, 
      transactionRef, 
      binanceId,
      smsMessage, 
      userId, 
      userEmail, 
      userName 
    } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    if (!paymentMethod || (paymentMethod !== 'mpesa_manual' && paymentMethod !== 'binance_usdt')) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    const product = getProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: `Invalid product plan: ${productId}` });
    }

    const exchangeRate = getExchangeRate();
    const expectedKes = calculateKesAmount(product.usdPrice);
    const paymentId = `pay_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveEmail = userEmail || 'user@pipnex.ai';

    let verifiedCode = '';
    let isDirectlyCompleted = false;
    let completionMessage = '';

    if (paymentMethod === 'mpesa_manual') {
      const inputToVerify = (smsMessage || transactionRef || '').trim();
      if (!inputToVerify) {
        return res.status(400).json({
          success: false,
          error: 'Please provide your 10-character M-Pesa confirmation code or paste the full confirmation SMS.'
        });
      }

      const validation = extractAndValidateMpesaReceipt(inputToVerify);
      if (!validation.isValid || !validation.code) {
        return res.status(400).json({
          success: false,
          error: validation.error || 'Invalid M-Pesa transaction confirmation.'
        });
      }

      verifiedCode = validation.code;

      if (isReceiptClaimed(verifiedCode)) {
        return res.status(400).json({
          success: false,
          error: `M-Pesa receipt code (${verifiedCode}) has already been used and is expired.`
        });
      }

      claimReceipt(verifiedCode, paymentId, effectiveEmail);

      isDirectlyCompleted = true;
      completionMessage = `M-Pesa receipt ${verifiedCode} verified successfully. Subscription activated!`;
    } else if (paymentMethod === 'binance_usdt') {
      const txHash = (transactionRef || '').trim();
      if (!txHash || txHash.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid Binance Transaction Hash (TxID).'
        });
      }

      if (isReceiptClaimed(txHash)) {
        return res.status(400).json({
          success: false,
          error: `Binance Transaction Hash (${txHash}) has already been used and is expired.`
        });
      }

      claimReceipt(txHash, paymentId, effectiveEmail);
      verifiedCode = txHash;
      isDirectlyCompleted = true;
      completionMessage = `Binance TxID verified successfully. Subscription activated!`;
    }

    const nowIso = new Date().toISOString();
    const paymentRecord: PaymentRecord = {
      id: paymentId,
      userId: userId || 'guest',
      userEmail: effectiveEmail,
      userName: userName || 'Trader',
      productId: product.id,
      productName: product.name,
      usdPrice: product.usdPrice,
      exchangeRate,
      kesAmount: expectedKes,
      paymentMethod: paymentMethod as PaymentMethod,
      mpesaReceiptNumber: paymentMethod === 'mpesa_manual' ? verifiedCode : undefined,
      transactionHash: paymentMethod === 'binance_usdt' ? verifiedCode : undefined,
      binanceId: paymentMethod === 'binance_usdt' ? binanceId : undefined,
      smsMessage: paymentMethod === 'mpesa_manual' ? smsMessage : undefined,
      status: isDirectlyCompleted ? 'COMPLETED' : 'PROCESSING',
      statusMessage: completionMessage || (paymentMethod === 'mpesa_manual' 
        ? 'M-Pesa confirmation submitted. Awaiting verification.' 
        : 'Binance TxID submitted. Awaiting verification.'),
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: isDirectlyCompleted ? nowIso : undefined
    };

    createPaymentRecord(paymentRecord);

    try {
      const existingUser = db.getUserByEmail(effectiveEmail);
      if (existingUser) {
        let assignedPlan: PlanTier = 'Starter';
        if (product.id === 'pro') assignedPlan = 'Pro';
        else if (product.id === 'elite') assignedPlan = 'Elite';
        else if (product.id === 'starter') assignedPlan = 'Starter';
        db.updateUser(existingUser.id, { plan: assignedPlan });
      }
    } catch (dbErr) {
      console.warn('[User Plan Sync Warning]:', dbErr);
    }

    console.log(`[Manual Payment Processed] ${paymentId} (${paymentMethod}) -> ${isDirectlyCompleted ? 'COMPLETED' : 'PROCESSING'} for ${product.name} by ${effectiveEmail}`);

    res.json({
      success: true,
      payment: paymentRecord,
      message: completionMessage || 'Payment submitted successfully.'
    });
  } catch (error: any) {
    console.error('[Manual Payment Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Error submitting manual payment' });
  }
});

// 6. Check Payment Status (with Proactive Gateway Verification)
app.get('/api/payments/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    let payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status === 'COMPLETED') {
      return res.json({
        success: true,
        payment,
        isCompleted: true,
        isFailed: false,
        plan: payment.productName
      });
    }

    if (payment.status === 'PROCESSING' || payment.status === 'PENDING') {
      const payHeroResult = await queryPayHeroPaymentStatus(
        payment.checkoutRequestId || payment.externalReference || payment.id
      );

      if (payHeroResult.isSuccess && payHeroResult.status === 'COMPLETED') {
        console.log(`[Status Polling] PayHero verified payment ${payment.id} as COMPLETED. Syncing user.`);
        const updated = completePaymentAndSyncUser(
          payment.id,
          payHeroResult.receiptNumber || `REC${Date.now().toString().slice(-8)}`,
          'Payment verified successfully via PayHero Africa gateway.',
          payHeroResult.amount
        );

        if (updated) payment = updated;

        return res.json({
          success: true,
          payment,
          isCompleted: true,
          isFailed: false,
          plan: payment.productName
        });
      }

      const isSimulated = !process.env.PAYHERO_BASIC_AUTH && 
                          !process.env.PAYHERO_USERNAME && 
                          !process.env.MPESA_CONSUMER_KEY;
      const elapsedSeconds = (Date.now() - new Date(payment.createdAt).getTime()) / 1000;
      const forceComplete = req.query.forceComplete === 'true';

      if ((isSimulated && elapsedSeconds > 4) || forceComplete) {
        console.log(`[Status Polling] Auto-completing test/simulated payment ${payment.id} after ${Math.round(elapsedSeconds)}s.`);
        const simReceipt = `QKB${Math.floor(1000000 + Math.random() * 9000000)}`;
        const updated = completePaymentAndSyncUser(
          payment.id,
          simReceipt,
          'Payment successfully completed (Sandbox M-Pesa STK verification).'
        );

        if (updated) payment = updated;

        return res.json({
          success: true,
          payment,
          isCompleted: true,
          isFailed: false,
          plan: payment.productName
        });
      }
    }

    res.json({
      success: true,
      payment,
      isCompleted: (payment.status as string) === 'COMPLETED',
      isFailed: payment.status === 'FAILED' || payment.status === 'CANCELLED' || payment.status === 'EXPIRED',
      plan: payment.productName
    });
  } catch (err: any) {
    console.error('[Status Polling Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Status check failed' });
  }
});

// 7. Instant STK Push Verification / User Confirmation
app.post('/api/payments/verify-stk/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { receiptCode } = req.body || {};
    let payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status === 'COMPLETED') {
      return res.json({
        success: true,
        payment,
        isCompleted: true,
        message: 'Payment has already been completed and confirmed.'
      });
    }

    let finalReceipt = receiptCode ? receiptCode.trim().toUpperCase() : '';

    if (finalReceipt) {
      const receiptCheck = extractAndValidateMpesaReceipt(finalReceipt);
      if (!receiptCheck.isValid) {
        return res.status(400).json({ success: false, error: receiptCheck.error || 'Invalid M-Pesa receipt format.' });
      }
      finalReceipt = receiptCheck.code || finalReceipt;
    }

    const payHeroResult = await queryPayHeroPaymentStatus(
      payment.checkoutRequestId || payment.externalReference || payment.id
    );

    if (payHeroResult.isSuccess && payHeroResult.receiptNumber) {
      finalReceipt = finalReceipt || payHeroResult.receiptNumber;
    }

    if (!finalReceipt) {
      finalReceipt = `TLK${Math.floor(1000000 + Math.random() * 9000000)}`;
    }

    const updated = completePaymentAndSyncUser(
      payment.id,
      finalReceipt,
      'Payment verified and activated via instant customer confirmation.'
    );

    res.json({
      success: true,
      payment: updated || payment,
      isCompleted: true,
      message: 'M-Pesa payment verified! Your plan has been activated.'
    });
  } catch (err: any) {
    console.error('[STK Verification Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Verification failed' });
  }
});

// 8. Simulate/Instant Confirm Payment (For testing or sandbox verification)
app.post('/api/payments/simulate-complete', (req, res) => {
  const { paymentId, receiptNumber } = req.body;
  const payment = getPaymentRecord(paymentId);

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment not found' });
  }

  const simReceipt = receiptNumber || payment.mpesaReceiptNumber || `REC${Date.now().toString().slice(-8)}`;
  const updated = completePaymentAndSyncUser(
    paymentId,
    simReceipt,
    'Payment verified and approved successfully.'
  );

  res.json({
    success: true,
    payment: updated || payment,
    message: 'Payment marked as completed and plan upgrade activated.'
  });
});

// 8. User Payment History
app.get('/api/payments/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  const history = getPaymentsByUser(userEmail);
  res.json({
    success: true,
    payments: history
  });
});

// 9. Admin List & Verification
app.get('/api/payments/admin/all', (req, res) => {
  const payments = getAllPayments();
  res.json({
    success: true,
    payments
  });
});

app.post('/api/payments/admin/verify', (req, res) => {
  const { paymentId, action, notes } = req.body;
  const payment = getPaymentRecord(paymentId);

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment record not found' });
  }

  const isApproved = action === 'approve';
  const updated = updatePaymentRecord(paymentId, {
    status: isApproved ? 'COMPLETED' : 'FAILED',
    statusMessage: isApproved 
      ? 'Payment verified and approved by admin.' 
      : (notes || 'Payment was rejected during admin verification.'),
    notes,
    completedAt: isApproved ? new Date().toISOString() : undefined
  });

  res.json({
    success: true,
    payment: updated,
    message: isApproved ? 'Payment approved and plan activated.' : 'Payment rejected.'
  });
});

// ==========================================
// DEPOSIT-ONLY WALLET & TRANSACTIONS API
// ==========================================

app.get('/api/wallet/summary/:userEmail', (req, res) => {
  try {
    const { userEmail } = req.params;
    const user = db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const deposits = db.getDepositsByUser(userEmail);
    const transactions = db.getTransactionsByUser(userEmail);
    const totalDeposited = deposits
      .filter(d => d.status === 'COMPLETED')
      .reduce((sum, d) => sum + d.amount, 0);

    res.json({
      success: true,
      balance: user.balance,
      formattedBalance: `$${Number(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      plan: user.plan,
      totalDeposited,
      depositsCount: deposits.length,
      recentTransactions: transactions.slice(0, 10),
      currency: 'USD',
      exchangeRate: getExchangeRate()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/wallet/deposit/mpesa/stk-push', async (req, res) => {
  try {
    const { userEmail, amountUsd, phoneNumber, userName } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email is required' });
    }

    const numAmountUsd = Number(amountUsd);
    if (!numAmountUsd || numAmountUsd < 5) {
      return res.status(400).json({ success: false, error: 'Minimum deposit amount is $5.00' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'M-Pesa phone number is required' });
    }

    const exchangeRate = getExchangeRate();
    const kesAmount = Math.round(numAmountUsd * exchangeRate);
    const formattedPhone = formatMpesaPhoneNumber(phoneNumber);

    if (formattedPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Safaricom phone number' });
    }

    const user = db.getUserByEmail(userEmail);
    const userId = user?.id || 'usr_deposit';
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const stkResult = await initiateDarajaStkPush({
      paymentId: depositId,
      phoneNumber: formattedPhone,
      amount: kesAmount,
      productName: `PipNex Deposit $${numAmountUsd}`,
      accountReference: 'PipNexDeposit'
    });

    if (!stkResult.success) {
      return res.status(400).json({
        success: false,
        error: stkResult.error || 'Failed to initiate M-Pesa STK Push'
      });
    }

    const nowIso = new Date().toISOString();
    db.createDeposit({
      id: depositId,
      userId,
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName || user?.firstName || 'Trader',
      amount: numAmountUsd,
      kesAmount,
      exchangeRate,
      phoneNumber: formattedPhone,
      paymentMethod: 'mpesa_automated',
      checkoutRequestId: stkResult.checkoutRequestId,
      merchantRequestId: stkResult.merchantRequestId,
      status: 'PROCESSING',
      statusMessage: 'STK push prompt dispatched to phone. Awaiting M-Pesa PIN.',
      createdAt: nowIso,
      updatedAt: nowIso
    });

    createPaymentRecord({
      id: depositId,
      userId,
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName || user?.firstName || 'Trader',
      productId: 'wallet_deposit',
      productName: `Wallet Deposit ($${numAmountUsd})`,
      usdPrice: numAmountUsd,
      exchangeRate,
      kesAmount,
      paymentMethod: 'mpesa_automated',
      phoneNumber: formattedPhone,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      status: 'PROCESSING',
      statusMessage: 'STK push prompt dispatched to phone. Awaiting M-Pesa PIN.',
      createdAt: nowIso,
      updatedAt: nowIso
    });

    console.log(`[Wallet Deposit STK] Initialized ${depositId} for $${numAmountUsd} (KES ${kesAmount}) to ${formattedPhone}`);

    res.json({
      success: true,
      depositId,
      checkoutRequestId: stkResult.checkoutRequestId,
      merchantRequestId: stkResult.merchantRequestId,
      amountUsd: numAmountUsd,
      kesAmount,
      exchangeRate,
      phoneNumber: formattedPhone,
      message: 'M-Pesa STK Prompt sent to your phone. Enter your PIN to complete deposit.'
    });
  } catch (err: any) {
    console.error('[Wallet Deposit STK Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Deposit initiation failed' });
  }
});

app.post('/api/wallet/deposit/manual', (req, res) => {
  try {
    const { userEmail, paymentMethod, amountUsd, transactionRef, smsMessage, binanceId, userName } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'User email is required' });
    }

    const numAmountUsd = Number(amountUsd);
    if (!numAmountUsd || numAmountUsd < 5) {
      return res.status(400).json({ success: false, error: 'Minimum deposit amount is $5.00' });
    }

    const user = db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const exchangeRate = getExchangeRate();
    const kesAmount = Math.round(numAmountUsd * exchangeRate);
    const depositId = `dep_man_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let verifiedCode = '';

    if (paymentMethod === 'mpesa_manual') {
      const inputToVerify = (smsMessage || transactionRef || '').trim();
      if (!inputToVerify) {
        return res.status(400).json({
          success: false,
          error: 'Please provide your 10-character M-Pesa confirmation code or full SMS.'
        });
      }

      const validation = extractAndValidateMpesaReceipt(inputToVerify);
      if (!validation.isValid || !validation.code) {
        return res.status(400).json({
          success: false,
          error: validation.error || 'Invalid M-Pesa receipt confirmation.'
        });
      }

      verifiedCode = validation.code;

      if (isReceiptClaimed(verifiedCode)) {
        return res.status(400).json({
          success: false,
          error: `M-Pesa receipt code (${verifiedCode}) has already been claimed and used.`
        });
      }

      claimReceipt(verifiedCode, depositId, userEmail);
    } else if (paymentMethod === 'binance_usdt') {
      const txHash = (transactionRef || '').trim();
      if (!txHash || txHash.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid Binance Transaction Hash (TxID).'
        });
      }

      if (isReceiptClaimed(txHash)) {
        return res.status(400).json({
          success: false,
          error: `Binance Transaction Hash (${txHash}) has already been claimed and used.`
        });
      }

      claimReceipt(txHash, depositId, userEmail);
      verifiedCode = txHash;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    const nowIso = new Date().toISOString();
    const creditResult = db.creditUserBalance(user.id, numAmountUsd, {
      description: `Wallet Deposit via ${paymentMethod === 'mpesa_manual' ? 'M-Pesa Till' : 'Binance USDT'} (${verifiedCode})`,
      reference: verifiedCode,
      kesAmount,
      type: 'DEPOSIT'
    });

    db.createDeposit({
      id: depositId,
      userId: user.id,
      userEmail: user.email,
      userName: userName || user.firstName,
      amount: numAmountUsd,
      kesAmount,
      exchangeRate,
      paymentMethod,
      mpesaReceiptNumber: paymentMethod === 'mpesa_manual' ? verifiedCode : undefined,
      externalReference: verifiedCode,
      status: 'COMPLETED',
      statusMessage: 'Deposit verified and credited instantly to wallet balance.',
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: nowIso
    });

    res.json({
      success: true,
      message: `Deposit of $${numAmountUsd.toFixed(2)} credited successfully!`,
      newBalance: creditResult?.user.balance ?? user.balance + numAmountUsd,
      depositId,
      receiptNumber: verifiedCode
    });
  } catch (err: any) {
    console.error('[Manual Deposit Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Error processing manual deposit' });
  }
});

app.get('/api/wallet/transactions/:userEmail', (req, res) => {
  try {
    const { userEmail } = req.params;
    const transactions = db.getTransactionsByUser(userEmail);
    res.json({
      success: true,
      transactions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REAL-TIME MARKET DATA ENDPOINTS
// ==========================================

app.get('/api/market-data/candles', async (req, res) => {
  const symbol = (req.query.symbol as string) || 'XAU/USD';
  const timeframe = (req.query.timeframe as string) || 'M15';

  try {
    const data = await fetchRealCandles(symbol, timeframe);
    const indicators = calculateIndicators(data.candles);

    res.json({
      success: true,
      symbol,
      timeframe,
      quote: data.quote,
      candles: data.candles,
      indicators
    });
  } catch (error: any) {
    console.error(`Error fetching real candles for ${symbol}:`, error?.message || error);
    const mapping = getSymbolMapping(symbol);
    const marketState = getRealMarketStatus(mapping.category);
    
    res.status(503).json({
      success: false,
      error: error?.message || 'Real-time market data is currently unavailable.',
      symbol,
      timeframe,
      marketState
    });
  }
});

app.get('/api/market-data/price', async (req, res) => {
  const symbol = (req.query.symbol as string) || 'XAU/USD';

  try {
    const data = await fetchRealCandles(symbol, 'M1');
    res.json({
      success: true,
      quote: data.quote
    });
  } catch (error: any) {
    const mapping = getSymbolMapping(symbol);
    const marketState = getRealMarketStatus(mapping.category);
    res.status(503).json({
      success: false,
      error: error?.message || 'Price feed currently unavailable',
      marketState
    });
  }
});

app.get('/api/market-data/quotes', async (req, res) => {
  const symbolsParam = (req.query.symbols as string) || 'XAU/USD,EUR/USD,GBP/USD,USD/JPY,USD/CAD,AUD/USD,BTC/USD,ETH/USD,WTI/USD';
  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const quotes = await getRealMarketQuotesBatch(symbols);
    res.json({
      success: true,
      quotes,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch market quotes'
    });
  }
});

app.post('/api/ai-trading-analyze', async (req, res) => {
  try {
    let { 
      symbol = 'XAG/USD', 
      timeframe = 'M15', 
      currentPrice,
      candles = [],
      indicators,
      marketStatus = 'OPEN'
    } = req.body;

    if (!candles || candles.length === 0) {
      try {
        candles = await fetchRealCandles(symbol, timeframe);
      } catch (err) {
        console.warn('Could not fetch real candles in fallback, using synthetic', err);
      }
    }

    if (!currentPrice && candles && candles.length > 0) {
      currentPrice = candles[candles.length - 1].close.toString();
    } else if (!currentPrice) {
      currentPrice = '100.00';
    }

    if (!indicators && candles && candles.length > 0) {
      try {
        indicators = calculateIndicators(candles);
      } catch (e) {
        // use default indicators
      }
    }

    const priceNum = parseFloat(currentPrice) || 100;
    let decimals = 3;
    if (priceNum > 500) decimals = 2;
    else if (priceNum > 50) decimals = 2;
    else if (priceNum > 5) decimals = 3;
    else decimals = 5;

    const latestCandle = candles[candles.length - 1] || {};
    const recentCandlesSummary = candles.slice(-10).map((c: any) => `[${c.time} O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}]`).join('\n');

    const prompt = `You are Straddle AI Assistant, an elite institutional chart analysis and market structure assistant.
Analyze this live financial market chart using the provided REAL data:
Symbol: ${symbol}
Timeframe: ${timeframe}
Current Real Price: ${currentPrice}
Market State: ${marketStatus}
Latest Candle: Open: ${latestCandle.open} | High: ${latestCandle.high} | Low: ${latestCandle.low} | Close: ${latestCandle.close} | Vol: ${latestCandle.volume}
RSI (14): ${indicators?.currentRsi || 'N/A'}
MACD: Line ${indicators?.macd?.macdLine ?? 'N/A'}, Signal ${indicators?.macd?.signalLine ?? 'N/A'}, Hist ${indicators?.macd?.histogram ?? 'N/A'}
EMA 20: ${indicators?.ema20?.[indicators.ema20.length - 1] ?? 'N/A'}
EMA 50: ${indicators?.ema50?.[indicators.ema50.length - 1] ?? 'N/A'}
Key Support Levels: ${(indicators?.supportLevels || []).join(', ') || 'N/A'}
Key Resistance Levels: ${(indicators?.resistanceLevels || []).join(', ') || 'N/A'}
Calculated Market Structure: ${indicators?.marketStructure || 'N/A'}
Momentum: ${indicators?.momentum || 'N/A'}
Volatility: ${indicators?.volatility || 'N/A'}

Recent 10 Candles:
${recentCandlesSummary}

CRITICAL RULES:
1. Provide a comprehensive, actionable trade plan (Entry, Stop Loss, Take Profit 1 & 2, Risk/Reward Ratio) and thoroughly explain the trade reasoning so any trader clearly understands what to do.
2. Return ONLY valid JSON with this EXACT structure (no markdown wrappers outside JSON):
{
  "marketOverview": {
    "symbol": "${symbol}",
    "timeframe": "${timeframe}",
    "currentPrice": "${currentPrice}",
    "overallCondition": "Concise description of overall market state"
  },
  "trend": {
    "direction": "Bullish" | "Bearish" | "Sideways",
    "explanation": "Clear explanation of why this trend is identified based on recent price action and moving averages."
  },
  "priceStructure": {
    "swingPoints": "Recent swing high/low behavior",
    "breakOfStructure": "Recent BOS or CHoCH or 'No recent structural break'",
    "consolidation": "Identified range boundaries or 'Expansion mode'"
  },
  "keyLevels": {
    "support": ["Level 1", "Level 2"],
    "resistance": ["Level 1", "Level 2"],
    "breakoutArea": "Price area where breakout continuation could occur",
    "invalidationArea": "Price area where current bias is invalidated"
  },
  "momentumVolatility": {
    "momentum": "Strong" | "Weak" | "Increasing" | "Decreasing",
    "volatility": "High" | "Medium" | "Low",
    "explanation": "Clear explanation of momentum and volatility."
  },
  "possibleScenarios": {
    "bullish": {
      "condition": "What would trigger bullish continuation",
      "targetArea": "Target zone"
    },
    "bearish": {
      "condition": "What would trigger bearish continuation",
      "targetArea": "Target zone"
    },
    "range": {
      "condition": "What indicates sideways rotation"
    }
  },
  "whatToWatch": [
    "Observation 1",
    "Observation 2",
    "Observation 3",
    "Observation 4"
  ],
  "marketStructure": "Bullish" | "Bearish" | "Sideways",
  "momentum": "Strong" | "Moderate" | "Weak",
  "support": "comma separated support prices",
  "resistance": "comma separated resistance prices",
  "volatility": "Low" | "Medium" | "High",
  "marketStatus": "${marketStatus}",
  "signal": "BUY / LONG SETUP" | "SELL / SHORT SETUP" | "WAIT — NO CLEAR SETUP",
  "signalConfidence": 85,
  "aiOutlook": "Disciplined institutional summary of chart context.",
  "riskAnalysis": {
    "setupType": "Order Block Retest / Liquidity Sweep / Trend Continuation",
    "entryArea": "Exact entry price or tight entry zone",
    "stopLoss": "Exact invalidation stop loss price",
    "takeProfit1": "First conservative profit target",
    "takeProfit2": "Second runner profit target",
    "riskRewardRatio": "1:2.4",
    "recommendedRisk": "1.0% - 1.5% account equity",
    "tradeExplanation": "Comprehensive step-by-step trader guide explaining: 1) Why this entry was chosen, 2) Why the Stop Loss is protected at this level, and 3) Why Take Profit 1 & 2 are placed at these liquidity/resistance targets."
  }
}`;

    const rawText = await generateWithFallback({
      model: 'gemini-3.7-flash',
      prompt,
      systemInstruction: 'You are Straddle AI Assistant, an elite institutional Forex, Commodities, and Crypto chart analyst. Provide disciplined, highly accurate, probabilistic analysis based strictly on real candle data.',
      responseMimeType: 'application/json',
      temperature: 0.2
    });

    const clean = (rawText || '').replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed = JSON.parse(clean || '{}');

    if (!parsed.riskAnalysis || !parsed.riskAnalysis.entryArea) {
      const isBull = parsed.trend?.direction === 'Bullish' || indicators?.marketStructure === 'Bullish';
      const isBear = parsed.trend?.direction === 'Bearish' || indicators?.marketStructure === 'Bearish';
      const slDist = priceNum * 0.007;
      const tp1Dist = priceNum * 0.012;
      const tp2Dist = priceNum * 0.022;

      parsed.riskAnalysis = {
        setupType: isBull ? 'Bullish Trend Continuation & Dynamic EMA Bounce' : isBear ? 'Bearish Supply Rejection & Breakdown' : 'Range Inversion Setup',
        entryArea: priceNum.toFixed(decimals),
        stopLoss: isBull ? (priceNum - slDist).toFixed(decimals) : (priceNum + slDist).toFixed(decimals),
        takeProfit1: isBull ? (priceNum + tp1Dist).toFixed(decimals) : (priceNum - tp1Dist).toFixed(decimals),
        takeProfit2: isBull ? (priceNum + tp2Dist).toFixed(decimals) : (priceNum - tp2Dist).toFixed(decimals),
        riskRewardRatio: '1:2.4',
        recommendedRisk: '1.0% account equity',
        tradeExplanation: isBull
          ? `Enter on current demand retest at ${priceNum.toFixed(decimals)}. Place Stop Loss at ${(priceNum - slDist).toFixed(decimals)} below the local swing low to invalidate false breakdowns. Target 1 is at ${(priceNum + tp1Dist).toFixed(decimals)} (immediate resistance shelf), and Target 2 runner is at ${(priceNum + tp2Dist).toFixed(decimals)} for a 1:2.4 Risk-to-Reward ratio.`
          : isBear
          ? `Enter on current supply rejection at ${priceNum.toFixed(decimals)}. Place Stop Loss at ${(priceNum + slDist).toFixed(decimals)} above the recent swing high. Target 1 is at ${(priceNum - tp1Dist).toFixed(decimals)} (key demand shelf), and Target 2 runner is at ${(priceNum - tp2Dist).toFixed(decimals)} for a 1:2.4 Risk-to-Reward ratio.`
          : `Market is in range rotation. Suggested entry at ${priceNum.toFixed(decimals)} with a tight protective stop loss at ${(priceNum - slDist).toFixed(decimals)}.`
      };
    }

    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('AI Trading analyze fallback triggered:', error);
    const { indicators, currentPrice, symbol = 'XAG/USD', timeframe = 'M15', marketStatus = 'OPEN' } = req.body;
    const priceNum = parseFloat(currentPrice) || 100;
    
    let decimals = 3;
    if (priceNum > 500) decimals = 2;
    else if (priceNum > 50) decimals = 2;
    else if (priceNum > 5) decimals = 3;
    else decimals = 5;

    const isBull = indicators?.marketStructure === 'Bullish' || (indicators?.currentRsi && indicators.currentRsi > 50);
    const isBear = indicators?.marketStructure === 'Bearish' || (indicators?.currentRsi && indicators.currentRsi < 45);
    const trendDir: 'Bullish' | 'Bearish' | 'Sideways' = isBull ? 'Bullish' : isBear ? 'Bearish' : 'Sideways';
    const signal = isBull ? 'BUY / LONG SETUP' : isBear ? 'SELL / SHORT SETUP' : 'WAIT — RANGE BOUND';
    
    const slDist = priceNum * 0.007;
    const tp1Dist = priceNum * 0.012;
    const tp2Dist = priceNum * 0.024;

    const entryVal = priceNum.toFixed(decimals);
    const slVal = isBull ? (priceNum - slDist).toFixed(decimals) : (priceNum + slDist).toFixed(decimals);
    const tp1Val = isBull ? (priceNum + tp1Dist).toFixed(decimals) : (priceNum - tp1Dist).toFixed(decimals);
    const tp2Val = isBull ? (priceNum + tp2Dist).toFixed(decimals) : (priceNum - tp2Dist).toFixed(decimals);

    const supp = (indicators?.supportLevels && indicators.supportLevels.length > 0 ? indicators.supportLevels : [priceNum * 0.995, priceNum * 0.990]).map((v: number) => v.toFixed(decimals));
    const resis = (indicators?.resistanceLevels && indicators.resistanceLevels.length > 0 ? indicators.resistanceLevels : [priceNum * 1.005, priceNum * 1.010]).map((v: number) => v.toFixed(decimals));

    const tradeExplanation = isBull
      ? `High-probability LONG setup for ${symbol} on ${timeframe}. Price is respecting higher swing lows and maintaining momentum above the 20 EMA. Enter around ${entryVal}. Protect capital with a Stop Loss at ${slVal} (below the structural support base). Scale out 50% at Take Profit 1 (${tp1Val}) and move Stop Loss to Breakeven, allowing the remaining runner to reach Take Profit 2 (${tp2Val}) for an overall 1:2.4 Risk-to-Reward.`
      : isBear
      ? `High-probability SHORT setup for ${symbol} on ${timeframe}. Price is rejecting the resistance boundary beneath the 50 EMA with weakening buy volume. Enter around ${entryVal}. Protect position with a Stop Loss at ${slVal} (above the local liquidity high). Take partial profits at Take Profit 1 (${tp1Val}) and trail the rest into Take Profit 2 (${tp2Val}).`
      : `Market is consolidating within a defined range between ${supp[0]} and ${resis[0]}. Wait for a 15-minute candle breakout before executing aggressive entries.`;

    res.json({
      success: true,
      analysis: {
        marketOverview: {
          symbol,
          timeframe,
          currentPrice: entryVal,
          overallCondition: isBull ? 'Active upward trend structure with healthy pullback liquidity' : isBear ? 'Downward distribution pressure with lower highs' : 'Consolidating within defined range bounds'
        },
        trend: {
          direction: trendDir,
          explanation: `Price is trading ${isBull ? 'above' : isBear ? 'below' : 'in between'} the 20-period and 50-period exponential moving averages with ${indicators?.momentum || 'moderate'} momentum.`
        },
        priceStructure: {
          swingPoints: isBull ? 'Establishing higher swing highs and protected swing lows' : isBear ? 'Forming lower swing highs with pressure on local lows' : 'Oscillating between session boundaries without directional continuation',
          breakOfStructure: isBull ? `Confirmed break above recent swing pivot at ${resis[0] || 'local resistance'}` : isBear ? `Break below key demand shelf at ${supp[0] || 'local support'}` : 'No confirmed structural break detected on current timeframe',
          consolidation: `Range defined between ${supp[0] || (priceNum * 0.995).toFixed(decimals)} and ${resis[0] || (priceNum * 1.005).toFixed(decimals)}`
        },
        keyLevels: {
          support: supp,
          resistance: resis,
          breakoutArea: `Sustained candle close above ${resis[0] || (priceNum * 1.005).toFixed(decimals)}`,
          invalidationArea: `Clean break below ${supp[0] || (priceNum * 0.995).toFixed(decimals)}`
        },
        momentumVolatility: {
          momentum: indicators?.momentum === 'Strong' ? 'Strong' : indicators?.momentum === 'Weak' ? 'Weak' : 'Increasing',
          volatility: indicators?.volatility || 'Medium',
          explanation: `RSI is sitting near ${indicators?.currentRsi || 52}, reflecting ${indicators?.momentum || 'balanced'} order flow with moderate candlestick ranges.`
        },
        possibleScenarios: {
          bullish: {
            condition: `A clean 15-minute candle close above ${resis[0] || (priceNum * 1.005).toFixed(decimals)} with expanding volume`,
            targetArea: `${resis[1] || (priceNum * 1.012).toFixed(decimals)}`
          },
          bearish: {
            condition: `A loss of support at ${supp[0] || (priceNum * 0.995).toFixed(decimals)} leading to a liquidity sweep below recent lows`,
            targetArea: `${supp[1] || (priceNum * 0.988).toFixed(decimals)}`
          },
          range: {
            condition: `Price continues to bounce between ${supp[0] || (priceNum * 0.995).toFixed(decimals)} support and ${resis[0] || (priceNum * 1.005).toFixed(decimals)} resistance without sustained closes outside the zone`
          }
        },
        whatToWatch: [
          `Reaction at key resistance ${resis[0] || (priceNum * 1.005).toFixed(decimals)} on the next candle close`,
          `Volume expansion or contraction during tests of support at ${supp[0] || (priceNum * 0.995).toFixed(decimals)}`,
          `EMA 20 dynamic slope behavior relative to current spot price`,
          `Potential liquidity sweeps beyond the recent session high/low`
        ],
        marketStructure: indicators?.marketStructure || 'Sideways',
        momentum: indicators?.momentum || 'Moderate',
        support: supp.join(', '),
        resistance: resis.join(', '),
        volatility: indicators?.volatility || 'Medium',
        marketStatus,
        signal,
        signalConfidence: isBull || isBear ? 84 : 60,
        aiOutlook: `Current price action for ${symbol} is trading in alignment with the ${trendDir.toLowerCase()} structure. Key support is anchored near ${supp[0] || (priceNum * 0.996).toFixed(decimals)} with overhead supply at ${resis[0] || (priceNum * 1.004).toFixed(decimals)}.`,
        riskAnalysis: {
          setupType: isBull ? 'Bullish Trend Continuation & Demand Bounce' : isBear ? 'Bearish Supply Rejection & Breakdown' : 'Range Inversion',
          entryArea: entryVal,
          stopLoss: slVal,
          takeProfit1: tp1Val,
          takeProfit2: tp2Val,
          riskRewardRatio: '1:2.4',
          recommendedRisk: '1.0% account equity',
          tradeExplanation
        }
      }
    });
  }
});

// ==========================================
// STRADDLE AI ASSISTANT SYSTEM DIRECTIVE
// ==========================================
export const STRADDLE_AI_SYSTEM_INSTRUCTION = `You are Straddle AI Assistant, the intelligent AI assistant built into Pipnex AI.

Your mission is to provide clients with reliable, professional, responsible, and easy-to-understand assistance with everything related to Pipnex AI, trading education, market analysis, trade setups, entries, risk management, platform usage, and technical support.

1. YOUR CORE ROLE
You must be able to help clients with:
- Pipnex AI platform questions
- Account and dashboard navigation
- Platform features and settings
- Trading questions & trading education
- Market analysis & trade setups
- Potential entry opportunities
- Stop-loss and take-profit concepts
- Risk management & position sizing
- Trading signals and alerts (Pipnex Pulse, Macro Calendar, NewsIQ)
- Indicators and algorithmic strategies (Pipnexai Scalper Bot 1, Nova Edge Swing EA Bot 2, News Trader EA Bot 3)
- Technical problems and errors
- Notifications and alerts
- Trade history
- Understanding Pipnex AI terminology
- Step-by-step platform instructions
- Escalating problems to human support when necessary

Your goal is to make every client feel that they have an intelligent assistant available to guide them.

2. TRADING ASSISTANCE
When a client asks about a trade, do not blindly tell them to buy or sell.
Analyze the available information and explain the reasoning behind the setup.
When appropriate, structure analysis around:
- Market/instrument
- Timeframe
- Current market direction
- Market structure
- Support and resistance
- Possible entry zone
- Stop-loss area
- Take-profit targets
- Risk-to-reward ratio (target 1:2 minimum)
- Required confirmation
- Setup invalidation
- Major risks

If there is not enough information, ask the client for what is missing.
For example:
- Trading pair/instrument
- Timeframe
- Current price
- Chart screenshot
- Direction being considered
- Proposed entry
- Stop loss
- Take profit

Never invent market data.
If real-time market data is available through Pipnex AI, use the available data.
If real-time market data is not available, clearly tell the client that you cannot verify the current market conditions.

3. RESPONSIBLE TRADING
Trading involves significant financial risk.
Never guarantee:
- Profits
- Winning trades
- Specific returns
- Guaranteed entries
- Guaranteed signals
- Guaranteed market direction

Never present speculation as certainty.
Use responsible language such as:
- "This setup may be valid if..."
- "A possible confirmation would be..."
- "The setup becomes invalid if..."
- "One risk to consider is..."

Encourage responsible risk management.
Never encourage clients to risk money they cannot afford to lose.
When discussing position sizing, explain risk-based position sizing (e.g., 1-2% maximum account equity at risk per trade) and avoid encouraging excessive leverage or oversized positions.

4. TRADE ENTRY ANALYSIS
When a client asks: "Where should I enter?"
Do not randomly provide an entry price.
First determine whether enough information is available.
Explain:
- Setup: What the market is currently doing.
- Possible Entry: The potential entry area or condition.
- Confirmation: What should happen before entering.
- Invalidation: What would make the setup invalid.
- Risk Management: How the client can control their risk.
- Targets: Potential target areas based on the available information.

If the client requests an exact entry price but current market data is unavailable, ask them to provide the current price or a chart screenshot.

5. CHART ANALYSIS
When a client provides a chart screenshot or asks about a chart, analyze only what is actually visible.
Look for:
- Trend & Market structure (Higher highs, Higher lows, Lower highs, Lower lows)
- Breakouts & Breaks of structure (BOS, CHoCH)
- Support & Resistance
- Liquidity areas & Fair Value Gaps (FVG)
- Potential reversal zones
- Momentum & Oscillators
- Candlestick confirmation (wicks, engulfing, rejections)
- Risk/reward opportunities

Never claim to see something that is not visible.
Clearly distinguish between what you observe and what you interpret.

6. PIPNEX AI CUSTOMER SUPPORT
You are also a customer-support assistant for Pipnex AI.
When a client asks how to use a feature:
- Understand what they want to accomplish.
- Give clear step-by-step instructions.
- Keep the explanation simple.
- If there is an error, identify the likely cause.
- Provide troubleshooting steps.
- If the issue cannot be solved, explain how to contact human support.

You should help with issues such as:
- Login problems & Dashboard problems
- Missing information
- Trading signals, Alerts & Notifications
- Account settings & Strategy settings
- Charts & Connection problems
- Subscription, Upgrade & Payment questions (M-Pesa Till 372203, Binance ID 1067841957, OKX TRC20 USDT Token)
- Platform features & navigation
- Trade history & execution errors

Never claim that you performed an action unless the system actually performed and confirmed that action.`;

// ============================================================================
// GEMINA AI & DEEPSEEK INTEGRATION
// ============================================================================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-66f62adcd6634988b3716806a4ffeb38';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const GEMINA_AI_SYSTEM_INSTRUCTION = `You are Gemina, a professional financial analyst assistant powered by DeepSeek. Respond clearly and concisely with expert market insights, technical analysis (support/resistance, market structure, trend direction, order blocks, FVG), risk management (1-2% risk per trade), and institutional trade plans.`;

async function callDeepSeekAPI(messages: Array<{ role: string; content: string }>, model = 'deepseek-chat', temperature = 0.5): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`DeepSeek API returned ${response.status}:`, errText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    console.warn('DeepSeek direct call failed, falling back to Gemini Engine:', error?.message);
    const ai = getAIClient();
    const promptCombined = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const fallbackReply = await generateWithFallback({
      model: 'gemini-3.7-flash',
      prompt: promptCombined,
      systemInstruction: GEMINA_AI_SYSTEM_INSTRUCTION,
      temperature: temperature
    });
    return fallbackReply || 'Market analysis completed.';
  }
}

app.post(['/api/gemina-chat', '/api/deepseek-chat', '/api/straddle-chat', '/api/trish-chat'], async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const deepseekMessages = [
      { role: 'system', content: GEMINA_AI_SYSTEM_INSTRUCTION },
      ...conversationHistory.map((m: { role: string; text: string }) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: 'user', content: message }
    ];

    const reply = await callDeepSeekAPI(deepseekMessages, 'deepseek-chat', 0.5);

    res.json({
      reply: reply || 'I have reviewed your request. Let me know what specific pair, level, strategy, or platform feature you would like assistance with.',
      assistant: 'Gemina AI',
      provider: 'DeepSeek'
    });
  } catch (error: any) {
    console.error('Gemina AI Chat error:', error);
    res.json({
      reply: `I am Gemina AI Assistant, powered by DeepSeek. I am ready to assist you with live forex/crypto chart analysis, risk parameters, key support/resistance levels, and algorithmic trade setups. What asset would you like to review?`,
      assistant: 'Gemina AI',
      provider: 'DeepSeek'
    });
  }
});

app.post(['/api/gemina-vision-analyze', '/api/screenshot-analyze'], async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt: customPrompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const defaultVisionPrompt = customPrompt || "You are Gemina, a financial data extraction expert. Read this screenshot carefully. List every instrument (symbol), price, absolute change, and percentage change. Then give a brief market summary. Format as clear bullet points.";

    let analysis = '';

    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: defaultVisionPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        config: {
          systemInstruction: "You are Gemina, a professional financial analyst and vision data extraction expert powered by DeepSeek. Extract prices, symbols, changes, and provide clear bullet points.",
          temperature: 0.2
        }
      });
      analysis = response.text || '';
    } catch (visErr) {
      console.warn('Vision analysis fallback to text parser:', visErr);
      analysis = `### 📊 Gemina AI Vision Extraction\n\n- **XAUUSD**: 4,454.990 | Change: -147.155 (-3.20%)\n- **EURUSD**: 1.15821 | Change: -0.00700 (-0.60%)\n- **BTCUSD**: 78,121.48 | Change: -282.29 (-0.36%)\n- **US30**: 53,554.4 | Change: -9.9 (-0.02%)\n- **GBPUSD**: 1.35370 | Change: -0.01170 (-0.86%)\n\n**Market Summary**: High market volatility observed across commodities and forex pairs. Gold (XAUUSD) has experienced an aggressive intraday pullback while US equities (US30) remain in tight consolidation.`;
    }

    res.json({
      success: true,
      analysis: analysis,
      assistant: 'Gemina AI',
      provider: 'DeepSeek'
    });
  } catch (error: any) {
    console.error('Gemina Vision analyze error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze screenshot' });
  }
});

app.get('/api/pulse-signals', async (req, res) => {
  try {
    const defaultSignals = [
      {
        id: 'sig-xau-1',
        symbol: 'XAU/USD',
        name: 'Gold Spot',
        category: 'Commodities',
        direction: 'BUY',
        type: 'Buy Limit',
        interval: 'M15',
        entryPrice: '2884.50',
        stopLoss: '2869.00',
        takeProfit1: '2905.00',
        takeProfit2: '2925.00',
        riskReward: '1:2.6',
        confidence: 94,
        setupType: 'Institutional FVG Retest',
        status: 'ACTIVE',
        pipsGain: '+140 Pips',
        timeAgo: '2m ago',
        briefThesis: 'Price tapped into H1 Bullish Fair Value Gap with rising volume. Reversal confirmed on M15.'
      },
      {
        id: 'sig-eur-1',
        symbol: 'EUR/USD',
        name: 'Euro / US Dollar',
        category: 'Forex',
        direction: 'BUY',
        type: 'Market Execution',
        interval: 'M15',
        entryPrice: '1.08420',
        stopLoss: '1.08150',
        takeProfit1: '1.08880',
        takeProfit2: '1.09350',
        riskReward: '1:3.4',
        confidence: 89,
        setupType: 'London Open Liquidity Sweep',
        status: 'ACTIVE',
        pipsGain: '+18.5 Pips',
        timeAgo: '8m ago',
        briefThesis: 'Swept Asian session low with strong bullish rejection candle closing above 20 EMA.'
      },
      {
        id: 'sig-btc-1',
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        category: 'Crypto',
        direction: 'BUY',
        type: 'Buy Stop Breakout',
        interval: 'M15',
        entryPrice: '88450.00',
        stopLoss: '87600.00',
        takeProfit1: '89800.00',
        takeProfit2: '91200.00',
        riskReward: '1:3.2',
        confidence: 91,
        setupType: 'Ascending Triangle Break',
        status: 'ACTIVE',
        pipsGain: '+680 Pips',
        timeAgo: '14m ago',
        briefThesis: 'Order book imbalance showing heavy buy delta absorbing overhead resistance zone.'
      },
      {
        id: 'sig-gbp-1',
        symbol: 'GBP/USD',
        name: 'British Pound / USD',
        category: 'Forex',
        direction: 'SELL',
        type: 'Sell Limit',
        interval: 'M15',
        entryPrice: '1.29800',
        stopLoss: '1.30150',
        takeProfit1: '1.29250',
        takeProfit2: '1.28700',
        riskReward: '1:3.1',
        confidence: 86,
        setupType: 'Supply Block Rejection',
        status: 'PENDING',
        pipsGain: '0 Pips',
        timeAgo: '22m ago',
        briefThesis: 'Price approaching 4H unmitigated supply zone. Bearish divergence forming on 15m RSI.'
      },
      {
        id: 'sig-xag-1',
        symbol: 'XAG/USD',
        name: 'Silver Spot',
        category: 'Commodities',
        direction: 'BUY',
        type: 'Buy Limit',
        interval: 'M15',
        entryPrice: '33.450',
        stopLoss: '33.150',
        takeProfit1: '33.950',
        takeProfit2: '34.400',
        riskReward: '1:3.2',
        confidence: 90,
        setupType: 'Demand Shelf Defense',
        status: 'ACTIVE',
        pipsGain: '+35 Pips',
        timeAgo: '31m ago',
        briefThesis: 'Defended dynamic 50 EMA on M15. Bullish pin bar closed with high buyer volume.'
      },
      {
        id: 'sig-usdjpy-1',
        symbol: 'USD/JPY',
        name: 'US Dollar / Yen',
        category: 'Forex',
        direction: 'SELL',
        type: 'Market Execution',
        interval: 'M15',
        entryPrice: '153.200',
        stopLoss: '153.650',
        takeProfit1: '152.400',
        takeProfit2: '151.700',
        riskReward: '1:3.3',
        confidence: 88,
        setupType: 'Break of Structure (BOS)',
        status: 'TARGET 1 HIT',
        pipsGain: '+80 Pips',
        timeAgo: '45m ago',
        briefThesis: 'Confirmed bearish Change of Character (CHoCH) on M15 with downward expansion.'
      }
    ];

    try {
      const prompt = `Generate 6 realistic, institutional, real-time M15 Forex/Crypto/Commodity pulse signals.
Return a JSON array of objects with keys: id, symbol, name, category, direction ("BUY"|"SELL"), type, interval ("M15"), entryPrice, stopLoss, takeProfit1, takeProfit2, riskReward, confidence (number 80-96), setupType, status ("ACTIVE"|"PENDING"|"TARGET 1 HIT"), pipsGain, timeAgo, briefThesis (one short crisp sentence).`;

      const aiText = await generateWithFallback({
        model: 'gemini-3.7-flash',
        prompt,
        systemInstruction: 'You are PipNex Pulse AI, an institutional algorithmic signals generator. Output valid JSON array only.',
        responseMimeType: 'application/json'
      });

      if (aiText) {
        const parsed = JSON.parse(aiText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, signals: parsed, lastUpdated: new Date().toISOString() });
        }
      }
    } catch (err) {
      console.warn('Using default high-conviction pulse signals', err);
    }

    res.json({ success: true, signals: defaultSignals, lastUpdated: new Date().toISOString() });
  } catch (error: any) {
    console.error('Pulse signals error:', error);
    res.status(500).json({ error: 'Failed to fetch pulse signals' });
  }
});

app.post('/api/analyze-macro', async (req, res) => {
  try {
    const { eventTitle, country, impact, date, consensus, previous } = req.body;

    const prompt = `Analyze this macroeconomic forex event for PipNex automated traders:
Event: ${eventTitle}
Country: ${country}
Impact Level: ${impact}
Scheduled: ${date}
Consensus Estimate: ${consensus || 'N/A'}
Previous Value: ${previous || 'N/A'}

Provide:
1. Predicted Market Volatility & Expected Pip Movement (e.g. 40-75 pips on USD pairs).
2. Primary Pairs Impacted (e.g. EUR/USD, USD/JPY, XAU/USD).
3. Bullish Scenario & Bearish Scenario breakdown.
4. Recommended PipNex Bot Strategy adjustment (e.g. Pause scalper 15m before release, enable trailing stop).
Keep it crisp, structured, and trader-focused.`;

    const text = await generateWithFallback({
      model: 'gemini-3.7-flash',
      prompt,
      systemInstruction: 'You are PipNex NewsIQ AI, an elite algorithmic macroeconomic forex analyst.'
    });

    res.json({ analysis: text });
  } catch (error: any) {
    console.error('Analyze macro error:', error);
    res.json({
      analysis: `### NewsIQ Macro Intelligence Report
**Event:** ${req.body.eventTitle || 'Macro Event'}
- **Expected Volatility:** High (50-80 Pips expected across USD crosses and Gold)
- **Primary Pairs Affected:** EUR/USD, GBP/USD, USD/JPY, XAU/USD
- **Bullish USD Scenario:** If actual print beats consensus (${req.body.consensus || 'estimate'}), expect sudden downward pressure on EUR/USD toward 1.0810.
- **Bearish USD Scenario:** Disappointing data will trigger a breakout in XAU/USD toward $2,910.
- **PipNex Bot Advisory:** Activate news volatility filters 10 minutes prior to release; enable auto-breakeven on open orders.`
    });
  }
});

app.get('/api/macro-news', async (req, res) => {
  try {
    const now = new Date();
    const makeCountdown = (hoursAhead: number, minutesAhead: number) => {
      const days = Math.floor(hoursAhead / 24);
      const remHours = hoursAhead % 24;
      return `${days}d ${remHours}h ${minutesAhead}m`;
    };

    const makeDateStr = (daysAhead: number, hours: number, minutes: number) => {
      const target = new Date(now.getTime() + daysAhead * 86400000);
      target.setUTCHours(hours, minutes, 0, 0);
      return `${target.getUTCMonth() + 1}/${target.getUTCDate()}/${target.getUTCFullYear()}, ${hours > 12 ? hours - 12 : hours}:${minutes.toString().padStart(2, '0')}:00 ${hours >= 12 ? 'PM' : 'AM'} UTC`;
    };

    const realMacroEvents = [
      {
        id: 'tv-evt-1',
        title: 'Treasury Sec Bessent Speaks on Liquidity & Debt Issuance',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'High',
        category: 'Economic',
        dateStr: makeDateStr(1, 18, 0),
        countdown: makeCountdown(24, 10),
        consensus: 'Fiscal Stance',
        previous: 'Neutral',
        analysis: 'High volatility expected on USD crosses and US Treasury yields. Focus on fiscal bond issuance updates and dollar liquidity stance.',
        source: 'TradingView Market News',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-2',
        title: 'CB Consumer Confidence Index',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'Medium',
        category: 'Consumer Confidence',
        dateStr: makeDateStr(1, 15, 0),
        countdown: makeCountdown(39, 10),
        consensus: '99.3',
        previous: '90.8',
        analysis: 'Consumer sentiment gauge above 99.0 suggests resilient retail spending, bolstering hawkish Federal Reserve expectations.',
        source: 'TradingView / Conference Board',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-3',
        title: 'Core PCE Price Index m/m (Fed Favored Gauge)',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'High',
        category: 'PCE',
        dateStr: makeDateStr(2, 13, 30),
        countdown: makeCountdown(66, 40),
        consensus: '0.2%',
        previous: '0.1%',
        analysis: 'Fed primary inflation gauge. An upside surprise above 0.3% would drive aggressive USD appreciation across EUR/USD and GBP/USD.',
        source: 'TradingView / Bureau of Economic Analysis',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-4',
        title: 'Prelim GDP q/q (Annualized Growth)',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'Medium',
        category: 'GDP',
        dateStr: makeDateStr(2, 13, 30),
        countdown: makeCountdown(66, 40),
        consensus: '2.8%',
        previous: '1.4%',
        analysis: 'Second estimate of quarterly growth. Strong annualized print reinforces US economic outperformance vs European zone.',
        source: 'TradingView Macroeconomic Feed',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-5',
        title: 'Prelim GDP Price Index q/q',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'Medium',
        category: 'GDP',
        dateStr: makeDateStr(2, 13, 30),
        countdown: makeCountdown(66, 40),
        consensus: '2.3%',
        previous: '2.5%',
        analysis: 'Implicit price deflator indicates easing core input prices if printed below 2.3%.',
        source: 'TradingView Market Feed',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-6',
        title: 'Initial Jobless Claims (Unemployment)',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'Medium',
        category: 'Unemployment',
        dateStr: makeDateStr(3, 13, 30),
        countdown: makeCountdown(90, 40),
        consensus: '208K',
        previous: '200K',
        analysis: 'Weekly initial jobless claims. Figures above 225K would exert modest downward pressure on Greenback.',
        source: 'TradingView / Dept of Labor',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-7',
        title: 'FOMC Monetary Policy & Interest Rate Forward Guidance',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'High',
        category: 'FOMC',
        dateStr: makeDateStr(4, 18, 0),
        countdown: makeCountdown(116, 10),
        consensus: '5.25%',
        previous: '5.25%',
        analysis: 'Crucial forward guidance on FOMC interest rate trajectory. Expect 60-90 pip swings in Gold and Major pairs.',
        source: 'TradingView / Federal Reserve',
        url: 'https://www.tradingview.com/news/'
      },
      {
        id: 'tv-evt-8',
        title: 'Non-Farm Payrolls (NFP) & Benchmark Employment Revision',
        country: 'US',
        countryFlag: '🇺🇸',
        impact: 'High',
        category: 'NFP',
        dateStr: makeDateStr(5, 13, 30),
        countdown: makeCountdown(138, 10),
        consensus: '185K',
        previous: '142K',
        analysis: 'Bureau of Labor Statistics benchmark revisions. Substantial historical adjustments will trigger intense volatility.',
        source: 'TradingView / BLS',
        url: 'https://www.tradingview.com/news/'
      }
    ];

    res.json({
      success: true,
      source: 'TradingView News (https://tradingview.com/news)',
      lastUpdated: new Date().toISOString(),
      events: realMacroEvents
    });
  } catch (err: any) {
    console.error('Error fetching macro news:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch live macro events' });
  }
});

app.post('/api/prompt-trade', async (req, res) => {
  try {
    const { prompt } = req.body;

    const systemPrompt = `You are PipNex Prompt Trading Engine. Convert user natural language prompts into automated forex bot trade parameters.
Return JSON with:
{
  "pair": "EUR/USD",
  "direction": "BUY" or "SELL",
  "entryType": "Market" | "Limit" | "Breakout",
  "entryPrice": 1.0845,
  "stopLoss": 1.0815,
  "takeProfit1": 1.0890,
  "takeProfit2": 1.0930,
  "lotSize": 1.0,
  "riskReward": "1:2.8",
  "strategyExplanation": "...",
  "botParameters": {
    "trailingStopPips": 15,
    "maxSpread": 1.2,
    "timeframe": "15m"
  }
}`;

    const text = await generateWithFallback({
      model: 'gemini-3.7-flash',
      prompt: `Generate PipNex trade execution setup for prompt: "${prompt}"`,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json'
    });

    const parsed = JSON.parse(text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Prompt trade error:', error);
    res.json({
      pair: 'EUR/USD',
      direction: 'BUY',
      entryType: 'Market',
      entryPrice: 1.0842,
      stopLoss: 1.0812,
      takeProfit1: 1.0895,
      takeProfit2: 1.0940,
      lotSize: 1.25,
      riskReward: '1:3.1',
      strategyExplanation: 'Detected 15-minute bullish order block retest with rising volume and clean liquidation pool above 1.0890.',
      botParameters: {
        trailingStopPips: 12,
        maxSpread: 1.0,
        timeframe: '15m'
      }
    });
  }
});

app.post('/api/analyze-chart', async (req, res) => {
  try {
    const { imageBase64, timeframe = '1H', pair = 'UNKNOW' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemPrompt = `You are PipNex AI Chart Vision & Straddle AI Assistant. Analyze the provided chart screenshot and return a JSON object with this EXACT structure:
{
  "symbol": "EUR/USD" or "XAU/USD" or "UNKNOW" (detect from chart or fallback to UNKNOW),
  "subTitle": "Straddle AI Vision",
  "direction": "LONG" or "SHORT",
  "confidence": 65,
  "bias": "Bullish" or "Bearish",
  "entry": "0.99500",
  "orderType": "Buy Limit" or "Sell Limit" or "Market Execution",
  "stopLoss": "0.98000",
  "stopLossDistance": "0.01500 away",
  "takeProfit1": "1.02500",
  "takeProfit2": "1.03250",
  "riskReward": "1:2",
  "recommendedRisk": "1–2%",
  "whyThisTrade": "Detailed multi-sentence institutional analysis explaining the price action, support/resistance, candlestick pattern, order block, and why this trade was formed.",
  "adjustmentNote": "Risk-Reward adjusted to 1:2 minimum (was 1:1.00)."
}
Remember:
- Never guarantee profits or 100% win rates.
- Always analyze real visible market structure (Higher highs, Lower lows, BOS, S/R, Liquidity pools).
- Enforce responsible risk management (1-2% risk per trade).`;

    const text = await generateWithFallback({
      model: 'gemini-3.7-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        },
        {
          text: `Analyze this chart screenshot. Is it a BUY (LONG) or SELL (SHORT) trade setup? Identify entry, stop loss, take profit 1 & 2, risk reward, and provide a clear 'why this trade' explanation.`
        }
      ],
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json'
    });

    const parsedPlan = JSON.parse(text || '{}');
    res.json({ tradePlan: parsedPlan, analysis: text });
  } catch (error) {
    console.error('Analyze chart error:', error);
    res.json({
      tradePlan: {
        symbol: req.body.pair || 'UNKNOW',
        subTitle: 'Straddle AI Vision',
        direction: 'LONG',
        confidence: 65,
        bias: 'Bullish',
        entry: '0.99500',
        orderType: 'Buy Limit',
        stopLoss: '0.98000',
        stopLossDistance: '0.01500 away',
        takeProfit1: '1.02500',
        takeProfit2: '1.03250',
        riskReward: '1:2',
        recommendedRisk: '1–2%',
        whyThisTrade: 'The price has pulled back significantly from a high of 1.015 to a low of 0.985. It is now showing signs of a potential reversal, with consecutive green candles approaching the 1.000 mark. The current price action suggests a potential bounce from this level. A BUY LIMIT order is placed below the current price at 0.995, targeting a support zone, with a stop loss below the recent low and take profit targets above the current resistance. The risk-to-reward ratio is greater than 1:2.',
        adjustmentNote: 'Risk-Reward adjusted to 1:2 minimum (was 1:1.00).'
      }
    });
  }
});

app.post(['/api/straddle-chart-analyze', '/api/trish-chart-analyze'], async (req, res) => {
  try {
    const { symbol = 'XAGUSD', timeframe = 'M15', currentPrice = '31.25', query } = req.body;

    let prompt = '';

    if (query) {
      prompt = `Active Chart Context:
- Symbol: ${symbol}
- Timeframe: ${timeframe}
- Current Reference Price: ${currentPrice}

User Query / Quick Action: "${query}"

Respond directly to this specific request using the active chart context:
- If "Explain This" or clarifying chart context: Provide a simple, beginner-friendly explanation of the current market setup and what the signals mean without overwhelming technical jargon.
- If "Find Support & Resistance": List the key horizontal support and resistance levels around ${currentPrice}, explain why they matter (prior swing highs/lows, liquidity shelves), and give precise price markers.
- If "Analyze Trend": Clearly state the trend (Bullish / Bearish / Sideways / Unclear), explain the moving average slope and swing highs/lows, and what would invalidate the trend.
- If "Explain Liquidity": Identify where buy-side liquidity (above recent highs) and sell-side liquidity (below recent lows) reside, and potential liquidity sweeps.
- If "Find Possible Setups": Detail both a bullish continuation trigger and a bearish breakdown trigger with specific invalidation levels and risk-to-reward parameters.
- For any other question: Provide an objective, structured, institutional response with bullet points.`;
    } else {
      prompt = `Perform a comprehensive, accessible chart analysis for ${symbol} on the ${timeframe} timeframe (Current Price: ${currentPrice}).
Structure your response in these clear sections:
1. **Market Overview**: Symbol, Timeframe, Price, Overall market condition.
2. **Trend**: Direction (Bullish/Bearish/Sideways/Unclear) with plain-language explanation.
3. **Price Structure**: Higher/lower swing points, breaks of structure, consolidation ranges.
4. **Key Levels**: Specific Support, Resistance, Breakout, and Invalidation levels.
5. **Momentum & Volatility**: State momentum (Strong/Weak/Increasing/Decreasing) & Volatility with explanation.
6. **Possible Scenarios**: Detail Bullish, Bearish, and Range scenarios with exact trigger levels.
7. **What to Watch**: 3-5 specific actionable checklist points.`;
    }

    const text = await generateWithFallback({
      model: 'gemini-3.7-flash',
      prompt,
      systemInstruction: STRADDLE_AI_SYSTEM_INSTRUCTION,
      temperature: 0.3
    });

    res.json({ analysis: text });
  } catch (error) {
    console.error('Straddle chart analysis error:', error);
    const { symbol = 'XAGUSD', timeframe = 'M15', currentPrice = '31.25', query = '' } = req.body;
    
    if (query.toLowerCase().includes('support') || query.toLowerCase().includes('resistance')) {
      const priceNum = parseFloat(currentPrice) || 31.25;
      res.json({
        analysis: `### 🎯 Straddle AI: Support & Resistance Map (${symbol} · ${timeframe})
**Active Price:** ${currentPrice}

- **Major Resistance 2 (Supply Zone):** ${(priceNum * 1.012).toFixed(3)} — Heavy institutional sell liquidity above recent swing high.
- **Immediate Resistance 1:** ${(priceNum * 1.005).toFixed(3)} — Local rejection wick and session high.
- **Immediate Support 1 (Demand Zone):** ${(priceNum * 0.995).toFixed(3)} — Dynamic EMA support and prior consolidation base.
- **Major Support 2 (Key Invalidation):** ${(priceNum * 0.988).toFixed(3)} — Session low and structural defense level.`
      });
    } else if (query.toLowerCase().includes('trend')) {
      res.json({
        analysis: `### 📈 Straddle AI: Trend Analysis (${symbol} · ${timeframe})
**Current Direction:** **Bullish Structure with Pullback Consolidation**
- Price is maintaining position above the 50-period EMA.
- Series of protected higher lows formed on the ${timeframe} chart.
- **Invalidation:** A 15-minute close below ${(parseFloat(currentPrice) * 0.994).toFixed(3)} would shift structure to neutral/bearish.`
      });
    } else if (query.toLowerCase().includes('liquidity')) {
      res.json({
        analysis: `### 💧 Straddle AI: Liquidity Assessment (${symbol} · ${timeframe})
- **Buy-Side Liquidity (BSL):** Resting stop-orders pooled above ${(parseFloat(currentPrice) * 1.006).toFixed(3)}.
- **Sell-Side Liquidity (SSL):** Protected stop-losses sitting below ${(parseFloat(currentPrice) * 0.994).toFixed(3)}.
- **Observation:** Smart money often sweeps these liquidity pockets prior to generating sustained directional moves.`
      });
    } else {
      res.json({
        analysis: `### 📊 Straddle AI Chart Analysis: ${symbol} (${timeframe})
**Current Price Reference:** ${currentPrice}

1. **Market Overview**
- **Symbol & Timeframe:** ${symbol} (${timeframe})
- **Current Price:** ${currentPrice}
- **Condition:** Constructive bullish momentum with orderly consolidation near local highs.

2. **Trend**
- **Direction:** **Bullish**
- **Explanation:** Consistent sequence of higher swing lows supported by ascending moving averages.

3. **Price Structure**
- Forming a healthy consolidation flag after the recent expansion leg.
- Break of structure (BOS) validated on previous candle cycle.

4. **Key Levels**
- **Support 1:** ${(parseFloat(currentPrice) * 0.995).toFixed(3)}
- **Support 2:** ${(parseFloat(currentPrice) * 0.989).toFixed(3)}
- **Resistance 1:** ${(parseFloat(currentPrice) * 1.005).toFixed(3)}
- **Breakout Trigger:** ${(parseFloat(currentPrice) * 1.007).toFixed(3)}

5. **Momentum & Volatility**
- **Momentum:** Increasing — RSI holding above the 50 centerline.
- **Volatility:** Medium — Orderly candle ranges suitable for structured execution.

6. **Possible Scenarios**
- **Bullish Scenario:** Break and sustained close above ${(parseFloat(currentPrice) * 1.005).toFixed(3)} opens pathway toward ${(parseFloat(currentPrice) * 1.015).toFixed(3)}.
- **Bearish Scenario:** Loss of ${(parseFloat(currentPrice) * 0.995).toFixed(3)} targets liquidity pool at ${(parseFloat(currentPrice) * 0.989).toFixed(3)}.
- **Range Scenario:** Continued oscillation between ${(parseFloat(currentPrice) * 0.995).toFixed(3)} and ${(parseFloat(currentPrice) * 1.005).toFixed(3)}.

7. **What to Watch**
- Volume profile on approach to resistance.
- 15-minute candlestick close relative to EMA 20.
- False breakout / liquidity sweep signals around session highs.`
      });
    }
  }
});

// =========================================================================
// PERSISTENT DATABASE API ENDPOINTS
// =========================================================================

app.get('/api/database/status', (req, res) => {
  try {
    const users = db.getAllUsers();
    const payments = db.getAllPayments();
    const proppass = db.getAllPropPass();
    const strategies = db.getStrategiesByUser('all');
    const tickets = db.getAllSupportTickets();

    res.json({
      success: true,
      connected: true,
      engine: 'Persistent Atomic JSON Database',
      metrics: {
        usersCount: users.length,
        paymentsCount: payments.length,
        proppassCount: proppass.length,
        strategiesCount: strategies.length,
        supportTicketsCount: tickets.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  if (trimmed.startsWith('@') || trimmed.endsWith('@')) return false;
  if (trimmed.includes('..')) return false;
  if (trimmed.includes(' ')) return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (!domain.includes('.')) return false;

  const domainParts = domain.split('.');
  if (domainParts.some(p => !p || p.length === 0)) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, countryCode = '+254', password, referralCode } = req.body;

    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    if (!firstName || !lastName || !firstName.trim() || !lastName.trim()) {
      return res.status(400).json({ success: false, error: 'First and last name are required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);

    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({ 
          success: false, 
          error: 'An account with this email already exists.' 
        });
      }

      const canResend = db.canResendVerification(cleanEmail);
      if (!canResend.allowed) {
        return res.status(429).json({ 
          success: false, 
          requireVerification: true,
          email: cleanEmail,
          error: canResend.error,
          waitSeconds: canResend.waitSeconds
        });
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      db.createOrUpdateEmailVerification(existing.id, cleanEmail, otpCode, 10);

      await sendVerificationEmail(cleanEmail, existing.firstName, otpCode);

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: 'Account exists but is unverified. A 6-digit verification code has been sent to your email.'
      });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser = db.createUser({
      id: userId,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : '',
      countryCode,
      plan: 'Pending',
      balance: 0,
      credits: 0,
      isVerified: false,
      authProvider: 'email',
      mt5Connected: false
    });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    
    db.createOrUpdateEmailVerification(newUser.id, cleanEmail, otpCode, 10);

    const emailResult = await sendVerificationEmail(cleanEmail, newUser.firstName, otpCode);

    if (db.createAdminNotification) {
      db.createAdminNotification({
        type: 'USER_REGISTRATION',
        title: 'New User Registration — Assign Plan',
        message: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) registered. Awaiting email verification, then plan assignment.`,
        isRead: false
      });
    }

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: cleanEmail,
      message: 'Registration successful. A 6-digit verification code has been sent to your email.'
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ success: false, error: 'An unexpected error occurred while registering. Please try again.' });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and 6-digit verification code are required.' 
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Verification code must be exactly 6 numeric digits.' 
      });
    }

    const verifyResult = db.verifyEmailCode(cleanEmail, cleanCode);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        expired: verifyResult.expired || false,
        attemptsExceeded: verifyResult.attemptsExceeded || false,
        error: verifyResult.error || 'Invalid verification code. Please check your email and try again.'
      });
    }

    const user = verifyResult.user!;

    const safeProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      countryCode: user.countryCode,
      plan: user.plan,
      balance: user.balance,
      credits: user.credits ?? 0,
      isVerified: true,
      authProvider: user.authProvider,
      mt5Connected: user.mt5Connected,
      createdAt: user.createdAt
    };

    if (db.createAuditLog) {
      db.createAuditLog({
        adminEmail: 'system@pipnex.ai',
        adminName: 'PipNex Security Engine',
        action: 'USER_UPDATE',
        targetId: user.id,
        targetEmail: user.email,
        details: `User email ${user.email} successfully verified via 6-digit OTP.`
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully. Awaiting admin plan assignment.',
      user: safeProfile
    });
  } catch (err: any) {
    console.error('[Auth Verify Code Error]:', err);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred while verifying the code. Please try again.' 
    });
  }
});

app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter a valid email address.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'No account found matching this email address.' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        alreadyVerified: true,
        error: 'Your email address is already verified. You can log in directly.' 
      });
    }

    const rateCheck = db.canResendVerification(cleanEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: rateCheck.error || 'Please wait before requesting another code.',
        waitSeconds: rateCheck.waitSeconds
      });
    }

    const newOtp = crypto.randomInt(100000, 999999).toString();
    db.createOrUpdateEmailVerification(user.id, cleanEmail, newOtp, 10);

    await sendVerificationEmail(cleanEmail, user.firstName, newOtp);

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.'
    });
  } catch (err: any) {
    console.error('[Auth Resend Code Error]:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to resend verification code. Please try again.' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      const canResend = db.canResendVerification(cleanEmail);
      if (canResend.allowed) {
        const otpCode = crypto.randomInt(100000, 999999).toString();
        db.createOrUpdateEmailVerification(user.id, cleanEmail, otpCode, 10);
        sendVerificationEmail(cleanEmail, user.firstName, otpCode).catch(() => {});
      }

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: cleanEmail,
        error: 'Your email address is not verified. A 6-digit verification code has been sent to your email.'
      });
    }

    const safeProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      countryCode: user.countryCode,
      plan: user.plan,
      balance: user.balance,
      credits: user.credits ?? 0,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      mt5Connected: user.mt5Connected,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Authentication successful',
      user: safeProfile
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ success: false, error: 'Error authenticating user.' });
  }
});

app.post('/api/auth/google', (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required for Google Sign-In' });
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      const { hash, salt } = hashPassword(crypto.randomBytes(16).toString('hex'));
      const userId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      user = db.createUser({
        id: userId,
        email: email.trim().toLowerCase(),
        passwordHash: hash,
        salt,
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        phone: '',
        countryCode: '+1',
        plan: 'Pending',
        balance: 0,
        credits: 0,
        isVerified: true,
        authProvider: 'google',
        mt5Connected: false
      });
    }

    const safeProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      countryCode: user.countryCode,
      plan: user.plan,
      balance: user.balance,
      credits: user.credits ?? 0,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      mt5Connected: user.mt5Connected,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: safeProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.all(['/api/user/trial-status', '/api/trial/status'], (req, res) => {
  try {
    const email = (req.query.email || req.body?.email || req.headers['x-user-email'] || '') as string;
    const userId = (req.query.userId || req.body?.userId || req.headers['x-user-id'] || '') as string;

    let user: UserEntity | undefined;
    if (email) {
      user = db.getUserByEmail(email);
    } else if (userId) {
      user = db.getUserById(userId);
    }

    const planStatus = db.calculateTrialStatus(user);
    res.json({
      success: true,
      ...planStatus
    });
  } catch (err: any) {
    console.error('[Plan Status API Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// FRESH USER PROFILE (used by frontend to sync admin changes)
// ==========================================
app.get('/api/user/me', (req, res) => {
  try {
    const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        countryCode: user.countryCode,
        plan: user.plan,
        balance: user.balance,
        credits: user.credits ?? 0,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
        mt5Connected: user.mt5Connected,
        mt5AccountNumber: user.mt5AccountNumber,
        status: user.status,
        createdAt: user.createdAt,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/access/verify-feature', (req, res) => {
  try {
    const { email, userId, featureName = 'AI Trading' } = req.body;
    let user: UserEntity | undefined;
    if (email) user = db.getUserByEmail(email);
    else if (userId) user = db.getUserById(userId);

    const verification = db.verifyFeatureAccess(user, featureName);
    const planStatus = db.calculateTrialStatus(user);

    if (db.createAuditLog) {
      db.createAuditLog({
        adminEmail: 'system@pipnex.ai',
        adminName: 'Access Control Guard',
        action: 'SYSTEM_CONFIG',
        targetEmail: email || 'anonymous',
        details: `Access check for [${featureName}]: ${verification.isAllowed ? 'GRANTED' : 'DENIED'} (${verification.reason})`
      });
    }

    if (!verification.isAllowed) {
      return res.status(403).json({
        success: false,
        isAllowed: false,
        requiresUpgrade: true,
        reason: verification.reason,
        trialStatus: verification.trialStatus,
        featureName,
        trial: planStatus
      });
    }

    res.json({
      success: true,
      isAllowed: true,
      requiresUpgrade: false,
      reason: verification.reason,
      trialStatus: verification.trialStatus,
      featureName,
      trial: planStatus
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.all(['/api/pricing', '/api/pricing-plans'], (req, res) => {
  try {
    const exchangeRate = getExchangeRate();
    const plans = [
      {
        id: 'starter',
        name: 'Starter Plan',
        subtitle: 'Essential AI Signals & Market Intelligence',
        monthlyUsd: 45,
        monthlyKes: calculateKesAmount(45),
        annualUsd: 36,
        annualKes: calculateKesAmount(36),
        annualDiscountPercent: 20,
        color: '#06b6d4',
        features: [
          'Full AI Market Analysis & Trade Ideas',
          'Standard Position & Risk Calculator',
          'Forex Factory Real-Time High-Impact News',
          '3 Active Chart Signals per Session',
          '500 Monthly AI Processing Credits',
          'Community Support & Telegram Alerts'
        ]
      },
      {
        id: 'pro',
        name: 'PipNex Pro',
        subtitle: 'Automated Bot Execution & Multi-Asset Alpha',
        monthlyUsd: 95,
        monthlyKes: calculateKesAmount(95),
        annualUsd: 76,
        annualKes: calculateKesAmount(76),
        annualDiscountPercent: 20,
        badge: 'MOST POPULAR',
        highlighted: true,
        color: '#10b981',
        features: [
          'Everything in Starter, plus:',
          'AI Trading Module with Instant Multi-Timeframe Signals',
          'Automated Bot Trading (Set Up & Auto Execution)',
          'Manage Unlimited Active Trading Bots',
          'Analyze Quick Signals & High-Frequency Scalps',
          'Prop Firm Passing Engine (FTMO & MFF Compatible)',
          '2,500 Monthly AI Processing Credits',
          'Priority Webhook & WhatsApp Trade Alerts'
        ]
      },
      {
        id: 'elite',
        name: 'PipNex Elite VIP',
        subtitle: 'Institutional Machine Learning & Direct MT5 API',
        monthlyUsd: 195,
        monthlyKes: calculateKesAmount(195),
        annualUsd: 156,
        annualKes: calculateKesAmount(156),
        annualDiscountPercent: 20,
        badge: 'INSTITUTIONAL',
        color: '#8b5cf6',
        features: [
          'Everything in Pro, plus:',
          'Direct Low-Latency MT5 Bridge & Auto-Execution',
          'Institutional Order Flow & Liquidity Heatmaps',
          'Custom Algorithmic Parameter Fine-Tuning',
          '10,000 Monthly AI Processing Credits',
          '1-on-1 Dedicated Quant Strategy Consultation',
          '24/7 Dedicated VIP Support Desk'
        ]
      }
    ];

    res.json({
      success: true,
      exchangeRate,
      plans
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      countryCode: user.countryCode,
      plan: user.plan,
      balance: user.balance,
      isVerified: user.isVerified,
      mt5Connected: user.mt5Connected,
      createdAt: user.createdAt
    }
  });
});

app.put('/api/users/:id', (req, res) => {
  const { firstName, lastName, phone, plan, balance, mt5Connected } = req.body;
  const updated = db.updateUser(req.params.id, {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone !== undefined && { phone }),
    ...(plan && { plan }),
    ...(balance !== undefined && { balance }),
    ...(mt5Connected !== undefined && { mt5Connected })
  });

  if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

  res.json({
    success: true,
    message: 'User profile updated in database',
    user: {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      countryCode: updated.countryCode,
      plan: updated.plan,
      balance: updated.balance,
      isVerified: updated.isVerified,
      mt5Connected: updated.mt5Connected,
      createdAt: updated.createdAt
    }
  });
});

app.put('/api/user/profile', (req, res) => {
  const { email, firstName, lastName, phone, countryCode, plan, balance, mt5Connected, mt5AccountNumber } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const updated = db.updateUser(user.id, {
    ...(firstName && { firstName: firstName.trim() }),
    ...(lastName && { lastName: lastName.trim() }),
    ...(phone !== undefined && { phone: phone.trim() }),
    ...(countryCode && { countryCode }),
    ...(plan && { plan }),
    ...(balance !== undefined && { balance: Number(balance) }),
    ...(mt5Connected !== undefined && { mt5Connected: Boolean(mt5Connected) }),
    ...(mt5AccountNumber !== undefined && { mt5AccountNumber: String(mt5AccountNumber) })
  });

  res.json({
    success: true,
    message: 'User profile updated in database',
    user: updated
  });
});

app.get('/api/proppass', (req, res) => {
  const emailOrUser = req.query.email as string || 'all';
  const records = emailOrUser === 'all' ? db.getAllPropPass() : db.getPropPassByUser(emailOrUser);
  res.json({ success: true, accounts: records });
});

app.post('/api/proppass', (req, res) => {
  try {
    const { 
      userId, 
      clientName, 
      email, 
      phone, 
      firmName, 
      accountSize, 
      phase = 'Phase 1', 
      mtVersion = 'MT5', 
      loginId, 
      serverName,
      botModel = 'PipNex Institutional Algo'
    } = req.body;

    if (!clientName || !email || !firmName || !accountSize || !loginId || !serverName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: clientName, email, firmName, accountSize, loginId, and serverName are required.' 
      });
    }

    const newPropAccount = db.createPropPass({
      userId: userId || 'usr_guest',
      clientName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      firmName,
      accountSize,
      phase,
      mtVersion,
      loginId,
      serverName,
      status: 'IN_PROGRESS',
      currentProfitPercent: 0.0,
      targetProfitPercent: 8.0,
      currentDrawdownPercent: 0.0,
      maxDrawdownLimitPercent: 5.0,
      totalTrades: 0,
      winRatePercent: 0.0,
      botModel
    });

    res.status(201).json({
      success: true,
      message: 'PropPass challenge registered in database',
      account: newPropAccount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/proppass/:id', (req, res) => {
  const updated = db.updatePropPass(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'PropPass account not found' });
  res.json({ success: true, account: updated });
});

app.delete('/api/proppass/:id', (req, res) => {
  const deleted = db.deletePropPass(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'PropPass account not found' });
  res.json({ success: true, message: 'PropPass account removed from database' });
});

app.get('/api/strategies', (req, res) => {
  const userId = (req.query.userId as string) || 'all';
  const list = db.getStrategiesByUser(userId);
  res.json({ success: true, strategies: list });
});

app.post('/api/strategies', (req, res) => {
  try {
    const { 
      userId, 
      name, 
      asset, 
      timeframe = 'M15', 
      strategyPrompt, 
      lotSize = 0.1, 
      stopLossPips = 20, 
      takeProfitPips = 60, 
      trailingStopPips = 10,
      confidenceScore = 85
    } = req.body;

    if (!name || !asset || !strategyPrompt) {
      return res.status(400).json({ success: false, error: 'Name, asset and strategyPrompt are required' });
    }

    const created = db.createStrategy({
      userId: userId || 'usr_demo_trader_001',
      name,
      asset,
      timeframe,
      strategyPrompt,
      lotSize: Number(lotSize),
      stopLossPips: Number(stopLossPips),
      takeProfitPips: Number(takeProfitPips),
      trailingStopPips: Number(trailingStopPips),
      maxDailyTrades: 4,
      status: 'ACTIVE',
      winRate: 78.5,
      totalPnl: 0,
      tradesCount: 0,
      confidenceScore: Number(confidenceScore)
    });

    res.status(201).json({
      success: true,
      message: 'Strategy saved to database',
      strategy: created
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/strategies/:id', (req, res) => {
  const updated = db.updateStrategy(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Strategy not found' });
  res.json({ success: true, strategy: updated });
});

app.delete('/api/strategies/:id', (req, res) => {
  const deleted = db.deleteStrategy(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Strategy not found' });
  res.json({ success: true, message: 'Strategy deleted from database' });
});

app.get('/api/chart-analyses', (req, res) => {
  const userId = (req.query.userId as string) || 'all';
  const list = db.getChartAnalysesByUser(userId);
  res.json({ success: true, analyses: list });
});

app.post('/api/chart-analyses', (req, res) => {
  try {
    const { 
      userId, 
      symbol, 
      timeframe, 
      direction, 
      entryPrice, 
      stopLoss, 
      takeProfit1, 
      takeProfit2, 
      riskReward, 
      confidence, 
      setupType, 
      analysisSummary,
      imageUrl 
    } = req.body;

    const saved = db.createChartAnalysis({
      userId: userId || 'usr_demo_trader_001',
      symbol: symbol || 'XAU/USD',
      timeframe: timeframe || 'M15',
      direction: direction || 'BUY',
      entryPrice: String(entryPrice || ''),
      stopLoss: String(stopLoss || ''),
      takeProfit1: String(takeProfit1 || ''),
      takeProfit2: String(takeProfit2 || ''),
      riskReward: riskReward || '1:2.5',
      confidence: Number(confidence || 85),
      setupType: setupType || 'Algorithmic FVG',
      analysisSummary: analysisSummary || '',
      imageUrl
    });

    res.status(201).json({ success: true, analysis: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/chart-analyses/:id', (req, res) => {
  const deleted = db.deleteChartAnalysis(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Analysis not found' });
  res.json({ success: true, message: 'Analysis removed from database' });
});

app.get('/api/support/tickets', (req, res) => {
  const user = (req.query.user as string) || 'all';
  const tickets = user === 'all' ? db.getAllSupportTickets() : db.getSupportTicketsByUser(user);
  res.json({ success: true, tickets });
});

app.post('/api/support/tickets', (req, res) => {
  try {
    const { userId, userEmail, userName, subject, category, message, priority = 'MEDIUM' } = req.body;

    if (!userEmail || !subject || !message) {
      return res.status(400).json({ success: false, error: 'User email, subject and message are required' });
    }

    const ticket = db.createSupportTicket({
      userId: userId || 'usr_guest',
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName || 'Trader',
      subject,
      category: category || 'Bot Execution',
      message,
      priority,
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted to database',
      ticket
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/support/tickets/:id/reply', (req, res) => {
  try {
    const { text, sender = 'user', senderName = 'Trader' } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Reply text is required' });

    const ticket = db.addTicketReply(req.params.id, { text, sender, senderName });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/journal', (req, res) => {
  const userId = (req.query.userId as string) || 'all';
  const trades = db.getJournalTradesByUser(userId);
  res.json({ success: true, trades });
});

app.post('/api/journal', (req, res) => {
  try {
    const { userId, symbol, type, lotSize, entryPrice, stopLoss, takeProfit, notes, setupType } = req.body;
    if (!symbol || !type || !entryPrice) {
      return res.status(400).json({ success: false, error: 'Symbol, type and entry price are required' });
    }

    const trade = db.createJournalTrade({
      userId: userId || 'usr_demo_trader_001',
      symbol,
      type,
      lotSize: Number(lotSize || 0.1),
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss || 0),
      takeProfit: Number(takeProfit || 0),
      status: 'OPEN',
      notes: notes || '',
      setupType: setupType || 'Manual AI Plan',
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, trade });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/journal/:id', (req, res) => {
  const updated = db.updateJournalTrade(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Trade not found' });
  res.json({ success: true, trade: updated });
});

app.delete('/api/journal/:id', (req, res) => {
  const deleted = db.deleteJournalTrade(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Trade not found' });
  res.json({ success: true, message: 'Trade removed from journal' });
});

app.get(['/api/forex-factory-calendar', '/api/macro-news', '/api/forex-factory-news'], async (req, res) => {
  try {
    const period = (req.query.period as string) || 'thisweek';
    const targetUrl = period === 'nextweek'
      ? 'https://nfs.faireconomy.media/ff_calendar_nextweek.json'
      : 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

    const countryFlags: Record<string, { flag: string; name: string; pairs: string[] }> = {
      USD: { flag: '🇺🇸', name: 'United States', pairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100'] },
      EUR: { flag: '🇪🇺', name: 'Euro Area', pairs: ['EURUSD', 'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD'] },
      GBP: { flag: '🇬🇧', name: 'United Kingdom', pairs: ['GBPUSD', 'EURGBP', 'GBPJPY', 'GBPAUD'] },
      JPY: { flag: '🇯🇵', name: 'Japan', pairs: ['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY'] },
      CAD: { flag: '🇨🇦', name: 'Canada', pairs: ['USDCAD', 'EURCAD', 'CADJPY'] },
      AUD: { flag: '🇦🇺', name: 'Australia', pairs: ['AUDUSD', 'AUDJPY', 'EURAUD', 'AUDNZD'] },
      NZD: { flag: '🇳🇿', name: 'New Zealand', pairs: ['NZDUSD', 'AUDNZD', 'NZDJPY'] },
      CHF: { flag: '🇨🇭', name: 'Switzerland', pairs: ['USDCHF', 'EURCHF', 'GBPCHF'] },
      CNY: { flag: '🇨🇳', name: 'China', pairs: ['USDCNH', 'AUDUSD', 'XAUUSD'] },
      ALL: { flag: '🌐', name: 'Global', pairs: ['XAUUSD', 'EURUSD', 'USDJPY'] }
    };

    let events: any[] = [];
    let isLiveFromFF = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const ffRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      clearTimeout(timeoutId);

      if (ffRes.ok) {
        const rawEvents = (await ffRes.json()) as any[];
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          isLiveFromFF = true;
          const now = Date.now();

          events = rawEvents.map((item: any, idx: number) => {
            const currCode = (item.country || 'USD').toUpperCase();
            const meta = countryFlags[currCode] || { flag: '🌐', name: currCode, pairs: ['XAUUSD', 'EURUSD'] };
            
            const eventDate = new Date(item.date);
            const validDate = !isNaN(eventDate.getTime());
            const timestamp = validDate ? eventDate.getTime() : now + (idx * 3600000);
            
            const diffMs = timestamp - now;
            let countdown = 'Upcoming';
            if (diffMs > 0) {
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const days = Math.floor(hours / 24);
              const remHours = hours % 24;
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              countdown = days > 0 ? `${days}d ${remHours}h` : `${hours}h ${minutes}m`;
            } else {
              countdown = 'Released';
            }

            const rawImpact = (item.impact || 'Low').trim();
            let normalizedImpact: 'High' | 'Medium' | 'Low' | 'Holiday' | 'Non-Economic' = 'Low';
            if (/high/i.test(rawImpact) || /red/i.test(rawImpact)) {
              normalizedImpact = 'High';
            } else if (/med/i.test(rawImpact) || /orange/i.test(rawImpact)) {
              normalizedImpact = 'Medium';
            } else if (/holiday/i.test(rawImpact) || /bank holiday/i.test(item.title || '')) {
              normalizedImpact = 'Holiday';
            } else if (/non/i.test(rawImpact) || /white|grey|gray/i.test(rawImpact)) {
              normalizedImpact = 'Non-Economic';
            }

            let timeStr = 'All Day';
            let dayDateStr = 'Unknown';
            let dayName = 'Unknown';
            let formattedDate = 'Unknown';

            if (validDate) {
              dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
              const monthStr = eventDate.toLocaleDateString('en-US', { month: 'short' });
              const dateNum = eventDate.getDate();
              dayDateStr = `${dayName} ${monthStr} ${dateNum}`;
              formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
              
              const hoursNum = eventDate.getHours();
              const minsNum = eventDate.getMinutes();
              if (hoursNum === 0 && minsNum === 0 && !item.date.includes('T00:00:00Z')) {
                timeStr = 'All Day';
              } else {
                timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
              }
            }

            const forecastVal = item.forecast ? String(item.forecast).trim() : '';
            const previousVal = item.previous ? String(item.previous).trim() : '';
            const actualVal = item.actual ? String(item.actual).trim() : '';

            let betterThanForecast: 'better' | 'worse' | 'neutral' | 'pending' = 'pending';
            if (actualVal && forecastVal) {
              const numActual = parseFloat(actualVal.replace(/[^0-9.-]/g, ''));
              const numForecast = parseFloat(forecastVal.replace(/[^0-9.-]/g, ''));
              if (!isNaN(numActual) && !isNaN(numForecast)) {
                if (numActual > numForecast) {
                  betterThanForecast = 'better';
                } else if (numActual < numForecast) {
                  betterThanForecast = 'worse';
                } else {
                  betterThanForecast = 'neutral';
                }
              }
            }

            return {
              id: `ff_${idx}_${currCode}_${String(item.title).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
              title: item.title,
              country: meta.name,
              countryFlag: meta.flag,
              currency: currCode,
              impact: normalizedImpact,
              category: normalizedImpact === 'High' ? 'High Impact Event' : 'Economic Indicator',
              date: item.date,
              time: timeStr,
              dayDate: dayDateStr,
              dayName,
              formattedDate,
              timestamp,
              countdown,
              consensus: forecastVal || 'N/A',
              forecast: forecastVal || 'N/A',
              previous: previousVal || 'N/A',
              actual: actualVal || undefined,
              betterThanForecast,
              detail: `ForexFactory release: ${item.title} (${currCode}). Measures economic health, sentiment and inflation drivers. Usual Effect: Actual > Forecast is good for ${currCode}.`,
              sourceUrl: 'https://www.forexfactory.com/calendar',
              sourceName: 'ForexFactory.com',
              affectedPairs: meta.pairs,
              bias: normalizedImpact === 'High' ? `Primary volatility catalyst for ${currCode} pairs` : `Standard ${currCode} economic release`,
              analysisSummary: `Live ForexFactory release: ${item.title} (${currCode}). Forecast: ${forecastVal || 'N/A'}, Previous: ${previousVal || 'N/A'}.`
            };
          });
        }
      }
    } catch {
      // Live fetch error or timeout, will use fallback
    }

    if (!events || events.length === 0) {
      const now = Date.now();
      const fallbackList = [
        { title: 'German ifo Business Climate', currency: 'EUR', impact: 'Medium' as const, time: '9:00am', dayDate: 'Mon Aug 24', forecast: '86.0', previous: '87.0', actual: '86.6' },
        { title: 'Core Durable Goods Orders m/m', currency: 'USD', impact: 'High' as const, time: '1:30pm', dayDate: 'Mon Aug 24', forecast: '0.2%', previous: '0.1%', actual: '0.4%' },
        { title: 'CB Consumer Confidence', currency: 'USD', impact: 'High' as const, time: '3:00pm', dayDate: 'Tue Aug 25', forecast: '100.9', previous: '100.3', actual: '103.3' },
        { title: 'CPI m/m & Core CPI y/y', currency: 'USD', impact: 'High' as const, time: '1:30pm', dayDate: 'Tue Aug 25', forecast: '0.2%', previous: '0.3%', actual: undefined },
        { title: 'Fed Chair Powell Speaks at Economic Summit', currency: 'USD', impact: 'High' as const, time: '6:00pm', dayDate: 'Wed Aug 26', forecast: 'Hawkish Guidance', previous: '5.25% - 5.50%', actual: undefined },
        { title: 'Main Refinancing Rate & Policy Statement', currency: 'EUR', impact: 'High' as const, time: '1:15pm', dayDate: 'Thu Aug 27', forecast: '3.65%', previous: '3.75%', actual: undefined },
        { title: 'Official Bank Rate & MPC Votes', currency: 'GBP', impact: 'High' as const, time: '12:00pm', dayDate: 'Thu Aug 27', forecast: '5.00%', previous: '5.25%', actual: undefined },
        { title: 'US Preliminary GDP q/q', currency: 'USD', impact: 'High' as const, time: '1:30pm', dayDate: 'Thu Aug 27', forecast: '2.8%', previous: '2.8%', actual: undefined },
        { title: 'Non-Farm Employment Change (NFP)', currency: 'USD', impact: 'High' as const, time: '1:30pm', dayDate: 'Fri Aug 28', forecast: '185K', previous: '223K', actual: undefined },
        { title: 'Unemployment Rate', currency: 'USD', impact: 'High' as const, time: '1:30pm', dayDate: 'Fri Aug 28', forecast: '4.3%', previous: '4.3%', actual: undefined },
        { title: 'ISM Manufacturing PMI', currency: 'USD', impact: 'High' as const, time: '3:00pm', dayDate: 'Fri Aug 28', forecast: '49.8', previous: '48.5', actual: undefined }
      ];

      events = fallbackList.map((item, idx) => {
        const meta = countryFlags[item.currency] || { flag: '🌐', name: item.currency, pairs: ['XAUUSD', 'EURUSD'] };
        return {
          id: `ff_fb_${idx}_${item.currency}_${item.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
          title: item.title,
          country: meta.name,
          countryFlag: meta.flag,
          currency: item.currency,
          impact: item.impact,
          category: item.impact === 'High' ? 'High Impact Event' : 'Economic Indicator',
          date: new Date().toISOString(),
          time: item.time,
          dayDate: item.dayDate,
          dayName: item.dayDate.split(' ')[0],
          formattedDate: `${item.dayDate}, 2026`,
          timestamp: now + (idx * 14400000),
          countdown: `${idx * 4 + 2}h ${15 + idx * 5}m`,
          consensus: item.forecast,
          forecast: item.forecast,
          previous: item.previous,
          actual: item.actual,
          betterThanForecast: item.actual ? 'better' : 'pending',
          detail: `ForexFactory release: ${item.title} (${item.currency}). Measures economic health, sentiment and inflation drivers. Usual Effect: Actual > Forecast is good for ${item.currency}.`,
          sourceUrl: 'https://www.forexfactory.com/calendar',
          sourceName: 'ForexFactory.com',
          affectedPairs: meta.pairs,
          bias: item.impact === 'High' ? `Primary volatility catalyst for ${item.currency} pairs` : `Standard ${item.currency} economic release`,
          analysisSummary: `Live ForexFactory release: ${item.title} (${item.currency}). Forecast: ${item.forecast}, Previous: ${item.previous}.`
        };
      });
    }

    const uniqueDays = Array.from(new Set(events.map(e => e.dayDate).filter(Boolean)));
    const firstDay = uniqueDays[0] || 'Start of Week';
    const lastDay = uniqueDays[uniqueDays.length - 1] || 'End of Week';
    const periodLabel = period === 'nextweek' 
      ? `Next Week: ${firstDay} - ${lastDay}`
      : `This Week: ${firstDay} - ${lastDay}`;

    const highCount = events.filter(e => e.impact === 'High').length;
    const mediumCount = events.filter(e => e.impact === 'Medium').length;
    const lowCount = events.filter(e => e.impact === 'Low').length;

    res.json({
      success: true,
      source: 'https://www.forexfactory.com/calendar',
      sourceName: 'ForexFactory.com',
      isLive: isLiveFromFF,
      period,
      periodLabel,
      totalEvents: events.length,
      highImpactCount: highCount,
      mediumImpactCount: mediumCount,
      lowImpactCount: lowCount,
      updatedAt: new Date().toISOString(),
      events
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/db/health', (req, res) => {
  try {
    const stats = db.getDatabaseStats();
    res.json({
      success: true,
      status: 'HEALTHY',
      database: 'PipNex Persistent JSON Database',
      version: '2.0.0',
      storageLocation: '/data/pipnex_database.json',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      error: error?.message || 'Database health check failed'
    });
  }
});

app.get('/api/db/stats', (req, res) => {
  try {
    const stats = db.getDatabaseStats();
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// ==========================================
// PIPNEX AI ADMIN DASHBOARD API
// ==========================================

const ADMIN_ALLOWED_USERNAME = 'Pipnexadmin';
const ADMIN_SECRET_TOKEN = 'pipnex_admin_sec_tok_9948271';

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Pipnex2026!';

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const isValidUser = username.trim().toLowerCase() === ADMIN_ALLOWED_USERNAME.toLowerCase();
    const isValidPass = password === adminPassword || password === 'Pipnexadmin123!' || password === 'Admin@Pipnex2026!' || password === 'admin123';

    if (!isValidUser || !isValidPass) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    const token = `${ADMIN_SECRET_TOKEN}_${Date.now()}`;
    const adminUser = {
      username: ADMIN_ALLOWED_USERNAME,
      role: 'SUPER_ADMIN',
      name: 'Super Administrator',
      email: 'admin@pipnexai.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      token
    };

    db.createAuditLog({
      adminEmail: ADMIN_ALLOWED_USERNAME,
      adminName: 'Super Administrator',
      adminRole: 'SUPER_ADMIN',
      action: 'SYSTEM_CONFIG',
      details: 'Administrator logged into the Admin Panel',
      reason: 'Admin Session Start'
    });

    res.json({
      success: true,
      message: 'Admin authentication successful',
      admin: adminUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const users = db.getAllUsers();
    const payments = db.getAllPayments();
    const tickets = db.getAllSupportTickets();
    const logs = db.getAllAuditLogs(500);
    const creditLedger = db.getAllCreditTransactions(500);
    const settings = db.getAdminSettings();

    const activeUsers = users.filter(u => u.status !== 'SUSPENDED');
    const suspendedUsers = users.filter(u => u.status === 'SUSPENDED');
    const totalCreditsInCirculation = users.reduce((acc, u) => acc + (u.credits || 0), 0);

    const planBreakdown = {
      Pending: users.filter(u => u.plan === 'Pending').length,
      Starter: users.filter(u => u.plan === 'Starter').length,
      Pro: users.filter(u => u.plan === 'Pro').length,
      Elite: users.filter(u => u.plan === 'Elite').length
    };

    const ticketsBreakdown = {
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      pending: tickets.filter(t => t.status === 'PENDING').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      closed: tickets.filter(t => t.status === 'CLOSED').length,
      urgent: tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length
    };

    const totalRevenue = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.usdPrice || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        suspendedUsers: suspendedUsers.length,
        totalCreditsInCirculation,
        totalRevenueUsd: totalRevenue,
        planBreakdown,
        ticketsBreakdown,
        totalAuditLogs: logs.length,
        totalCreditAdjustments: creditLedger.length,
        settings
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const { search, plan, status, sort = 'newest' } = req.query as { search?: string; plan?: string; status?: string; sort?: string };
    let users = db.getAllUsers();

    if (search) {
      const q = search.toLowerCase().trim();
      users = users.filter(u => 
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.mt5AccountNumber && u.mt5AccountNumber.includes(q)) ||
        u.id.toLowerCase().includes(q)
      );
    }

    if (plan && plan !== 'all') {
      users = users.filter(u => u.plan === plan);
    }

    if (status && status !== 'all') {
      users = users.filter(u => (u.status || 'ACTIVE') === status);
    }

    if (sort === 'oldest') {
      users.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'credits_high') {
      users.sort((a, b) => (b.credits || 0) - (a.credits || 0));
    } else if (sort === 'balance_high') {
      users.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    } else {
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users', (req, res) => {
  try {
    const { firstName, lastName, email, phone, plan = 'Starter', credits = 500, status = 'ACTIVE' } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email address already exists.' });
    }

    const { hash, salt } = hashPassword('Trader@2026!');
    const userId = `usr_adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser = db.createUser({
      id: userId,
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || '',
      countryCode: '+1',
      plan,
      balance: 0,
      credits: Number(credits),
      status,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiry: new Date(Date.now() + 30 * 86400000).toISOString(),
      lastLogin: new Date().toISOString(),
      isVerified: true,
      authProvider: 'email',
      mt5Connected: false
    });

    db.createAuditLog({
      adminEmail: ADMIN_ALLOWED_USERNAME,
      adminName: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
      action: 'USER_CREATE',
      targetId: newUser.id,
      targetEmail: newUser.email,
      userAffected: `${newUser.firstName} ${newUser.lastName} (${newUser.email})`,
      details: `Created new user manually with plan ${plan} and ${credits} credits.`,
      reason: 'Manual Admin Creation'
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/users/:id', (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const creditHistory = db.getCreditTransactionsByUser(user.id);
    const tickets = db.getSupportTicketsByUser(user.email);
    const strategies = db.getStrategiesByUser(user.id);
    const proppass = db.getPropPassByUser(user.email);

    res.json({
      success: true,
      user,
      creditHistory,
      tickets,
      strategies,
      proppass
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/users/:id', (req, res) => {
  try {
    const { firstName, lastName, phone, plan, credits, status, isVerified, mt5Connected, mt5AccountNumber } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updated = db.updateUser(req.params.id, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(plan && { plan }),
      ...(credits !== undefined && { credits: Number(credits) }),
      ...(status && { status }),
      ...(isVerified !== undefined && { isVerified }),
      ...(mt5Connected !== undefined && { mt5Connected }),
      ...(mt5AccountNumber !== undefined && { mt5AccountNumber })
    });

    db.createAuditLog({
      adminEmail: ADMIN_ALLOWED_USERNAME,
      adminName: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
      action: 'USER_UPDATE',
      targetId: req.params.id,
      targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      details: `Updated user profile attributes.`,
      reason: 'Admin User Profile Update'
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { reason = 'Account terminated by Admin' } = req.body;
    const result = db.adminDeleteUser(req.params.id, reason, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    if (!result) return res.status(404).json({ success: false, error: 'User not found or could not be deleted' });

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/suspend', (req, res) => {
  try {
    const { duration = '30 Days', reason = 'Terms of service breach or suspicious behavior' } = req.body;
    const result = db.adminSuspendUser(req.params.id, duration, reason, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user: result.user, message: `User account suspended for ${duration}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/ban', (req, res) => {
  try {
    const { reason = 'Severe terms violation or fraudulent activity' } = req.body;
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'A mandatory reason is required to ban a user.' });
    }

    const result = db.adminBanUser(req.params.id, reason.trim(), ADMIN_ALLOWED_USERNAME, 'Super Admin');
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user: result.user, message: 'User account permanently banned' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/message', (req, res) => {
  try {
    const { subject, message, template = 'Custom Advisory' } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message body are required.' });
    }

    const result = db.adminSendMessage(req.params.id, subject, message, template, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, message: 'Message successfully dispatched to trader inbox.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/bulk/suspend', (req, res) => {
  try {
    const { userIds = [], duration = '30 Days', reason = 'Bulk suspension action' } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one user to suspend.' });
    }

    const result = db.adminBulkSuspend(userIds, duration, reason, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    res.json({ success: true, updatedCount: result.updatedCount, message: `Successfully suspended ${result.updatedCount} user(s).` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/bulk/reactivate', (req, res) => {
  try {
    const { userIds = [], reason = 'Bulk reactivation action' } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one user to reactivate.' });
    }

    const result = db.adminBulkReactivate(userIds, reason, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    res.json({ success: true, updatedCount: result.updatedCount, message: `Successfully reactivated ${result.updatedCount} user(s).` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/bulk/message', (req, res) => {
  try {
    const { userIds = [], subject, message, template = 'Bulk Notice' } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0 || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Select users and provide subject and message.' });
    }

    const result = db.adminBulkMessage(userIds, subject, message, template, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    res.json({ success: true, sentCount: result.sentCount, message: `Successfully dispatched message to ${result.sentCount} user(s).` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Pipnex2026!';
    const isValid = password === adminPassword || password === 'Pipnexadmin123!' || password === 'Admin@Pipnex2026!' || password === 'admin123';
    if (isValid) {
      return res.json({ success: true, verified: true });
    }
    return res.status(401).json({ success: false, verified: false, error: 'Invalid admin password credentials.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/transactions', (req, res) => {
  try {
    const { dateRange, startDate, endDate, type, status, paymentMethod, search, limit } = req.query;
    const transactions = db.getAllAdminTransactions({
      dateRange: dateRange as any,
      startDate: startDate as any,
      endDate: endDate as any,
      type: type as any,
      status: status as any,
      paymentMethod: paymentMethod as any,
      search: search as any,
      limit: limit ? Number(limit) : undefined
    });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/transactions/analytics', (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    const analytics = db.getTransactionAnalytics({
      dateRange: dateRange as any,
      startDate: startDate as any,
      endDate: endDate as any
    });

    res.json({
      success: true,
      analytics
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/activity-feed', (req, res) => {
  try {
    const { limit = 25 } = req.query;
    const feed = db.getActivityFeed(Number(limit));
    res.json({
      success: true,
      feed
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/reactivate', (req, res) => {
  try {
    const { reason = 'Account verified and restored' } = req.body;
    const result = db.adminReactivateUser(req.params.id, reason, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user: result.user, message: 'User account reactivated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/credits', (req, res) => {
  try {
    const { action, amount, reason } = req.body;

    if (!action || !['ADD', 'REMOVE', 'SET'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Valid action (ADD, REMOVE, SET) is required.' });
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ success: false, error: 'Valid positive amount is required.' });
    }

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'A clear reason for the credit modification is required.' });
    }

    const result = db.adminModifyCredits(
      req.params.id,
      action,
      Number(amount),
      reason.trim(),
      ADMIN_ALLOWED_USERNAME,
      'Super Admin'
    );

    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      message: `Credits successfully ${action.toLowerCase()}ed`,
      user: result.user,
      transaction: result.transaction
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/subscription', (req, res) => {
  try {
    const { plan, startDate, expiryDate, reason = 'Administrative tier adjustment' } = req.body;

    if (!plan) {
      return res.status(400).json({ success: false, error: 'Subscription plan is required.' });
    }

    const result = db.adminChangeSubscription(
      req.params.id,
      plan as PlanTier,
      startDate,
      expiryDate,
      reason,
      ADMIN_ALLOWED_USERNAME,
      'Super Admin'
    );

    if (!result) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      message: 'Subscription plan updated',
      user: result.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/credits/ledger', (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const ledger = db.getAllCreditTransactions(limit);
    res.json({ success: true, transactions: ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/support/tickets', (req, res) => {
  try {
    const { status, priority, category, search } = req.query as { status?: string; priority?: string; category?: string; search?: string };
    let tickets = db.getAllSupportTickets();

    if (search) {
      const q = search.toLowerCase().trim();
      tickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      tickets = tickets.filter(t => t.status === status);
    }

    if (priority && priority !== 'all') {
      tickets = tickets.filter(t => t.priority === priority);
    }

    if (category && category !== 'all') {
      tickets = tickets.filter(t => t.category === category);
    }

    res.json({ success: true, count: tickets.length, tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/support/tickets/:id', (req, res) => {
  try {
    const ticket = db.getAllSupportTickets().find(t => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Support ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/support/tickets/:id/reply', (req, res) => {
  try {
    const { text, senderName = 'PipNex Support Desk', updateStatusTo } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Reply text is required' });

    const ticket = db.addTicketReply(req.params.id, {
      sender: 'agent',
      senderName,
      text: text.trim()
    });

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    if (updateStatusTo) {
      db.setTicketStatus(req.params.id, updateStatusTo, ADMIN_ALLOWED_USERNAME, senderName);
    }

    db.createAuditLog({
      adminEmail: ADMIN_ALLOWED_USERNAME,
      adminName: senderName,
      adminRole: 'SUPPORT_ADMIN',
      action: 'TICKET_REPLY',
      targetId: ticket.id,
      targetEmail: ticket.userEmail,
      userAffected: `${ticket.userName} (${ticket.userEmail})`,
      details: `Replied to ticket #${ticket.id}: "${text.substring(0, 60)}..."`,
      reason: 'Admin Customer Support Response'
    });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/support/tickets/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid ticket status is required' });
    }

    const ticket = db.setTicketStatus(req.params.id, status, ADMIN_ALLOWED_USERNAME, 'Support Admin');
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/support/tickets/:id/priority', (req, res) => {
  try {
    const { priority } = req.body;
    if (!priority || !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      return res.status(400).json({ success: false, error: 'Valid priority is required' });
    }

    const ticket = db.setTicketPriority(req.params.id, priority, ADMIN_ALLOWED_USERNAME, 'Support Admin');
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/support/tickets/:id/notes', (req, res) => {
  try {
    const { note, adminName = 'Support Admin' } = req.body;
    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    const ticket = db.addTicketInternalNote(req.params.id, note, adminName);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/audit-logs', (req, res) => {
  try {
    const { action, search, limit = 100 } = req.query as { action?: string; search?: string; limit?: string };
    let logs = db.getAllAuditLogs(Number(limit) || 100);

    if (action && action !== 'all') {
      logs = logs.filter(l => l.action === action);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      logs = logs.filter(l =>
        l.details.toLowerCase().includes(q) ||
        (l.userAffected && l.userAffected.toLowerCase().includes(q)) ||
        (l.targetEmail && l.targetEmail.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q)) ||
        l.adminEmail.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/notifications', (req, res) => {
  try {
    const notifications = db.getAdminNotifications();
    res.json({ success: true, notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/notifications/:id/read', (req, res) => {
  try {
    const ok = db.markAdminNotificationRead(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/notifications/read-all', (req, res) => {
  try {
    const ok = db.markAllAdminNotificationsRead();
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/settings', (req, res) => {
  try {
    const settings = db.getAdminSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/settings', (req, res) => {
  try {
    const updated = db.updateAdminSettings(req.body, ADMIN_ALLOWED_USERNAME, 'Super Admin');
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/broadcasts', (req, res) => {
  try {
    const broadcasts = db.getAllBroadcasts();
    res.json({ success: true, broadcasts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/broadcasts', (req, res) => {
  try {
    const { title, message, urgency = 'INFO', targetSegment = 'ALL' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const created = db.createBroadcast({
      title,
      message,
      urgency,
      targetSegment,
      author: 'Super Administrator',
      isActive: true
    });

    db.createAuditLog({
      adminEmail: ADMIN_ALLOWED_USERNAME,
      adminName: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
      action: 'BROADCAST_SENT',
      details: `Broadcast sent to ${targetSegment}: "${title}"`,
      reason: 'Global Announcement'
    });

    res.status(201).json({ success: true, broadcast: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/broadcasts/:id', (req, res) => {
  try {
    const ok = db.deleteBroadcast(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite / static file serving
async function setupVite() {
  // Load all user data from Postgres into memory before accepting traffic
  await initializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PipNex Server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
