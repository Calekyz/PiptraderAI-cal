import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Coins,
  LifeBuoy,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Radio,
  FileText,
  ChevronRight,
  DollarSign,
  Activity,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { AdminStats, AdminSupportTicket, AdminAuditLog, AdminViewType, ActivityFeedItem } from '../types';
import { AdminApi } from '../api';

interface AdminOverviewProps {
  stats: AdminStats | null;
  tickets: AdminSupportTicket[];
  auditLogs: AdminAuditLog[];
  onNavigate: (view: AdminViewType) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  tickets,
  auditLogs,
  onNavigate,
  onSelectTicket
}) => {
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  useEffect(() => {
    const loadFeed = async () => {
      setLoadingFeed(true);
      try {
        const feed = await AdminApi.getActivityFeed(8);
        setActivityFeed(feed);
      } catch (err) {
        console.error('Failed to load activity feed:', err);
      } finally {
        setLoadingFeed(false);
      }
    };
    loadFeed();
  }, []);

  const urgentTickets = tickets.filter(
    t => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );

  const recentLogs = auditLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner / System Notice */}
      <div className="bg-gradient-to-r from-[#14182e] via-[#1a1f3c] to-[#12162b] border border-[#262c52] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-purple-600/5 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PipNex AI Core Systems Operational
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Live monitoring of users, subscriptions, credit ledgers, support tickets, and system governance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('users')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => onNavigate('support')}
              className="px-3.5 py-2 rounded-xl bg-[#202647] hover:bg-[#2a325e] text-slate-200 text-xs font-semibold border border-[#303761] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
              <span>Support Inbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-[#0f1224] border border-[#1e233d] hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Registered Traders</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalUsers ?? '...'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
              <UserCheck className="w-3 h-3" /> {stats?.activeUsers ?? 0} Active
            </span>
            <span>•</span>
            <span className="text-rose-400 flex items-center gap-0.5 font-medium">
              <UserX className="w-3 h-3" /> {stats?.suspendedUsers ?? 0} Suspended
            </span>
          </div>
        </div>

        {/* Total Credits */}
        <div
          onClick={() => onNavigate('credits')}
          className="bg-[#0f1224] border border-[#1e233d] hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Credits in Circulation</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.totalCreditsInCirculation ? Number(stats.totalCreditsInCirculation).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>AI Token Engine</span>
            <span className="text-amber-400 font-medium">100% Audited</span>
          </div>
        </div>

        {/* Gross Plan Revenue */}
        <div
          onClick={() => onNavigate('subscriptions')}
          className="bg-[#0f1224] border border-[#1e233d] hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Gross Revenue (USD)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            ${stats?.totalRevenueUsd ? Number(stats.totalRevenueUsd).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Verified Payments Ledger</span>
          </div>
        </div>

        {/* Support Tickets */}
        <div
          onClick={() => onNavigate('support')}
          className="bg-[#0f1224] border border-[#1e233d] hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Support Tickets</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {(stats?.ticketsBreakdown?.open || 0) + (stats?.ticketsBreakdown?.inProgress || 0)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">
              {stats?.ticketsBreakdown?.urgent || 0} Urgent
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">
              {stats?.ticketsBreakdown?.resolved || 0} Resolved
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Plan Breakdown & Urgent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriptions Distribution */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Subscription Distribution
              </h2>
              <button
                onClick={() => onNavigate('subscriptions')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View details →
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Free Trial (3-Day)', count: stats?.planBreakdown?.FreeTrial || 0, color: 'bg-slate-400' },
                { name: 'Starter Plan ($49)', count: stats?.planBreakdown?.Starter || 0, color: 'bg-blue-500' },
                { name: 'Pro Tier ($99)', count: stats?.planBreakdown?.Pro || 0, color: 'bg-purple-500' },
                { name: 'Elite Plan ($199)', count: stats?.planBreakdown?.Elite || 0, color: 'bg-amber-500' },
                { name: 'Platinum / Institutional', count: stats?.planBreakdown?.Platinum || 0, color: 'bg-cyan-500' }
              ].map((tier) => {
                const total = stats?.totalUsers || 1;
                const pct = Math.round((tier.count / total) * 100) || 0;
                return (
                  <div key={tier.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{tier.name}</span>
                      <span className="font-mono font-semibold text-white">
                        {tier.count} <span className="text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#171b33] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tier.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(pct, tier.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#1a1f3a] flex items-center justify-between text-xs text-slate-400">
            <span>Platform Policy:</span>
            <span className="text-slate-300 font-mono text-[11px]">Strict Non-Custodial SaaS</span>
          </div>
        </div>

        {/* Priority Support Queue */}
        <div className="lg:col-span-2 bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">High Priority Support Queue</h2>
                {urgentTickets.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    {urgentTickets.length} Pending Attention
                  </span>
                )}
              </div>

              <button
                onClick={() => onNavigate('support')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Go to Inbox →
              </button>
            </div>

            <div className="space-y-2">
              {urgentTickets.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-[#202545] rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <span>No urgent support tickets waiting. Everything is clear!</span>
                </div>
              ) : (
                urgentTickets.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      if (onSelectTicket) onSelectTicket(ticket.id);
                      onNavigate('support');
                    }}
                    className="p-3 bg-[#14182e] hover:bg-[#1a203d] border border-[#232847] hover:border-purple-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          {ticket.priority}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {ticket.subject}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{ticket.userName} ({ticket.userEmail})</span>
                        <span>•</span>
                        <span className="text-slate-500">{ticket.category}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a1f3a] text-right">
            <button
              onClick={() => onNavigate('support')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              View all {tickets.length} support inquiries →
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed & Security Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Platform Activity Feed */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Live Platform Activity Feed</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-time Stream
              </span>
            </div>

            <div className="space-y-2.5">
              {loadingFeed ? (
                <div className="py-8 text-center text-slate-500 text-xs">Streaming events...</div>
              ) : activityFeed.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No recent platform activities recorded.</div>
              ) : (
                activityFeed.map((item) => (
                  <div key={item.id} className="p-2.5 bg-[#14182e] border border-[#232847] rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          item.urgency === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.urgency === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.urgency === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {item.type}
                        </span>
                        <span className="font-semibold text-white truncate">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a1f3a] text-right">
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
            >
              View Financial Transactions <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Administrative Audit Timeline */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Recent Security & Governance Actions</h2>
              </div>
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Full Logs →
              </button>
            </div>

            <div className="divide-y divide-[#1b2038]">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                        {log.action}
                      </span>
                      <span className="text-slate-300 font-medium truncate">{log.details}</span>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-slate-400">
                        Reason: <span className="text-slate-300">{log.reason}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">
                      By {log.adminName || log.adminEmail} ({log.adminRole || 'SUPER_ADMIN'})
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 shrink-0 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a1f3a] text-right">
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              View all audit trail entries →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
