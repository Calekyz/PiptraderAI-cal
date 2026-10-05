/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PipNexAuthCard } from './components/PipNexAuthCard';
import { ForexTicker } from './components/ForexTicker';
import { BotDashboard } from './components/BotDashboard';
import { LandingPage } from './components/LandingPage';
import { UpgradePlanModal } from './components/UpgradePlanModal';
import { AdminApp } from './admin/AdminApp';
import { MaintenancePage } from './components/MaintenancePage';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { UserProfile } from './types';
import { X, ShieldAlert, Bot } from 'lucide-react';
import { NovaAssistantModal } from './components/NovaAssistantModal';
import { clearAllUserState,
  enterAsDevUser,
  getActiveSession,
  logoutUser,
  saveActiveSession,
  updateUserProfileAsync,
  fetchFreshUserAsync,
  validateActiveSession
} from './lib/authService';
import { isDevelopmentMode } from './lib/devMode';

const SITE_UNDER_MAINTENANCE = false;

export default function App() {
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [novaInitialTab, setNovaInitialTab] = useState<'chat' | 'vision'>('chat');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.tab === 'chat' || detail.tab === 'vision') {
        setNovaInitialTab(detail.tab);
      }
      setIsNovaOpen(true);
    };
    window.addEventListener('open-nova', handler);
    return () => window.removeEventListener('open-nova', handler);
  }, []);
  const [isAdminPanel, setIsAdminPanel] = useState<boolean>(() => {
    try {
      const host = window.location.hostname.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      return (
        host === 'pipnexai.adminpanel' ||
        host.includes('adminpanel') ||
        path.startsWith('/admin') ||
        search.includes('admin') ||
        hash.includes('admin')
      );
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (isDevelopmentMode()) return enterAsDevUser();
    return getActiveSession();
  });

  // One-time cleanup of stale legacy localStorage keys
  useEffect(() => {
    try {
      const session = localStorage.getItem('pipnex_active_session_v1');
      const sessionEmail = session ? (JSON.parse(session)?.email || '').toLowerCase() : '';
      if (!sessionEmail) return;
      const legacyKeys = ['pipnex_user', 'user', 'currentUser', 'pipnexUser', 'authUser'];
      for (const k of legacyKeys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const legacyEmail = String(parsed?.email || '').toLowerCase();
          if (legacyEmail && legacyEmail !== sessionEmail) {
            localStorage.removeItem(k);
            console.log(`[Session] Removed stale key "${k}" (had ${legacyEmail}, session is ${sessionEmail})`);
          }
        } catch {
          const legacyEmail = String(raw).toLowerCase();
          if (legacyEmail.includes('@') && legacyEmail !== sessionEmail) {
            localStorage.removeItem(k);
            console.log(`[Session] Removed stale raw key "${k}"`);
          }
        }
      }
    } catch {}
  }, []);

  const ADMIN_WHITELIST = ['pipnexaicustomer@gmail.com', 'oruchodaniel21@gmail.com'];
  const isWhitelistedAdmin = Boolean(
    currentUser?.email && ADMIN_WHITELIST.includes(currentUser.email.toLowerCase().trim())
  );

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const host = window.location.hostname.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        setIsAdminPanel(
          host === 'pipnexai.adminpanel' ||
          host.includes('adminpanel') ||
          path.startsWith('/admin') ||
          search.includes('admin') ||
          hash.includes('admin')
        );
      } catch {
        setIsAdminPanel(false);
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>(() => {
    return getActiveSession() ? 'dashboard' : 'landing';
  });

  useEffect(() => {
    if (!isDevelopmentMode()) return;
    const user = enterAsDevUser();
    setCurrentUser(user);
    setCurrentView('dashboard');
  }, []);

  // 🔥 NEW: Refresh user data on mount and whenever the window regains focus
  // This ensures admin-initiated changes (plan, credits, status) reflect immediately.
  useEffect(() => {
    // Validate session on mount — ensures we don't have stale/cross-account state
    (async () => {
      const valid = await validateActiveSession();
      if (valid) {
        setCurrentUser(valid);
      } else if (!valid) {
        // Session was cleared because user was deleted or mismatched
        const cached = getActiveSession();
        if (!cached) setCurrentUser(null);
      }
    })();

    const session = getActiveSession();
    if (!session?.email) return;

    // Initialize credits for this plan (idempotent — only tops up if credits are 0)
    fetch('/api/credits/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session.email })
    })
      .then(r => r.json())
      .then(data => {
        if (data?.success && data.initialized) {
          console.log(`[Credits] Initialized ${data.credits} credits for ${data.plan}`);
          // Refresh session to show updated credits
          if (session) {
            const updated = { ...session, credits: data.credits };
            saveActiveSession(updated);
            setCurrentUser(updated);
          }
        }
      })
      .catch(() => {});

    const refresh = async () => {
      const fresh = await fetchFreshUserAsync(session.email);
      if (fresh) {
        const merged: UserProfile = { ...session, ...fresh };
        saveActiveSession(merged);
        setCurrentUser(merged);
      }
    };

    refresh();

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // Also poll every 60 seconds so plan changes appear without a manual refresh
    const interval = setInterval(refresh, 60_000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<'Starter' | 'Pro' | 'Elite'>('Pro');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pipnex_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // ── App colour theme (aurora | neon | sunset) ──
  const [appTheme, setAppTheme] = useState<'aurora' | 'neon' | 'sunset'>(() => {
    try {
      const saved = localStorage.getItem('pipnex_app_theme');
      return (saved === 'neon' || saved === 'sunset') ? saved : 'aurora';
    } catch {
      return 'aurora';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pipnex_app_theme', appTheme);
    } catch {}
    if (appTheme === 'aurora') {
      document.documentElement.removeAttribute('data-app-theme');
    } else {
      document.documentElement.setAttribute('data-app-theme', appTheme);
    }
  }, [appTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('pipnex_theme', theme);
    } catch {}

    if (theme === 'dark') {
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
  }, [theme]);

  const handleLogout = () => {
    // 1. Clear all auth state in localStorage
    clearAllUserState();
    // 2. Clear React state immediately
    setCurrentUser(null);
    setCurrentView('landing');
    // 3. Force a clean reload so no stale effects can re-hydrate the old session
    //    (this is the nuclear option that guarantees no cross-user bleed)
    try {
      // Small delay so state setters flush, then hard reload to landing
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
    } catch {}
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updated };
      // Guard: only save if the user has both id and email (never write partial)
      if (nextUser?.id && nextUser?.email) {
        saveActiveSession(nextUser);
      }
      return nextUser;
    });
    updateUserProfileAsync(updated).catch((err) => {
      console.warn('Could not sync user profile with backend:', err);
    });
  };

  const handleOpenSignIn = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleStartTrading = () => {
    if (currentUser) {
      setCurrentView('dashboard');
      return;
    }
    if (isDevelopmentMode()) {
      const user = enterAsDevUser();
      setCurrentUser(user);
      setCurrentView('dashboard');
      return;
    }
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleOpenUpgradeFromLanding = (tier: 'Starter' | 'Pro' | 'Elite' = 'Pro') => {
    setUpgradeTier(tier);
    setIsUpgradeModalOpen(true);
  };

  const handleUpgradeSuccess = (tier: any) => {
    if (currentUser) {
      handleUpdateUser({ plan: tier });
    } else {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
    }
  };

  if (SITE_UNDER_MAINTENANCE && !isAdminPanel && !isDevelopmentMode()) {
    return <MaintenancePage />;
  }

  if (isAdminPanel) {
    return (
      <div className="relative">
        <AdminApp />
        <button
          onClick={() => {
            window.location.hash = '';
            window.location.search = '';
            setIsAdminPanel(false);
          }}
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-xl bg-[#121528]/90 hover:bg-[#1a1e38] text-slate-400 hover:text-white border border-[#232742] text-[11px] font-medium backdrop-blur-md shadow-2xl transition-all flex items-center gap-1.5 cursor-pointer opacity-75 hover:opacity-100"
          title="Switch to User App"
        >
          <span>Switch to Trader View</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#07080d] text-[#0f172a] dark:text-[#f8fafc] flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-700 relative overflow-x-hidden transition-colors duration-200">
      {currentView !== 'dashboard' && <ForexTicker />}

      {currentView === 'dashboard' && currentUser ? (
        <BotDashboard
          user={currentUser}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSetTheme={setTheme}
          appTheme={appTheme}
          onSetAppTheme={setAppTheme}
        />
      ) : (
        <LandingPage
          user={currentUser}
          onStartTrading={handleStartTrading}
          onOpenSignIn={handleOpenSignIn}
          onOpenSignUp={handleOpenSignUp}
          onOpenUpgrade={handleOpenUpgradeFromLanding}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {isWhitelistedAdmin && (
        <button
          onClick={() => {
            window.location.hash = '#admin';
            setIsAdminPanel(true);
          }}
          className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-xl bg-[#0e1122]/90 hover:bg-purple-900/40 text-purple-400 hover:text-purple-300 border border-purple-500/30 text-[11px] font-semibold backdrop-blur-md shadow-2xl transition-all flex items-center gap-1.5 cursor-pointer opacity-75 hover:opacity-100"
          title="Open Admin Panel"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Admin Panel</span>
        </button>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md my-auto py-6 sm:py-8">
            <button
              id="close-auth-modal-btn"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute -top-3 right-0 sm:-top-10 sm:right-0 p-2 rounded-xl bg-[#141624] border border-[#23273e] text-gray-400 hover:text-white hover:bg-[#1a1e30] transition-colors cursor-pointer z-30 shadow-lg"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <PipNexAuthCard
              initialMode={authModalMode}
              onSuccessAuth={(profile) => {
                setCurrentUser(profile);
                setIsAuthModalOpen(false);
                setCurrentView('dashboard');
                // Trigger PWA install prompt check after login
                try { window.dispatchEvent(new Event('pipnex:user-logged-in')); } catch {}
              }}
            />
          </div>
        </div>
      )}

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        defaultTier={upgradeTier}
        user={currentUser}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      <PWAInstallPrompt />
      {/* ═══════════════════════════════════════════════════
          FLOATING NOVA AI CHAT BUTTON + MODAL
          Available on every page (hidden in admin panel)
      ═══════════════════════════════════════════════════ */}
      <button
        onClick={() => setIsNovaOpen(true)}
        title="Ask Nova AI"
        aria-label="Open Nova AI Assistant"
        className="fixed bottom-28 right-6 z-40 w-14 h-14 rounded-full 
                   bg-gradient-to-br from-[#2962ff] to-[#7c3aed] 
                   text-white shadow-2xl shadow-purple-900/30
                   hover:scale-110 active:scale-95 
                   transition-transform duration-200 
                   flex items-center justify-center
                   border border-purple-400/40"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#07080d] animate-pulse" />
      </button>

      <NovaAssistantModal
        isOpen={isNovaOpen}
        onClose={() => setIsNovaOpen(false)}
        initialTab={novaInitialTab}
      />
    </div>
  );
}
