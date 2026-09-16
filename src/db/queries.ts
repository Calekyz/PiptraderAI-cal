import { db } from './index.ts';
import { 
  users, 
  tradingAccounts, 
  trades, 
  botSettings, 
  performanceMetrics, 
  transactions, 
  notifications, 
  apiKeys 
} from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

// ==========================================
// 1. USERS CRUD & SYNC
// ==========================================
export async function getOrCreateUser(userData: {
  id: string;
  email: string;
  fullName: string;
  uid?: string;
  googleId?: string;
  profilePicture?: string;
  accountType?: string;
  country?: string;
  phone?: string;
}) {
  try {
    const existing = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
    if (existing && existing.length > 0) {
      // Update last login
      const updated = await db.update(users)
        .set({
          lastLogin: new Date(),
          updatedAt: new Date(),
          fullName: userData.fullName || existing[0].fullName,
          profilePicture: userData.profilePicture || existing[0].profilePicture,
          uid: userData.uid || existing[0].uid,
          googleId: userData.googleId || existing[0].googleId
        })
        .where(eq(users.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const created = await db.insert(users).values({
      id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uid: userData.uid,
      fullName: userData.fullName || 'PipNex Trader',
      email: userData.email,
      googleId: userData.googleId,
      profilePicture: userData.profilePicture,
      accountType: userData.accountType || 'Free',
      country: userData.country || 'United States',
      phone: userData.phone,
      emailVerified: true,
      twoFactorEnabled: false,
      isActive: true,
      lastLogin: new Date()
    }).returning();

    // Create default trading account & default bot settings for the new user
    const newUser = created[0];
    const defaultAccount = await db.insert(tradingAccounts).values({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: newUser.id,
      accountName: 'PipNex Demo Primary',
      accountNumber: `MT5-${Math.floor(10000000 + Math.random() * 90000000)}`,
      broker: 'MetaTrader 5 Demo',
      accountType: 'Demo',
      initialBalance: '10000.00',
      currentBalance: '10000.00',
      equity: '10000.00',
      margin: '0.00',
      freeMargin: '10000.00',
      leverage: 100,
      currency: 'USD',
      status: 'Active'
    }).returning();

    await db.insert(botSettings).values({
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: newUser.id,
      botName: 'PipNex AI Pro',
      botVersion: '2.4.0',
      strategy: 'Scalping',
      riskPerTrade: '2.00',
      maxDailyLoss: '1000.00',
      maxPositionSize: '1.00',
      stopLossDefault: 50,
      takeProfitDefault: 100,
      tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      tradingStart: '09:00',
      tradingEnd: '17:00',
      timezone: 'UTC',
      indicatorsUsed: ['RSI', 'MACD', 'EMA_200', 'Bollinger_Bands'],
      autoTrade: false,
      emailAlerts: true,
      pushNotifications: false,
      smsAlerts: false
    });

    // Create welcome notification
    await db.insert(notifications).values({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: newUser.id,
      type: 'System Update',
      title: 'Welcome to PipNex AI Trading Bot',
      message: 'Your PostgreSQL Cloud SQL database account has been provisioned and synced with MetaTrader 5 demo integration.',
      priority: 'High',
      isRead: false
    });

    return newUser;
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    throw new Error('Database operation failed for user management', { cause: error });
  }
}

// ==========================================
// 2. TRADING ACCOUNTS
// ==========================================
export async function getUserTradingAccounts(userId: string) {
  try {
    return await db.select().from(tradingAccounts).where(eq(tradingAccounts.userId, userId));
  } catch (error) {
    console.error('getUserTradingAccounts error:', error);
    throw new Error('Failed to retrieve trading accounts', { cause: error });
  }
}

export async function createTradingAccount(data: {
  userId: string;
  accountName: string;
  broker: string;
  accountType: string;
  initialBalance: string;
  leverage: number;
  currency: string;
}) {
  try {
    const res = await db.insert(tradingAccounts).values({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      accountName: data.accountName,
      accountNumber: `${data.broker.substring(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`,
      broker: data.broker,
      accountType: data.accountType,
      initialBalance: data.initialBalance,
      currentBalance: data.initialBalance,
      equity: data.initialBalance,
      margin: '0.00',
      freeMargin: data.initialBalance,
      leverage: data.leverage || 100,
      currency: data.currency || 'USD',
      status: 'Active'
    }).returning();
    return res[0];
  } catch (error) {
    console.error('createTradingAccount error:', error);
    throw new Error('Failed to create trading account', { cause: error });
  }
}

// ==========================================
// 3. TRADES & POSITIONS
// ==========================================
export async function getUserTrades(userId: string, limit = 50) {
  try {
    return await db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.entryTime))
      .limit(limit);
  } catch (error) {
    console.error('getUserTrades error:', error);
    throw new Error('Failed to retrieve trades', { cause: error });
  }
}

export async function recordTrade(tradeData: {
  userId: string;
  accountId: string;
  symbol: string;
  tradeType: string;
  entryPrice: string;
  stopLoss?: string;
  takeProfit?: string;
  lotSize: string;
  strategy?: string;
  notes?: string;
}) {
  try {
    const res = await db.insert(trades).values({
      id: `trd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: tradeData.userId,
      accountId: tradeData.accountId,
      symbol: tradeData.symbol,
      tradeType: tradeData.tradeType,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      lotSize: tradeData.lotSize,
      status: 'Open',
      strategy: tradeData.strategy || 'PipNex AI Engine',
      notes: tradeData.notes
    }).returning();
    return res[0];
  } catch (error) {
    console.error('recordTrade error:', error);
    throw new Error('Failed to record trade', { cause: error });
  }
}

export async function closeTrade(tradeId: string, exitPrice: string, profitLoss: string) {
  try {
    const res = await db.update(trades)
      .set({
        exitPrice,
        profitLoss,
        status: 'Closed',
        exitTime: new Date()
      })
      .where(eq(trades.id, tradeId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('closeTrade error:', error);
    throw new Error('Failed to close trade', { cause: error });
  }
}

// ==========================================
// 4. BOT SETTINGS
// ==========================================
export async function getUserBotSettings(userId: string) {
  try {
    const settings = await db.select().from(botSettings).where(eq(botSettings.userId, userId)).limit(1);
    return settings[0] || null;
  } catch (error) {
    console.error('getUserBotSettings error:', error);
    throw new Error('Failed to get bot settings', { cause: error });
  }
}

export async function updateBotSettings(userId: string, updates: Partial<typeof botSettings.$inferInsert>) {
  try {
    const res = await db.update(botSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(botSettings.userId, userId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('updateBotSettings error:', error);
    throw new Error('Failed to update bot settings', { cause: error });
  }
}

// ==========================================
// 5. PERFORMANCE METRICS
// ==========================================
export async function getPerformanceMetrics(userId: string) {
  try {
    return await db.select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId))
      .orderBy(desc(performanceMetrics.date))
      .limit(30);
  } catch (error) {
    console.error('getPerformanceMetrics error:', error);
    throw new Error('Failed to get performance metrics', { cause: error });
  }
}

// ==========================================
// 6. TRANSACTIONS
// ==========================================
export async function getUserTransactions(userId: string) {
  try {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  } catch (error) {
    console.error('getUserTransactions error:', error);
    throw new Error('Failed to get transactions', { cause: error });
  }
}

// ==========================================
// 7. NOTIFICATIONS
// ==========================================
export async function getUserNotifications(userId: string) {
  try {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error('getUserNotifications error:', error);
    throw new Error('Failed to get notifications', { cause: error });
  }
}

export async function markNotificationRead(notifId: string) {
  try {
    return await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notifId))
      .returning();
  } catch (error) {
    console.error('markNotificationRead error:', error);
    throw new Error('Failed to mark notification as read', { cause: error });
  }
}

// ==========================================
// 8. API KEYS
// ==========================================
export async function getUserApiKeys(userId: string) {
  try {
    return await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  } catch (error) {
    console.error('getUserApiKeys error:', error);
    throw new Error('Failed to get API keys', { cause: error });
  }
}
