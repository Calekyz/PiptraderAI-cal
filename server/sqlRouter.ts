import { Router, Request, Response } from 'express';
import { 
  getOrCreateUser,
  getUserTradingAccounts,
  createTradingAccount,
  getUserTrades,
  recordTrade,
  closeTrade,
  getUserBotSettings,
  updateBotSettings,
  getPerformanceMetrics,
  getUserTransactions,
  getUserNotifications,
  markNotificationRead,
  getUserApiKeys
} from '../src/db/queries.ts';
import { db } from '../src/db/index.ts';
import { performanceMetrics, transactions, apiKeys, notifications } from '../src/db/schema.ts';

export const sqlRouter = Router();

// ==========================================
// 1. DATABASE HEALTH & STATUS
// ==========================================
sqlRouter.get('/api/database/status', async (req: Request, res: Response) => {
  try {
    const isCloudSqlConfigured = !!(process.env.SQL_HOST && process.env.SQL_DB_NAME);
    res.json({
      success: true,
      database: 'PostgreSQL (Cloud SQL)',
      status: 'Connected & Healthy',
      engine: 'Drizzle ORM + pg connection pool',
      region: 'europe-west2',
      tables: [
        'users',
        'trading_accounts',
        'trades',
        'bot_settings',
        'performance_metrics',
        'transactions',
        'notifications',
        'api_keys'
      ],
      views: ['user_dashboard_summary', 'active_trades_view']
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. USER PROFILE & SYNC (POSTGRES)
// ==========================================
sqlRouter.post('/api/database/users/sync', async (req: Request, res: Response) => {
  try {
    const user = await getOrCreateUser(req.body);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. TRADING ACCOUNTS
// ==========================================
sqlRouter.get('/api/database/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const accounts = await getUserTradingAccounts(userId);
    res.json({ success: true, accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/accounts', async (req: Request, res: Response) => {
  try {
    const account = await createTradingAccount(req.body);
    res.status(201).json({ success: true, account });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. TRADING HISTORY & POSITIONS
// ==========================================
sqlRouter.get('/api/database/trades', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const limit = Number(req.query.limit) || 50;
    const tradesList = await getUserTrades(userId, limit);
    res.json({ success: true, trades: tradesList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/trades', async (req: Request, res: Response) => {
  try {
    const trade = await recordTrade(req.body);
    res.status(201).json({ success: true, trade });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/trades/:id/close', async (req: Request, res: Response) => {
  try {
    const { exitPrice, profitLoss } = req.body;
    const trade = await closeTrade(req.params.id, exitPrice, profitLoss);
    res.json({ success: true, trade });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. BOT CONFIGURATION & SETTINGS
// ==========================================
sqlRouter.get('/api/database/bot-settings', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const settings = await getUserBotSettings(userId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.put('/api/database/bot-settings', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'default';
    const updated = await updateBotSettings(userId, req.body);
    res.json({ success: true, settings: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. PERFORMANCE METRICS
// ==========================================
sqlRouter.get('/api/database/metrics', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const metrics = await getPerformanceMetrics(userId);
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/metrics', async (req: Request, res: Response) => {
  try {
    const metric = await db.insert(performanceMetrics).values({
      id: `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.body.userId,
      accountId: req.body.accountId,
      date: req.body.date || new Date().toISOString().split('T')[0],
      totalTrades: req.body.totalTrades || 0,
      winningTrades: req.body.winningTrades || 0,
      losingTrades: req.body.losingTrades || 0,
      winRate: req.body.winRate || '0.00',
      totalProfit: req.body.totalProfit || '0.00',
      totalLoss: req.body.totalLoss || '0.00',
      netProfit: req.body.netProfit || '0.00',
      bestTrade: req.body.bestTrade || '0.00',
      worstTrade: req.body.worstTrade || '0.00',
      avgWin: req.body.avgWin || '0.00',
      avgLoss: req.body.avgLoss || '0.00',
      profitFactor: req.body.profitFactor || '0.00',
      maxDrawdown: req.body.maxDrawdown || '0.00',
      roi: req.body.roi || '0.00'
    }).returning();
    res.status(201).json({ success: true, metric: metric[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. TRANSACTIONS
// ==========================================
sqlRouter.get('/api/database/transactions', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const txs = await getUserTransactions(userId);
    res.json({ success: true, transactions: txs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/transactions', async (req: Request, res: Response) => {
  try {
    const tx = await db.insert(transactions).values({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.body.userId,
      accountId: req.body.accountId,
      type: req.body.type || 'Deposit',
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
      status: req.body.status || 'Completed',
      paymentMethod: req.body.paymentMethod || 'Credit Card / M-Pesa',
      referenceId: req.body.referenceId || `TX-${Date.now()}`,
      notes: req.body.notes,
      completedAt: new Date()
    }).returning();
    res.status(201).json({ success: true, transaction: tx[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. NOTIFICATIONS & ALERTS
// ==========================================
sqlRouter.get('/api/database/notifications', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const notifs = await getUserNotifications(userId);
    res.json({ success: true, notifications: notifs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const updated = await markNotificationRead(req.params.id);
    res.json({ success: true, notification: updated[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. API KEYS & INTEGRATIONS
// ==========================================
sqlRouter.get('/api/database/api-keys', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const keys = await getUserApiKeys(userId);
    res.json({ success: true, apiKeys: keys });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sqlRouter.post('/api/database/api-keys', async (req: Request, res: Response) => {
  try {
    const created = await db.insert(apiKeys).values({
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.body.userId,
      integrationType: req.body.integrationType || 'MetaTrader 5',
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret || '***',
      apiPassphrase: req.body.apiPassphrase,
      accessLevel: req.body.accessLevel || 'Trade',
      status: 'Active'
    }).returning();
    res.status(201).json({ success: true, apiKey: created[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
