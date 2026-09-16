import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Moon,
  Sun,
  Shield,
  Check,
  Trash2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AdminUser, AdminNotification } from './types';
import { AdminApi } from './api';

interface AdminHeaderProps {
  admin: AdminUser;
  notifications: AdminNotification[];
  onRefreshNotifications: () => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  admin,
  notifications,
  onRefreshNotifications,
  onLogout,
  onToggleMobileMenu,
  theme,
  onToggleTheme,
  onGlobalSearch
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await AdminApi.markAllNotificationsRead();
      onRefreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await AdminApi.markNotificationRead(id);
      onRefreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGlobalSearch) {
      onGlobalSearch(searchQuery);
    }
  };

  return (
    <header className="h-16 bg-[#0d101f] border-b border-[#1e233d] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-[#161a30] text-slate-300 hover:text-white border border-[#262b49] lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onGlobalSearch) onGlobalSearch(e.target.value);
            }}
            placeholder="Search users, emails, tickets, or audit logs..."
            className="w-full pl-9 pr-4 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </form>
      </div>

      {/* Right: Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-[#161a30] hover:bg-[#1f2442] border border-[#262b49] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-[#161a30] hover:bg-[#1f2442] border border-[#262b49] text-slate-300 hover:text-white transition-colors relative cursor-pointer"
            title="Admin Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111427] border border-[#232847] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e233d]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Admin Activity Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No admin notifications at this time
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkSingleRead(notif.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        notif.isRead
                          ? 'bg-[#161a30]/50 border-transparent text-slate-400'
                          : 'bg-[#1a1f3a] border-purple-500/30 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-slate-100">{notif.title}</div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#161a30] hover:bg-[#1f2442] border border-[#262b49] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              PA
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-white leading-tight">Pipnexadmin</div>
              <div className="text-[10px] text-purple-400 font-mono">SUPER_ADMIN</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111427] border border-[#232847] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-[#1e233d] mb-1">
                <div className="text-xs font-bold text-white">Pipnexadmin</div>
                <div className="text-[11px] text-slate-400">admin@pipnexai.com</div>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">
                  <Shield className="w-3 h-3 text-purple-400" />
                  Super Administrator
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out from Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
