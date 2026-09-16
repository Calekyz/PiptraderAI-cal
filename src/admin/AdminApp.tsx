import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminOverview } from './views/AdminOverview';
import { UserManagement } from './views/UserManagement';
import { TransactionsView } from './views/TransactionsView';
import { SubscriptionManagement } from './views/SubscriptionManagement';
import { CreditManagement } from './views/CreditManagement';
import { SupportInbox } from './views/SupportInbox';
import { AuditLogsView } from './views/AuditLogsView';
import { BroadcastsView } from './views/BroadcastsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import {
  AdminViewType,
  AdminStats,
  AdminNotification,
  AdminUser,
  AdminSupportTicket,
  AdminAuditLog
} from './types';
import { AdminApi, getStoredAdmin, clearAdminSession } from './api';

export const AdminApp: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    return getStoredAdmin();
  });

  const [currentView, setCurrentView] = useState<AdminViewType>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Global Admin State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Search filter passed from overview or header
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const fetchGlobalData = async () => {
    if (!adminUser) return;
    try {
      const [stRes, notifsRes, ticketsRes, logsRes] = await Promise.allSettled([
        AdminApi.getStats(),
        AdminApi.getNotifications(),
        AdminApi.getSupportTickets({ limit: 10 }),
        AdminApi.getAuditLogs({ limit: 10 })
      ]);
      if (stRes.status === 'fulfilled' && stRes.value) setStats(stRes.value);
      if (notifsRes.status === 'fulfilled' && notifsRes.value) setNotifications(notifsRes.value);
      if (ticketsRes.status === 'fulfilled' && ticketsRes.value) setTickets(ticketsRes.value);
      if (logsRes.status === 'fulfilled' && logsRes.value) setAuditLogs(logsRes.value);
    } catch (err) {
      console.warn('Admin global data synchronized with fallback cache:', err);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchGlobalData();
      const interval = setInterval(fetchGlobalData, 30000); // 30s auto refresh
      return () => clearInterval(interval);
    }
  }, [adminUser]);

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminUser(null);
  };

  const handleReturnToMainApp = () => {
    window.location.hash = '';
    window.location.search = '';
    window.location.reload();
  };

  const handleNavigate = (view: AdminViewType) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  const handleSelectTicketFromOverview = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setCurrentView('support');
  };

  const handleGlobalSearch = (query: string) => {
    setUserSearchQuery(query);
    setCurrentView('users');
  };

  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToApp={handleReturnToMainApp}
      />
    );
  }

  const openTicketsCount = stats?.ticketsBreakdown?.open || 0;
  const totalUsersCount = stats?.totalUsers || 0;

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Top Level App Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar Navigation */}
        <AdminSidebar
          currentView={currentView}
          onSelectView={handleNavigate}
          openTicketsCount={openTicketsCount}
          totalUsersCount={totalUsersCount}
          onBackToApp={handleReturnToMainApp}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Header */}
          <AdminHeader
            admin={adminUser}
            notifications={notifications}
            onRefreshNotifications={fetchGlobalData}
            onLogout={handleLogout}
            onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            onGlobalSearch={handleGlobalSearch}
          />

          {/* Dynamic View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              {currentView === 'overview' && (
                <AdminOverview
                  stats={stats}
                  tickets={tickets}
                  auditLogs={auditLogs}
                  onNavigate={handleNavigate}
                  onSelectTicket={handleSelectTicketFromOverview}
                />
              )}

              {currentView === 'users' && (
                <UserManagement
                  initialSearchQuery={userSearchQuery}
                  onRefreshStats={fetchGlobalData}
                />
              )}

              {currentView === 'transactions' && (
                <TransactionsView
                  onRefreshStats={fetchGlobalData}
                />
              )}

              {currentView === 'subscriptions' && (
                <SubscriptionManagement
                  stats={stats}
                  onRefreshStats={fetchGlobalData}
                />
              )}

              {currentView === 'credits' && (
                <CreditManagement
                  stats={stats}
                  onRefreshStats={fetchGlobalData}
                />
              )}

              {currentView === 'support' && (
                <SupportInbox
                  initialTicketId={selectedTicketId}
                  stats={stats}
                  onRefreshStats={fetchGlobalData}
                />
              )}

              {currentView === 'broadcasts' && <BroadcastsView />}

              {currentView === 'audit-logs' && <AuditLogsView />}

              {currentView === 'settings' && <AdminSettingsView />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
