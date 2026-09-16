import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Crown, 
  Copy, 
  Check, 
  Bot, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Shield, 
  Activity, 
  Calculator, 
  Wallet, 
  ExternalLink, 
  Users, 
  BarChart2, 
  Zap, 
  Radio
} from 'lucide-react';
import { UserProfile, MacroEvent } from '../../types';
import { ForexFactoryCalendar } from '../ForexFactoryCalendar';
import { MarketPulse } from '../MarketPulse';
import { QuickPerformanceSnapshot } from '../QuickPerformanceSnapshot';

interface OverviewViewProps {
  user: UserProfile;
  onOpenTrish: () => void;
  onOpenMacroAnalysis: (event: MacroEvent) => void;
  onOpenUpgrade: (tier?: 'Starter' | 'Pro' | 'Elite' | 'Platinum' | 'Ultimate') => void;
  onNavigateToTab: (tabId: string) => void;
}

const MARKET_TICKERS = [
  { symbol: 'XAUUSD', price: '4,602.990', change: '+84.035 (+1.86%)', isUp: true, icon: '🪙' },
  { symbol: 'EURUSD', price: '1.16782', change: '+0.00 (+0.01%)', isUp: true, icon: '💶' },
  { symbol: 'BTCUSD', price: '78,008.79', change: '+954.35 (+1.24%)', isUp: true, icon: '₿' },
  { symbol: 'US30', price: '53,258.6', change: '+477.2 (+0.90%)', isUp: true, icon: '📈' },
  { symbol: 'GBPUSD', price: '1.34120', change: '+0.0034 (+0.25%)', isUp: true, icon: '💷' },
  { symbol: 'USDJPY', price: '154.62', change: '-0.38 (-0.24%)', isUp: false, icon: '💴' },
  { symbol: 'NAS100', price: '21,450.2', change: '+188.4 (+0.89%)', isUp: true, icon: '📊' },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  onOpenTrish,
  onOpenMacroAnalysis,
  onOpenUpgrade,
  onNavigateToTab,
}) => {
  const [referralTab, setReferralTab] = useState<'Overview' | 'Referrals' | 'Withdrawals'>('Overview');
  const [copiedRef, setCopiedRef] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const referralLink = `https://pipnex-ai.com/ref/${user.referralCode || 'PNX782'}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const userFullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const userGreetingName = userFullName || user.firstName || (user.email ? user.email.split('@')[0] : 'Trader');

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto pb-12">
      
      {/* 1. Header Section: Personalized Welcome to PipNex */}
      <div 
        id="welcome-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-purple-950/80 border border-slate-800/80 shadow-2xl p-6 sm:p-8 md:p-10 backdrop-blur-md"
        style={{
          boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Soft background radial ambient glow & dark overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>PipNex Intelligence Suite</span>
            </div>

            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold text-white tracking-tight leading-tight"
              style={{
                color: '#FFFFFF',
                fontWeight: 800,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)'
              }}
            >
              Hello {userGreetingName} Trader, Welcome to PipNex
            </h1>

            <p 
              className="text-sm sm:text-base md:text-lg text-slate-200 font-medium leading-relaxed max-w-2xl"
              style={{
                color: '#E2E8F0',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)'
              }}
            >
              Your all-in-one AI trading intelligence platform.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('ai-trading')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Launch AI Trading</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-[#e5e7eb] dark:bg-[#171a27] my-1" />

      {/* 2. STATS OVERVIEW & CORE FEATURE LAUNCHERS */}
      <div className="space-y-4">
        {/* 2x2 / 4-Column Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
          {/* Card 1: Active Bots → CHANGED TO Connected Accounts */}
          <div 
            id="stat-card-active-bots"
            onClick={() => onNavigateToTab('manage-bots')}
            className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs md:text-sm font-medium text-[#475569] dark:text-slate-400">Connected Accounts</div>
                <div className="text-xl md:text-2xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                  0 <span className="text-[#94a3b8] dark:text-slate-500 font-normal text-sm md:text-base">/ 0</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 text-[#3b82f6] dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] md:text-xs text-[#94a3b8] dark:text-slate-500 font-medium mt-3">
              None running
            </div>
          </div>

          {/* Card 2: Active EAs (unchanged) */}
          <div 
            id="stat-card-active-eas"
            onClick={() => onNavigateToTab('settings')}
            className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs md:text-sm font-medium text-[#475569] dark:text-slate-400">Active EAs</div>
                <div className="text-xl md:text-2xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                  0
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40 text-[#8b5cf6] dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] md:text-xs text-[#94a3b8] dark:text-slate-500 font-medium mt-3">
              0 brokers connected
            </div>
          </div>

          {/* Card 3: Total Trades (unchanged) */}
          <div 
            id="stat-card-total-trades"
            onClick={() => onNavigateToTab('ai-trading')}
            className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs md:text-sm font-medium text-[#475569] dark:text-slate-400">Total Trades</div>
                <div className="text-xl md:text-2xl font-extrabold text-[#0f172a] dark:text-white mt-1">
                  0
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 text-[#f59e0b] dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] md:text-xs text-[#94a3b8] dark:text-slate-500 font-medium mt-3">
              All time
            </div>
          </div>

          {/* Card 4: Total P&L (unchanged) */}
          <div 
            id="stat-card-total-pnl"
            onClick={() => onNavigateToTab('ai-trading')}
            className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs md:text-sm font-medium text-[#475569] dark:text-slate-400">Total P&amp;L</div>
                <div className="text-xl md:text-2xl font-extrabold text-[#16a34a] dark:text-emerald-400 font-mono mt-1">
                  +$0.00
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 text-[#10b981] dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] md:text-xs text-[#64748b] dark:text-slate-400 font-medium mt-3">
              Balance: $0.00
            </div>
          </div>
        </div>

        {/* Quick Performance Snapshot Reference Widget */}
        <QuickPerformanceSnapshot onStartAITrading={() => onNavigateToTab('ai-trading')} />

        {/* 3 Vibrant Action Banners */}
        <div className="space-y-3.5">
          {/* Banner 1: AI Trading */}
          <div 
            id="banner-ai-trading"
            className="rounded-3xl p-5 md:p-6 bg-gradient-to-r from-[#3b82f6] to-[#6052f7] text-white shadow-md flex items-center justify-between transition-all hover:shadow-lg group"
          >
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">AI Trading</h3>
              <p className="text-xs md:text-sm text-white/90 font-normal">Let AI trade for you</p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToTab('ai-trading')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Start AI</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 md:w-7 md:h-7 stroke-[2.2]" />
            </div>
          </div>

          {/* Banner 2: Connect Broker */}
          <div 
            id="banner-connect-broker"
            className="rounded-3xl p-5 md:p-6 bg-gradient-to-r from-[#00b074] to-[#10b981] text-white shadow-md flex items-center justify-between transition-all hover:shadow-lg group"
          >
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">Connect Broker</h3>
              <p className="text-xs md:text-sm text-white/90 font-normal">Link your trading account</p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToTab('settings')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Connect</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6 md:w-7 md:h-7 stroke-[2.2]" />
            </div>
          </div>

          {/* Banner 3: Market Pulse */}
          <div 
            id="banner-market-pulse"
            className="rounded-3xl p-5 md:p-6 bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-md flex items-center justify-between transition-all hover:shadow-lg group"
          >
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">Market Pulse</h3>
              <p className="text-xs md:text-sm text-white/90 font-normal">Live market insights</p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateToTab('pulse-signals')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
              <BarChart2 className="w-6 h-6 md:w-7 md:h-7 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Market Pulse Redesigned with Multi-Asset Layout */}
      <MarketPulse onOpenFullMarket={() => onNavigateToTab('pulse-signals')} />

      {/* 4. Exclusive VIP Signal of the Day Banner */}
      <div 
        id="signal-of-the-day-banner"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-8 shadow-xs text-center relative overflow-hidden flex flex-col items-center justify-center space-y-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#f0edfe] dark:bg-[#1c1938] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs">
          <Shield className="w-6 h-6" />
        </div>
        
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase font-mono tracking-wider px-3 py-1 rounded-md bg-[#f0edfe] dark:bg-[#1c1938] text-[#5b3fe4] dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            Exclusive to Ultimate &amp; Platinum Plans
          </span>
          <h2 className="text-base md:text-lg font-bold text-[#0f172a] dark:text-white tracking-tight pt-2">
            Get access to daily high-precision trading signals generated by Gemina AI (DeepSeek)
          </h2>
          <p className="text-xs text-[#64748b] dark:text-slate-400 max-w-xl mx-auto">
            Institutional algorithmic signals with verified win-rates, optimal trade entry levels &amp; auto-execution.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onOpenUpgrade('Platinum')}
            className="px-6 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Upgrade to Unlock</span>
          </button>
        </div>
      </div>

      {/* 5. ForexFactory — Real Macro Events & Economic Calendar */}
      <ForexFactoryCalendar onOpenMacroAnalysis={onOpenMacroAnalysis} />

      {/* 6. News Signal (NFP/CPI) Wide Locked Feature Section */}
      <div 
        id="news-signal-nfp-cpi-full-section"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between"
      >
        {/* Title and Subtitle at Top-Left */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
            <h3 className="text-sm md:text-base font-bold text-[#0f172a] dark:text-white tracking-wide">
              News Signal (NFP/CPI)
            </h3>
          </div>
          <p className="text-xs text-[#64748b] dark:text-slate-400">
            Pro plan (or higher) required to access news signals
          </p>
        </div>

        {/* Centered Lock, Copy, and Upgrade Button */}
        <div className="flex flex-col items-center justify-center text-center py-8 md:py-10 space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#f0edfe] dark:bg-[#1c1938] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400">
            <Lock className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-xs md:text-sm text-[#334155] dark:text-slate-300 max-w-xl font-medium">
            Upgrade to Pro (or higher) to receive high-confidence NFP &amp; CPI trading signals
          </p>
          <div className="pt-1">
            <button
              onClick={() => onOpenUpgrade('Pro')}
              className="px-7 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      {/* 7. Referral Program Full Width Horizontal Section */}
      <div 
        id="referral-program-section-full"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
      >
        {/* Header with Title and Available Balance */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f0edfe] dark:bg-[#1c1938] text-[#5b3fe4] dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              $
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#0f172a] dark:text-white tracking-wide">
                Referral Program
              </h3>
              <p className="text-[11px] text-[#64748b] dark:text-slate-400">
                Earn real money when your referrals subscribe
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[#64748b] dark:text-slate-400 font-mono uppercase">Available Balance</div>
            <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">$0.00</div>
          </div>
        </div>

        {/* Navigation Tabs (Overview, Referrals, Withdrawals) */}
        <div className="flex items-center gap-2 border-b border-[#f1f5f9] dark:border-[#171a27] pb-2 text-xs">
          {(['Overview', 'Referrals', 'Withdrawals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setReferralTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                referralTab === tab
                  ? 'bg-[#5b3fe4] text-white shadow-xs'
                  : 'text-[#64748b] dark:text-slate-400 hover:text-[#5b3fe4] dark:hover:text-purple-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] text-center shadow-2xs">
            <div className="text-lg font-bold font-mono text-[#0f172a] dark:text-white">0</div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
              Total Referred
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] text-center shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-lg font-bold font-mono text-[#0f172a] dark:text-white">
              <Users className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
              <span>0</span>
            </div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
              Subscribed
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] text-center shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-lg font-bold font-mono text-[#0f172a] dark:text-white">
              <Clock className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
              <span>0</span>
            </div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
              Pending
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] text-center shadow-2xs">
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">$0.00</div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
              Earnings
            </div>
          </div>
        </div>

        {/* Account ID Display */}
        <div className="space-y-1 pt-1">
          <label className="text-[11px] text-[#475569] dark:text-slate-300 font-medium block">Your Account ID</label>
          <div className="px-3.5 py-2 bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] rounded-xl text-[#0f172a] dark:text-white font-mono text-xs w-full max-w-sm">
            {user.referralCode || 'DAVB669'}
          </div>
        </div>

        {/* Referral Link with Copy Button */}
        <div className="space-y-1">
          <label className="text-[11px] text-[#475569] dark:text-slate-300 font-medium block">Your Referral Link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] rounded-xl text-[#5b3fe4] dark:text-purple-300 font-mono text-xs focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95 cursor-pointer"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span>{copiedRef ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Withdrawal Bar Banner */}
        <div className="w-full py-2.5 px-4 rounded-xl bg-[#f0edfe] dark:bg-[#1c1938] border border-purple-200 dark:border-purple-500/30 text-center text-xs font-semibold text-[#5b3fe4] dark:text-purple-300 flex items-center justify-center gap-2">
          <span>↓</span>
          <span>Withdraw (Min $75 - Need $75.00 more)</span>
        </div>

        {/* Earnings tier cards */}
        <div className="space-y-2 pt-2">
          <div className="text-[11px] text-[#64748b] font-medium">Earn real money when your referrals subscribe:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-[#e5e7eb] text-center">
              <div className="text-sm font-bold font-mono text-[#5b3fe4]">$5</div>
              <div className="text-[10px] text-[#64748b]">Starter / Pro</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-[#e5e7eb] text-center">
              <div className="text-sm font-bold font-mono text-[#5b3fe4]">$10</div>
              <div className="text-[10px] text-[#64748b]">Elite / Ultimate</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-sm font-bold font-mono text-amber-700">$36</div>
              <div className="text-[10px] text-amber-700 font-semibold">Platinum</div>
            </div>
          </div>
          <div className="text-[10px] text-[#64748b] flex items-center gap-1">
            <span>💡</span>
            <span>You can also use your balance to pay for subscriptions!</span>
          </div>
        </div>
      </div>

      {/* 8. MT5 Account Full Width Strip */}
      <div 
        id="mt5-account-full-strip"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
            MT5 Account
          </h3>
        </div>

        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <Activity className="w-6 h-6 text-gray-400" />
          <div className="text-xs text-[#334155] dark:text-slate-300 font-medium">No MT5 account connected</div>
          <div className="text-[11px] text-[#64748b] dark:text-slate-400">
            Connect your account in <span className="text-[#5b3fe4] dark:text-purple-400 font-semibold cursor-pointer" onClick={() => onNavigateToTab('settings')}>Settings &rarr; MT5 Bridge</span>
          </div>
        </div>
      </div>

      {/* 9. Gemina AI Assistant & Activity Summary (Horizontal 2-Column Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemina Assistant Card */}
        <div 
          id="gemina-assistant-overview-card"
          className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
                Gemina AI Assistant
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              DeepSeek-V3
            </span>
          </div>
          <p className="text-xs text-[#64748b] dark:text-slate-400">DeepSeek-powered market analyst &amp; vision assistant</p>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="text-[#475569] dark:text-slate-400 text-[11px] font-semibold mb-1">Capabilities:</div>
            {['Screenshot Vision Data Extraction', 'Live Market Structure Analysis', 'Institutional S/R Levels', '1-2% Risk Model Engine', 'Automated Strategy Guidance'].map((cap, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[#334155] dark:text-slate-300 text-xs">
                <span className="text-[#5b3fe4] dark:text-purple-400">•</span>
                <span>{cap}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenTrish}
            className="w-full py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Launch Gemina AI</span>
          </button>
        </div>

        {/* Activity Summary Card */}
        <div 
          id="activity-summary-overview-card"
          className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
              Activity Summary
            </h3>
          </div>
          <p className="text-xs text-[#64748b] dark:text-slate-400">Your usage statistics</p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
              <span className="text-[#64748b] dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Last Login:</span>
              </span>
              <span className="font-semibold text-[#0f172a] dark:text-white">Today</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
              <span className="text-[#64748b] dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span>Membership Plan:</span>
              </span>
              <span className="font-semibold text-[#5b3fe4] dark:text-purple-400">{user.plan || 'Free Trial'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
              <span className="text-[#64748b] dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gray-400" />
                <span>Features Used This Week:</span>
              </span>
              <span className="font-semibold text-[#0f172a] dark:text-white font-mono">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748b] dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>AI Time Used:</span>
              </span>
              <span className="font-semibold text-[#0f172a] dark:text-white font-mono">0 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Daily Usage Stats Full Width Strip */}
      <div 
        id="daily-usage-stats-full"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
            Daily Usage Stats
          </h3>
        </div>
        <p className="text-xs text-[#64748b] dark:text-slate-400">Track your feature usage and remaining limits</p>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
            <span className="text-[#475569] dark:text-slate-400">AI Chart Analyses</span>
            <span className="font-mono font-bold text-[#0f172a] dark:text-white">0 / 2</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
            <span className="text-[#475569] dark:text-slate-400">Voice Sessions</span>
            <span className="font-mono font-bold text-[#0f172a] dark:text-white">0 / 0</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#171a27] pb-2">
            <span className="text-[#475569] dark:text-slate-400">Custom AI Setups</span>
            <span className="font-mono font-bold text-[#0f172a] dark:text-white">0 / 0</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#475569] dark:text-slate-400">Current Plan: <strong className="text-[#5b3fe4] dark:text-purple-400">{user.plan || 'Free Trial'}</strong></span>
            <span className="text-[11px] text-[#64748b] dark:text-slate-400 font-mono">Trial Active</span>
          </div>
        </div>
      </div>

      {/* 11. Your Tools & Shortcuts */}
      <div 
        id="your-tools-shortcuts-full"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🧰</span>
          <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
            Your Tools &amp; Shortcuts
          </h3>
        </div>
        <p className="text-xs text-[#64748b] dark:text-slate-400">Quick access to popular PipNex features</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => onNavigateToTab('prop-pass')}
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] hover:border-purple-300 dark:hover:border-purple-500/40 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <Shield className="w-5 h-5 text-[#5b3fe4] dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-[#0f172a] dark:text-white">PropPass</div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400">Prop firm challenge guard</div>
          </button>

          <button
            onClick={() => onNavigateToTab('calc')}
            className="p-4 rounded-xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] hover:border-purple-300 dark:hover:border-purple-500/40 text-left transition-all group cursor-pointer shadow-2xs"
          >
            <Calculator className="w-5 h-5 text-[#5b3fe4] dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-[#0f172a] dark:text-white">Position Size Calculator</div>
            <div className="text-[10px] text-[#64748b] dark:text-slate-400">Risk &amp; lot size calculator</div>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onNavigateToTab('quick-access')}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#15192c] hover:bg-gray-200 dark:hover:bg-[#1d223c] border border-[#e5e7eb] dark:border-[#222842] text-xs font-semibold text-[#334155] dark:text-slate-200 hover:text-[#0f172a] dark:hover:text-white transition-all cursor-pointer shadow-xs"
          >
            Explore Tools
          </button>
        </div>
      </div>

      {/* 12. Membership Plans Showcase */}
      <div 
        id="membership-plans-overview-card"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f1f5f9] dark:border-[#171a27] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white tracking-wide">
                PipNex Membership Plans
              </h3>
            </div>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
              Choose the tier that matches your trading goals and execution volume.
            </p>
          </div>
          <button
            onClick={() => onOpenUpgrade('Pro')}
            className="px-4 py-2 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            Upgrade Membership
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* Starter Plan */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] flex flex-col justify-between space-y-4 shadow-2xs">
            <div>
              <div className="text-sm font-bold text-[#0f172a] dark:text-white">Starter</div>
              <div className="text-[11px] text-[#64748b] dark:text-slate-400">Perfect for getting started</div>
              <div className="text-2xl font-extrabold font-mono text-[#0f172a] dark:text-white mt-2">
                $45 <span className="text-xs text-[#64748b] dark:text-slate-400 font-sans font-normal">/ ½ month</span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5e7eb] dark:border-[#1e2338] space-y-1.5 text-xs text-[#334155] dark:text-slate-300">
                <div className="flex items-center gap-1.5">✓ 10 Chart Uploads per day</div>
                <div className="flex items-center gap-1.5">✓ Advanced Chart Analysis</div>
                <div className="flex items-center gap-1.5">✓ Multi-Timeframe Analysis</div>
                <div className="flex items-center gap-1.5">✓ PipNex Pulse Signals (2/day)</div>
                <div className="flex items-center gap-1.5">✓ AI News Trading Analysis</div>
                <div className="flex items-center gap-1.5">✓ Position Size Calculator</div>
                <div className="flex items-center gap-1.5">✓ 3 Custom AI Setups per day</div>
                <div className="flex items-center gap-1.5">✓ Smart Chart Analyzer</div>
                <div className="flex items-center gap-1.5">✓ Trading Journal</div>
                <div className="flex items-center gap-1.5">✓ 24/7 Priority Support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade('Starter')}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-[#181c30] hover:bg-gray-100 dark:hover:bg-[#202540] border border-[#e5e7eb] dark:border-[#252c4c] text-xs font-semibold text-[#0f172a] dark:text-white transition-all cursor-pointer shadow-xs"
            >
              Get Starter ($45)
            </button>
          </div>

          {/* Pro Plan (⭐ MOST POPULAR) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#13162b] border-2 border-[#5b3fe4] flex flex-col justify-between space-y-4 relative shadow-lg">
            <span className="absolute -top-3 right-5 text-[10px] font-mono uppercase px-3 py-0.5 rounded-full bg-[#5b3fe4] text-white font-bold shadow-xs">
              ⭐ MOST POPULAR
            </span>

            <div>
              <div className="text-sm font-bold text-[#0f172a] dark:text-white">Pro</div>
              <div className="text-[11px] text-[#5b3fe4] dark:text-purple-300 font-medium">For serious traders</div>
              <div className="text-2xl font-extrabold font-mono text-[#0f172a] dark:text-white mt-2">
                $95 <span className="text-xs text-[#64748b] dark:text-slate-400 font-sans font-normal">/ month</span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] dark:border-[#1e2338] space-y-1.5 text-xs text-[#334155] dark:text-slate-300">
                <div className="flex items-center gap-1.5">✓ 24 Chart Uploads per day</div>
                <div className="flex items-center gap-1.5">✓ Multi-Timeframe Analysis</div>
                <div className="flex items-center gap-1.5 text-[#5b3fe4] dark:text-purple-300 font-bold">✓ Signal of the Day (90%+ accurate)</div>
                <div className="flex items-center gap-1.5">✓ PipNex Pulse Signals (2/day)</div>
                <div className="flex items-center gap-1.5">✓ AI News Trading Analysis (NFP/CPI)</div>
                <div className="flex items-center gap-1.5">✓ AI Auto trading</div>
                <div className="flex items-center gap-1.5">✓ PipNex PropPass</div>
                <div className="flex items-center gap-1.5">✓ Smart Chart Analyzer</div>
                <div className="flex items-center gap-1.5">✓ Unlimited Custom Setups</div>
                <div className="flex items-center gap-1.5">✓ 24/7 Priority Support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade('Pro')}
              className="w-full py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              Get Pro ($95)
            </button>
          </div>

          {/* Elite Plan */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121524] border border-amber-300 dark:border-amber-500/40 flex flex-col justify-between space-y-4 relative shadow-2xs">
            <span className="absolute -top-3 right-5 text-[10px] font-mono uppercase px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-600/40">
              MAX PERFORMANCE
            </span>

            <div>
              <div className="text-sm font-bold text-[#0f172a] dark:text-white">Elite</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Maximum performance</div>
              <div className="text-2xl font-extrabold font-mono text-[#0f172a] dark:text-white mt-2">
                $195 <span className="text-xs text-[#64748b] dark:text-slate-400 font-sans font-normal">/ 3 months</span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5e7eb] dark:border-[#1e2338] space-y-1.5 text-xs text-[#334155] dark:text-slate-300">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium">✓ Unlimited PipNex Pulse Signals</div>
                <div className="flex items-center gap-1.5">✓ Direct AI Chart Analysis (no uploads)</div>
                <div className="flex items-center gap-1.5">✓ Prompt Trading UI</div>
                <div className="flex items-center gap-1.5">✓ MT5 Account Connection</div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">✓ 🤖 Run Bots Without PC (Cloud Bots)</div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">✓ 🚀 Auto Trading (2000 AI credits)</div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">✓ ☁️ FREE VPS Included ($50/mo value)</div>
                <div className="flex items-center gap-1.5">✓ Voice-based AI Interaction</div>
                <div className="flex items-center gap-1.5">✓ AI reads account for journaling</div>
                <div className="flex items-center gap-1.5">✓ AI generates &amp; executes strategies</div>
                <div className="flex items-center gap-1.5">✓ Unlimited MT5 accounts (10)</div>
                <div className="flex items-center gap-1.5">✓ 24/7 Bot Monitoring &amp; Alerts</div>
                <div className="flex items-center gap-1.5">✓ Priority AI processing</div>
                <div className="flex items-center gap-1.5">✓ White-glove support</div>
              </div>
            </div>

            <button
              onClick={() => onOpenUpgrade('Elite')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              Get Elite ($195)
            </button>
          </div>
        </div>

        {/* Support Contact Footer Banner */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1e2338] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#334155] dark:text-slate-300">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">24/7 Customer Support:</span>
            <span>Reach out anytime to our dedicated desk</span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="mailto:Pipnexaicustomer@gmail.com" 
              className="font-mono text-[#5b3fe4] dark:text-purple-300 hover:underline font-semibold"
            >
              Pipnexaicustomer@gmail.com
            </a>
            <span className="text-gray-400">•</span>
            <a 
              href="tel:+254726222093" 
              className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              +254726222093
            </a>
          </div>
        </div>
      </div>

      {/* 13. RISK DISCLAIMER FOOTER (Collapsible Dropdown) */}
      <div 
        id="risk-disclaimer-footer"
        className="w-full bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl shadow-xs overflow-hidden"
      >
        {/* Dropdown Toggle Button */}
        <button
          id="risk-disclaimer-toggle-btn"
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#131627] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">
                Risk Disclaimer &amp; Important Legal Notice
              </div>
              <div className="text-[10px] md:text-[11px] text-[#64748b] dark:text-slate-400">
                Trading involves substantial risk of loss. Click to read the full disclaimer.
              </div>
            </div>
          </div>

          <ChevronRight
            className={`w-4 h-4 text-[#64748b] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
              showDisclaimer ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* Dropdown Content */}
        {showDisclaimer && (
          <div className="px-5 pb-5 pt-1 border-t border-[#f1f5f9] dark:border-[#171a27] space-y-4 text-[11px] md:text-xs text-[#475569] dark:text-slate-400 leading-relaxed animate-in fade-in duration-200">

            {/* General Risk Warning */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">1. General Risk Warning</h4>
              <p>
                Trading foreign exchange (Forex), contracts for difference (CFDs), and other leveraged financial instruments carries a high level of risk and may not be suitable for all investors. You should never trade with money you cannot afford to lose. Leverage can work against you as well as for you. <strong className="text-[#0f172a] dark:text-white">Past performance is not indicative of future results.</strong>
              </p>
              <p>
                PipNex AI is not a licensed financial advisor, broker, or exchange. All tools, signals, alerts, and algorithmic suggestions provided by PipNex AI are for <strong className="text-[#0f172a] dark:text-white">educational, informational, and analytical purposes only</strong>. They do not constitute investment advice, financial guidance, or a solicitation to buy or sell any security, currency, or asset. You are solely responsible for your own trading decisions.
              </p>
            </div>

            {/* No Profit Guarantees */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">2. No Profit Guarantees</h4>
              <p>
                PipNex AI does <strong className="text-[#0f172a] dark:text-white">NOT</strong> promise or guarantee profits, passive income, or specific win-rate percentages. Our AI-powered market analysis, support/resistance levels, and trade setups are generated using technical indicators, pattern recognition, and machine learning models. They are <strong className="text-[#0f172a] dark:text-white">analytical tools</strong>, not profit-generating machines. No algorithmic system can accurately predict market movements with 100% certainty. Any reference to "Signal of the Day," "high-probability setups," or backtested performance is for educational illustration only and is not a guarantee of future results.
              </p>
            </div>

            {/* No Custody of Funds */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">3. No Custody of Funds</h4>
              <p>
                PipNex AI does <strong className="text-[#0f172a] dark:text-white">NOT</strong> hold, store, or take custody of user funds or deposits for trading purposes. Our platform provides algorithmic trade setups, market data analysis, and decision-support tools. It does not execute trades on your behalf or manage your account balance. All actual trading activity must take place through your own external, regulated brokerage account. We connect to your brokerage account only via secure APIs (where applicable) and never have the ability to withdraw, move, or manage your funds.
              </p>
            </div>

            {/* Transparent Methodology */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">4. Transparent Methodology</h4>
              <p>
                Our AI combines classical technical analysis (support/resistance, trendlines, candle patterns) with machine learning models including <strong className="text-[#0f172a] dark:text-white">Random Forests</strong> for breakout classification and <strong className="text-[#0f172a] dark:text-white">LSTM networks</strong> for short-term price movement prediction and volatility estimation. All models are ensemble-based and retrained periodically. Each setup is assigned a confidence score and risk recommendations (Stop-Loss, Take-Profit, position sizing) are derived from volatility-adjusted models. These are suggestions only and must be customised to your personal risk tolerance.
              </p>
            </div>

            {/* Jurisdictional Considerations */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">5. Jurisdictional Considerations</h4>
              <p>
                PipNex AI is available to users worldwide, but it is your responsibility to ensure that using our tools complies with your local laws and regulations. Some jurisdictions restrict or prohibit trading in leveraged financial products. It is your duty to verify whether you are legally permitted to trade Forex, CFDs, or cryptocurrencies in your country. PipNex AI does not provide services to individuals or entities in jurisdictions where such services are prohibited.
              </p>
            </div>

            {/* Acknowledgment of Risk */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#0f172a] dark:text-white text-xs">6. Acknowledgment of Risk</h4>
              <p>
                By using PipNex AI, you acknowledge and agree that you have read, understood, and accepted this Risk Disclaimer in its entirety; you are solely responsible for all trading decisions and outcomes; you understand that trading involves substantial risk of financial loss; and you will not hold PipNex AI, its developers, affiliates, or data providers liable for any trading losses, missed profits, or damages arising from your use of our platform.
              </p>
            </div>

            <div className="pt-2 border-t border-[#f1f5f9] dark:border-[#171a27] text-[10px] text-[#94a3b8] dark:text-slate-500 font-mono">
              Last Updated: September 2026 · © {new Date().getFullYear()} PipNex AI. All rights reserved.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
