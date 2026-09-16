import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Coins,
  LifeBuoy,
  Radio,
  FileText,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  X
} from 'lucide-react';
import { AdminViewType } from './types';

interface AdminSidebarProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  openTicketsCount?: number;
  totalUsersCount?: number;
  onBackToApp: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  openTicketsCount = 0,
  totalUsersCount = 0,
  onBackToApp,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems: Array<{
    id: AdminViewType;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview & Stats',
      icon: LayoutDashboard
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      badge: totalUsersCount > 0 ? totalUsersCount : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      id: 'transactions',
      label: 'Financial & Transactions',
      icon: DollarSign
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: CreditCard
    },
    {
      id: 'credits',
      label: 'Credit Ledger',
      icon: Coins
    },
    {
      id: 'support',
      label: 'Support Desk',
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? `${openTicketsCount} Open` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'broadcasts',
      label: 'Broadcasts',
      icon: Radio
    },
    {
      id: 'audit-logs',
      label: 'Security & Audits',
      icon: FileText
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: Settings
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d101f] border-r border-[#1e233d] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1e233d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-purple-600/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-wide">PipNex AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">pipnexai.adminpanel</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            aria-label="Close admin navigation"
            title="Close menu"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white lg:hidden border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administrative Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161a30] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Badge / Constraint Notice */}
        <div className="p-3 border-t border-[#1e233d] space-y-2">
          <div className="bg-[#12162b] border border-[#202647] rounded-xl p-2.5 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-200 font-medium block">Policy Enforced</span>
              <span className="text-[10px] text-slate-400">Strict Non-Custodial Core</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToApp}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#161a30] hover:bg-[#1f2442] border border-[#262b49] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            <span>Open User App Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
