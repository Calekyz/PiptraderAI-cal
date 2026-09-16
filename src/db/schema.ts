import { pgTable, text, timestamp, boolean, decimal, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// LEGACY TABLES (used by sqlRouter.ts — DO NOT DELETE)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  profilePicture: text('profile_picture'),
  accountType: text('account_type').default('Free').notNull(),
  country: text('country'),
  phone: text('phone'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tradingAccounts = pgTable('trading_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').unique(),
  broker: text('broker'),
  accountType: text('account_type').default('Demo').notNull(),
  initialBalance: decimal('initial_balance', { precision: 20, scale: 2 }).default('10000.00'),
  currentBalance: decimal('current_balance', { precision: 20, scale: 2 }).default('10000.00'),
  equity: decimal('equity', { precision: 20, scale: 2 }).default('10000.00'),
  margin: decimal('margin', { precision: 20, scale: 2 }).default('0.00'),
  freeMargin: decimal('free_margin', { precision: 20, scale: 2 }).default('10000.00'),
  leverage: integer('leverage').default(100),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: text('account_id').references(() => tradingAccounts.id, { onDelete: 'cascade' }).notNull(),
  symbol: text('symbol').notNull(),
  tradeType: text('trade_type').notNull(),
  entryPrice: decimal('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 20, scale: 8 }),
  stopLoss: decimal('stop_loss', { precision: 20, scale: 8 }),
  takeProfit: decimal('take_profit', { precision: 20, scale: 8 }),
  lotSize: decimal('lot_size', { precision: 20, scale: 2 }).notNull(),
  profitLoss: decimal('profit_loss', { precision: 20, scale: 2 }),
  profitPercentage: decimal('profit_percentage', { precision: 10, scale: 2 }),
  status: text('status').default('Open').notNull(),
  strategy: text('strategy'),
  entryTime: timestamp('entry_time').defaultNow().notNull(),
  exitTime: timestamp('exit_time'),
  duration: text('duration'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const botSettings = pgTable('bot_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  botName: text('bot_name').default('PipNex Bot').notNull(),
  botVersion: text('bot_version').default('1.0.0').notNull(),
  strategy: text('strategy').default('Scalping').notNull(),
  riskPerTrade: decimal('risk_per_trade', { precision: 5, scale: 2 }).default('2.00'),
  maxDailyLoss: decimal('max_daily_loss', { precision: 20, scale: 2 }).default('1000.00'),
  maxPositionSize: decimal('max_position_size', { precision: 20, scale: 2 }).default('1.00'),
  stopLossDefault: integer('stop_loss_default').default(50),
  takeProfitDefault: integer('take_profit_default').default(100),
  tradingDays: json('trading_days').$type<string[]>().default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  tradingStart: text('trading_start').default('09:00'),
  tradingEnd: text('trading_end').default('17:00'),
  timezone: text('timezone').default('UTC'),
  indicatorsUsed: json('indicators_used').$type<string[]>().default(['RSI', 'MACD', 'EMA_200']),
  autoTrade: boolean('auto_trade').default(false).notNull(),
  emailAlerts: boolean('email_alerts').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(false).notNull(),
  smsAlerts: boolean('sms_alerts').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const performanceMetrics = pgTable('performance_metrics', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: text('account_id').references(() => tradingAccounts.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  totalTrades: integer('total_trades').default(0).notNull(),
  winningTrades: integer('winning_trades').default(0).notNull(),
  losingTrades: integer('losing_trades').default(0).notNull(),
  winRate: decimal('win_rate', { precision: 5, scale: 2 }).default('0.00'),
  totalProfit: decimal('total_profit', { precision: 20, scale: 2 }).default('0.00'),
  totalLoss: decimal('total_loss', { precision: 20, scale: 2 }).default('0.00'),
  netProfit: decimal('net_profit', { precision: 20, scale: 2 }).default('0.00'),
  bestTrade: decimal('best_trade', { precision: 20, scale: 2 }).default('0.00'),
  worstTrade: decimal('worst_trade', { precision: 20, scale: 2 }).default('0.00'),
  avgWin: decimal('avg_win', { precision: 20, scale: 2 }).default('0.00'),
  avgLoss: decimal('avg_loss', { precision: 20, scale: 2 }).default('0.00'),
  profitFactor: decimal('profit_factor', { precision: 10, scale: 2 }).default('0.00'),
  maxDrawdown: decimal('max_drawdown', { precision: 10, scale: 2 }).default('0.00'),
  roi: decimal('roi', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: text('account_id').references(() => tradingAccounts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('Pending').notNull(),
  paymentMethod: text('payment_method'),
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  priority: text('priority').default('Medium').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  integrationType: text('integration_type').notNull(),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret').notNull(),
  apiPassphrase: text('api_passphrase'),
  accessLevel: text('access_level').default('Read').notNull(),
  status: text('status').default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
});

// ============================================================================
// PIPNEX AI APPLICATION TABLES (used by server/db.ts)
// ============================================================================

export const pipnexUsers = pgTable('pipnex_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull().default(''),
  salt: text('salt').notNull().default(''),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  phone: text('phone').default(''),
  countryCode: text('country_code').default('+254'),
  plan: text('plan').default('Free Trial').notNull(),
  balance: decimal('balance', { precision: 20, scale: 2 }).default('10000.00').notNull(),
  credits: integer('credits').default(150).notNull(),
  isEarlyAccessUser: boolean('is_early_access_user').default(false),
  trialStartedAt: timestamp('trial_started_at'),
  trialExpiresAt: timestamp('trial_expires_at'),
  trialStatus: text('trial_status'),
  status: text('status').default('ACTIVE').notNull(),
  suspensionDuration: text('suspension_duration'),
  suspensionReason: text('suspension_reason'),
  bannedAt: timestamp('banned_at'),
  banReason: text('ban_reason'),
  lastIp: text('last_ip'),
  deviceId: text('device_id'),
  location: text('location'),
  isOnline: boolean('is_online').default(false),
  lastActiveAt: timestamp('last_active_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  loginHistory: json('login_history').$type<any[]>().default([]),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionExpiry: timestamp('subscription_expiry'),
  lastLogin: timestamp('last_login'),
  isVerified: boolean('is_verified').default(false).notNull(),
  authProvider: text('auth_provider').default('email').notNull(),
  mt5Connected: boolean('mt5_connected').default(false).notNull(),
  mt5AccountNumber: text('mt5_account_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipnexEmailVerifications = pgTable('pipnex_email_verifications', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  userId: text('user_id').notNull(),
  codeHash: text('code_hash').notNull(),
  codeSalt: text('code_salt').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  resendCooldownUntil: timestamp('resend_cooldown_until').notNull(),
  resendCount: integer('resend_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexPayments = pgTable('pipnex_payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  userEmail: text('user_email').notNull().default(''),
  userName: text('user_name'),
  productId: text('product_id').notNull().default(''),
  productName: text('product_name').notNull().default(''),
  usdPrice: decimal('usd_price', { precision: 12, scale: 2 }).notNull().default('0'),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 4 }).notNull().default('129'),
  kesAmount: decimal('kes_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentMethod: text('payment_method').notNull().default('mpesa_automated'),
  phoneNumber: text('phone_number'),
  merchantRequestId: text('merchant_request_id'),
  checkoutRequestId: text('checkout_request_id'),
  externalReference: text('external_reference'),
  mpesaReceiptNumber: text('mpesa_receipt_number'),
  transactionHash: text('transaction_hash'),
  binanceId: text('binance_id'),
  smsMessage: text('sms_message'),
  notes: text('notes'),
  status: text('status').notNull().default('PENDING'),
  statusMessage: text('status_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const pipnexDeposits = pgTable('pipnex_deposits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  userEmail: text('user_email').notNull().default(''),
  userName: text('user_name'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  kesAmount: decimal('kes_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 4 }).notNull().default('129'),
  phoneNumber: text('phone_number'),
  paymentMethod: text('payment_method').notNull().default('mpesa_automated'),
  checkoutRequestId: text('checkout_request_id'),
  merchantRequestId: text('merchant_request_id'),
  externalReference: text('external_reference'),
  mpesaReceiptNumber: text('mpesa_receipt_number'),
  status: text('status').notNull().default('PENDING'),
  statusMessage: text('status_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const pipnexTransactions = pgTable('pipnex_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  type: text('type').notNull(),
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  kesAmount: decimal('kes_amount', { precision: 20, scale: 2 }),
  balanceAfter: decimal('balance_after', { precision: 20, scale: 2 }).notNull(),
  description: text('description').notNull(),
  reference: text('reference'),
  status: text('status').notNull().default('COMPLETED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexPropPass = pgTable('pipnex_proppass', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  clientName: text('client_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  firmName: text('firm_name').notNull(),
  accountSize: text('account_size').notNull(),
  phase: text('phase').notNull().default('Phase 1'),
  mtVersion: text('mt_version').notNull().default('MT5'),
  loginId: text('login_id').notNull(),
  serverName: text('server_name').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'),
  currentProfitPercent: decimal('current_profit_percent', { precision: 8, scale: 2 }).default('0'),
  targetProfitPercent: decimal('target_profit_percent', { precision: 8, scale: 2 }).default('8'),
  currentDrawdownPercent: decimal('current_drawdown_percent', { precision: 8, scale: 2 }).default('0'),
  maxDrawdownLimitPercent: decimal('max_drawdown_limit_percent', { precision: 8, scale: 2 }).default('5'),
  totalTrades: integer('total_trades').default(0),
  winRatePercent: decimal('win_rate_percent', { precision: 8, scale: 2 }).default('0'),
  botModel: text('bot_model').default('PipNex Institutional Algo'),
  passedAt: timestamp('passed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipnexStrategies = pgTable('pipnex_strategies', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  asset: text('asset').notNull(),
  timeframe: text('timeframe').notNull().default('M15'),
  strategyPrompt: text('strategy_prompt').notNull(),
  lotSize: decimal('lot_size', { precision: 10, scale: 2 }).default('0.1'),
  stopLossPips: integer('stop_loss_pips').default(20),
  takeProfitPips: integer('take_profit_pips').default(60),
  trailingStopPips: integer('trailing_stop_pips').default(10),
  maxDailyTrades: integer('max_daily_trades').default(4),
  status: text('status').notNull().default('ACTIVE'),
  winRate: decimal('win_rate', { precision: 6, scale: 2 }).default('0'),
  totalPnl: decimal('total_pnl', { precision: 20, scale: 2 }).default('0'),
  tradesCount: integer('trades_count').default(0),
  confidenceScore: integer('confidence_score').default(85),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipnexChartAnalyses = pgTable('pipnex_chart_analyses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  timeframe: text('timeframe').notNull().default('M15'),
  direction: text('direction').notNull(),
  entryPrice: text('entry_price'),
  stopLoss: text('stop_loss'),
  takeProfit1: text('take_profit_1'),
  takeProfit2: text('take_profit_2'),
  riskReward: text('risk_reward'),
  confidence: integer('confidence').default(85),
  setupType: text('setup_type'),
  analysisSummary: text('analysis_summary'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexSupportTickets = pgTable('pipnex_support_tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  subject: text('subject').notNull(),
  category: text('category').notNull().default('Other'),
  message: text('message').notNull(),
  priority: text('priority').notNull().default('MEDIUM'),
  status: text('status').notNull().default('OPEN'),
  isReadByAdmin: boolean('is_read_by_admin').default(false),
  isReadByUser: boolean('is_read_by_user').default(true),
  internalNotes: json('internal_notes').$type<string[]>().default([]),
  replies: json('replies').$type<any[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipnexCreditTransactions = pgTable('pipnex_credit_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  amount: integer('amount').notNull(),
  action: text('action').notNull(),
  reason: text('reason').notNull(),
  adminEmail: text('admin_email').notNull(),
  adminName: text('admin_name').notNull(),
  previousBalance: integer('previous_balance').notNull(),
  newBalance: integer('new_balance').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexAdminNotifications = pgTable('pipnex_admin_notifications', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexAdminSettings = pgTable('pipnex_admin_settings', {
  id: text('id').primaryKey(),
  platformName: text('platform_name').notNull().default('PipNex AI Platform'),
  supportEmail: text('support_email').notNull().default('support@pipnex.ai'),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  allowNewRegistrations: boolean('allow_new_registrations').default(true).notNull(),
  defaultStarterCredits: integer('default_starter_credits').default(500).notNull(),
  defaultProCredits: integer('default_pro_credits').default(2500).notNull(),
  defaultEliteCredits: integer('default_elite_credits').default(10000).notNull(),
  starterPriceUsd: integer('starter_price_usd').default(49).notNull(),
  proPriceUsd: integer('pro_price_usd').default(95).notNull(),
  elitePriceUsd: integer('elite_price_usd').default(199).notNull(),
  autoCloseResolvedTicketsDays: integer('auto_close_resolved_tickets_days').default(7).notNull(),
  securityEnforceMfa: boolean('security_enforce_mfa').default(false).notNull(),
  sessionTimeoutMinutes: integer('session_timeout_minutes').default(120).notNull(),
});

export const pipnexJournalTrades = pgTable('pipnex_journal_trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  type: text('type').notNull(),
  lotSize: decimal('lot_size', { precision: 10, scale: 2 }).notNull(),
  entryPrice: decimal('entry_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 20, scale: 8 }),
  stopLoss: decimal('stop_loss', { precision: 20, scale: 8 }).default('0'),
  takeProfit: decimal('take_profit', { precision: 20, scale: 8 }).default('0'),
  pnl: decimal('pnl', { precision: 20, scale: 2 }),
  status: text('status').notNull().default('OPEN'),
  notes: text('notes').default(''),
  setupType: text('setup_type'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipnexAdminLogs = pgTable('pipnex_admin_logs', {
  id: text('id').primaryKey(),
  adminEmail: text('admin_email').notNull(),
  adminName: text('admin_name').notNull(),
  adminRole: text('admin_role').default('SUPER_ADMIN'),
  action: text('action').notNull(),
  targetId: text('target_id'),
  targetEmail: text('target_email'),
  userAffected: text('user_affected'),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  details: text('details').notNull(),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const pipnexBroadcasts = pgTable('pipnex_broadcasts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  urgency: text('urgency').notNull().default('INFO'),
  targetSegment: text('target_segment').notNull().default('ALL'),
  author: text('author').notNull().default('SuperAdmin'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipnexEarlyAccess = pgTable('pipnex_early_access', {
  email: text('email').primaryKey(),
  name: text('name'),
  notes: text('notes'),
  approvedAt: timestamp('approved_at').defaultNow().notNull(),
});

// ============================================================================
// RELATIONS (legacy)
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  tradingAccounts: many(tradingAccounts),
  trades: many(trades),
  botSettings: one(botSettings, { fields: [users.id], references: [botSettings.userId] }),
  performanceMetrics: many(performanceMetrics),
  transactions: many(transactions),
  notifications: many(notifications),
  apiKeys: many(apiKeys),
}));

export const tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, { fields: [tradingAccounts.userId], references: [users.id] }),
  trades: many(trades),
  performanceMetrics: many(performanceMetrics),
  transactions: many(transactions),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  account: one(tradingAccounts, { fields: [trades.accountId], references: [tradingAccounts.id] }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, { fields: [performanceMetrics.userId], references: [users.id] }),
  account: one(tradingAccounts, { fields: [performanceMetrics.accountId], references: [tradingAccounts.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(tradingAccounts, { fields: [transactions.accountId], references: [tradingAccounts.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));
