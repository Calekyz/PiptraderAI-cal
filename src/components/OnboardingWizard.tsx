import React, { useState } from 'react';
import {
  Sparkles, ShieldCheck, Link2, Crown, Rocket, BookOpen,
  ChevronRight, X, CheckCircle2, BarChart2, MessageSquare,
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  user: { firstName?: string; email?: string; plan?: string; mt5Connected?: boolean; isVerified?: boolean };
  // Deep-link handlers
  onOpenSettings?: () => void;
  onOpenMT5?: () => void;
  onOpenSubscription?: () => void;
  onOpenHowToUse?: () => void;
  onOpenGemina?: (tab?: 'chat' | 'vision') => void;
}

interface Slide {
  id: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  bullets?: string[];
  ctaLabel?: string;
  onCta?: () => void;
  accent: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  user,
  onOpenSettings,
  onOpenMT5,
  onOpenSubscription,
  onOpenHowToUse,
  onOpenGemina,
}) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const firstName = user?.firstName || 'Trader';

  const slides: Slide[] = [
    {
      id: 'welcome',
      icon: <Sparkles className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'Welcome',
      title: `Welcome aboard, ${firstName}!`,
      description:
        "You've just unlocked PipTraderAI — the fastest way to find, verify, and act on high-probability institutional setups. Let's take 60 seconds to get you set up.",
      bullets: [
        'Live signals from our SMC + CRT engine',
        'Gemina AI — silent verification & chart vision',
        'MT5 connection, backtesting, and risk tools',
      ],
      accent: 'from-[#7c3aed] to-[#a855f7]',
    },
    {
      id: 'verify',
      icon: <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'Step 1 · Verify',
      title: user?.isVerified ? 'Your email is verified ✓' : 'Verify your email',
      description: user?.isVerified
        ? "You're all set on verification. Email verification unlocks trading actions, payouts, and account security."
        : 'Check your inbox for a verification code. Verified accounts get full access to trading signals and payouts.',
      ctaLabel: user?.isVerified ? 'Open Settings' : 'Verify now',
      onCta: onOpenSettings,
      accent: 'from-[#0ea5e9] to-[#38bdf8]',
    },
    {
      id: 'mt5',
      icon: <Link2 className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'Step 2 · Connect MT5',
      title: user?.mt5Connected ? 'MT5 connected ✓' : 'Connect your MT5 account',
      description: user?.mt5Connected
        ? 'Your MT5 account is linked. Live positions, balance, and history sync automatically.'
        : 'Link your MetaTrader 5 account so the engine can pull live prices and execute setups with one click.',
      ctaLabel: user?.mt5Connected ? 'Manage connection' : 'Connect MT5',
      onCta: onOpenMT5,
      accent: 'from-[#059669] to-[#10b981]',
    },
    {
      id: 'plan',
      icon: <Crown className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'Step 3 · Plan',
      title: user?.plan && user.plan !== 'Pending' ? `${user.plan} plan active ✓` : 'Choose your plan',
      description: user?.plan && user.plan !== 'Pending'
        ? 'Your plan is active. Upgrade anytime to unlock Pulse Signals, automated bots, and more AI credits.'
        : 'Start with Starter or go Pro/Elite for advanced bots, Pulse Signals, and unlimited Gemina AI uploads.',
      ctaLabel: 'View plans',
      onCta: onOpenSubscription,
      accent: 'from-[#f59e0b] to-[#fbbf24]',
    },
    {
      id: 'features',
      icon: <Rocket className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'Step 4 · Explore',
      title: 'Your trading dashboard',
      description: 'Four tools you will use every day:',
      bullets: [
        'Upload Chart — drop a screenshot, get a full trade plan + AI verification',
        'Pulse Signals — auto-detected institutional setups, updated live',
        'AI Trading — chat with Gemina about any chart, get reviews & recommendations',
        'Manage Bots — deploy automated strategies with risk guardrails',
      ],
      accent: 'from-[#ec4899] to-[#f472b6]',
    },
    {
      id: 'ready',
      icon: <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.2} />,
      badge: 'All set',
      title: "You're ready to trade",
      description:
        'Open the How-to-Use guide anytime from the sidebar. Want a tour with Gemina AI right now?',
      bullets: [
        'Click the purple Gemina button anytime',
        'Upload a chart to get your first AI review',
        'Enable notifications to catch high-impact news',
      ],
      ctaLabel: 'Open How to Use',
      onCta: onOpenHowToUse,
      accent: 'from-[#7c3aed] to-[#ec4899]',
    },
  ];

  const current = slides[step];
  const isLast = step === slides.length - 1;

  const finish = () => {
    try {
      if (dontShowAgain) localStorage.setItem('pipnex_onboarded', '1');
    } catch {}
    onClose();
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => {
    try {
      localStorage.setItem('pipnex_onboarded', '1');
    } catch {}
    onClose();
  };

  const runCta = () => {
    current.onCta?.();
    // Auto-advance after a CTA that deep-links
    if (step < slides.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0a0c16] border border-[#e5e7eb] dark:border-[#1a1e30] rounded-3xl shadow-2xl text-[#111] dark:text-white relative overflow-hidden">
        {/* Header strip */}
        <div className={`h-1.5 bg-gradient-to-r ${current.accent}`} />

        {/* Close */}
        <button
          onClick={skip}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 dark:bg-[#121422] text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1e2338] transition-colors cursor-pointer z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon + badge */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.accent} flex items-center justify-center shrink-0 shadow-lg`}>
              {current.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500 font-mono mb-1">
                {current.badge}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                {current.title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Bullets */}
          {current.bullets && current.bullets.length > 0 && (
            <ul className="space-y-2.5 mb-5">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-between mb-5 pt-3 border-t border-gray-100 dark:border-[#161828]">
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-purple-500' : i < step ? 'w-1.5 bg-purple-500/60' : 'w-1.5 bg-gray-200 dark:bg-[#20243d]'
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono text-gray-400 ml-2">
                {step + 1} / {slides.length}
              </span>
            </div>

            {/* Don't show again */}
            <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-[#2a2e48] accent-purple-600"
              />
              Don't show again
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={step === 0 ? skip : () => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {step === 0 ? 'Skip tour' : '← Back'}
            </button>

            <div className="flex items-center gap-2">
              {current.ctaLabel && current.onCta && (
                <button
                  onClick={runCta}
                  className="px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  {current.ctaLabel}
                </button>
              )}
              <button
                onClick={next}
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-br ${current.accent} text-white text-xs font-bold shadow-md hover:shadow-purple-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5`}
              >
                {isLast ? 'Start trading' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
