import React, { useState } from 'react';
import { 
  Crown, 
  Bot, 
  Play, 
  Pause, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  Zap, 
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';
import { BotTrade, UserProfile } from '../../types';

interface AutoTradingViewProps {
  user?: UserProfile;
  onOpenUpgrade?: () => void;
}

export const AutoTradingView: React.FC<AutoTradingViewProps> = ({ 
  user, 
  onOpenUpgrade 
}) => {
  // If user is not on Pro/Elite, display the upgrade lock screen
  const [isUnlocked, setIsUnlocked] = useState(user?.plan === 'Pro' || user?.plan === 'Elite');
  const [isLive, setIsLive] = useState(true);
  const [riskPercent, setRiskPercent] = useState('1.5');
  const [maxOpenTrades, setMaxOpenTrades] = useState('4');
  const [takeProfitPips, setTakeProfitPips] = useState('35');
  const [stopLossPips, setStopLossPips] = useState('15');


  const handleUpgradeClick = () => {
    if (onOpenUpgrade) {
      onOpenUpgrade();
    } else {
      setIsUnlocked(true);
    }
  };

  // If locked, render the exact screen from Screenshot 1
  if (!isUnlocked) {
    return (
      <div className="min-h-[72vh] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-[#140f09]/95 border border-[#593d18] rounded-2xl p-7 sm:p-8 space-y-4 shadow-2xl relative">
          
          {/* Header with Gold Crown and White Title */}
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-[#f5a623]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pro & Elite Feature
            </h2>
          </div>

          {/* Description matching screenshot */}
          <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">
            Auto Trading is available on Pro and Elite plans. Upgrade to unlock AI-managed modes (Aggressive · Intraday · Swing) on your MT5 account.
          </p>

          {/* Purple Upgrade Button */}
          <div className="pt-2">
            <button
              onClick={handleUpgradeClick}
              className="px-6 py-2.5 rounded-xl bg-[#a084e8] hover:bg-[#b096f2] text-[#120f24] font-bold text-xs shadow-md transition-all active:scale-[0.98] inline-flex items-center gap-2"
            >
              <span>Upgrade to Pro or Elite</span>
            </button>
          </div>

          {/* Developer/Testing preview switch */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setIsUnlocked(true)}
              className="text-[10px] text-gray-500 hover:text-gray-300 font-mono flex items-center gap-1 transition-colors"
              title="Preview Unlocked Mode"
            >
              <Zap className="w-3 h-3 text-[#f5a623]" />
              <span>Preview Live</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Auto Trading Engine View
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Lock toggle for testing */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#1e170c] border border-[#f5a623]/35 text-[#f5a623] text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
            👑 Pro/Elite Active
          </span>
        </div>
        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 font-mono"
        >
          <Lock className="w-3 h-3" />
          <span>Show Lock Banner</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-[#0c0d15] border border-[#1d2030] rounded-3xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Automated Bot Execution Engine</h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-bold ${
              isLive ? 'bg-[#122b1c] text-emerald-400 border border-emerald-500/30' : 'bg-[#2b220e] text-[#f5a623] border border-[#f5a623]/30'
            }`}>
              {isLive ? 'Live Bridge Connected' : 'Engine Paused'}
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl">
            Autonomous order placement with microsecond slippage protection, dynamic trailing stops, and multi-asset position management.
          </p>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-[0.98] ${
            isLive 
              ? 'bg-[#2b1216] hover:bg-[#38151c] text-[#ff4b58] border border-[#ff4b58]/35'
              : 'bg-[#122b1c] hover:bg-[#183a26] text-emerald-400 border border-emerald-500/35'
          }`}
        >
          {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isLive ? 'Pause Auto Trading' : 'Activate Live Trading'}</span>
        </button>
      </div>

      {/* Bot Parameters Settings */}
      <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#161826] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Live Execution Safeguards</h3>
          </div>
          <span className="text-[11px] text-gray-400">Syncs directly with MT5 / Prop Firm Rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 bg-[#10121c] p-3.5 rounded-2xl border border-[#1c1f30]">
            <label className="text-[11px] text-gray-400 block font-medium">Risk Per Trade (%)</label>
            <input
              type="text"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="w-full bg-[#141624] border border-[#24283c] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-1.5 bg-[#10121c] p-3.5 rounded-2xl border border-[#1c1f30]">
            <label className="text-[11px] text-gray-400 block font-medium">Max Simultaneous Positions</label>
            <input
              type="text"
              value={maxOpenTrades}
              onChange={(e) => setMaxOpenTrades(e.target.value)}
              className="w-full bg-[#141624] border border-[#24283c] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-1.5 bg-[#10121c] p-3.5 rounded-2xl border border-[#1c1f30]">
            <label className="text-[11px] text-gray-400 block font-medium">Default Take Profit (Pips)</label>
            <input
              type="text"
              value={takeProfitPips}
              onChange={(e) => setTakeProfitPips(e.target.value)}
              className="w-full bg-[#141624] border border-[#24283c] rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="space-y-1.5 bg-[#10121c] p-3.5 rounded-2xl border border-[#1c1f30]">
            <label className="text-[11px] text-gray-400 block font-medium">Stop Loss Guard (Pips)</label>
            <input
              type="text"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
              className="w-full bg-[#141624] border border-[#24283c] rounded-xl px-3 py-1.5 text-xs text-[#ff4b58] font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* Active Position Grid */}
      <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#161826] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border-2 border-purple-500/40 rounded-3xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Run Auto Trading on the Bot Platform
                </h3>
                <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Configure your risk %, TP, and SL settings above, then launch live bots on our dedicated VPS infrastructure. All trades, positions, and monitoring appear on the Bot Platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href="https://app.piptraderai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  <span>Open Bot Platform</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                Opens in a new tab · 24/7 VPS uptime · Elite plan required
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};
