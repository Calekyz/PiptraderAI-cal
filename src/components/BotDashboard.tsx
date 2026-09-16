import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Zap,
  MessageSquare, 
  UploadCloud, 
  Layers, 
  Radio, 
  Crown, 
  BookOpen, 
  Headphones, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronDown, 
  ChevronRight,
  User, 
  ShieldCheck, 
  Calculator, 
  Shield, 
  Sun, 
  Moon, 
  BarChart2,
  CreditCard,
  Link2,
  Diamond,
  HelpCircle,
  CheckCircle2,
  Check,
  Globe,
  Home,
  Cpu,
  Upload
} from 'lucide-react';
import { UserProfile, MacroEvent, TrialStatusResponse } from '../types';
import { ForexTicker } from './ForexTicker';
import { ThemeToggle } from './ThemeToggle';
import { OverviewView } from './views/OverviewView';
import { PromptTradingView } from './views/PromptTradingView';
import { AutoTradingView } from './views/AutoTradingView';
import { AITradingView } from './views/AITradingView';
import { UploadChartView } from './views/UploadChartView';
import { ManageBotsView } from './views/ManageBotsView';
import { PulseSignalsView } from './views/PulseSignalsView';
import { PositionCalculatorView } from './views/PositionCalculatorView';
import { PropPassView } from './views/PropPassView';
import { QuickAccessTools } from './views/QuickAccessToolsView';
import { SubscriptionView } from './views/SubscriptionView';
import { HowToUseView } from './views/HowToUseView';
import { ContactSupportView } from './views/ContactSupportView';
import { SettingsView } from './views/SettingsView';
import { ForexFactoryNewsView } from './views/ForexFactoryNewsView';
import { HorizontalQuickAccessMenu } from './HorizontalQuickAccessMenu';
import { TrishAssistantModal } from './TrishAssistantModal';
import { MacroAnalysisModal } from './MacroAnalysisModal';
import { UpgradePlanModal } from './UpgradePlanModal';
import { MT5ConnectionModal } from './MT5ConnectionModal';
import { MyProfileModal } from './MyProfileModal';
import { TrialCountdownBanner } from './TrialCountdownBanner';
import { PremiumLock } from './PremiumLock';
import { fetchTrialStatusAsync } from '../lib/authService';

interface BotDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSetTheme?: (mode: 'dark' | 'light') => void;
}

export const BotDashboard: React.FC<BotDashboardProps> = ({
  user,
  onLogout,
  onUpdateUser,
  theme = 'dark',
  onToggleTheme,
  onSetTheme
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Local theme state fallback if not controlled
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pipnex_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const currentTheme = theme || localTheme;

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const nextTheme = localTheme === 'dark' ? 'light' : 'dark';
      setLocalTheme(nextTheme);
      try {
        localStorage.setItem('pipnex_theme', nextTheme);
      } catch {}
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
    }
  };

  const handleSetTheme = (newMode: 'dark' | 'light') => {
    if (onSetTheme) {
      onSetTheme(newMode);
    } else {
      setLocalTheme(newMode);
      try {
        localStorage.setItem('pipnex_theme', newMode);
      } catch {}
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
    }
  };

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMT5ModalOpen, setIsMT5ModalOpen] = useState(false);

  // Responsive Sidebar / Drawer State with persistence in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('pipnex_sidebar_open');
      if (stored !== null) {
        return stored === 'true';
      }
      if (typeof window !== 'undefined') {
        return window.innerWidth >= 1024;
      }
      return true;
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pipnex_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem('pipnex_sidebar_open', 'false');
    } catch {}
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
    try {
      localStorage.setItem('pipnex_sidebar_open', 'true');
    } catch {}
  };

  // Close sidebar when pressing Escape on mobile or desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        handleCloseSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Modals state
  const [isTrishOpen, setIsTrishOpen] = useState(false);
  const [selectedMacroEvent, setSelectedMacroEvent] = useState<MacroEvent | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeDefaultTier, setUpgradeDefaultTier] = useState<any>('Pro');

  // Trial status & access control state
  const [trialStatus, setTrialStatus] = useState<TrialStatusResponse | null>(null);

  const refreshTrialStatus = async () => {
    if (user?.email) {
      try {
        const res = await fetchTrialStatusAsync(user.email);
        if (res) setTrialStatus(res);
      } catch (e) {
        console.warn('Could not sync trial status:', e);
      }
    }
  };

  useEffect(() => {
    refreshTrialStatus();
  }, [user?.email, user?.plan]);

  const handleOpenUpgrade = (tier: any = 'Pro') => {
    setUpgradeDefaultTier(tier);
    setIsUpgradeModalOpen(true);
  };

  const handleUpgradeSuccess = (newPlan: any) => {
    onUpdateUser({ plan: newPlan });
    refreshTrialStatus();
  };

  // Strict Whitelist for Admin Panel access (ONLY these two email accounts)
  const isAdmin = Boolean(
    user?.email &&
    (user.email.toLowerCase().trim() === 'pipnexaicustomer@gmail.com' ||
     user.email.toLowerCase().trim() === 'oruchodaniel21@gmail.com')
  );

  // Sidebar navigation items with icon, label, and badges
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'news-calendar', label: 'News & Calendar', icon: Globe, isDiamond: true, dotColor: 'bg-rose-500' },
    { id: 'quick-start', label: 'Quick Access Tools', icon: Zap },
    { id: 'prompt-trading', label: 'Prompt Trading', icon: MessageSquare, isDiamond: true },
    { id: 'auto-trading', label: 'Auto Trading', icon: Zap, isDiamond: true },
    { id: 'ai-trading', label: 'AI Trading', icon: BarChart2 },
    { id: 'upload-chart', label: 'Upload Chart', icon: UploadCloud },
    { id: 'position-calculator', label: 'Position Size Calc', icon: Calculator },
    { id: 'proppass', label: 'PropPass', icon: Shield },
    { id: 'manage-bots', label: 'Manage Bots', icon: Layers, isDiamond: true, dotColor: 'bg-[#a855f7]' },
    { id: 'pulse-signals', label: 'Pulse Signals', icon: Radio, isDiamond: true, dotColor: 'bg-[#10b981]' },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'how-to-use', label: 'How to Use', icon: BookOpen },
    { id: 'contact-support', label: 'Contact Support', icon: Headphones },
    { id: 'settings', label: 'Settings', icon: Settings, hasChevron: true },
    ...(isAdmin ? [{ 
      id: 'admin', 
      label: '⚙️ Admin Panel', 
      icon: ShieldCheck, 
      isAdmin: true,
      href: '/admin'
    }] : []),
  ];

  const handleNavItemClick = (itemId: string) => {
    if (itemId === 'admin') {
      window.location.hash = '#admin';
      try {
        if (window.history?.pushState) {
          window.history.pushState(null, '', '/admin');
        }
      } catch {}
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('hashchange'));
      return;
    }
    setActiveTab(itemId);
  };

  const bottomNavItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'auto-trading', label: 'Auto', icon: Zap },
    { id: 'upload-chart', label: 'Upload', icon: Upload, isCenter: true },
    { id: 'subscription', label: 'Plan', icon: CreditCard },
    { id: 'manage-bots', label: 'Strategy', icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#07080d] text-[#0f172a] dark:text-[#f8fafc] flex font-sans selection:bg-purple-500/20 selection:text-purple-700 relative transition-colors duration-200">
      <div className="liquid-glass-body-glow" aria-hidden="true" />
      {/* Main Container Layout with Fixed Desktop Sidebar */}
      <div className="flex-1 flex min-w-0 relative bg-[#f8f9fc] dark:bg-[#07080d]">
        
        {/* DESKTOP COLLAPSIBLE FIXED SIDEBAR */}
        <aside
          id="desktop-sidebar"
          aria-hidden={!isSidebarOpen}
          className={`fixed top-0 left-0 h-screen w-64 xl:w-72 bg-white dark:bg-[#0c0e18] border-r border-[#e5e7eb] dark:border-[#171a27] p-4 flex-col justify-between shrink-0 z-30 shadow-xs select-none overflow-y-auto custom-scrollbar transition-transform duration-300 ${
            isSidebarOpen
              ? 'hidden lg:flex translate-x-0'
              : 'hidden -translate-x-full pointer-events-none invisible'
          }`}
        >
          <div className="space-y-4">
            {/* Brand Header with Close/Collapse Button */}
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100 dark:border-[#171a27]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f0edfe] dark:bg-[#18152e] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-[#0f172a] dark:text-white font-mono">pipnex</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0edfe] dark:bg-[#18152e] text-[#5b3fe4] dark:text-purple-300 font-mono border border-purple-200 dark:border-purple-500/30 font-bold">AI</span>
                </div>
              </div>

              {/* X Close / Collapse button */}
              <button
                id="sidebar-desktop-collapse-btn"
                onClick={handleCloseSidebar}
                aria-label="Close sidebar"
                title="Close sidebar"
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#16192b] hover:bg-gray-200 dark:hover:bg-[#20253e] text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#262c46] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] pr-1 custom-scrollbar">
              {navItems.map((item: any) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || 
                  (item.id === 'quick-start' && activeTab === 'quick-access') ||
                  (item.id === 'prompt-trading' && activeTab === 'prompt-chart');
                const isSpecialAdmin = Boolean(item.isAdmin);

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] tracking-normal transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-[#f0edfe] dark:bg-[#1d1738] text-[#5b3fe4] dark:text-purple-300 font-bold shadow-2xs'
                        : isSpecialAdmin
                        ? 'text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/40 font-semibold shadow-2xs'
                        : 'text-[#374151] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#131627] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'text-[#5b3fe4] dark:text-purple-300'
                          : isSpecialAdmin
                          ? 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                          : 'text-[#6b7280] dark:text-slate-400 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSpecialAdmin && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          VIP
                        </span>
                      )}
                      {item.isDiamond && (
                        <span className="text-[11px] text-[#a855f7]" title="Premium Feature">💎</span>
                      )}
                      {item.dotColor && !item.isDiamond && (
                        <span className={`w-2 h-2 rounded-full ${item.dotColor} shadow-xs`} />
                      )}
                      {item.hasChevron && (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Theme Switcher & User Profile Card at Bottom of Sidebar */}
          <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#171a27] space-y-2">
            {/* Quick Theme Switcher Pill */}
            <div className="px-1">
              <ThemeToggle
                theme={currentTheme}
                onToggle={handleToggleTheme}
                variant="expanded"
              />
            </div>

            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-2.5 rounded-2xl bg-[#fafafa] dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1e2238] flex items-center justify-between shadow-2xs hover:border-purple-300 dark:hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#f0edfe] dark:bg-[#1c1635] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center font-bold text-[#5b3fe4] dark:text-purple-300 text-xs shrink-0 shadow-2xs">
                  {user.firstName[0] || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#0f172a] dark:text-white truncate group-hover:text-[#5b3fe4] dark:group-hover:text-purple-300 transition-colors">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-mono truncate font-semibold">
                    {user.plan || 'Pro Plan'}
                  </div>
                </div>
              </div>

              <button
                id="sidebar-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Sign out"
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE / TABLET SLIDE-IN NAVIGATION DRAWER */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden transition-opacity duration-300">
            {/* Smooth Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={handleCloseSidebar}
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0c0e18] border-r border-[#e5e7eb] dark:border-[#171a27] p-4 flex flex-col justify-between z-10 shadow-xl animate-in slide-in-from-left duration-200">
              <div>
                {/* Brand Logo & Close Button */}
                <div className="flex items-center justify-between px-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#f0edfe] dark:bg-[#18152e] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black tracking-tight text-[#0f172a] dark:text-white font-mono">pipnex</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0edfe] dark:bg-[#18152e] text-[#5b3fe4] dark:text-purple-300 font-mono border border-purple-200 dark:border-purple-500/30 font-bold">AI</span>
                    </div>
                  </div>

                  <button
                    id="sidebar-mobile-close-btn"
                    onClick={handleCloseSidebar}
                    aria-label="Close sidebar"
                    title="Close sidebar"
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#16192b] hover:bg-gray-200 dark:hover:bg-[#20253e] text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#262c46] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Navigation List */}
                <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 custom-scrollbar">
                  {navItems.map((item: any) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || 
                      (item.id === 'quick-start' && activeTab === 'quick-access') ||
                      (item.id === 'prompt-trading' && activeTab === 'prompt-chart');
                    const isSpecialAdmin = Boolean(item.isAdmin);

                    return (
                      <button
                        key={item.id}
                        id={`drawer-nav-${item.id}`}
                        onClick={() => {
                          handleCloseSidebar();
                          handleNavItemClick(item.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] tracking-normal transition-all group cursor-pointer ${
                          isActive
                            ? 'bg-[#f0edfe] dark:bg-[#1d1738] text-[#5b3fe4] dark:text-purple-300 font-bold shadow-2xs'
                            : isSpecialAdmin
                            ? 'text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/40 font-semibold shadow-2xs'
                            : 'text-[#374151] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#131627] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#5b3fe4] dark:text-purple-300'
                              : isSpecialAdmin
                              ? 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                              : 'text-[#6b7280] dark:text-slate-400 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSpecialAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              VIP
                            </span>
                          )}
                          {item.isDiamond && (
                            <span className="text-[11px] text-[#a855f7]">💎</span>
                          )}
                          {item.dotColor && !item.isDiamond && (
                            <span className={`w-2 h-2 rounded-full ${item.dotColor} shadow-xs`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* User Account Snippet at Bottom */}
              <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#171a27] space-y-2">
                <div className="px-1">
                  <ThemeToggle
                    theme={currentTheme}
                    onToggle={handleToggleTheme}
                    variant="expanded"
                  />
                </div>

                <div className="p-2.5 rounded-2xl bg-white dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1e2238] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-[#f0edfe] dark:bg-[#1c1635] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center font-bold text-[#5b3fe4] dark:text-purple-300 text-xs shrink-0">
                      {user.firstName[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-mono truncate font-semibold">
                        {user.plan || 'Pro Plan'}
                      </div>
                    </div>
                  </div>

                  <button
                    id="drawer-logout-btn"
                    onClick={() => {
                      handleCloseSidebar();
                      onLogout();
                    }}
                    title="Sign out"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Main View Area with Dynamic Sidebar Offset */}
        <main className={`flex-1 flex flex-col min-w-0 min-h-screen bg-white dark:bg-[#07080d] overflow-x-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64 xl:ml-72' : 'ml-0'
        }`}>
          {/* Top Real-Time Forex & Asset Live Ticker */}
          <ForexTicker />
          
          {/* Top App Bar */}
          <header className="h-16 border-b border-[#e5e7eb] dark:border-[#171a27] px-4 md:px-8 flex items-center justify-between shrink-0 bg-white dark:bg-[#0c0e18] sticky top-0 z-50 transition-colors">
            <div className="flex items-center gap-3">
              {/* ☰ Hamburger Menu Button */}
              <button
                id="main-hamburger-menu-btn"
                type="button"
                onClick={handleToggleSidebar}
                aria-expanded={isSidebarOpen}
                aria-controls="desktop-sidebar"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                className="p-2 rounded-xl bg-white dark:bg-[#141624] hover:bg-gray-50 dark:hover:bg-[#1c2035] text-[#0f172a] dark:text-white border border-[#e5e7eb] dark:border-[#22273d] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand Logo & Current Section */}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#f0edfe] dark:bg-[#18152e] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-black text-[#0f172a] dark:text-white font-mono">PipNex</span>
                  <span className="text-gray-300 dark:text-gray-600 font-light">/</span>
                </div>
                <span className="font-bold text-[#0f172a] dark:text-white text-xs sm:text-sm uppercase tracking-wider font-mono">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Right Header Action Items */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Header Theme Toggle Component */}
              <ThemeToggle
                id="header-theme-toggle-btn"
                theme={currentTheme}
                onToggle={handleToggleTheme}
                variant="pill"
                className="hidden sm:inline-flex"
              />
              <ThemeToggle
                id="header-theme-toggle-mobile-btn"
                theme={currentTheme}
                onToggle={handleToggleTheme}
                variant="circle"
                className="sm:hidden"
              />

              {/* Notification Bell Button */}
              <div className="relative">
                <button
                  id="header-notifications-btn"
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsUserMenuOpen(false);
                  }}
                  title="Notifications"
                  className="w-9 h-9 rounded-full bg-white dark:bg-[#141624] hover:bg-gray-50 dark:hover:bg-[#1c2035] border border-[#e5e7eb] dark:border-[#22273d] flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all shadow-xs active:scale-95 cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-[#5b3fe4] absolute top-2 right-2 border-2 border-white dark:border-[#141624]" />
                </button>

                {/* Notifications Popover */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0e101d] border border-[#e5e7eb] dark:border-[#20243d] rounded-2xl p-3 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-2 text-[#0f172a] dark:text-white">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb] dark:border-[#20243d]">
                      <span className="font-bold text-sm text-[#0f172a] dark:text-white">Notifications</span>
                      <span className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-semibold cursor-pointer">Mark all as read</span>
                    </div>
                    <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                      <div className="p-2.5 rounded-xl bg-[#faf9ff] dark:bg-[#151829] border border-purple-100 dark:border-purple-900/30 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-[#0f172a] dark:text-white">Signal Triggered: XAG/USD</div>
                          <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5">Silver reached key resistance level at $68.96.</div>
                          <div className="text-[10px] text-[#94a3b8] mt-1">2 mins ago</div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121422] border border-[#e5e7eb] dark:border-[#20243d] flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-[#0f172a] dark:text-white">ForexFactory Live Calendar</div>
                          <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5">High impact USD releases synced directly from ForexFactory.</div>
                          <div className="text-[10px] text-[#94a3b8] mt-1">1 hour ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Dropdown Menu */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsNotificationsOpen(false);
                  }}
                  className="w-9 h-9 rounded-full bg-[#f0edfe] dark:bg-[#1c1635] hover:bg-[#e6e0fd] dark:hover:bg-[#251e44] border border-purple-200 dark:border-purple-500/30 text-[#5b3fe4] dark:text-purple-300 font-bold text-xs flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName && user.lastName
                    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                    : (user.firstName ? user.firstName.substring(0, 2).toUpperCase() : 'DJ')}
                </button>

                {/* DROPDOWN MENU */}
                {isUserMenuOpen && (
                  <div 
                    id="user-profile-dropdown-card"
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0e101d] border border-[#e5e7eb] dark:border-[#20243d] rounded-3xl p-3.5 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-2 text-[#0f172a] dark:text-white select-none"
                  >
                    {/* User Header Profile Block */}
                    <div className="p-2 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#f0edfe] dark:bg-[#1c1635] border border-purple-200 dark:border-purple-500/30 text-[#5b3fe4] dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {user.firstName && user.lastName
                          ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                          : (user.email ? user.email.substring(0, 2).toUpperCase() : 'DD')}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="font-medium text-[#0f172a] dark:text-white text-[13px] truncate">
                          {user.email || `${user.firstName?.toLowerCase() || 'trader'}@pipnexai.com`}
                        </div>
                        <div className="mt-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#f0edfe] dark:bg-[#1c1635] text-[#5b3fe4] dark:text-purple-300 text-[11px] font-medium tracking-wide inline-block border border-purple-200 dark:border-purple-500/30">
                            {user.plan === 'Platinum' ? 'Platinum Tier' : 'Free Trial'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="my-2 border-t border-[#e5e7eb] dark:border-[#20243d]" />

                    {/* Section 1: Profile & Connections */}
                    <div className="space-y-1">
                      {/* 1. My Profile */}
                      <button
                        id="menu-my-profile-btn"
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#0f172a] dark:text-slate-200 hover:bg-[#f0edfe] dark:hover:bg-[#1a1735] hover:text-[#5b3fe4] dark:hover:text-purple-300 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <User className="w-4 h-4 text-[#64748b] dark:text-slate-400 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 stroke-[1.8] transition-colors" />
                          <span className="font-normal text-[14px]">My Profile</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 2. Subscription & Billing */}
                      <button
                        id="menu-subscription-billing-btn"
                        onClick={() => {
                          setActiveTab('subscription');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#0f172a] dark:text-slate-200 hover:bg-[#f0edfe] dark:hover:bg-[#1a1735] hover:text-[#5b3fe4] dark:hover:text-purple-300 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <CreditCard className="w-4 h-4 text-[#64748b] dark:text-slate-400 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 stroke-[1.8] transition-colors" />
                          <span className="font-normal text-[14px]">Subscription &amp; Billing</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 3. MT5 Account Connection */}
                      <button
                        id="menu-mt5-connection-btn"
                        onClick={() => {
                          setIsMT5ModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white flex items-center justify-between transition-colors shadow-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <Link2 className="w-4 h-4 text-white stroke-[2]" />
                          <span className="font-medium text-[14px] text-white">MT5 Account Connection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            {user.mt5Connected ? 'Connected' : 'Setup'}
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="my-2 border-t border-[#e5e7eb] dark:border-[#20243d]" />

                    {/* Section 2: Theme Switcher & Help */}
                    <div className="space-y-1">
                      <button
                        id="menu-toggle-theme-btn"
                        onClick={handleToggleTheme}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#0f172a] dark:text-slate-200 hover:bg-[#f0edfe] dark:hover:bg-[#1a1735] hover:text-[#5b3fe4] dark:hover:text-purple-300 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          {currentTheme === 'dark' ? (
                            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                          ) : (
                            <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform" />
                          )}
                          <span className="font-normal text-[14px]">
                            {currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#1f233a] text-[#5b3fe4] dark:text-purple-300">
                          {currentTheme === 'dark' ? 'DARK' : 'LIGHT'}
                        </span>
                      </button>

                      <button
                        id="menu-help-support-btn"
                        onClick={() => {
                          setActiveTab('contact-support');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#0f172a] dark:text-slate-200 hover:bg-[#f0edfe] dark:hover:bg-[#1a1735] hover:text-[#5b3fe4] dark:hover:text-purple-300 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <HelpCircle className="w-4 h-4 text-[#64748b] dark:text-slate-400 group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 stroke-[1.8] transition-colors" />
                          <span className="font-normal text-[14px]">Help &amp; Support</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#5b3fe4] dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    <div className="my-2 border-t border-[#e5e7eb] dark:border-[#20243d]" />

                    {/* Section 3: Sign Out */}
                    <div>
                      <button
                        id="menu-sign-out-btn"
                        onClick={onLogout}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#ef4444] hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3.5 font-medium transition-colors cursor-pointer group"
                      >
                        <LogOut className="w-4 h-4 text-[#ef4444] stroke-[2]" />
                        <span className="text-[14px] font-medium text-[#ef4444]">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Real-time 3-Day Early Access Trial Countdown Banner */}
          <TrialCountdownBanner
            user={user}
            trialStatus={trialStatus}
            onUpgradeClick={() => handleOpenUpgrade('Pro')}
            onTrialExpired={() => refreshTrialStatus()}
          />

          {/* Horizontal Feature / Quick Access Menu (PipNex AI Pro) */}
          <HorizontalQuickAccessMenu
            activeTab={activeTab}
            onNavigateToTab={(tabId) => setActiveTab(tabId)}
          />

          {/* Main Content Area */}
          <div className={`p-3 md:p-6 pb-20 md:pb-24 w-full flex-1 space-y-6 ${
            activeTab === 'ai-trading' ? 'max-w-[1720px] mx-auto px-2 sm:px-4' : 'max-w-7xl mx-auto'
          }`}>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewView
                user={user}
                onOpenTrish={() => setIsTrishOpen(true)}
                onOpenMacroAnalysis={(evt) => setSelectedMacroEvent(evt)}
                onOpenUpgrade={handleOpenUpgrade}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {/* ForexFactory News & Calendar Dedicated View */}
            {(activeTab === 'news-calendar' || activeTab === 'news') && (
              <ForexFactoryNewsView
                onOpenMacroAnalysis={(evt) => setSelectedMacroEvent(evt)}
                onNavigateToChart={(pair) => {
                  setActiveTab('ai-trading');
                }}
              />
            )}

            {/* Quick Start / Quick Access Tools */}
            {(activeTab === 'quick-start' || activeTab === 'quick-access') && (
              <QuickAccessTools 
                onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                onOpenUpgrade={handleOpenUpgrade}
              />
            )}

            {/* Prompt Trading AI / Prompt Chart */}
            {(activeTab === 'prompt-trading' || activeTab === 'prompt-chart') && (
              <PromptTradingView />
            )}

            {/* Upload Chart */}
            {activeTab === 'upload-chart' && (
              <UploadChartView />
            )}

            {/* FEATURE #4: Manage Bots (Locked without Pro/Active Trial) */}
            {activeTab === 'manage-bots' && (
              <PremiumLock
                featureName="Manage Automated Bots"
                featureDescription="Deploy, monitor, and backtest automated algorithmic trading bots with risk guardrails."
                user={user}
                trialStatus={trialStatus}
                onUpgradeClick={() => handleOpenUpgrade('Pro')}
                benefits={[
                  'Manage and execute unlimited automated trading algorithms',
                  'Live execution telemetry, win-rate trackers, and drawdown limits',
                  'Prop-firm compliant risk management (FTMO & MFF presets)'
                ]}
              >
                <ManageBotsView 
                  onBack={() => setActiveTab('overview')} 
                  onNavigateToBuilder={() => setActiveTab('prompt-trading')}
                  onNavigateToSubscription={() => setActiveTab('subscription')}
                />
              </PremiumLock>
            )}

            {/* FEATURE #3: Set Up Auto Trading (Locked without Pro/Active Trial) */}
            {activeTab === 'auto-trading' && (
              <PremiumLock
                featureName="Set Up Auto Trading"
                featureDescription="Configure automated trade triggers, MT5 execution bridge, and risk profiles."
                user={user}
                trialStatus={trialStatus}
                onUpgradeClick={() => handleOpenUpgrade('Pro')}
                benefits={[
                  'Automated signal-to-order execution via cloud trading engine',
                  'Custom lot-size sizing and risk-per-trade parameters',
                  'Direct broker bridge & real-time webhook notification triggers'
                ]}
              >
                <AutoTradingView 
                  user={user} 
                  onOpenUpgrade={handleOpenUpgrade} 
                />
              </PremiumLock>
            )}

            {/* FEATURE #1: AI Trading (Locked without Pro/Active Trial) */}
            {activeTab === 'ai-trading' && (
              <PremiumLock
                featureName="AI Trading Engine"
                featureDescription="Access Gemini 3.7 deep multi-timeframe price action analysis, dynamic support/resistance, and institutional trade setups."
                user={user}
                trialStatus={trialStatus}
                onUpgradeClick={() => handleOpenUpgrade('Pro')}
                benefits={[
                  'Deep institutional chart pattern analysis with Gemini 3.7',
                  'Exact Entry, TP1, TP2, and Stop Loss recommendations',
                  'Real-time liquidity sweep & order block detection'
                ]}
              >
                <AITradingView
                  user={user}
                  theme={currentTheme}
                  onOpenTrish={() => setIsTrishOpen(true)}
                  onOpenUpgrade={handleOpenUpgrade}
                  onBack={() => setActiveTab('overview')}
                />
              </PremiumLock>
            )}

            {/* FEATURE #2: Position Calculator (Locked without Pro/Active Trial) */}
            {activeTab === 'position-calculator' && (
              <PremiumLock
                featureName="Position Risk Calculator"
                featureDescription="Calculate exact lot sizes, pip values, margin requirements, and risk-to-reward ratios across all asset classes."
                user={user}
                trialStatus={trialStatus}
                onUpgradeClick={() => handleOpenUpgrade('Starter')}
                benefits={[
                  'Exact lot size computation based on account equity and risk %',
                  'Automatic pip value conversion for Forex, Crypto, Indices, and Metals',
                  'Prop firm max daily drawdown protection calculations'
                ]}
              >
                <PositionCalculatorView />
              </PremiumLock>
            )}

            {/* PropPass */}
            {activeTab === 'proppass' && (
              <PropPassView onNavigateToTab={(tab) => setActiveTab(tab)} />
            )}

            {/* FEATURE #5: Analyze Quick Signals / Pulse Signals (Locked without Pro/Active Trial) */}
            {activeTab === 'pulse-signals' && (
              <PremiumLock
                featureName="Analyze Quick Signals"
                featureDescription="Real-time institutional scalping and swing trade pulse signals with high probability setups."
                user={user}
                trialStatus={trialStatus}
                onUpgradeClick={() => handleOpenUpgrade('Pro')}
                benefits={[
                  'Ultra-low latency scalp & breakout signals generated every minute',
                  'AI confidence score, volume confirmation, and risk reward metrics',
                  'One-click execution into AI Trading workspace'
                ]}
              >
                <PulseSignalsView 
                  onBack={() => setActiveTab('overview')}
                  onOpenUpgrade={handleOpenUpgrade}
                  onExecuteSignal={(sig) => {
                    setActiveTab('ai-trading');
                  }}
                />
              </PremiumLock>
            )}

            {/* Subscription Management */}
            {activeTab === 'subscription' && (
              <SubscriptionView
                user={user}
                onOpenUpgrade={handleOpenUpgrade}
              />
            )}

            {/* How to Use */}
            {activeTab === 'how-to-use' && (
              <HowToUseView />
            )}

            {/* Contact Support */}
            {activeTab === 'contact-support' && (
              <ContactSupportView 
                user={user} 
                onBack={() => setActiveTab('overview')}
              />
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                onUpdateUser={onUpdateUser}
                onLogout={onLogout}
                onOpenUpgrade={handleOpenUpgrade}
                currentTheme={currentTheme}
                onSetTheme={handleSetTheme}
              />
            )}

          </div>

          {/* FLOATING BOTTOM OVERLAY NAVIGATION BAR */}
          <div className="fixed bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full flex justify-center px-6 sm:px-0">
            <div
              id="floating-bottom-overlay-navbar"
              className="bottom-nav-glass pointer-events-auto relative w-full max-w-[280px] sm:max-w-[320px] h-12 sm:h-14 bg-[#1c1c1f]/80 border border-white/10 rounded-full px-1.5 sm:px-2.5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)] flex items-center justify-between overflow-visible"
            >
              <span className="bottom-nav-shine" aria-hidden="true" />
              {bottomNavItems.map((item) => {
                const ItemIcon = item.icon;
                const isCenter = Boolean(item.isCenter);
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'overview' && activeTab === 'overview');

                if (isCenter) {
                  return (
                    <div key={item.id} className="w-10 sm:w-12 shrink-0" aria-hidden="true" />
                  );
                }

                return (
                  <button
                    key={item.id}
                    id={`floating-bottom-nav-${item.id}`}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 h-10 sm:h-12 flex flex-col items-center justify-center gap-px sm:gap-0.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bottom-nav-item-active'
                        : 'text-[#c5c5c8] hover:text-white'
                    }`}
                  >
                    <ItemIcon className={`bottom-nav-item-icon w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8] text-[#d1d1d4]'}`} />
                    <span className={`bottom-nav-item-label text-[9px] sm:text-[10px] leading-none whitespace-nowrap ${isActive ? '' : 'font-medium'}`}>{item.label}</span>
                    <span className={isActive ? 'bottom-nav-active-indicator' : 'w-3 h-[3px] bg-transparent'} />
                  </button>
                );
              })}

              <button
                id="floating-bottom-nav-upload-chart"
                type="button"
                onClick={() => setActiveTab('upload-chart')}
                aria-label="Upload Chart"
                className={`bottom-nav-upload-glow absolute left-1/2 -translate-x-1/2 -top-2 sm:-top-2.5 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#c4b5fd] hover:bg-[#d4c8ff] text-[#1a1228] flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                  activeTab === 'upload-chart' ? 'ring-2 ring-[#f5edff] scale-110 shadow-[0_0_22px_rgba(196,181,253,0.85)]' : ''
                }`}
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Trish Voice & Chat AI Assistant Modal */}
      <TrishAssistantModal
        isOpen={isTrishOpen}
        onClose={() => setIsTrishOpen(false)}
      />

      {/* Macro Event Analysis Modal */}
      <MacroAnalysisModal
        isOpen={Boolean(selectedMacroEvent)}
        onClose={() => setSelectedMacroEvent(null)}
        event={selectedMacroEvent}
      />

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        defaultTier={upgradeDefaultTier}
        user={user}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      {/* My Profile Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        onOpenUpgrade={handleOpenUpgrade}
      />

      {/* MT5 Account Connection Modal */}
      <MT5ConnectionModal
        isOpen={isMT5ModalOpen}
        onClose={() => setIsMT5ModalOpen(false)}
        user={user}
        onOpenUpgrade={handleOpenUpgrade}
      />
    </div>
  );
};
