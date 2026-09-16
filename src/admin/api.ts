import {
  AdminStats,
  AdminUserItem,
  AdminCreditTransaction,
  AdminSupportTicket,
  AdminAuditLog,
  AdminNotification,
  AdminSettings,
  AdminBroadcast,
  AdminUser,
  AdminTransactionItem,
  TransactionAnalytics,
  ActivityFeedItem
} from './types';

const ADMIN_TOKEN_KEY = 'pipnex_admin_session';

export function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminUser | null;
      if (parsed) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAdminSession(admin: AdminUser) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(admin));
  } catch {}
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const admin = getStoredAdmin();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (admin?.token) {
    headers['Authorization'] = `Bearer ${admin.token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      try {
        const parsed = JSON.parse(errText);
        throw new Error(parsed.error || `HTTP ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }
    }

    const data = await res.json();
    if (data.success === false) {
      throw new Error(data.error || 'API Request failed');
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const AdminApi = {
  // ---------- Auth ----------
  async login(username: string, password: string): Promise<{ admin: AdminUser; token: string }> {
    const res = await request<{ admin: AdminUser; token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    saveAdminSession(res.admin);
    return res;
  },

  async verifyPassword(password: string): Promise<boolean> {
    const res = await request<{ verified: boolean }>('/api/admin/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    return !!res.verified;
  },

  // ---------- Stats ----------
  async getStats(): Promise<AdminStats> {
    const res = await request<{ stats: AdminStats }>('/api/admin/stats');
    return res.stats;
  },

  // ---------- Activity Feed ----------
  async getActivityFeed(limit = 25): Promise<ActivityFeedItem[]> {
    const res = await request<{ feed: ActivityFeedItem[] }>(`/api/admin/activity-feed?limit=${limit}`);
    return res.feed || [];
  },

  // ---------- Users CRUD ----------
  async getUsers(params?: { search?: string; plan?: string; status?: string; sort?: string }): Promise<AdminUserItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.plan) query.append('plan', params.plan);
    if (params?.status) query.append('status', params.status);
    if (params?.sort) query.append('sort', params.sort);

    const res = await request<{ users: AdminUserItem[] }>(`/api/admin/users?${query.toString()}`);
    return res.users || [];
  },

  async getUserDetails(id: string): Promise<{
    user: AdminUserItem;
    creditHistory: AdminCreditTransaction[];
    tickets: AdminSupportTicket[];
    strategies: any[];
    proppass: any[];
  }> {
    return await request(`/api/admin/users/${id}`);
  },

  async createUser(user: Partial<AdminUserItem>): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return res.user;
  },

  async updateUser(id: string, updates: Partial<AdminUserItem>): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.user;
  },

  async deleteUser(id: string, reason: string): Promise<boolean> {
    await request(`/api/admin/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
    return true;
  },

  async suspendUser(id: string, duration: string, reason: string): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>(`/api/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ duration, reason })
    });
    return res.user;
  },

  async banUser(id: string, reason: string): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>(`/api/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.user;
  },

  async reactivateUser(id: string, reason: string): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>(`/api/admin/users/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.user;
  },

  async sendMessage(id: string, subject: string, message: string, template?: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/api/admin/users/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ subject, message, template })
    });
    return res.success;
  },

  // ---------- Bulk Operations ----------
  async bulkSuspend(userIds: string[], duration: string, reason: string): Promise<number> {
    const res = await request<{ updatedCount: number }>('/api/admin/users/bulk/suspend', {
      method: 'POST',
      body: JSON.stringify({ userIds, duration, reason })
    });
    return res.updatedCount;
  },

  async bulkReactivate(userIds: string[], reason: string): Promise<number> {
    const res = await request<{ updatedCount: number }>('/api/admin/users/bulk/reactivate', {
      method: 'POST',
      body: JSON.stringify({ userIds, reason })
    });
    return res.updatedCount;
  },

  async bulkMessage(userIds: string[], subject: string, message: string, template?: string): Promise<number> {
    const res = await request<{ sentCount: number }>('/api/admin/users/bulk/message', {
      method: 'POST',
      body: JSON.stringify({ userIds, subject, message, template })
    });
    return res.sentCount;
  },

  async modifyCredits(id: string, action: 'ADD' | 'REMOVE' | 'SET', amount: number, reason: string): Promise<{ user: AdminUserItem; transaction: AdminCreditTransaction }> {
    return await request(`/api/admin/users/${id}/credits`, {
      method: 'POST',
      body: JSON.stringify({ action, amount, reason })
    });
  },

  async changeSubscription(id: string, plan: AdminUserItem['plan'], startDate?: string, expiryDate?: string, reason?: string): Promise<AdminUserItem> {
    const res = await request<{ user: AdminUserItem }>(`/api/admin/users/${id}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ plan, startDate, expiryDate, reason })
    });
    return res.user;
  },

  // ---------- Financial Transactions Oversight ----------
  async getTransactions(params?: {
    dateRange?: 'today' | 'week' | 'month' | 'all' | 'custom';
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    paymentMethod?: string;
    search?: string;
    limit?: number;
  }): Promise<AdminTransactionItem[]> {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append('dateRange', params.dateRange);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.paymentMethod) query.append('paymentMethod', params.paymentMethod);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await request<{ transactions: AdminTransactionItem[] }>(`/api/admin/transactions?${query.toString()}`);
    return res.transactions || [];
  },

  async getTransactionAnalytics(params?: {
    dateRange?: 'today' | 'week' | 'month' | 'all' | 'custom';
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionAnalytics> {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append('dateRange', params.dateRange);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const res = await request<{ analytics: TransactionAnalytics }>(`/api/admin/transactions/analytics?${query.toString()}`);
    return res.analytics;
  },

  // ---------- Credits Ledger ----------
  async getCreditLedger(limit = 100): Promise<AdminCreditTransaction[]> {
    const res = await request<{ transactions: AdminCreditTransaction[] }>(`/api/admin/credits/ledger?limit=${limit}`);
    return res.transactions || [];
  },

  // ---------- Support Tickets ----------
  async getSupportTickets(params?: { status?: string; priority?: string; category?: string; search?: string; limit?: number }): Promise<AdminSupportTicket[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await request<{ tickets: AdminSupportTicket[] }>(`/api/admin/support/tickets?${query.toString()}`);
    return res.tickets || [];
  },

  async getTicketDetails(id: string): Promise<AdminSupportTicket> {
    const res = await request<{ ticket: AdminSupportTicket }>(`/api/admin/support/tickets/${id}`);
    return res.ticket;
  },

  async replyTicket(id: string, text: string, senderName?: string, updateStatusTo?: string): Promise<AdminSupportTicket> {
    const res = await request<{ ticket: AdminSupportTicket }>(`/api/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text, senderName, updateStatusTo })
    });
    return res.ticket;
  },

  async setTicketStatus(id: string, status: AdminSupportTicket['status']): Promise<AdminSupportTicket> {
    const res = await request<{ ticket: AdminSupportTicket }>(`/api/admin/support/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    return res.ticket;
  },

  async setTicketPriority(id: string, priority: AdminSupportTicket['priority']): Promise<AdminSupportTicket> {
    const res = await request<{ ticket: AdminSupportTicket }>(`/api/admin/support/tickets/${id}/priority`, {
      method: 'POST',
      body: JSON.stringify({ priority })
    });
    return res.ticket;
  },

  async addTicketNote(id: string, note: string): Promise<AdminSupportTicket> {
    const res = await request<{ ticket: AdminSupportTicket }>(`/api/admin/support/tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    return res.ticket;
  },

  // ---------- Audit Logs ----------
  async getAuditLogs(params?: { action?: string; search?: string; limit?: number }): Promise<AdminAuditLog[]> {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await request<{ logs: AdminAuditLog[] }>(`/api/admin/audit-logs?${query.toString()}`);
    return res.logs || [];
  },

  // ---------- Notifications ----------
  async getNotifications(): Promise<AdminNotification[]> {
    const res = await request<{ notifications: AdminNotification[] }>('/api/admin/notifications');
    return res.notifications || [];
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/api/admin/notifications/${id}/read`, { method: 'POST' });
    return res.success;
  },

  async markAllNotificationsRead(): Promise<boolean> {
    const res = await request<{ success: boolean }>('/api/admin/notifications/read-all', { method: 'POST' });
    return res.success;
  },

  // ---------- Settings ----------
  async getSettings(): Promise<AdminSettings> {
    const res = await request<{ settings: AdminSettings }>('/api/admin/settings');
    return res.settings;
  },

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const res = await request<{ settings: AdminSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return res.settings;
  },

  // ---------- Broadcasts ----------
  async getBroadcasts(): Promise<AdminBroadcast[]> {
    const res = await request<{ broadcasts: AdminBroadcast[] }>('/api/admin/broadcasts');
    return res.broadcasts || [];
  },

  async createBroadcast(broadcast: { title: string; message: string; urgency?: string; targetSegment?: string }): Promise<AdminBroadcast> {
    const res = await request<{ broadcast: AdminBroadcast }>('/api/admin/broadcasts', {
      method: 'POST',
      body: JSON.stringify(broadcast)
    });
    return res.broadcast;
  },

  async deleteBroadcast(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/api/admin/broadcasts/${id}`, {
      method: 'DELETE'
    });
    return res.success;
  }
};
