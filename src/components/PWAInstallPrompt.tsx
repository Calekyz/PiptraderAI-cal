import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'pipnex_pwa_dismissed_v3';
const DISMISS_HOURS = 24;

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Detect if already running as installed PWA (standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const android = /android/.test(ua);
    const desktop = !iOS && !android;
    setIsIOS(iOS);
    setIsAndroid(android);
    setIsDesktop(desktop);

    // 3. Check dismissal (14 days)
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const hoursSince = (Date.now() - Number(dismissedAt)) / 3600000;
        if (hoursSince < DISMISS_HOURS) return;
      }
    } catch {}

    // 4. Android/Chrome: capture the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 5. iOS: show our own prompt
    if (iOS) {
      setTimeout(() => setVisible(true), 5000); // delay so it doesn't feel pushy
    }

    // 6. If user installs, hide
    const installed = () => {
      setIsInstalled(true);
      setVisible(false);
    };
    window.addEventListener('appinstalled', installed);

    // 7. Show prompt on EVERY login (reset dismissal on login event)
    const onLogin = () => {
      // Skip if already installed
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true;
      if (standalone) return;

      // Clear any previous dismissal — user logged in fresh, show them again
      try { localStorage.removeItem(DISMISS_KEY); } catch {}

      // Show after 2s delay so the app settles first
      setTimeout(() => setVisible(true), 2000);
    };
    window.addEventListener('pipnex:user-logged-in', onLogin);

    // 8. If already logged in on page load, check if we should show
    const sessionRaw = localStorage.getItem('pipnex_active_session_v1');
    if (sessionRaw) {
      try {
        JSON.parse(sessionRaw);
        onLogin();
      } catch {}
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('pipnex:user-logged-in', onLogin);
    };
  }, []);

  const handleInstall = async () => {
    // iOS Safari — no native prompt, show manual instructions
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Native prompt available — fire it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setVisible(false);
      return;
    }

    // Android without prompt OR desktop — show manual instructions
    setShowIOSInstructions(true);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (isInstalled || !visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-40 z-50 sm:max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-br from-[#1a1c2e] to-[#0d0f1a] border border-purple-500/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-purple-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">Install PipTraderAI</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {isIOS
              ? 'Add to your Home Screen for a native app experience.'
              : 'Get instant access from your home screen — no browser needed.'}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
            >
              {isIOS ? 'Show me how' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showIOSInstructions && (
        <div className="mt-2 p-4 rounded-2xl bg-[#0d0f1a] border border-purple-500/40 shadow-2xl text-xs text-slate-300 space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold mb-1">
            <Smartphone className="w-4 h-4 text-purple-300" />
            {isIOS ? 'Install on iPhone / iPad' : isAndroid ? 'Install on Android' : 'Install PipTraderAI'}
          </div>

          {isIOS && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">1.</span>
                <span>Open this page in <strong>Safari</strong> (if not already)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">2.</span>
                <span>Tap the <strong>Share</strong> icon (⤴) at the bottom</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">3.</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">4.</span>
                <span>Tap <strong>"Add"</strong> — you're done!</span>
              </div>
            </>
          )}

          {isAndroid && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">1.</span>
                <span>Tap the <strong>⋮ menu</strong> (3 dots, top-right of Chrome)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">2.</span>
                <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">3.</span>
                <span>Confirm by tapping <strong>"Install"</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">4.</span>
                <span>PipTraderAI will appear on your home screen 🎉</span>
              </div>
            </>
          )}

          {isDesktop && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">1.</span>
                <span>Look at the <strong>address bar</strong> — a small install icon (⊕) should appear</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">2.</span>
                <span>Click the <strong>install icon</strong> to install the app</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 font-bold">3.</span>
                <span>If no icon appears, use the <strong>Chrome/Edge ⋮ menu</strong> → "Install PipTraderAI"</span>
              </div>
            </>
          )}

          <button
            onClick={() => { setShowIOSInstructions(false); handleDismiss(); }}
            className="mt-3 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
};
