export interface AdminUser {
  username: string;
  role: 'SUPER_ADMIN' | 'USER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';
  name: string;
  email: string;
  avatar: string;
  token: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers?: number;
  pendingUsers?: number;
  onlineUsers?: number;
  totalCreditsInCirculation: number;
  totalRevenueUsd: number;
  totalRevenueKes?: number;
  totalTransactionsCount?: number;
  planBreakdown: {
    Pending: number;
    Starter: number;
    Pro: number;
    Elite: number;
  };
  ticketsBreakdown: {
    open: number;
    inProgress: number;
    pending: number;
    resolved: number;
    closed: number;
    urgent: number;
  };
  totalAuditLogs: number;
  totalCreditAdjustments: number;
  settings?: AdminSettings;
}

export interface UserLoginHistoryRecord {
  ip: string;
  location: string;
  device: string;
  deviceId?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface AdminUserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  plan: 'Pending' | 'Starter' | 'Pro' | 'Elite';
  balance: number;
  credits?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';
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

export interface AdminTransactionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountUsd: number;
  amountKes: number;
  exchangeRate: number;
  type: 'DEPOSIT' | 'SUBSCRIPTION' | 'CREDIT_PURCHASE' | 'REFUND';
  paymentMethod: 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt' | 'bank_transfer' | 'stripe';
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  reference?: string;
  receiptNumber?: string;
  description: string;
  tier?: string;
  isHighValue?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TransactionAnalytics {
  totalVolumeUsd: number;
  totalVolumeKes: number;
  totalTransactions: number;
  averageTransactionValueUsd: number;
  growthVsPreviousPeriod: number;
  tierBreakdown: Record<string, { count: number; volumeUsd: number }>;
  methodBreakdown: Record<string, { count: number; volumeUsd: number }>;
  statusBreakdown: Record<string, number>;
}

export interface ActivityFeedItem {
  id: string;
  type: 'REGISTRATION' | 'TRANSACTION' | 'ADMIN_ACTION' | 'TICKET' | 'SECURITY_FLAG';
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
  urgency?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  targetUser?: string;
  metadata?: any;
}

export interface AdminCreditTransaction {
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

export interface AdminSupportTicket {
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

export interface AdminAuditLog {
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

export interface AdminNotification {
  id: string;
  type: 'USER_REGISTRATION' | 'NEW_TICKET' | 'SUPPORT_MESSAGE' | 'SUBSCRIPTION_CHANGE' | 'SYSTEM' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AdminSettings {
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

export interface AdminBroadcast {
  id: string;
  title: string;
  message: string;
  urgency: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  targetSegment: 'ALL' | 'PENDING' | 'STARTER' | 'PRO' | 'ELITE';
  author: string;
  isActive: boolean;
  createdAt: string;
}

export type AdminViewType = 
  | 'overview' 
  | 'users' 
  | 'transactions'
  | 'subscriptions' 
  | 'credits' 
  | 'support' 
  | 'broadcasts' 
  | 'audit-logs' 
  | 'settings';
