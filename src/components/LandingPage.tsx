import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Layers, 
  Target, 
  Clock, 
  MessageSquare, 
  Search, 
  Activity, 
  CheckCircle2, 
  Send, 
  X, 
  ExternalLink, 
  Menu, 
  ChevronRight, 
  LineChart, 
  Flame, 
  Crown, 
  Lock, 
  Radio, 
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';

import { UserProfile } from '../types';
import { isDevelopmentMode } from '../lib/devMode';

interface LandingPageProps {
  onStartTrading: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
  onOpenUpgrade?: (tier?: any) => void;
  user?: UserProfile | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartTrading,
  onOpenSignIn,
  onOpenSignUp,
  onOpenUpgrade,
  user,
  theme = 'dark',
  onToggleTheme
}) => {
  const [showTelegramBanner, setShowTelegramBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative flex flex-col">
      
      {/* 1. TOP TELEGRAM BANNER (Requested in 3rd Screenshot) */}
      {showTelegramBanner && (
        <aside 
          id="telegram-top-banner"
          aria-label="Telegram Community Announcement"
          className="sticky top-0 z-50 w-full bg-[#080b14]/95 backdrop-blur-md border-b border-[#1c223a] px-4 py-2.5 transition-all shadow-lg"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            
            {/* Left Content */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Telegram App Icon */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#229ed9] to-[#1d8dbf] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#229ed9]/20">
                <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 -ml-0.5 -mt-0.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                    PipNex AI on Telegram
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0d2a1f] border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-[11px] font-semibold tracking-wide shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Signals
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 truncate hidden sm:block">
                  Real-time updates, trading signals &amp; instant alerts
                </p>
              </div>
            </div>

            {/* Right Action: Join Button & Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                id="telegram-join-btn"
                href="https://t.me/calekyz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#0088cc]/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Join</span>
                <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              </a>

              <button
                id="close-telegram-banner-btn"
                onClick={() => setShowTelegramBanner(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#141829] transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </aside>
      )}

      {/* 2. MAIN NAVIGATION MATCHING SCREENSHOT 1 */}
      <header 
        id="main-landing-header"
        className="sticky top-0 z-40 w-full bg-[#050711]/90 backdrop-blur-xl border-b border-[#14172a] transition-all"
        style={{ top: showTelegramBanner ? 'auto' : '0' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Brand (Screenshot 1: Black box with PIPNEX AI logo + PipnexAi Algo + AI TRADING INTELLIGENCE) */}
          <div 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#090b14] border border-[#1e2338] p-1 shadow-lg shadow-blue-950/40 flex items-center justify-center">
              <div className="w-full h-full rounded-lg bg-black flex flex-col items-center justify-center p-0.5">
                <span className="text-[7px] font-black tracking-tighter text-emerald-400 font-mono">PIPNEX</span>
                <span className="text-[6px] font-bold tracking-widest text-white font-mono">AI</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 leading-tight">
                <span>PipnexAi</span>
                <span className="text-[#38bdf8] font-extrabold">Algo</span>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-semibold">
                AI TRADING INTELLIGENCE
              </div>
            </div>
          </div>

          {/* Right Action Links: Sign In / Sign Up & Dashboard Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <button
                id="nav-dashboard-btn"
                onClick={onStartTrading}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-950/50 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <span className="hidden sm:inline text-purple-200 font-normal">({user.firstName})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                {isDevelopmentMode() && (
                  <button
                    id="nav-continue-as-dev-btn"
                    type="button"
                    onClick={onStartTrading}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                  >
                    Continue as Dev
                  </button>
                )}
                <button
                  id="nav-sign-in-link"
                  onClick={onOpenSignIn}
                  className="text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer px-2 py-1"
                >
                  Sign In
                </button>

                <button
                  id="nav-sign-up-link"
                  onClick={onOpenSignUp || onOpenSignIn}
                  className="px-3.5 sm:px-5 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-black/40 transition-all cursor-pointer active:scale-95"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION (EXACT 1:1 MATCH TO SCREENSHOT 1) */}
      <section 
        id="hero"
        className="relative min-h-[82vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 w-full overflow-hidden py-16 md:py-24"
      >
        {/* Background Trading Workspace Backdrop */}
        <div 
          className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 40%, rgba(14, 23, 42, 0.4) 0%, rgba(5, 7, 17, 0.95) 85%), repeating-linear-gradient(0deg, rgba(30, 41, 59, 0.2) 0px, rgba(30, 41, 59, 0.2) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(30, 41, 59, 0.2) 0px, rgba(30, 41, 59, 0.2) 1px, transparent 1px, transparent 40px)`
          }}
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-r from-blue-900/25 via-indigo-900/20 to-purple-900/25 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-7">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#131728]/80 border border-[#242b48] text-gray-200 text-xs sm:text-sm font-medium tracking-wide shadow-md backdrop-blur-md">
            <span>🚀 Next-Gen Forex AI Platform</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.15] flex items-center justify-center gap-3">
              <span>AI-Powered Forex</span>
              <span className="inline-block text-3xl sm:text-5xl md:text-6xl">🤖</span>
            </h1>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.15] text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc]">
              Trading Intelligence
            </h2>
          </div>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Get real-time AI-driven market analysis, support/resistance levels, and actionable trading signals for major currency pairs.
          </p>

          {/* 3 Stats in Row (Screenshot 1: 3K+ Traders Reached | Global Market Coverage | Fast Responsive AI) */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 pt-2 max-w-xl mx-auto w-full">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] tracking-tight">
                3K+
              </span>
              <span className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
                Traders Reached
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] tracking-tight">
                Global
              </span>
              <span className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
                Market Coverage
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] tracking-tight">
                Fast
              </span>
              <span className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
                Responsive AI
              </span>
            </div>
          </div>

          {/* Golden Orange CTA Button (Screenshot 1: 🚀 Start Trading Today) */}
          <div className="pt-3">
            <button
              id="hero-primary-start-trading-btn"
              onClick={onStartTrading}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f97316] active:scale-95 text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-950/80 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-amber-300/30"
            >
              <span>🚀 Start Trading Today</span>
            </button>
          </div>

        </div>
      </section>

      {/* 6. HOW TRISH AI WORKS SECTION */}
      <section 
        id="how-it-works"
        className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-[#141728] space-y-14"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your AI Trading Assistant
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            Turn complex market charts into clear, understandable insights.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-[#090b16] border border-[#181c2e] hover:border-purple-500/40 transition-all space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 bg-[#14162a] px-3 py-1 rounded-xl border border-[#232744]">
                01
              </span>
              <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Open Your Chart</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
                Select the currency pair and timeframe you want to analyze with seamless real-time candlestick feeds.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-[#0e1022] border border-purple-500/50 shadow-xl shadow-purple-950/20 space-y-4 group relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white bg-purple-600 px-3 py-1 rounded-xl shadow-md">
                02
              </span>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Ask Gemina AI</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                Click <strong>Analyze Current Chart</strong> and let Gemina AI examine the current market structure and key price zones.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-[#090b16] border border-[#181c2e] hover:border-purple-500/40 transition-all space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 bg-[#14162a] px-3 py-1 rounded-xl border border-[#232744]">
                03
              </span>
              <Target className="w-5 h-5 text-gray-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Understand the Market</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
                Get a clear explanation of trend, support/resistance, momentum, structure, and high-probability scenarios to watch.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 7. FEATURE SECTION (Premium Feature Grid) */}
      <section 
        id="features"
        className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-[#141728] space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131628] border border-[#232845] text-purple-300 text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Institutional AI Built for Serious Traders
          </h2>
          <p className="text-sm text-gray-400">
            A comprehensive suite of algorithmic models delivering real-time clarity across any currency pair.
          </p>
        </div>

        {/* 6 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">AI Chart Analysis</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Gemina AI analyzes the current chart and explains what is happening in simple, clear language without clutter.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Market Structure</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Identify trend direction, swing highs, swing lows, breaks of structure (BOS), and consolidation ranges.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Support &amp; Resistance</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Highlight important price levels, order blocks, and key liquidity areas worth watching closely.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Timeframe Intelligence</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Help traders understand how higher timeframe momentum aligns with lower timeframe entries from M1 to Daily.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real-Time Market Context</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Keep analysis tightly connected to the exact symbol, spread, and timeframe currently active on your screen.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-3xl bg-[#090a14] border border-[#181b2e] hover:border-purple-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Interactive AI</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ask follow-up questions, drill into invalidation levels, and evaluate custom setups instead of receiving only static text.
            </p>
          </div>

        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section 
        id="pricing"
        className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-[#141728] space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141628] border border-[#232845] text-purple-300 text-xs font-mono font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Flexible Memberships</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transparent Plans for Every Trader
          </h2>
          <p className="text-sm text-gray-400">
            No long contracts. Instant algorithmic activation. 24/7 dedicated support.
          </p>
        </div>

        {/* 3 Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter Plan */}
          <div className="p-6 rounded-3xl bg-[#090b16] border border-[#1a1d2e] flex flex-col justify-between space-y-6">
            <div>
              <div className="text-base font-bold text-white">Starter</div>
              <div className="text-xs text-gray-400 mt-0.5">Perfect for getting started</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-4">
                $45 <span className="text-xs text-gray-400 font-sans font-normal">/ ½ month</span>
              </div>

              <div className="mt-6 pt-4 border-t border-[#161828] space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">✓ 10 Chart Uploads per day</div>
                <div className="flex items-center gap-2">✓ Advanced Chart Analysis</div>
                <div className="flex items-center gap-2">✓ Multi-Timeframe Analysis</div>
                <div className="flex items-center gap-2">✓ PipNex Pulse Signals (2/day)</div>
                <div className="flex items-center gap-2">✓ AI News Trading Analysis</div>
                <div className="flex items-center gap-2">✓ Position Size Calculator</div>
                <div className="flex items-center gap-2">✓ 3 Custom AI Setups per day</div>
                <div className="flex items-center gap-2">✓ Smart Chart Analyzer</div>
                <div className="flex items-center gap-2">✓ Trading Journal</div>
                <div className="flex items-center gap-2">✓ 24/7 Priority Support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade ? onOpenUpgrade('Starter') : onStartTrading()}
              className="w-full py-3 rounded-xl bg-[#141626] hover:bg-[#1b1f34] border border-[#262b44] text-xs font-bold text-white transition-all cursor-pointer"
            >
              Get Starter ($45)
            </button>
          </div>

          {/* Pro Plan (⭐ MOST POPULAR) */}
          <div className="p-6 rounded-3xl bg-[#0f1124] border border-purple-500/60 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-purple-950/40">
            <span className="absolute -top-3 right-6 text-[10px] font-mono uppercase px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold border border-purple-400/40 shadow-md">
              ⭐ MOST POPULAR
            </span>

            <div>
              <div className="text-base font-bold text-white">Pro</div>
              <div className="text-xs text-purple-300 mt-0.5">For serious traders</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-4">
                $95 <span className="text-xs text-gray-400 font-sans font-normal">/ month</span>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e2338] space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">✓ 24 Chart Uploads per day</div>
                <div className="flex items-center gap-2">✓ Multi-Timeframe Analysis</div>
                <div className="flex items-center gap-2 text-purple-200 font-semibold">✓ Signal of the Day (90%+ accurate)</div>
                <div className="flex items-center gap-2">✓ PipNex Pulse Signals (2/day)</div>
                <div className="flex items-center gap-2">✓ AI News Trading Analysis (NFP/CPI)</div>
                <div className="flex items-center gap-2">✓ AI Auto trading</div>
                <div className="flex items-center gap-2">✓ PipNex PropPass</div>
                <div className="flex items-center gap-2">✓ Smart Chart Analyzer</div>
                <div className="flex items-center gap-2">✓ Unlimited Custom Setups</div>
                <div className="flex items-center gap-2">✓ 24/7 Priority Support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade ? onOpenUpgrade('Pro') : onStartTrading()}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-950 cursor-pointer"
            >
              Get Pro ($95)
            </button>
          </div>

          {/* Elite Plan */}
          <div className="p-6 rounded-3xl bg-[#090b16] border border-amber-500/35 flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 right-6 text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-[#2a1d08] text-amber-400 font-bold border border-amber-500/30">
              MAX PERFORMANCE
            </span>

            <div>
              <div className="text-base font-bold text-white">Elite</div>
              <div className="text-xs text-amber-300 mt-0.5">Maximum performance</div>
              <div className="text-3xl font-extrabold font-mono text-white mt-4">
                $195 <span className="text-xs text-gray-400 font-sans font-normal">/ 3 months</span>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1b1f30] space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2 text-amber-200">✓ Unlimited PipNex Pulse Signals</div>
                <div className="flex items-center gap-2">✓ Direct AI Chart Analysis (no uploads)</div>
                <div className="flex items-center gap-2">✓ Prompt Trading UI</div>
                <div className="flex items-center gap-2">✓ MT5 Account Connection</div>
                <div className="flex items-center gap-2 font-medium text-amber-200">✓ 🤖 Run Bots Without PC (Cloud Bots)</div>
                <div className="flex items-center gap-2 font-medium text-amber-200">✓ 🚀 Auto Trading (2000 AI credits)</div>
                <div className="flex items-center gap-2 font-medium text-amber-200">✓ ☁️ FREE VPS Included ($50/mo value)</div>
                <div className="flex items-center gap-2">✓ Voice-based AI Interaction</div>
                <div className="flex items-center gap-2">✓ AI reads account for journaling</div>
                <div className="flex items-center gap-2">✓ AI generates &amp; executes strategies</div>
                <div className="flex items-center gap-2">✓ Unlimited MT5 accounts (10)</div>
                <div className="flex items-center gap-2">✓ 24/7 Bot Monitoring &amp; Alerts</div>
                <div className="flex items-center gap-2">✓ Priority AI processing</div>
                <div className="flex items-center gap-2">✓ White-glove support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade ? onOpenUpgrade('Elite') : onStartTrading()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              Get Elite ($195)
            </button>
          </div>

        </div>

        {/* Support Direct Contacts */}
        <div className="p-4 rounded-2xl bg-[#090b16] border border-[#1b1f30] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-gray-400 text-center sm:text-left">
            Questions regarding plans or custom enterprise deployment?
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="mailto:Pipnexaicustomer@gmail.com" 
              className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 font-mono"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Pipnexaicustomer@gmail.com</span>
            </a>
            <span className="text-gray-600">•</span>
            <a 
              href="tel:+254726222093" 
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+254726222093</span>
            </a>
          </div>
        </div>
      </section>

      {/* 10. FINAL BOTTOM CTA */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#111326] to-[#070810] border border-[#222744] shadow-2xl space-y-5 relative overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Upgrade Your Market Analysis?
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
              Join thousands of traders using Gemina AI (DeepSeek) to detect key price action, support, resistance, and market momentum.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStartTrading}
              className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>🚀 Start Trading Today</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://t.me/calekyz"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-[#0c1a26] hover:bg-[#102434] border border-[#0088cc]/40 text-[#0088cc] hover:text-cyan-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Join Official Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* 11. FOOTER WITH REQUIRED COMPLIANCE & DISCLAIMER */}
      <footer className="mt-auto border-t border-[#121422] bg-[#030408] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>PipnexAi Algo</span>
              </div>
              <p className="text-xs text-gray-400">
                Next-Gen AI Forex Trading Intelligence &amp; Chart Analysis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">Pricing</button>
              <a href="https://t.me/calekyz" target="_blank" rel="noreferrer" className="text-[#0088cc] hover:underline">Telegram</a>
            </div>
          </div>

          {/* Regulatory & Risk Disclaimer as mandated */}
          <div className="pt-6 border-t border-[#0f111e] space-y-2 text-[11px] text-gray-400 leading-relaxed">
            <p>
              <strong>Disclaimer &amp; Decision Support Notice:</strong> PipnexAi Algo and Gemina AI are designed exclusively as AI-powered analysis, educational, and decision-support tools. PipNex does not offer guaranteed profits, guaranteed signals, or get-rich-quick claims. Trading Foreign Exchange (Forex) and CFDs carries a high level of risk and may not be suitable for all investors. Never trade with capital you cannot afford to lose.
            </p>
            <p className="text-gray-400">
              © {new Date().getFullYear()} PipnexAi Algo. All rights reserved. Support: Pipnexaicustomer@gmail.com · +254726222093
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
};
