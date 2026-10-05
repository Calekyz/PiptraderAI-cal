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
  Upload,
  Clock,
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
import { FloatingSupportButton } from './FloatingSupportButton';
import { SettingsView } from './views/SettingsView';
import { ForexFactoryNewsView } from './views/ForexFactoryNewsView';
import { HorizontalQuickAccessMenu } from './HorizontalQuickAccessMenu';
import { MacroAnalysisModal } from './MacroAnalysisModal';
import { UpgradePlanModal } from './UpgradePlanModal';
import { MT5ConnectionModal } from './MT5ConnectionModal';
import { MyProfileModal } from './MyProfileModal';
import { OnboardingWizard } from './OnboardingWizard';
import { PendingPaymentBanner } from './PendingPaymentBanner';
import { AuditLockScreen } from './AuditLockScreen';
import { StatusPill } from './StatusPill';
import { getUserEmail, handleCreditError } from '../lib/creditsClient';
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
  appTheme?: 'aurora' | 'neon' | 'sunset';
  onSetAppTheme?: (theme: 'aurora' | 'neon' | 'sunset') => void;
}

export const BotDashboard: React.FC<BotDashboardProps> = ({
  user,
  onLogout,
  onUpdateUser,
  theme = 'dark',
  onToggleTheme,
  onSetTheme,
  appTheme = 'aurora',
  onSetAppTheme
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string; title: string; message: string;
    urgency: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
    createdAt: string;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState<null | {
    id: string; title: string; message: string;
    createdAt: string; urgency?: string;
  }>(null);

  // Local theme state fallback if not controlled
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pipnex_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // ── Fetch user notifications (broadcasts) + poll every 30s ──
  useEffect(() => {
    const READ_KEY = 'pipnex_notif_read_ids';
    const getReadIds = (): string[] => {
      try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
    };

    const fetchNotifications = async () => {
      try {
        const email = (user?.email || '').toLowerCase().trim();
        const plan = (user?.plan || '').toUpperCase().trim();
        if (!email) return;
        const res = await fetch(`/api/notifications?email=${encodeURIComponent(email)}&plan=${encodeURIComponent(plan)}`);
        const data = await res.json();
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(list);
        const readIds = new Set(getReadIds());
        setUnreadCount(list.filter((n: any) => !readIds.has(n.id)).length);
      } catch { /* silent */ }
    };

    fetchNotifications();
    const t = setInterval(fetchNotifications, 30000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.email, user?.plan]);

  // ── Mark a single notification read ──
  const markNotificationRead = (id: string) => {
    try {
      const READ_KEY = 'pipnex_notif_read_ids';
      const cur: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
      if (!cur.includes(id)) {
        cur.push(id);
        localStorage.setItem(READ_KEY, JSON.stringify(cur.slice(-200)));
      }
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  // ── Mark all read ──
  const markAllNotificationsRead = () => {
    try {
      const READ_KEY = 'pipnex_notif_read_ids';
      const ids = notifications.map((n) => n.id);
      localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-200)));
      setUnreadCount(0);
    } catch {}
  };

  // ── Relative time helper ──
  const relTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return 'just now';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  };

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
  const [isTrishOpen, setIsTrishOpen] = useState(false); // legacy — kept to avoid breaking callers
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [creditsToast, setCreditsToast] = useState<{ balance: number; message: string } | null>(null);
  const [displayedCredits, setDisplayedCredits] = useState<number>((user as any)?.credits ?? 0);

  // Sync displayed credits with the user prop when it changes (e.g. login, refresh)
  useEffect(() => {
    setDisplayedCredits((user as any)?.credits ?? 0);
  }, [(user as any)?.credits, user?.email]);

  // Listen for global insufficient-credits events
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      if (typeof detail.balance === 'number') setDisplayedCredits(detail.balance);
      setCreditsToast({ balance: detail.balance ?? 0, message: detail.message || 'Insufficient credits.' });
      setTimeout(() => setCreditsToast(null), 6000);
    };
    window.addEventListener('pipnex:insufficient-credits', handler);

    // Also listen for post-action credit charges
    const creditHandler = (e: any) => {
      const detail = e?.detail || {};
      if (typeof detail.balance === 'number') setDisplayedCredits(detail.balance);
      if (detail.charged) {
        setCreditsToast({
          balance: detail.balance ?? 0,
          message: `${detail.reason || 'Action'} — ${detail.charged} credits used`,
        });
        setTimeout(() => setCreditsToast(null), 4000);
      }
    };
    window.addEventListener('pipnex:credits-changed', creditHandler);

    // ── Fallback: poll /api/credits/balance every 30s so the number stays in sync
    //    even if we miss an event (e.g. admin manually adjusts the balance)
    const pollCredits = () => {
      const email = user?.email;
      if (!email) return;
      fetch(`/api/credits/balance?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.success && typeof d.credits === 'number') {
            setDisplayedCredits(d.credits);
          }
        })
        .catch(() => { /* silent */ });
    };
    const poll = setInterval(pollCredits, 30000);
    const onVis = () => { if (document.visibilityState === 'visible') pollCredits(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('pipnex:insufficient-credits', handler);
      window.removeEventListener('pipnex:credits-changed', creditHandler);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.email]);

  // ── Send heartbeat to keep online status fresh ──
  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    const beat = () => {
      fetch('/api/user/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    };
    beat(); // immediate
    const id = setInterval(beat, 60_000); // every 60s
    const onVis = () => { if (document.visibilityState === 'visible') beat(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.email]);

  // Show onboarding once on first login
  useEffect(() => {
    try {
      const seen = localStorage.getItem('pipnex_onboarded');
      if (!seen) {
        // Small delay so the dashboard can render first
        const t = setTimeout(() => setIsOnboardingOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [user?.email]);

  const handleOpenNova = (tab: 'chat' | 'vision' = 'chat') => {
    window.dispatchEvent(new CustomEvent('open-nova', { detail: { tab } }));
  };
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

  // ⚠️ SECURITY: never trust client-side plan changes.
  // This handler just closes the upgrade picker and opens the real payment flow.
  const [pendingPayment, setPendingPayment] = useState<{ productId: string; productName: string } | null>(null);
  const [paymentToast, setPaymentToast] = useState<{ title: string; message: string } | null>(null);
  const [auditLockActive, setAuditLockActive] = useState(false);
  const [auditLockChecked, setAuditLockChecked] = useState(false);

  // On mount: check if the user has any pending payment → activate the lock
  useEffect(() => {
    const email = user?.email;
    if (!email) { setAuditLockChecked(true); return; }
    fetch(`/api/payments/user/${encodeURIComponent(email)}/pending`)
      .then((r) => r.json())
      .then((d) => {
        const hasPending = d?.success && Array.isArray(d.pending) && d.pending.length > 0;
        setAuditLockActive(hasPending);
      })
      .catch(() => {})
      .finally(() => setAuditLockChecked(true));
  }, [user?.email]);

  // When user submits a new payment, activate the lock immediately
  useEffect(() => {
    if (paymentToast?.title === 'Payment received') {
      setAuditLockActive(true);
    }
  }, [paymentToast]);

  // Called by UpgradePlanModal → DynamicPaymentModal when the user submits proof of payment
  const handleUpgradeSuccess = async (newPlan: any) => {
    const productId = String(newPlan || '').toLowerCase();
    const validProducts = ['starter', 'pro', 'elite'];
    if (validProducts.includes(productId)) {
      setPendingPayment({ productId, productName: newPlan });
    }
    setIsUpgradeModalOpen(false);

    // ── Show 'payment received' toast ──
    setPaymentToast({
      title: 'Payment received',
      message: 'Your payment is now under audit. This usually takes 1–30 minutes. You will be notified once activated.',
    });
    setTimeout(() => setPaymentToast(null), 10000);

    // ── Refresh user from server (plan stays the same — audit is pending) ──
    await refreshUserFromServer();
  };

  // Alias for backward compat
  const handlePaymentSubmitted = handleUpgradeSuccess;

  // Refetch the current user from the server (source of truth)
  const refreshUserFromServer = async () => {
    try {
      const email = user?.email;
      if (!email) return;
      const res = await fetch(`/api/user/by-email/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data?.success && data.user) {
        onUpdateUser({
          plan: data.user.plan,
          credits: data.user.credits,
          subscriptionExpiry: data.user.subscriptionExpiry,
          subscriptionStartDate: data.user.subscriptionStartDate,
        } as any);
      }
    } catch (e) {
      console.warn('[Refresh user] failed:', e);
    }
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
          className={`fixed top-0 left-0 h-screen w-64 xl:w-72 bg-white dark:bg-[#0c0e18] border-r border-[#e5e7eb] dark:border-[#171a27] p-4 flex-col justify-between shrink-0 z-50 shadow-xs select-none overflow-y-auto custom-scrollbar transition-transform duration-300 ${
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
                  <span className="text-lg font-black tracking-tight text-[#0f172a] dark:text-white font-mono">PipTrader<span className="text-[#5b3fe4]">AI</span></span>
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-mono truncate font-semibold">
                      {user.plan || 'Pro Plan'}
                    </div>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/40">
                      <Zap className="w-2.5 h-2.5 text-purple-600 dark:text-purple-300" />
                      <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {displayedCredits}
                      </span>
                    </div>
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
          <div className="fixed inset-0 z-50 flex lg:hidden transition-opacity duration-300">
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
                      <span className="text-lg font-black tracking-tight text-[#0f172a] dark:text-white font-mono">PipTrader<span className="text-[#5b3fe4]">AI</span></span>
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-mono truncate font-semibold">
                          {user.plan || 'Pro Plan'}
                        </div>
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/40">
                          <Zap className="w-2.5 h-2.5 text-purple-600 dark:text-purple-300" />
                          <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 font-mono">
                            {displayedCredits}
                          </span>
                        </div>
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
                  <span className="text-sm font-black text-[#0f172a] dark:text-white font-mono">PipTraderAI</span>
                  <span className="text-gray-300 dark:text-gray-600 font-light">/</span>
                </div>
                <span className="font-bold text-[#0f172a] dark:text-white text-xs sm:text-sm uppercase tracking-wider font-mono">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Right Header Action Items */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Account status pill — replaces theme toggle */}
              <StatusPill
                credits={displayedCredits}
                plan={(user as any)?.plan || 'Pending'}
                subscriptionExpiry={(user as any)?.subscriptionExpiry}
                onOpenCredits={() => setActiveTab('subscription')}
                onOpenSubscription={() => setActiveTab('subscription')}
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
                  {unreadCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#ff3b5c] absolute -top-0.5 -right-0.5 border-2 border-white dark:border-[#141624] text-[9px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0e101d] border border-[#e5e7eb] dark:border-[#20243d] rounded-2xl p-3 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-2 text-[#0f172a] dark:text-white">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb] dark:border-[#20243d]">
                      <span className="font-bold text-sm text-[#0f172a] dark:text-white">
                        Notifications {unreadCount > 0 && <span className="text-[10px] font-semibold text-[#5b3fe4] dark:text-purple-400">({unreadCount} new)</span>}
                      </span>
                      {unreadCount > 0 && (
                        <span
                          onClick={markAllNotificationsRead}
                          className="text-[10px] text-[#5b3fe4] dark:text-purple-400 font-semibold cursor-pointer hover:underline"
                        >
                          Mark all as read
                        </span>
                      )}
                    </div>
                    <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-[#94a3b8] dark:text-slate-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const urgencyColor =
                            n.urgency === 'CRITICAL' ? 'text-rose-500' :
                            n.urgency === 'WARNING' ? 'text-amber-500' :
                            n.urgency === 'SUCCESS' ? 'text-emerald-500' :
                            'text-[#5b3fe4] dark:text-purple-400';
                          return (
                            <div
                              key={n.id}
                              onClick={() => { markNotificationRead(n.id); setSelectedNotif(n); setIsNotificationsOpen(false); }}
                              className="p-2.5 rounded-xl bg-[#faf9ff] dark:bg-[#151829] border border-purple-100 dark:border-purple-900/30 flex items-start gap-2.5 cursor-pointer hover:bg-white dark:hover:bg-[#1a1e30] transition-colors"
                            >
                              <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${urgencyColor}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-[#0f172a] dark:text-white truncate">{n.title}</div>
                                <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5 line-clamp-3 whitespace-pre-wrap">{n.message}</div>
                                <div className="text-[10px] text-[#94a3b8] mt-1">{relTime(n.createdAt)}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
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
                          {user.email || `${user.firstName?.toLowerCase() || 'trader'}@piptraderai.com`}
                        </div>
                        <div className="mt-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#f0edfe] dark:bg-[#1c1635] text-[#5b3fe4] dark:text-purple-300 text-[11px] font-medium tracking-wide inline-block border border-purple-200 dark:border-purple-500/30">
                            {user.plan === 'Elite' ? 'Elite Tier' : (user.plan === 'Pro' ? 'Pro Tier' : 'Trial')}
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

          {/* Horizontal Feature / Quick Access Menu (PipTraderAI Pro) */}
          <HorizontalQuickAccessMenu
            activeTab={activeTab}
            onNavigateToTab={(tabId) => setActiveTab(tabId)}
          />

          {/* Main Content Area */}
          <div className={`p-3 md:p-6 pb-20 md:pb-24 w-full flex-1 space-y-6 ${
            activeTab === 'ai-trading' ? 'max-w-[1720px] mx-auto px-2 sm:px-4' : 'max-w-7xl mx-auto'
          }`}>

            {/* Overview Tab */}
            {/* Pending payment audit banner — shows when a payment is under admin review */}
            <PendingPaymentBanner
              userEmail={user?.email}
              onOpenSubscription={() => setActiveTab('subscription')}
            />

            {activeTab === 'overview' && (
              <OverviewView
                user={user}
                onOpenTrish={() => handleOpenNova('chat')}
                onOpenMacroAnalysis={(evt) => setSelectedMacroEvent(evt)}
                onOpenUpgrade={handleOpenUpgrade}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
                onOpenMT5={() => setIsMT5ModalOpen(true)}
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
                user={user}
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
              <UploadChartView user={user} onOpenNova={handleOpenNova} />
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
                  user={user}
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
                  user={user} onOpenNova={handleOpenNova}
                  theme={currentTheme}
                  onOpenTrish={() => handleOpenNova('chat')}
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
              <HowToUseView
                user={user}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenMT5={() => setIsMT5ModalOpen(true)}
                onOpenNova={handleOpenNova}
              />
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
                appTheme={appTheme}
                onSetAppTheme={onSetAppTheme}
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

      {/* Removed Trish — using Nova below */}


      {/* Macro Event Analysis Modal */}
      <MacroAnalysisModal
        isOpen={Boolean(selectedMacroEvent)}
        onClose={() => setSelectedMacroEvent(null)}
        event={selectedMacroEvent}
        user={user}
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

      {/* Full-screen audit lock — blocks UI while payment is under admin review */}
      <AuditLockScreen
        userEmail={user?.email}
        onApproved={async () => {
          setAuditLockActive(false);
          // Refresh user from server so their new plan + credits show up
          await refreshUserFromServer();
          // If the paid plan just activated and the user hasn't onboarded, show onboarding
          try {
            const seen = localStorage.getItem('pipnex_onboarded');
            if (!seen) {
              setTimeout(() => setIsOnboardingOpen(true), 800);
            }
          } catch {}
        }}
        onRejected={() => {
          setAuditLockActive(false);
          setActiveTab('contact-support');
        }}
      />

      {/* Payment Received Toast — shows after user submits payment proof */}
      {paymentToast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/95 to-amber-900/85 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{paymentToast.title}</div>
                <div className="text-xs text-amber-200/90 mt-1 leading-relaxed">{paymentToast.message}</div>
              </div>
              <button
                onClick={() => setPaymentToast(null)}
                className="p-1 rounded-lg text-amber-300/60 hover:text-amber-100 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Credits Toast */}
      {creditsToast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="rounded-2xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/95 to-rose-900/80 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0">
                <span className="text-rose-300 font-black text-base">₡</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Insufficient credits</div>
                <div className="text-xs text-rose-200/80 mt-0.5">{creditsToast.message}</div>
                <div className="text-[11px] text-rose-300/70 mt-1 font-mono">
                  Balance: {creditsToast.balance} credits
                </div>
                <button
                  onClick={() => { setCreditsToast(null); setActiveTab('subscription'); }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  Top up credits →
                </button>
              </div>
              <button
                onClick={() => setCreditsToast(null)}
                className="p-1 rounded-lg text-rose-300/60 hover:text-rose-100 transition-colors cursor-pointer shrink-0"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment received toast — shown after user submits payment proof */}
      {paymentToast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/95 to-amber-900/85 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{paymentToast.title}</div>
                <div className="text-xs text-amber-200/90 mt-1 leading-relaxed">{paymentToast.message}</div>
              </div>
              <button
                onClick={() => setPaymentToast(null)}
                className="p-1 rounded-lg text-amber-300/60 hover:text-amber-100 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Wizard — first-login only */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={user}
        onOpenSettings={() => { setIsOnboardingOpen(false); setActiveTab('settings'); }}
        onOpenMT5={() => { setIsOnboardingOpen(false); setIsMT5ModalOpen(true); }}
        onOpenSubscription={() => { setIsOnboardingOpen(false); setActiveTab('subscription'); }}
        onOpenHowToUse={() => { setIsOnboardingOpen(false); setActiveTab('how-to-use'); }}
        onOpenNova={(tab) => { setIsOnboardingOpen(false); handleOpenNova(tab || 'chat'); }}
      />

      {/* ═══ Full Notification Modal ═══ */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0a0c16] border border-[#e5e7eb] dark:border-[#1a1e30] rounded-3xl p-6 shadow-2xl text-[#111] dark:text-white relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-[#161828]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedNotif.urgency === 'CRITICAL' ? 'bg-rose-500/10 border border-rose-500/40 text-rose-500' :
                  selectedNotif.urgency === 'WARNING' ? 'bg-amber-500/10 border border-amber-500/40 text-amber-500' :
                  selectedNotif.urgency === 'SUCCESS' ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-500' :
                  'bg-purple-500/10 border border-purple-500/40 text-purple-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#0f172a] dark:text-white leading-tight">
                    {selectedNotif.title}
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                    {relTime(selectedNotif.createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-2 rounded-xl bg-gray-50 dark:bg-[#121422] text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1e2338] transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full message body */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
              <div className="text-[13px] text-[#334155] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedNotif.message}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#161828] flex justify-end">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Support Button — bottom-left with ticket badge */}
      <FloatingSupportButton
        userEmail={user.email}
        onOpenSupport={() => setActiveTab('contact-support')}
      />
    </div>
  );
};
