import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db as pgDb } from '../src/db/index.ts';
import {
  pipnexUsers,
  pipnexEmailVerifications,
  pipnexPayments,
  pipnexDeposits,
  pipnexTransactions,
  pipnexPropPass,
  pipnexStrategies,
  pipnexChartAnalyses,
  pipnexSupportTickets,
  pipnexCreditTransactions,
  pipnexAdminNotifications,
  pipnexAdminSettings,
  pipnexJournalTrades,
  pipnexAdminLogs,
  pipnexBroadcasts,
} from '../src/db/schema.ts';

// ============================================================================
// ENTITY INTERFACES
// ============================================================================

export type PlanTier = 'Pending' | 'Starter' | 'Pro' | 'Elite';

export interface UserLoginHistoryRecord {
  ip: string;
  location: string;
  device: string;
  deviceId?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  plan: PlanTier;
  balance: number;
  credits?: number;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';
  suspensionDuration?: string;
  suspensionReason?: string;
  bannedAt?: string;
  banReason?: string;
  lastIp?: string;
  deviceId?: string;
  location?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
  failedLoginAttempts?: number;
  loginHistory?: UserLoginHistoryRecord[];
  subscriptionStartDate?: string;
  subscriptionExpiry?: string;
  lastLogin?: string;
  isVerified: boolean;
  authProvider: 'email' | 'google';
  mt5Connected: boolean;
  mt5AccountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  kesAmount: number;
  exchangeRate: number;
  phoneNumber?: string;
  paymentMethod: 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';
  checkoutRequestId?: string;
  merchantRequestId?: string;
  externalReference?: string;
  mpesaReceiptNumber?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TransactionEntity {
  id: string;
  userId: string;
  userEmail: string;
  type: 'DEPOSIT' | 'SUBSCRIPTION' | 'TRADING_PROFIT' | 'TRADING_LOSS' | 'REFUND';
  amount: number;
  kesAmount?: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface PaymentEntity {
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

export interface PropPassEntity {
  id: string;
  userId: string;
  clientName: string;
  email: string;
  phone: string;
  firmName: string;
  accountSize: string;
  phase: 'Phase 1' | 'Phase 2' | 'Funded Stage';
  mtVersion: 'MT4' | 'MT5';
  loginId: string;
  serverName: string;
  status: 'PENDING_SETUP' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  currentProfitPercent: number;
  targetProfitPercent: number;
  currentDrawdownPercent: number;
  maxDrawdownLimitPercent: number;
  totalTrades: number;
  winRatePercent: number;
  botModel: string;
  passedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyBotEntity {
  id: string;
  userId: string;
  name: string;
  asset: string;
  timeframe: string;
  strategyPrompt: string;
  lotSize: number;
  stopLossPips: number;
  takeProfitPips: number;
  trailingStopPips: number;
  maxDailyTrades: number;
  status: 'ACTIVE' | 'PAUSED' | 'BACKTESTING';
  winRate: number;
  totalPnl: number;
  tradesCount: number;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChartAnalysisEntity {
  id: string;
  userId: string;
  symbol: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  entryPrice: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
  confidence: number;
  setupType: string;
  analysisSummary: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SupportTicketEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'Billing' | 'Bot Execution' | 'PropPass' | 'Signals' | 'API & MT5' | 'Other';
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  isReadByAdmin?: boolean;
  isReadByUser?: boolean;
  internalNotes?: string[];
  replies: Array<{
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransactionEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  action: 'ADD' | 'REMOVE' | 'SET';
  reason: string;
  adminEmail: string;
  adminName: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

export interface AdminNotificationEntity {
  id: string;
  type: 'USER_REGISTRATION' | 'NEW_TICKET' | 'SUPPORT_MESSAGE' | 'SUBSCRIPTION_CHANGE' | 'SYSTEM' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AdminSettingsEntity {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultStarterCredits: number;
  defaultProCredits: number;
  defaultEliteCredits: number;
  starterPriceUsd: number;
  proPriceUsd: number;
  elitePriceUsd: number;
  autoCloseResolvedTicketsDays: number;
  securityEnforceMfa: boolean;
  sessionTimeoutMinutes: number;
}

export interface JournalTradeEntity {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes: string;
  setupType?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLogEntity {
  id: string;
  adminEmail: string;
  adminName: string;
  adminRole?: 'SUPER_ADMIN' | 'USER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';
  action: string;
  targetId?: string;
  targetEmail?: string;
  userAffected?: string;
  previousValue?: string;
  newValue?: string;
  details: string;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface BroadcastAnnouncementEntity {
  id: string;
  title: string;
  message: string;
  urgency: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  targetSegment: 'ALL' | 'PENDING' | 'STARTER' | 'PRO' | 'ELITE';
  author: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmailVerificationEntity {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  codeSalt: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  resendCooldownUntil: string;
  resendCount: number;
  createdAt: string;
}

// ============================================================================
// PASSWORD HASHING HELPERS
// ============================================================================

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const currentSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, currentSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: currentSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = hashPassword(password, salt);
  return check.hash === hash;
}

export function hashVerificationCode(code: string, salt?: string): { hash: string; salt: string } {
  const currentSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(code.trim(), currentSalt, 1000, 32, 'sha256').toString('hex');
  return { hash, salt: currentSalt };
}

export function verifyVerificationCode(code: string, hash: string, salt: string): boolean {
  const check = hashVerificationCode(code, salt);
  return check.hash === hash;
}

// ============================================================================
// UTILITY
// ============================================================================

function toIso(v: any): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return undefined;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// ============================================================================
// ROW MAPPERS
// ============================================================================

function rowToUser(r: any): UserEntity {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.passwordHash || '',
    salt: r.salt || '',
    firstName: r.firstName || '',
    lastName: r.lastName || '',
    phone: r.phone || '',
    countryCode: r.countryCode || '+254',
    plan: (r.plan as PlanTier) || 'Pending',
    balance: Number(r.balance || 0),
    credits: r.credits ?? 0,
    status: (r.status as any) || 'ACTIVE',
    suspensionDuration: r.suspensionDuration || undefined,
    suspensionReason: r.suspensionReason || undefined,
    bannedAt: toIso(r.bannedAt),
    banReason: r.banReason || undefined,
    lastIp: r.lastIp || undefined,
    deviceId: r.deviceId || undefined,
    location: r.location || undefined,
    isOnline: r.isOnline ?? undefined,
    lastActiveAt: toIso(r.lastActiveAt),
    failedLoginAttempts: r.failedLoginAttempts ?? undefined,
    loginHistory: (r.loginHistory as any) || undefined,
    subscriptionStartDate: toIso(r.subscriptionStartDate),
    subscriptionExpiry: toIso(r.subscriptionExpiry),
    lastLogin: toIso(r.lastLogin),
    isVerified: Boolean(r.isVerified),
    authProvider: (r.authProvider as any) || 'email',
    mt5Connected: Boolean(r.mt5Connected),
    mt5AccountNumber: r.mt5AccountNumber || undefined,
    createdAt: toIso(r.createdAt) || new Date().toISOString(),
    updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
  };
}

function userToRow(u: UserEntity) {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash || '',
    salt: u.salt || '',
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    phone: u.phone || '',
    countryCode: u.countryCode || '+254',
    plan: u.plan || 'Pending',
    balance: String(u.balance ?? 0),
    credits: u.credits ?? 0,
    status: u.status || 'ACTIVE',
    suspensionDuration: u.suspensionDuration ?? null,
    suspensionReason: u.suspensionReason ?? null,
    bannedAt: toDate(u.bannedAt),
    banReason: u.banReason ?? null,
    lastIp: u.lastIp ?? null,
    deviceId: u.deviceId ?? null,
    location: u.location ?? null,
    isOnline: u.isOnline ?? null,
    lastActiveAt: toDate(u.lastActiveAt),
    failedLoginAttempts: u.failedLoginAttempts ?? 0,
    loginHistory: (u.loginHistory as any) || [],
    subscriptionStartDate: toDate(u.subscriptionStartDate),
    subscriptionExpiry: toDate(u.subscriptionExpiry),
    lastLogin: toDate(u.lastLogin),
    isVerified: Boolean(u.isVerified),
    authProvider: u.authProvider || 'email',
    mt5Connected: Boolean(u.mt5Connected),
    mt5AccountNumber: u.mt5AccountNumber ?? null,
    createdAt: toDate(u.createdAt) || new Date(),
    updatedAt: toDate(u.updatedAt) || new Date(),
  };
}

// ============================================================================
// PIPNEX DATABASE CLASS
// ============================================================================

class PersistentDatabase {
  private users: Map<string, UserEntity> = new Map();
  private emailVerifications: Map<string, EmailVerificationEntity> = new Map();
  private payments: Map<string, PaymentEntity> = new Map();
  private deposits: Map<string, DepositEntity> = new Map();
  private transactions: Map<string, TransactionEntity> = new Map();
  private proppass: Map<string, PropPassEntity> = new Map();
  private strategies: Map<string, StrategyBotEntity> = new Map();
  private chartAnalyses: Map<string, ChartAnalysisEntity> = new Map();
  private supportTickets: Map<string, SupportTicketEntity> = new Map();
  private creditTransactions: Map<string, CreditTransactionEntity> = new Map();
  private adminNotifications: Map<string, AdminNotificationEntity> = new Map();
  private adminSettings: AdminSettingsEntity | null = null;
  private journalTrades: Map<string, JournalTradeEntity> = new Map();
  private adminLogs: Map<string, AdminAuditLogEntity> = new Map();
  private broadcasts: Map<string, BroadcastAnnouncementEntity> = new Map();

  private initialized = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // ────────────────────────────────────────────────────────────
  // INITIALIZE
  // ────────────────────────────────────────────────────────────
  public async initialize(): Promise<void> {
    try {
      await this.loadAllFromDb();
      this.initialized = true;
      console.log(`[db] Loaded ${this.users.size} users, ${this.payments.size} payments, ${this.supportTickets.size} tickets from Postgres.`);

      if (!this.syncInterval) {
        this.syncInterval = setInterval(() => {
          this.loadAllFromDb().catch((e) => console.warn('[db] Background sync failed:', e?.message));
        }, 15000);
      }
    } catch (err: any) {
      console.error('[db] initialize() failed:', err?.message);
      this.initialized = true;
    }
  }

  private async loadAllFromDb(): Promise<void> {
    const [
      userRows, verifRows, payRows, depRows, txRows, ppRows, stratRows,
      chartRows, ticketRows, creditRows, notifRows, setRows, journalRows,
      logRows, bcRows,
    ] = await Promise.all([
      pgDb.select().from(pipnexUsers),
      pgDb.select().from(pipnexEmailVerifications),
      pgDb.select().from(pipnexPayments),
      pgDb.select().from(pipnexDeposits),
      pgDb.select().from(pipnexTransactions),
      pgDb.select().from(pipnexPropPass),
      pgDb.select().from(pipnexStrategies),
      pgDb.select().from(pipnexChartAnalyses),
      pgDb.select().from(pipnexSupportTickets),
      pgDb.select().from(pipnexCreditTransactions),
      pgDb.select().from(pipnexAdminNotifications),
      pgDb.select().from(pipnexAdminSettings),
      pgDb.select().from(pipnexJournalTrades),
      pgDb.select().from(pipnexAdminLogs),
      pgDb.select().from(pipnexBroadcasts),
    ]);

    this.users = new Map(userRows.map((r: any) => [r.id, rowToUser(r)]));
    this.emailVerifications = new Map(verifRows.map((r: any) => [r.email, {
      id: r.id, userId: r.userId, email: r.email,
      codeHash: r.codeHash, codeSalt: r.codeSalt,
      expiresAt: toIso(r.expiresAt) || new Date().toISOString(),
      attempts: r.attempts, maxAttempts: r.maxAttempts,
      resendCooldownUntil: toIso(r.resendCooldownUntil) || new Date().toISOString(),
      resendCount: r.resendCount,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
    }]));
    this.payments = new Map(payRows.map((r: any) => [r.id, this.rowToPayment(r)]));
    this.deposits = new Map(depRows.map((r: any) => [r.id, this.rowToDeposit(r)]));
    this.transactions = new Map(txRows.map((r: any) => [r.id, this.rowToTransaction(r)]));
    this.proppass = new Map(ppRows.map((r: any) => [r.id, this.rowToPropPass(r)]));
    this.strategies = new Map(stratRows.map((r: any) => [r.id, this.rowToStrategy(r)]));
    this.chartAnalyses = new Map(chartRows.map((r: any) => [r.id, this.rowToChartAnalysis(r)]));
    this.supportTickets = new Map(ticketRows.map((r: any) => [r.id, this.rowToTicket(r)]));
    this.creditTransactions = new Map(creditRows.map((r: any) => [r.id, this.rowToCreditTx(r)]));
    this.adminNotifications = new Map(notifRows.map((r: any) => [r.id, this.rowToNotification(r)]));
    this.journalTrades = new Map(journalRows.map((r: any) => [r.id, this.rowToJournal(r)]));
    this.adminLogs = new Map(logRows.map((r: any) => [r.id, this.rowToLog(r)]));
    this.broadcasts = new Map(bcRows.map((r: any) => [r.id, this.rowToBroadcast(r)]));

    if (setRows.length > 0) {
      const s = setRows[0] as any;
      this.adminSettings = {
        platformName: s.platformName,
        supportEmail: s.supportEmail,
        maintenanceMode: s.maintenanceMode,
        allowNewRegistrations: s.allowNewRegistrations,
        defaultStarterCredits: s.defaultStarterCredits,
        defaultProCredits: s.defaultProCredits,
        defaultEliteCredits: s.defaultEliteCredits,
        starterPriceUsd: s.starterPriceUsd,
        proPriceUsd: s.proPriceUsd,
        elitePriceUsd: s.elitePriceUsd,
        autoCloseResolvedTicketsDays: s.autoCloseResolvedTicketsDays,
        securityEnforceMfa: s.securityEnforceMfa,
        sessionTimeoutMinutes: s.sessionTimeoutMinutes,
      };
    }
  }

  // ─── ROW MAPPERS (other entities) ───
  private rowToPayment(r: any): PaymentEntity {
    return {
      id: r.id, userId: r.userId || '', userEmail: r.userEmail || '', userName: r.userName || undefined,
      productId: r.productId || '', productName: r.productName || '',
      usdPrice: Number(r.usdPrice), exchangeRate: Number(r.exchangeRate), kesAmount: Number(r.kesAmount),
      paymentMethod: r.paymentMethod, phoneNumber: r.phoneNumber || undefined,
      merchantRequestId: r.merchantRequestId || undefined, checkoutRequestId: r.checkoutRequestId || undefined,
      mpesaReceiptNumber: r.mpesaReceiptNumber || undefined, transactionHash: r.transactionHash || undefined,
      binanceId: r.binanceId || undefined, smsMessage: r.smsMessage || undefined, notes: r.notes || undefined,
      status: r.status, statusMessage: r.statusMessage || undefined,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
      completedAt: toIso(r.completedAt),
    };
  }
  private paymentToRow(p: PaymentEntity) {
    return {
      id: p.id, userId: p.userId || '', userEmail: p.userEmail || '', userName: p.userName || null,
      productId: p.productId || '', productName: p.productName || '',
      usdPrice: String(p.usdPrice || 0), exchangeRate: String(p.exchangeRate || 129), kesAmount: String(p.kesAmount || 0),
      paymentMethod: p.paymentMethod, phoneNumber: p.phoneNumber || null,
      merchantRequestId: p.merchantRequestId || null, checkoutRequestId: p.checkoutRequestId || null,
      externalReference: (p as any).externalReference || null,
      mpesaReceiptNumber: p.mpesaReceiptNumber || null, transactionHash: p.transactionHash || null,
      binanceId: p.binanceId || null, smsMessage: p.smsMessage || null, notes: p.notes || null,
      status: p.status, statusMessage: p.statusMessage || null,
      createdAt: toDate(p.createdAt) || new Date(),
      updatedAt: toDate(p.updatedAt) || new Date(),
      completedAt: toDate(p.completedAt),
    };
  }

  private rowToDeposit(r: any): DepositEntity {
    return {
      id: r.id, userId: r.userId, userEmail: r.userEmail, userName: r.userName || undefined,
      amount: Number(r.amount), kesAmount: Number(r.kesAmount), exchangeRate: Number(r.exchangeRate),
      phoneNumber: r.phoneNumber || undefined, paymentMethod: r.paymentMethod,
      checkoutRequestId: r.checkoutRequestId || undefined, merchantRequestId: r.merchantRequestId || undefined,
      externalReference: r.externalReference || undefined, mpesaReceiptNumber: r.mpesaReceiptNumber || undefined,
      status: r.status, statusMessage: r.statusMessage || undefined,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
      completedAt: toIso(r.completedAt),
    };
  }
  private depositToRow(d: DepositEntity) {
    return {
      id: d.id, userId: d.userId, userEmail: d.userEmail, userName: d.userName || null,
      amount: String(d.amount), kesAmount: String(d.kesAmount), exchangeRate: String(d.exchangeRate),
      phoneNumber: d.phoneNumber || null, paymentMethod: d.paymentMethod,
      checkoutRequestId: d.checkoutRequestId || null, merchantRequestId: d.merchantRequestId || null,
      externalReference: d.externalReference || null, mpesaReceiptNumber: d.mpesaReceiptNumber || null,
      status: d.status, statusMessage: d.statusMessage || null,
      createdAt: toDate(d.createdAt) || new Date(),
      updatedAt: toDate(d.updatedAt) || new Date(),
      completedAt: toDate(d.completedAt),
    };
  }

  private rowToTransaction(r: any): TransactionEntity {
    return {
      id: r.id, userId: r.userId, userEmail: r.userEmail, type: r.type,
      amount: Number(r.amount), kesAmount: r.kesAmount ? Number(r.kesAmount) : undefined,
      balanceAfter: Number(r.balanceAfter), description: r.description, reference: r.reference || undefined,
      status: r.status, createdAt: toIso(r.createdAt) || new Date().toISOString(),
    };
  }
  private transactionToRow(t: TransactionEntity) {
    return {
      id: t.id, userId: t.userId, userEmail: t.userEmail, type: t.type,
      amount: String(t.amount), kesAmount: t.kesAmount != null ? String(t.kesAmount) : null,
      balanceAfter: String(t.balanceAfter), description: t.description, reference: t.reference || null,
      status: t.status, createdAt: toDate(t.createdAt) || new Date(),
    };
  }

  private rowToPropPass(r: any): PropPassEntity {
    return {
      id: r.id, userId: r.userId, clientName: r.clientName, email: r.email, phone: r.phone || '',
      firmName: r.firmName, accountSize: r.accountSize, phase: r.phase, mtVersion: r.mtVersion,
      loginId: r.loginId, serverName: r.serverName, status: r.status,
      currentProfitPercent: Number(r.currentProfitPercent), targetProfitPercent: Number(r.targetProfitPercent),
      currentDrawdownPercent: Number(r.currentDrawdownPercent), maxDrawdownLimitPercent: Number(r.maxDrawdownLimitPercent),
      totalTrades: r.totalTrades, winRatePercent: Number(r.winRatePercent), botModel: r.botModel,
      passedAt: toIso(r.passedAt),
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
    };
  }
  private propPassToRow(p: PropPassEntity) {
    return {
      id: p.id, userId: p.userId, clientName: p.clientName, email: p.email, phone: p.phone || '',
      firmName: p.firmName, accountSize: p.accountSize, phase: p.phase, mtVersion: p.mtVersion,
      loginId: p.loginId, serverName: p.serverName, status: p.status,
      currentProfitPercent: String(p.currentProfitPercent), targetProfitPercent: String(p.targetProfitPercent),
      currentDrawdownPercent: String(p.currentDrawdownPercent), maxDrawdownLimitPercent: String(p.maxDrawdownLimitPercent),
      totalTrades: p.totalTrades, winRatePercent: String(p.winRatePercent), botModel: p.botModel,
      passedAt: toDate(p.passedAt),
      createdAt: toDate(p.createdAt) || new Date(), updatedAt: toDate(p.updatedAt) || new Date(),
    };
  }

  private rowToStrategy(r: any): StrategyBotEntity {
    return {
      id: r.id, userId: r.userId, name: r.name, asset: r.asset, timeframe: r.timeframe,
      strategyPrompt: r.strategyPrompt, lotSize: Number(r.lotSize), stopLossPips: r.stopLossPips,
      takeProfitPips: r.takeProfitPips, trailingStopPips: r.trailingStopPips, maxDailyTrades: r.maxDailyTrades,
      status: r.status, winRate: Number(r.winRate), totalPnl: Number(r.totalPnl), tradesCount: r.tradesCount,
      confidenceScore: r.confidenceScore,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
    };
  }
  private strategyToRow(s: StrategyBotEntity) {
    return {
      id: s.id, userId: s.userId, name: s.name, asset: s.asset, timeframe: s.timeframe,
      strategyPrompt: s.strategyPrompt, lotSize: String(s.lotSize), stopLossPips: s.stopLossPips,
      takeProfitPips: s.takeProfitPips, trailingStopPips: s.trailingStopPips, maxDailyTrades: s.maxDailyTrades,
      status: s.status, winRate: String(s.winRate), totalPnl: String(s.totalPnl), tradesCount: s.tradesCount,
      confidenceScore: s.confidenceScore,
      createdAt: toDate(s.createdAt) || new Date(), updatedAt: toDate(s.updatedAt) || new Date(),
    };
  }

  private rowToChartAnalysis(r: any): ChartAnalysisEntity {
    return {
      id: r.id, userId: r.userId, symbol: r.symbol, timeframe: r.timeframe, direction: r.direction,
      entryPrice: r.entryPrice || '', stopLoss: r.stopLoss || '',
      takeProfit1: r.takeProfit1 || '', takeProfit2: r.takeProfit2 || '',
      riskReward: r.riskReward || '', confidence: r.confidence || 85,
      setupType: r.setupType || '', analysisSummary: r.analysisSummary || '',
      imageUrl: r.imageUrl || undefined,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
    };
  }
  private chartAnalysisToRow(c: ChartAnalysisEntity) {
    return {
      id: c.id, userId: c.userId, symbol: c.symbol, timeframe: c.timeframe, direction: c.direction,
      entryPrice: c.entryPrice || null, stopLoss: c.stopLoss || null,
      takeProfit1: c.takeProfit1 || null, takeProfit2: c.takeProfit2 || null,
      riskReward: c.riskReward || null, confidence: c.confidence || 85,
      setupType: c.setupType || null, analysisSummary: c.analysisSummary || null,
      imageUrl: c.imageUrl || null,
      createdAt: toDate(c.createdAt) || new Date(),
    };
  }

  private rowToTicket(r: any): SupportTicketEntity {
    return {
      id: r.id, userId: r.userId, userEmail: r.userEmail, userName: r.userName,
      subject: r.subject, category: r.category, message: r.message, priority: r.priority, status: r.status,
      isReadByAdmin: r.isReadByAdmin ?? false, isReadByUser: r.isReadByUser ?? true,
      internalNotes: (r.internalNotes as any) || [], replies: (r.replies as any) || [],
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
    };
  }
  private ticketToRow(t: SupportTicketEntity) {
    return {
      id: t.id, userId: t.userId, userEmail: t.userEmail, userName: t.userName,
      subject: t.subject, category: t.category, message: t.message, priority: t.priority, status: t.status,
      isReadByAdmin: t.isReadByAdmin ?? false, isReadByUser: t.isReadByUser ?? true,
      internalNotes: (t.internalNotes as any) || [], replies: (t.replies as any) || [],
      createdAt: toDate(t.createdAt) || new Date(), updatedAt: toDate(t.updatedAt) || new Date(),
    };
  }

  private rowToCreditTx(r: any): CreditTransactionEntity {
    return {
      id: r.id, userId: r.userId, userEmail: r.userEmail, userName: r.userName,
      amount: r.amount, action: r.action, reason: r.reason,
      adminEmail: r.adminEmail, adminName: r.adminName,
      previousBalance: r.previousBalance, newBalance: r.newBalance,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
    };
  }
  private creditTxToRow(c: CreditTransactionEntity) {
    return {
      id: c.id, userId: c.userId, userEmail: c.userEmail, userName: c.userName,
      amount: c.amount, action: c.action, reason: c.reason,
      adminEmail: c.adminEmail, adminName: c.adminName,
      previousBalance: c.previousBalance, newBalance: c.newBalance,
      createdAt: toDate(c.createdAt) || new Date(),
    };
  }

  private rowToNotification(r: any): AdminNotificationEntity {
    return {
      id: r.id, type: r.type, title: r.title, message: r.message,
      isRead: r.isRead ?? false, link: r.link || undefined,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
    };
  }
  private notificationToRow(n: AdminNotificationEntity) {
    return {
      id: n.id, type: n.type, title: n.title, message: n.message,
      isRead: n.isRead ?? false, link: n.link || null,
      createdAt: toDate(n.createdAt) || new Date(),
    };
  }

  private rowToJournal(r: any): JournalTradeEntity {
    return {
      id: r.id, userId: r.userId, symbol: r.symbol, type: r.type,
      lotSize: Number(r.lotSize), entryPrice: Number(r.entryPrice),
      exitPrice: r.exitPrice != null ? Number(r.exitPrice) : undefined,
      stopLoss: Number(r.stopLoss), takeProfit: Number(r.takeProfit),
      pnl: r.pnl != null ? Number(r.pnl) : undefined,
      status: r.status, notes: r.notes || '', setupType: r.setupType || undefined,
      date: r.date,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
      updatedAt: toIso(r.updatedAt) || new Date().toISOString(),
    };
  }
  private journalToRow(j: JournalTradeEntity) {
    return {
      id: j.id, userId: j.userId, symbol: j.symbol, type: j.type,
      lotSize: String(j.lotSize), entryPrice: String(j.entryPrice),
      exitPrice: j.exitPrice != null ? String(j.exitPrice) : null,
      stopLoss: String(j.stopLoss), takeProfit: String(j.takeProfit),
      pnl: j.pnl != null ? String(j.pnl) : null,
      status: j.status, notes: j.notes || '', setupType: j.setupType || null,
      date: j.date,
      createdAt: toDate(j.createdAt) || new Date(), updatedAt: toDate(j.updatedAt) || new Date(),
    };
  }

  private rowToLog(r: any): AdminAuditLogEntity {
    return {
      id: r.id, adminEmail: r.adminEmail, adminName: r.adminName, adminRole: r.adminRole || undefined,
      action: r.action, targetId: r.targetId || undefined, targetEmail: r.targetEmail || undefined,
      userAffected: r.userAffected || undefined, previousValue: r.previousValue || undefined,
      newValue: r.newValue || undefined, details: r.details, reason: r.reason || undefined,
      ipAddress: r.ipAddress || undefined,
      timestamp: toIso(r.timestamp) || new Date().toISOString(),
    };
  }
  private logToRow(l: AdminAuditLogEntity) {
    return {
      id: l.id, adminEmail: l.adminEmail, adminName: l.adminName, adminRole: l.adminRole || 'SUPER_ADMIN',
      action: l.action, targetId: l.targetId || null, targetEmail: l.targetEmail || null,
      userAffected: l.userAffected || null, previousValue: l.previousValue || null,
      newValue: l.newValue || null, details: l.details, reason: l.reason || null,
      ipAddress: l.ipAddress || null,
      timestamp: toDate(l.timestamp) || new Date(),
    };
  }

  private rowToBroadcast(r: any): BroadcastAnnouncementEntity {
    return {
      id: r.id, title: r.title, message: r.message, urgency: r.urgency,
      targetSegment: r.targetSegment, author: r.author, isActive: r.isActive ?? true,
      createdAt: toIso(r.createdAt) || new Date().toISOString(),
    };
  }
  private broadcastToRow(b: BroadcastAnnouncementEntity) {
    return {
      id: b.id, title: b.title, message: b.message, urgency: b.urgency,
      targetSegment: b.targetSegment, author: b.author, isActive: b.isActive ?? true,
      createdAt: toDate(b.createdAt) || new Date(),
    };
  }

  // ─── PERSIST HELPERS ───
  private persistUser(u: UserEntity) {
    pgDb.insert(pipnexUsers).values(userToRow(u) as any)
      .onConflictDoUpdate({ target: pipnexUsers.id, set: userToRow(u) as any })
      .catch((e) => console.error('[db] persistUser failed:', e?.message));
  }
  private persistPayment(p: PaymentEntity) {
    pgDb.insert(pipnexPayments).values(this.paymentToRow(p) as any)
      .onConflictDoUpdate({ target: pipnexPayments.id, set: this.paymentToRow(p) as any })
      .catch((e) => console.error('[db] persistPayment failed:', e?.message));
  }
  private persistDeposit(d: DepositEntity) {
    pgDb.insert(pipnexDeposits).values(this.depositToRow(d) as any)
      .onConflictDoUpdate({ target: pipnexDeposits.id, set: this.depositToRow(d) as any })
      .catch((e) => console.error('[db] persistDeposit failed:', e?.message));
  }
  private persistTransaction(t: TransactionEntity) {
    pgDb.insert(pipnexTransactions).values(this.transactionToRow(t) as any)
      .onConflictDoUpdate({ target: pipnexTransactions.id, set: this.transactionToRow(t) as any })
      .catch((e) => console.error('[db] persistTransaction failed:', e?.message));
  }
  private persistPropPass(p: PropPassEntity) {
    pgDb.insert(pipnexPropPass).values(this.propPassToRow(p) as any)
      .onConflictDoUpdate({ target: pipnexPropPass.id, set: this.propPassToRow(p) as any })
      .catch((e) => console.error('[db] persistPropPass failed:', e?.message));
  }
  private persistStrategy(s: StrategyBotEntity) {
    pgDb.insert(pipnexStrategies).values(this.strategyToRow(s) as any)
      .onConflictDoUpdate({ target: pipnexStrategies.id, set: this.strategyToRow(s) as any })
      .catch((e) => console.error('[db] persistStrategy failed:', e?.message));
  }
  private persistChartAnalysis(c: ChartAnalysisEntity) {
    pgDb.insert(pipnexChartAnalyses).values(this.chartAnalysisToRow(c) as any)
      .onConflictDoUpdate({ target: pipnexChartAnalyses.id, set: this.chartAnalysisToRow(c) as any })
      .catch((e) => console.error('[db] persistChartAnalysis failed:', e?.message));
  }
  private persistTicket(t: SupportTicketEntity) {
    pgDb.insert(pipnexSupportTickets).values(this.ticketToRow(t) as any)
      .onConflictDoUpdate({ target: pipnexSupportTickets.id, set: this.ticketToRow(t) as any })
      .catch((e) => console.error('[db] persistTicket failed:', e?.message));
  }
  private persistCreditTx(c: CreditTransactionEntity) {
    pgDb.insert(pipnexCreditTransactions).values(this.creditTxToRow(c) as any)
      .onConflictDoUpdate({ target: pipnexCreditTransactions.id, set: this.creditTxToRow(c) as any })
      .catch((e) => console.error('[db] persistCreditTx failed:', e?.message));
  }
  private persistNotification(n: AdminNotificationEntity) {
    pgDb.insert(pipnexAdminNotifications).values(this.notificationToRow(n) as any)
      .onConflictDoUpdate({ target: pipnexAdminNotifications.id, set: this.notificationToRow(n) as any })
      .catch((e) => console.error('[db] persistNotification failed:', e?.message));
  }
  private persistJournal(j: JournalTradeEntity) {
    pgDb.insert(pipnexJournalTrades).values(this.journalToRow(j) as any)
      .onConflictDoUpdate({ target: pipnexJournalTrades.id, set: this.journalToRow(j) as any })
      .catch((e) => console.error('[db] persistJournal failed:', e?.message));
  }
  private persistLog(l: AdminAuditLogEntity) {
    pgDb.insert(pipnexAdminLogs).values(this.logToRow(l) as any)
      .onConflictDoUpdate({ target: pipnexAdminLogs.id, set: this.logToRow(l) as any })
      .catch((e) => console.error('[db] persistLog failed:', e?.message));
  }
  private persistBroadcast(b: BroadcastAnnouncementEntity) {
    pgDb.insert(pipnexBroadcasts).values(this.broadcastToRow(b) as any)
      .onConflictDoUpdate({ target: pipnexBroadcasts.id, set: this.broadcastToRow(b) as any })
      .catch((e) => console.error('[db] persistBroadcast failed:', e?.message));
  }
  private persistVerification(v: EmailVerificationEntity) {
    const row = {
      id: v.id, email: v.email, userId: v.userId,
      codeHash: v.codeHash, codeSalt: v.codeSalt,
      expiresAt: toDate(v.expiresAt) || new Date(),
      attempts: v.attempts, maxAttempts: v.maxAttempts,
      resendCooldownUntil: toDate(v.resendCooldownUntil) || new Date(),
      resendCount: v.resendCount,
      createdAt: toDate(v.createdAt) || new Date(),
    };
    pgDb.insert(pipnexEmailVerifications).values(row as any)
      .onConflictDoUpdate({ target: pipnexEmailVerifications.email, set: row as any })
      .catch((e) => console.error('[db] persistVerification failed:', e?.message));
  }
  private persistSettings(s: AdminSettingsEntity) {
    const row = { id: 'global', ...s };
    pgDb.insert(pipnexAdminSettings).values(row as any)
      .onConflictDoUpdate({ target: pipnexAdminSettings.id, set: row as any })
      .catch((e) => console.error('[db] persistSettings failed:', e?.message));
  }

  private deleteUserFromDb(id: string) {
    pgDb.delete(pipnexUsers).where(eq(pipnexUsers.id, id))
      .catch((e) => console.error('[db] deleteUser failed:', e?.message));
  }
  private deletePropPassFromDb(id: string) {
    pgDb.delete(pipnexPropPass).where(eq(pipnexPropPass.id, id))
      .catch((e) => console.error('[db] deletePropPass failed:', e?.message));
  }
  private deleteStrategyFromDb(id: string) {
    pgDb.delete(pipnexStrategies).where(eq(pipnexStrategies.id, id))
      .catch((e) => console.error('[db] deleteStrategy failed:', e?.message));
  }
  private deleteChartAnalysisFromDb(id: string) {
    pgDb.delete(pipnexChartAnalyses).where(eq(pipnexChartAnalyses.id, id))
      .catch((e) => console.error('[db] deleteChartAnalysis failed:', e?.message));
  }
  private deletePaymentFromDb(id: string) {
    pgDb.delete(pipnexPayments).where(eq(pipnexPayments.id, id))
      .catch((e) => console.error('[db] deletePayment failed:', e?.message));
  }
  private deleteJournalFromDb(id: string) {
    pgDb.delete(pipnexJournalTrades).where(eq(pipnexJournalTrades.id, id))
      .catch((e) => console.error('[db] deleteJournal failed:', e?.message));
  }
  private deleteBroadcastFromDb(id: string) {
    pgDb.delete(pipnexBroadcasts).where(eq(pipnexBroadcasts.id, id))
      .catch((e) => console.error('[db] deleteBroadcast failed:', e?.message));
  }
  private deleteVerificationFromDb(email: string) {
    pgDb.delete(pipnexEmailVerifications).where(eq(pipnexEmailVerifications.email, email.toLowerCase()))
      .catch((e) => console.error('[db] deleteVerification failed:', e?.message));
  }

  // ════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════

  // ─── Plan / feature access (trial system removed) ───
  // Kept for API compatibility with existing endpoints.
  // isUnlocked = true when user.plan is Starter | Pro | Elite
  public calculateTrialStatus(user: UserEntity | undefined) {
    const serverTimeUtc = new Date().toISOString();

    if (!user) {
      return {
        isTrialActive: false,
        isEarlyAccessUser: false,
        isUnlocked: false,
        trialStatus: 'NOT_ELIGIBLE' as const,
        plan: 'Pending',
        totalDurationHours: 0,
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        secondsRemaining: 0,
        totalSecondsRemaining: 0,
        serverTimeUtc,
        formattedRemainingTime: 'Not signed in'
      };
    }

    const hasActivePlan =
      user.plan === 'Starter' || user.plan === 'Pro' || user.plan === 'Elite';

    if (hasActivePlan) {
      return {
        isTrialActive: false,
        isEarlyAccessUser: false,
        isUnlocked: true,
        trialStatus: 'UPGRADED' as const,
        plan: user.plan,
        totalDurationHours: 0,
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        secondsRemaining: 0,
        totalSecondsRemaining: 0,
        serverTimeUtc,
        formattedRemainingTime: 'Active Plan'
      };
    }

    // plan === 'Pending'
    return {
      isTrialActive: false,
      isEarlyAccessUser: false,
      isUnlocked: false,
      trialStatus: 'NOT_ELIGIBLE' as const,
      plan: 'Pending',
      totalDurationHours: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      serverTimeUtc,
      formattedRemainingTime: 'Pending admin approval'
    };
  }

  public verifyFeatureAccess(user: UserEntity | undefined, featureName: string) {
    const lockedFeatures = [
      'ai trading', 'position calculator', 'set up auto trading', 'auto trading',
      'manage bots', 'analyze quick signals', 'quick signals', 'pulse signals',
      'ai-trading', 'position-calculator', 'manage-bots', 'auto-trading', 'pulse-signals',
    ];
    const normalizedFeature = featureName.trim().toLowerCase();
    const isLockedFeature = lockedFeatures.some(
      f => normalizedFeature.includes(f) || f.includes(normalizedFeature)
    );

    if (!isLockedFeature) {
      return {
        isAllowed: true,
        reason: 'Public/Standard Feature',
        requiresUpgrade: false,
        trialStatus: (user && user.plan !== 'Pending' ? 'UPGRADED' : 'NOT_ELIGIBLE') as
          'UPGRADED' | 'NOT_ELIGIBLE',
        featureName,
      };
    }

    if (!user) {
      return {
        isAllowed: false,
        reason: 'Authentication required. Please sign in or register.',
        requiresUpgrade: true,
        trialStatus: 'NOT_ELIGIBLE' as const,
        featureName,
      };
    }

    const hasActivePlan =
      user.plan === 'Starter' || user.plan === 'Pro' || user.plan === 'Elite';

    if (hasActivePlan) {
      return {
        isAllowed: true,
        reason: 'Active Subscription',
        requiresUpgrade: false,
        trialStatus: 'UPGRADED' as const,
        featureName,
      };
    }

    return {
      isAllowed: false,
      reason: 'Your account is pending admin approval. Please contact support to activate your plan.',
      requiresUpgrade: true,
      trialStatus: 'NOT_ELIGIBLE' as const,
      featureName,
    };
  }

  // ─── Users CRUD ───
  public createUser(user: Omit<UserEntity, 'createdAt' | 'updatedAt'>): UserEntity {
    const now = new Date().toISOString();
    const newUser: UserEntity = {
      ...user,
      plan: user.plan || 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(newUser.id, newUser);
    this.persistUser(newUser);
    return newUser;
  }

  public getUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserEntity | undefined {
    const norm = email.trim().toLowerCase();
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === norm);
  }

  public updateUser(id: string, updates: Partial<UserEntity>): UserEntity | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: UserEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    this.persistUser(updated);
    return updated;
  }

  public creditUserBalance(
    userEmailOrId: string,
    amountUsd: number,
    txDetails: { description: string; reference?: string; kesAmount?: number; type?: TransactionEntity['type'] }
  ): { user: UserEntity; transaction: TransactionEntity } | undefined {
    const norm = userEmailOrId.trim().toLowerCase();
    let user = this.users.get(userEmailOrId) ||
      Array.from(this.users.values()).find(u => u.email.toLowerCase() === norm);
    if (!user) return undefined;

    const newBalance = Number((Number(user.balance || 0) + Number(amountUsd)).toFixed(2));
    user = { ...user, balance: newBalance, updatedAt: new Date().toISOString() };
    this.users.set(user.id, user);
    this.persistUser(user);

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: TransactionEntity = {
      id: txId, userId: user.id, userEmail: user.email,
      type: txDetails.type || 'DEPOSIT', amount: Number(amountUsd),
      kesAmount: txDetails.kesAmount, balanceAfter: newBalance,
      description: txDetails.description, reference: txDetails.reference,
      status: 'COMPLETED', createdAt: new Date().toISOString(),
    };
    this.transactions.set(txId, newTx);
    this.persistTransaction(newTx);
    return { user, transaction: newTx };
  }

  public deleteUser(id: string): boolean {
    if (!this.users.has(id)) return false;
    this.users.delete(id);
    this.deleteUserFromDb(id);
    return true;
  }

  public getAllUsers(): UserEntity[] {
    return Array.from(this.users.values());
  }

  // ─── Email verification ───
  public createOrUpdateEmailVerification(
    userId: string, email: string, rawCode: string, expiresInMinutes = 10
  ): EmailVerificationEntity {
    const normEmail = email.trim().toLowerCase();
    const { hash, salt } = hashVerificationCode(rawCode);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000).toISOString();
    const cooldownUntil = new Date(now.getTime() + 60 * 1000).toISOString();

    const existing = this.emailVerifications.get(normEmail);
    const verificationId = existing ? existing.id : `vcode_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const resendCount = (existing?.resendCount || 0) + 1;

    const entity: EmailVerificationEntity = {
      id: verificationId, userId, email: normEmail,
      codeHash: hash, codeSalt: salt, expiresAt, attempts: 0, maxAttempts: 5,
      resendCooldownUntil: cooldownUntil, resendCount, createdAt: now.toISOString(),
    };
    this.emailVerifications.set(normEmail, entity);
    this.persistVerification(entity);
    return entity;
  }

  public getVerificationByEmail(email: string): EmailVerificationEntity | undefined {
    return this.emailVerifications.get(email.trim().toLowerCase());
  }

  public canResendVerification(email: string): { allowed: boolean; waitSeconds?: number; error?: string } {
    const record = this.getVerificationByEmail(email);
    if (!record) return { allowed: true };
    const now = Date.now();
    const cooldownTime = new Date(record.resendCooldownUntil).getTime();
    if (now < cooldownTime) {
      const waitSec = Math.ceil((cooldownTime - now) / 1000);
      return { allowed: false, waitSeconds: waitSec, error: `Please wait ${waitSec} second${waitSec > 1 ? 's' : ''} before requesting a new code.` };
    }
    if (record.resendCount >= 10) {
      return { allowed: false, error: 'Too many verification code requests. Please contact support or try again later.' };
    }
    return { allowed: true };
  }

  public verifyEmailCode(email: string, rawCode: string): {
    success: boolean; error?: string; expired?: boolean; attemptsExceeded?: boolean; user?: UserEntity;
  } {
    const normEmail = email.trim().toLowerCase();
    const record = this.emailVerifications.get(normEmail);
    const user = this.getUserByEmail(normEmail);

    if (!user) return { success: false, error: 'No account found matching this email address.' };
    if (user.isVerified) {
      this.emailVerifications.delete(normEmail);
      this.deleteVerificationFromDb(normEmail);
      return { success: true, user };
    }
    if (!record) {
      return { success: false, error: 'No active verification code found. Please request a new verification code.' };
    }
    if (Date.now() > new Date(record.expiresAt).getTime()) {
      return { success: false, expired: true, error: 'This verification code has expired. Please request a new code.' };
    }
    if (record.attempts >= record.maxAttempts) {
      return { success: false, attemptsExceeded: true, error: 'Too many incorrect attempts. For security reasons, please request a new verification code.' };
    }

    const isValid = verifyVerificationCode(rawCode.trim(), record.codeHash, record.codeSalt);
    if (!isValid) {
      record.attempts += 1;
      this.emailVerifications.set(normEmail, record);
      this.persistVerification(record);
      const remaining = record.maxAttempts - record.attempts;
      if (remaining <= 0) {
        return { success: false, attemptsExceeded: true, error: 'Too many incorrect attempts. This code is now invalidated. Please request a new code.' };
      }
      return { success: false, error: `Invalid verification code. Please check your email and try again. (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)` };
    }

    const verifiedUser: UserEntity = { ...user, isVerified: true, updatedAt: new Date().toISOString() };
    this.users.set(user.id, verifiedUser);
    this.persistUser(verifiedUser);
    this.emailVerifications.delete(normEmail);
    this.deleteVerificationFromDb(normEmail);
    return { success: true, user: verifiedUser };
  }

  // ─── Deposits ───
  public createDeposit(deposit: DepositEntity): DepositEntity {
    this.deposits.set(deposit.id, deposit);
    this.persistDeposit(deposit);
    return deposit;
  }
  public getDepositById(id: string) { return this.deposits.get(id); }
  public getDepositByReference(ref: string) {
    const cleanRef = ref.trim();
    return Array.from(this.deposits.values()).find(d =>
      d.id === cleanRef || d.externalReference === cleanRef ||
      d.checkoutRequestId === cleanRef || d.merchantRequestId === cleanRef
    );
  }
  public updateDeposit(id: string, updates: Partial<DepositEntity>) {
    const existing = this.deposits.get(id);
    if (!existing) return undefined;
    const updated: DepositEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.deposits.set(id, updated);
    this.persistDeposit(updated);
    return updated;
  }
  public getDepositsByUser(emailOrUserId: string) {
    const norm = emailOrUserId.trim().toLowerCase();
    return Array.from(this.deposits.values())
      .filter(d => d.userEmail.toLowerCase() === norm || d.userId === emailOrUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getAllDeposits() {
    return Array.from(this.deposits.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ─── Transactions ───
  public createTransaction(tx: TransactionEntity): TransactionEntity {
    this.transactions.set(tx.id, tx);
    this.persistTransaction(tx);
    return tx;
  }
  public getTransactionsByUser(emailOrUserId: string) {
    const norm = emailOrUserId.trim().toLowerCase();
    return Array.from(this.transactions.values())
      .filter(t => t.userEmail.toLowerCase() === norm || t.userId === emailOrUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getAllTransactions() {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ─── Payments ───
  public createPayment(payment: PaymentEntity): PaymentEntity {
    this.payments.set(payment.id, payment);
    this.persistPayment(payment);
    return payment;
  }
  public getPaymentById(id: string) { return this.payments.get(id); }
  public getPaymentsByUser(userEmail: string) {
    const norm = userEmail.trim().toLowerCase();
    return Array.from(this.payments.values())
      .filter(p => p.userEmail.toLowerCase() === norm)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getAllPayments() {
    return Array.from(this.payments.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public updatePayment(id: string, updates: Partial<PaymentEntity>) {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated: PaymentEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.payments.set(id, updated);
    this.persistPayment(updated);
    return updated;
  }
  public deletePayment(id: string): boolean {
    if (!this.payments.has(id)) return false;
    this.payments.delete(id);
    this.deletePaymentFromDb(id);
    return true;
  }

  // ─── PropPass ───
  public createPropPass(account: Omit<PropPassEntity, 'id' | 'createdAt' | 'updatedAt'>): PropPassEntity {
    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newRecord: PropPassEntity = { id, ...account, createdAt: now, updatedAt: now };
    this.proppass.set(id, newRecord);
    this.persistPropPass(newRecord);
    return newRecord;
  }
  public getPropPassById(id: string) { return this.proppass.get(id); }
  public getPropPassByUser(emailOrUserId: string) {
    const norm = emailOrUserId.trim().toLowerCase();
    return Array.from(this.proppass.values())
      .filter(p => p.email.toLowerCase() === norm || p.userId === emailOrUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getAllPropPass() {
    return Array.from(this.proppass.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public updatePropPass(id: string, updates: Partial<PropPassEntity>) {
    const existing = this.proppass.get(id);
    if (!existing) return undefined;
    const updated: PropPassEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.proppass.set(id, updated);
    this.persistPropPass(updated);
    return updated;
  }
  public deletePropPass(id: string): boolean {
    if (!this.proppass.has(id)) return false;
    this.proppass.delete(id);
    this.deletePropPassFromDb(id);
    return true;
  }

  // ─── Strategies ───
  public createStrategy(strategy: Omit<StrategyBotEntity, 'id' | 'createdAt' | 'updatedAt'>): StrategyBotEntity {
    const id = `strat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newRecord: StrategyBotEntity = { id, ...strategy, createdAt: now, updatedAt: now };
    this.strategies.set(id, newRecord);
    this.persistStrategy(newRecord);
    return newRecord;
  }
  public getStrategiesByUser(userId: string) {
    return Array.from(this.strategies.values())
      .filter(s => s.userId === userId || userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public getStrategyById(id: string) { return this.strategies.get(id); }
  public updateStrategy(id: string, updates: Partial<StrategyBotEntity>) {
    const existing = this.strategies.get(id);
    if (!existing) return undefined;
    const updated: StrategyBotEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.strategies.set(id, updated);
    this.persistStrategy(updated);
    return updated;
  }
  public deleteStrategy(id: string): boolean {
    if (!this.strategies.has(id)) return false;
    this.strategies.delete(id);
    this.deleteStrategyFromDb(id);
    return true;
  }

  // ─── Chart Analyses ───
  public createChartAnalysis(analysis: Omit<ChartAnalysisEntity, 'id' | 'createdAt'>): ChartAnalysisEntity {
    const id = `ana_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: ChartAnalysisEntity = { id, ...analysis, createdAt: new Date().toISOString() };
    this.chartAnalyses.set(id, newRecord);
    this.persistChartAnalysis(newRecord);
    return newRecord;
  }
  public getChartAnalysesByUser(userId: string) {
    return Array.from(this.chartAnalyses.values())
      .filter(a => a.userId === userId || userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public deleteChartAnalysis(id: string): boolean {
    if (!this.chartAnalyses.has(id)) return false;
    this.chartAnalyses.delete(id);
    this.deleteChartAnalysisFromDb(id);
    return true;
  }

  // ─── Support Tickets ───
  public createSupportTicket(ticket: Omit<SupportTicketEntity, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): SupportTicketEntity {
    const id = `tkt_${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newRecord: SupportTicketEntity = {
      id, ...ticket,
      isReadByAdmin: false, isReadByUser: true,
      replies: [{
        id: `rep_${Date.now()}`, sender: 'user',
        senderName: ticket.userName, text: ticket.message, timestamp: now,
      }],
      createdAt: now, updatedAt: now,
    };
    this.supportTickets.set(id, newRecord);
    this.persistTicket(newRecord);
    return newRecord;
  }
  public getSupportTicketsByUser(userEmailOrId: string) {
    const norm = userEmailOrId.trim().toLowerCase();
    return Array.from(this.supportTickets.values())
      .filter(t => t.userEmail.toLowerCase() === norm || t.userId === userEmailOrId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  public getAllSupportTickets() {
    return Array.from(this.supportTickets.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  public addTicketReply(ticketId: string, reply: { sender: 'user' | 'agent' | 'admin'; senderName: string; text: string }) {
    const existing = this.supportTickets.get(ticketId);
    if (!existing) return undefined;
    const now = new Date().toISOString();
    const newReply = { id: `rep_${Date.now()}`, ...reply, timestamp: now };
    const updated: SupportTicketEntity = {
      ...existing,
      replies: [...existing.replies, newReply],
      updatedAt: now,
      isReadByAdmin: reply.sender === 'user' ? false : true,
      isReadByUser: reply.sender === 'user' ? true : false,
    };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    return updated;
  }
  public markTicketReadByAdmin(ticketId: string): boolean {
    const existing = this.supportTickets.get(ticketId);
    if (!existing) return false;
    const updated = { ...existing, isReadByAdmin: true };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    return true;
  }
  public markTicketReadByUser(ticketId: string): boolean {
    const existing = this.supportTickets.get(ticketId);
    if (!existing) return false;
    const updated = { ...existing, isReadByUser: true };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    return true;
  }
  public updateSupportTicket(id: string, updates: Partial<SupportTicketEntity>) {
    const existing = this.supportTickets.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.supportTickets.set(id, updated);
    this.persistTicket(updated);
    return updated;
  }

  // ─── Journal ───
  public createJournalTrade(trade: Omit<JournalTradeEntity, 'id' | 'createdAt' | 'updatedAt'>): JournalTradeEntity {
    const id = `jrn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newRecord: JournalTradeEntity = { id, ...trade, createdAt: now, updatedAt: now };
    this.journalTrades.set(id, newRecord);
    this.persistJournal(newRecord);
    return newRecord;
  }
  public getJournalTradesByUser(userId: string) {
    return Array.from(this.journalTrades.values())
      .filter(t => t.userId === userId || userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public updateJournalTrade(id: string, updates: Partial<JournalTradeEntity>) {
    const existing = this.journalTrades.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.journalTrades.set(id, updated);
    this.persistJournal(updated);
    return updated;
  }
  public deleteJournalTrade(id: string): boolean {
    if (!this.journalTrades.has(id)) return false;
    this.journalTrades.delete(id);
    this.deleteJournalFromDb(id);
    return true;
  }

  // ─── Audit Logs ───
  public createAuditLog(log: Omit<AdminAuditLogEntity, 'id' | 'timestamp'>): AdminAuditLogEntity {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLog: AdminAuditLogEntity = { id, ...log, timestamp: new Date().toISOString() };
    this.adminLogs.set(id, newLog);
    this.persistLog(newLog);
    return newLog;
  }
  public getAllAuditLogs(limit = 100) {
    return Array.from(this.adminLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // ─── Broadcasts ───
  public createBroadcast(broadcast: Omit<BroadcastAnnouncementEntity, 'id' | 'createdAt'>): BroadcastAnnouncementEntity {
    const id = `bc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBc: BroadcastAnnouncementEntity = { id, ...broadcast, createdAt: new Date().toISOString() };
    this.broadcasts.set(id, newBc);
    this.persistBroadcast(newBc);
    return newBc;
  }
  public getAllBroadcasts() {
    return Array.from(this.broadcasts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public deleteBroadcast(id: string): boolean {
    if (!this.broadcasts.has(id)) return false;
    this.broadcasts.delete(id);
    this.deleteBroadcastFromDb(id);
    return true;
  }

  // ─── Admin user actions ───
  public adminSuspendUser(userId: string, duration = '30 Days', reason = 'Account temporarily suspended', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const prev = user.status || 'ACTIVE';
    const updated: UserEntity = { ...user, status: 'SUSPENDED', suspensionDuration: duration, suspensionReason: reason, updatedAt: new Date().toISOString() };
    this.users.set(userId, updated);
    this.persistUser(updated);
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'USER_SUSPEND',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      previousValue: prev, newValue: `SUSPENDED (${duration})`,
      details: `Suspended user account for ${duration}. Reason: ${reason}`, reason,
    });
    this.createAdminNotification({
      type: 'SECURITY_ALERT',
      title: `User Suspended: ${user.firstName} ${user.lastName}`,
      message: `Account ${user.email} suspended for ${duration}. Reason: ${reason}`,
      isRead: false,
    });
    return { user: updated, log };
  }

  public adminBanUser(userId: string, reason = 'Account permanently banned', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const prev = user.status || 'ACTIVE';
    const updated: UserEntity = { ...user, status: 'BANNED', bannedAt: new Date().toISOString(), banReason: reason, updatedAt: new Date().toISOString() };
    this.users.set(userId, updated);
    this.persistUser(updated);
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPER_ADMIN', action: 'USER_BAN',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      previousValue: prev, newValue: 'BANNED',
      details: `Permanently banned user. Reason: ${reason}`, reason,
    });
    this.createAdminNotification({
      type: 'SECURITY_ALERT',
      title: `User Banned: ${user.firstName} ${user.lastName}`,
      message: `Account ${user.email} was permanently banned. Reason: ${reason}`,
      isRead: false,
    });
    return { user: updated, log };
  }

  public adminReactivateUser(userId: string, reason = 'Account reactivated', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const prev = user.status || 'SUSPENDED';
    const updated: UserEntity = {
      ...user, status: 'ACTIVE',
      suspensionDuration: undefined, suspensionReason: undefined,
      bannedAt: undefined, banReason: undefined,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    this.persistUser(updated);
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'USER_REACTIVATE',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      previousValue: prev, newValue: 'ACTIVE',
      details: `Reactivated user account. Reason: ${reason}`, reason,
    });
    return { user: updated, log };
  }

  public adminSendMessage(userId: string, subject: string, message: string, template = 'Custom Message', adminEmail = 'Pipnexadmin', adminName = 'Admin Team') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    this.createAdminNotification({
      type: 'SUPPORT_MESSAGE',
      title: `Message sent to ${user.firstName} ${user.lastName}`,
      message: `[${template}] ${subject}: ${message.substring(0, 80)}...`,
      isRead: true,
    });
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'USER_MESSAGE',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      details: `Sent direct message template "${template}" [Subject: ${subject}].`, reason: subject,
    });
    return { success: true, log };
  }

  public adminBulkSuspend(userIds: string[], duration = '30 Days', reason = 'Bulk suspension', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    let updatedCount = 0;
    userIds.forEach(uid => {
      const u = this.users.get(uid);
      if (u) {
        const updated = { ...u, status: 'SUSPENDED' as const, suspensionDuration: duration, suspensionReason: reason, updatedAt: new Date().toISOString() };
        this.users.set(uid, updated);
        this.persistUser(updated);
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      this.createAuditLog({
        adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'BULK_USER_SUSPEND',
        details: `Bulk suspended ${updatedCount} user account(s) for ${duration}. Reason: ${reason}`, reason,
      });
    }
    return { updatedCount };
  }

  public adminBulkReactivate(userIds: string[], reason = 'Bulk reactivation', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    let updatedCount = 0;
    userIds.forEach(uid => {
      const u = this.users.get(uid);
      if (u) {
        const updated = {
          ...u, status: 'ACTIVE' as const,
          suspensionDuration: undefined, suspensionReason: undefined,
          bannedAt: undefined, banReason: undefined,
          updatedAt: new Date().toISOString(),
        };
        this.users.set(uid, updated);
        this.persistUser(updated);
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      this.createAuditLog({
        adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'BULK_USER_REACTIVATE',
        details: `Bulk reactivated ${updatedCount} user account(s). Reason: ${reason}`, reason,
      });
    }
    return { updatedCount };
  }

  public adminBulkMessage(userIds: string[], subject: string, message: string, template = 'Bulk Notice', adminEmail = 'Pipnexadmin', adminName = 'Admin Team') {
    const validUsers = userIds.map(id => this.users.get(id)).filter(Boolean);
    const sentCount = validUsers.length;
    this.createAuditLog({
      adminEmail, adminName, adminRole: 'USER_ADMIN', action: 'BULK_USER_MESSAGE',
      details: `Sent bulk message "${subject}" (${template}) to ${sentCount} user(s).`, reason: subject,
    });
    return { sentCount };
  }

  public adminDeleteUser(userId: string, reason = 'Account deleted', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const userLabel = `${user.firstName} ${user.lastName} (${user.email})`;
    this.users.delete(userId);
    this.deleteUserFromDb(userId);
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPER_ADMIN', action: 'USER_DELETE',
      targetId: userId, targetEmail: user.email, userAffected: userLabel,
      previousValue: 'EXISTING_USER', newValue: 'DELETED',
      details: `Permanently deleted user account. Reason: ${reason}`, reason,
    });
    return { log };
  }

  public adminModifyCredits(userId: string, action: 'ADD' | 'REMOVE' | 'SET', amount: number, reason: string, adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    if (!reason || reason.trim().length === 0) throw new Error('A reason is mandatory for any credit modification.');

    const previousBalance = Number(user.credits !== undefined ? user.credits : 0);
    let newBalance = previousBalance;
    if (action === 'ADD') newBalance = previousBalance + Math.abs(amount);
    else if (action === 'REMOVE') newBalance = Math.max(0, previousBalance - Math.abs(amount));
    else newBalance = Math.max(0, Math.abs(amount));

    const updated: UserEntity = { ...user, credits: newBalance, updatedAt: new Date().toISOString() };
    this.users.set(userId, updated);
    this.persistUser(updated);

    const txId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tx: CreditTransactionEntity = {
      id: txId, userId: user.id, userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      amount: action === 'REMOVE' ? -Math.abs(amount) : Math.abs(amount),
      action, reason: reason.trim(), adminEmail, adminName,
      previousBalance, newBalance, createdAt: new Date().toISOString(),
    };
    this.creditTransactions.set(txId, tx);
    this.persistCreditTx(tx);

    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPER_ADMIN',
      action: action === 'ADD' ? 'CREDITS_ADD' : action === 'REMOVE' ? 'CREDITS_REMOVE' : 'CREDITS_SET',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      previousValue: `${previousBalance} Credits`, newValue: `${newBalance} Credits`,
      details: `${action} credits: ${action === 'SET' ? 'Set to ' + newBalance : amount} credits. (Previous: ${previousBalance}, New: ${newBalance}). Reason: ${reason}`,
      reason,
    });
    return { user: updated, transaction: tx, log };
  }

  public adminChangeSubscription(userId: string, newPlan: PlanTier, startDate?: string, expiryDate?: string, reason = 'Subscription updated', adminEmail = 'Pipnexadmin', adminName = 'Super Admin') {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const prevPlan = user.plan || 'Pending';
    const updated: UserEntity = {
      ...user, plan: newPlan,
      subscriptionStartDate: startDate || user.subscriptionStartDate,
      subscriptionExpiry: expiryDate || user.subscriptionExpiry,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    this.persistUser(updated);
    const log = this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPER_ADMIN', action: 'SUBSCRIPTION_CHANGE',
      targetId: user.id, targetEmail: user.email,
      userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
      previousValue: prevPlan, newValue: newPlan,
      details: `Changed subscription from "${prevPlan}" to "${newPlan}". Expiry: ${updated.subscriptionExpiry || 'N/A'}. Reason: ${reason}`,
      reason,
    });
    return { user: updated, log };
  }

  public getAllCreditTransactions(limit = 100) {
    return Array.from(this.creditTransactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public getCreditTransactionsByUser(userId: string) {
    return Array.from(this.creditTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ─── Notifications ───
  public getAdminNotifications() {
    return Array.from(this.adminNotifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public createAdminNotification(notif: Omit<AdminNotificationEntity, 'id' | 'createdAt'>): AdminNotificationEntity {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: AdminNotificationEntity = { id, ...notif, createdAt: new Date().toISOString() };
    this.adminNotifications.set(id, newNotif);
    this.persistNotification(newNotif);
    return newNotif;
  }
  public markAdminNotificationRead(id: string): boolean {
    const n = this.adminNotifications.get(id);
    if (!n) return false;
    const updated = { ...n, isRead: true };
    this.adminNotifications.set(id, updated);
    this.persistNotification(updated);
    return true;
  }
  public markAllAdminNotificationsRead(): boolean {
    Array.from(this.adminNotifications.values()).forEach(n => {
      const updated = { ...n, isRead: true };
      this.adminNotifications.set(n.id, updated);
      this.persistNotification(updated);
    });
    return true;
  }

  // ─── Settings ───
  public getAdminSettings(): AdminSettingsEntity {
    if (!this.adminSettings) {
      this.adminSettings = {
        platformName: 'PipNex AI Platform',
        supportEmail: 'support@pipnex.ai',
        maintenanceMode: false,
        allowNewRegistrations: true,
        defaultStarterCredits: 500,
        defaultProCredits: 2500,
        defaultEliteCredits: 10000,
        starterPriceUsd: 45,
        proPriceUsd: 95,
        elitePriceUsd: 195,
        autoCloseResolvedTicketsDays: 7,
        securityEnforceMfa: false,
        sessionTimeoutMinutes: 120,
      };
      this.persistSettings(this.adminSettings);
    }
    return this.adminSettings;
  }
  public updateAdminSettings(settings: Partial<AdminSettingsEntity>, adminEmail = 'Pipnexadmin', adminName = 'Super Admin'): AdminSettingsEntity {
    const current = this.getAdminSettings();
    this.adminSettings = { ...current, ...settings };
    this.persistSettings(this.adminSettings);
    this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPER_ADMIN', action: 'SYSTEM_CONFIG',
      details: `Updated platform settings configuration.`, reason: 'Admin settings adjustment',
    });
    return this.adminSettings;
  }

  // ─── Ticket actions ───
  public addTicketInternalNote(ticketId: string, note: string, adminName = 'Support Admin') {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) return undefined;
    const notes = [...(ticket.internalNotes || []), `[${new Date().toLocaleTimeString()} by ${adminName}]: ${note.trim()}`];
    const updated = { ...ticket, internalNotes: notes, updatedAt: new Date().toISOString() };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    return updated;
  }
  public setTicketStatus(ticketId: string, status: SupportTicketEntity['status'], adminEmail = 'Pipnexadmin', adminName = 'Support Admin') {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) return undefined;
    const prev = ticket.status;
    const updated = { ...ticket, status, updatedAt: new Date().toISOString() };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPPORT_ADMIN', action: 'TICKET_STATUS_CHANGE',
      targetId: ticketId, targetEmail: ticket.userEmail,
      userAffected: `${ticket.userName} (${ticket.userEmail})`,
      previousValue: prev, newValue: status,
      details: `Changed support ticket #${ticketId} status from "${prev}" to "${status}".`,
      reason: `Ticket marked as ${status}`,
    });
    return updated;
  }
  public setTicketPriority(ticketId: string, priority: SupportTicketEntity['priority'], adminEmail = 'Pipnexadmin', adminName = 'Support Admin') {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) return undefined;
    const prev = ticket.priority;
    const updated = { ...ticket, priority, updatedAt: new Date().toISOString() };
    this.supportTickets.set(ticketId, updated);
    this.persistTicket(updated);
    this.createAuditLog({
      adminEmail, adminName, adminRole: 'SUPPORT_ADMIN', action: 'TICKET_PRIORITY_CHANGE',
      targetId: ticketId, targetEmail: ticket.userEmail,
      userAffected: `${ticket.userName} (${ticket.userEmail})`,
      previousValue: prev, newValue: priority,
      details: `Changed support ticket #${ticketId} priority from "${prev}" to "${priority}".`,
    });
    return updated;
  }

  // ─── Financial Oversight ───
  public getAllAdminTransactions(filters?: any): any[] {
    const payments = Array.from(this.payments.values());
    const deposits = Array.from(this.deposits.values());
    const list: any[] = [];

    payments.forEach(p => {
      const u = this.users.get(p.userId) || { firstName: 'Trader', lastName: 'User', email: p.userEmail };
      const isSub = p.productId?.toLowerCase().includes('bot') || p.productId?.toLowerCase().includes('pro') || p.productId?.toLowerCase().includes('starter') || p.productId?.toLowerCase().includes('elite');
      list.push({
        id: p.id, userId: p.userId,
        userName: p.userName || `${u.firstName} ${u.lastName}`,
        userEmail: p.userEmail || u.email,
        amountUsd: p.usdPrice || 0,
        amountKes: p.kesAmount || (p.usdPrice * (p.exchangeRate || 130)),
        exchangeRate: p.exchangeRate || 130,
        type: isSub ? 'SUBSCRIPTION' : 'CREDIT_PURCHASE',
        paymentMethod: p.paymentMethod || 'mpesa_automated',
        status: (p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'FAILED' ? 'FAILED' : 'PENDING') as any,
        reference: p.checkoutRequestId || p.transactionHash || p.id,
        receiptNumber: p.mpesaReceiptNumber,
        description: `${p.productName || 'PipNex Order'} (${p.paymentMethod})`,
        tier: p.productId,
        isHighValue: (p.usdPrice || 0) >= 200,
        createdAt: p.createdAt, completedAt: p.completedAt,
      });
    });

    deposits.forEach(d => {
      if (!list.some(item => item.id === d.id)) {
        const u = this.users.get(d.userId) || { firstName: 'Trader', lastName: 'User', email: d.userEmail };
        list.push({
          id: d.id, userId: d.userId,
          userName: d.userName || `${u.firstName} ${u.lastName}`,
          userEmail: d.userEmail || u.email,
          amountUsd: d.amount || 0,
          amountKes: d.kesAmount || (d.amount * (d.exchangeRate || 130)),
          exchangeRate: d.exchangeRate || 130,
          type: 'DEPOSIT', paymentMethod: d.paymentMethod,
          status: (d.status === 'COMPLETED' ? 'COMPLETED' : d.status === 'FAILED' ? 'FAILED' : 'PENDING') as any,
          reference: d.checkoutRequestId || d.id, receiptNumber: d.mpesaReceiptNumber,
          description: `Direct Balance Deposit (${d.paymentMethod})`,
          isHighValue: (d.amount || 0) >= 200,
          createdAt: d.createdAt, completedAt: d.completedAt,
        });
      }
    });

    let filtered = list;
    if (filters?.dateRange === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= todayStart);
    } else if (filters?.dateRange === 'week') {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= sevenDaysAgo);
    } else if (filters?.dateRange === 'month') {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= monthStart);
    }
    if (filters?.type && filters.type !== 'all') filtered = filtered.filter(t => t.type === filters.type);
    if (filters?.status && filters.status !== 'all') filtered = filtered.filter(t => t.status === filters.status);
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        (t.reference && t.reference.toLowerCase().includes(q)) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }

  public getTransactionAnalytics(filters?: any) {
    const allFiltered = this.getAllAdminTransactions(filters);
    const completed = allFiltered.filter(t => t.status === 'COMPLETED');
    const totalVolumeUsd = completed.reduce((sum, t) => sum + (t.amountUsd > 0 ? t.amountUsd : 0), 0);
    const totalVolumeKes = completed.reduce((sum, t) => sum + (t.amountKes > 0 ? t.amountKes : 0), 0);
    const tierBreakdown: Record<string, { count: number; volumeUsd: number }> = {};
    const methodBreakdown: Record<string, { count: number; volumeUsd: number }> = {};
    const statusBreakdown: Record<string, number> = { COMPLETED: 0, PENDING: 0, FAILED: 0, REFUNDED: 0 };

    allFiltered.forEach(t => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      const methodKey = t.paymentMethod || 'mpesa_automated';
      if (!methodBreakdown[methodKey]) methodBreakdown[methodKey] = { count: 0, volumeUsd: 0 };
      methodBreakdown[methodKey].count++;
      if (t.status === 'COMPLETED' && t.amountUsd > 0) methodBreakdown[methodKey].volumeUsd += t.amountUsd;
      const tierKey = t.tier || (t.type === 'DEPOSIT' ? 'Deposit' : 'Pro');
      if (!tierBreakdown[tierKey]) tierBreakdown[tierKey] = { count: 0, volumeUsd: 0 };
      tierBreakdown[tierKey].count++;
      if (t.status === 'COMPLETED' && t.amountUsd > 0) tierBreakdown[tierKey].volumeUsd += t.amountUsd;
    });

    return {
      totalVolumeUsd, totalVolumeKes,
      totalTransactions: allFiltered.length,
      averageTransactionValueUsd: completed.length > 0 ? Math.round((totalVolumeUsd / completed.length) * 100) / 100 : 0,
      growthVsPreviousPeriod: 14.8,
      tierBreakdown, methodBreakdown, statusBreakdown,
    };
  }

  public getActivityFeed(limit = 20) {
    const feed: any[] = [];
    Array.from(this.adminLogs.values()).forEach(l => {
      feed.push({
        id: `feed_log_${l.id}`, type: 'ADMIN_ACTION',
        title: `Admin Action: ${l.action}`,
        description: `${l.adminName} (${l.adminRole || 'SUPER_ADMIN'}): ${l.details}`,
        timestamp: l.timestamp, badge: l.action,
        urgency: l.action.includes('BAN') || l.action.includes('DELETE') ? 'CRITICAL' : l.action.includes('SUSPEND') ? 'WARNING' : 'INFO',
        targetUser: l.targetEmail,
      });
    });
    Array.from(this.users.values()).forEach(u => {
      feed.push({
        id: `feed_usr_${u.id}`, type: 'REGISTRATION',
        title: `New Trader Registration: ${u.firstName} ${u.lastName}`,
        description: `Registered with ${u.plan} plan (${u.authProvider}) from ${u.countryCode || '+1'}`,
        timestamp: u.createdAt, badge: u.plan, urgency: 'SUCCESS', targetUser: u.email,
      });
      if (u.status === 'BANNED') {
        feed.push({
          id: `feed_ban_${u.id}`, type: 'SECURITY_FLAG',
          title: `Account Flagged / Banned: ${u.email}`,
          description: `Permanent ban active: ${u.banReason || 'Policy Violation'}`,
          timestamp: u.bannedAt || u.updatedAt, badge: 'BANNED', urgency: 'CRITICAL', targetUser: u.email,
        });
      }
    });
    Array.from(this.payments.values()).forEach(p => {
      feed.push({
        id: `feed_pay_${p.id}`, type: 'TRANSACTION',
        title: `Payment ${p.status}: $${p.usdPrice} USD`,
        description: `${p.productName} by ${p.userEmail} via ${p.paymentMethod}`,
        timestamp: p.createdAt, badge: `$${p.usdPrice}`,
        urgency: p.status === 'COMPLETED' ? 'SUCCESS' : p.status === 'FAILED' ? 'CRITICAL' : 'WARNING',
        targetUser: p.userEmail,
      });
    });
    return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  public getDatabaseStats() {
    const usersList = Array.from(this.users.values());
    const paymentsList = Array.from(this.payments.values());
    const ticketsList = Array.from(this.supportTickets.values());
    const auditLogsList = Array.from(this.adminLogs.values());
    const totalRevenue = paymentsList.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.usdPrice || 0), 0);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const newUsersToday = usersList.filter(u => new Date(u.createdAt).getTime() >= todayStart).length;
    const activeSubscriptions = usersList.filter(u => u.plan && u.plan !== 'Pending').length;
    const openTickets = ticketsList.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    return {
      usersCount: usersList.length, newUsersToday, activeSubscriptions, openTickets, totalRevenue,
      paymentsCount: paymentsList.length,
      proppassCount: this.proppass.size,
      strategiesCount: this.strategies.size,
      chartAnalysesCount: this.chartAnalyses.size,
      supportTicketsCount: ticketsList.length,
      journalTradesCount: this.journalTrades.size,
      auditLogsCount: auditLogsList.length,
      broadcastsCount: this.broadcasts.size,
      lastSaved: new Date().toISOString(),
      version: '2.0.0',
      totalRecords: this.users.size + this.payments.size + this.supportTickets.size,
    };
  }

  public getRawDatabase() {
    return {
      users: Object.fromEntries(this.users),
      payments: Object.fromEntries(this.payments),
      deposits: Object.fromEntries(this.deposits),
      transactions: Object.fromEntries(this.transactions),
      credit_transactions: Object.fromEntries(this.creditTransactions),
      proppass_accounts: Object.fromEntries(this.proppass),
      strategies: Object.fromEntries(this.strategies),
      chart_analyses: Object.fromEntries(this.chartAnalyses),
      support_tickets: Object.fromEntries(this.supportTickets),
      journal_trades: Object.fromEntries(this.journalTrades),
      admin_logs: Object.fromEntries(this.adminLogs),
      admin_notifications: Object.fromEntries(this.adminNotifications),
      admin_settings: this.adminSettings,
      broadcasts: Object.fromEntries(this.broadcasts),
      metadata: {
        version: '2.0.0',
        lastSaved: new Date().toISOString(),
        totalRecords: this.users.size + this.payments.size + this.supportTickets.size,
      },
    };
  }
}

export const db = new PersistentDatabase();

// ============================================================================
// BOOT HOOK — server.ts should call this once before listening
// ============================================================================
export async function initializeDatabase(): Promise<void> {
  await db.initialize();
}
