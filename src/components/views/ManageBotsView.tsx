import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  Terminal, 
  Bot, 
  Layers,
  Crown,
  Activity,
  Play,
  Pause,
  Settings,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface ManageBotsViewProps {
  onBack?: () => void;
  onNavigateToBuilder?: () => void;
  onNavigateToSubscription?: () => void;
}

interface BotProfile {
  id: string;
  name: string;
  type: string;
  timeframe: string;
  pairs: string[];
  winRate: number;
  tradesCount: number;
  profitUsd: number;
  profitPips: number;
  status: 'ACTIVE' | 'PAUSED';
  riskPercent: number;
  maxDrawdown: string;
  description: string;
}

export const ManageBotsView: React.FC<ManageBotsViewProps> = ({ 
  onBack,
  onNavigateToBuilder,
  onNavigateToSubscription
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'live' | 'stats' | 'trades' | 'logs'>('all');
  
  const [bots, setBots] = useState<BotProfile[]>([
    {
      id: 'bot-1',
      name: 'Pipnexai Scalper',
      type: 'High-Frequency M1/M5 Momentum & Micro-Structure Scalper',
      timeframe: 'M1 / M5',
      pairs: ['EUR/USD', 'GBP/USD', 'XAU/USD', 'USD/JPY'],
      winRate: 88.4,
      tradesCount: 84,
      profitUsd: 2640.80,
      profitPips: 342.5,
      status: 'ACTIVE',
      riskPercent: 1.0,
      maxDrawdown: '2.1%',
      description: 'Microsecond order placement taking advantage of institutional liquidity sweeps and tight spread entries with dynamic breakeven.'
    },
    {
      id: 'bot-2',
      name: 'Nova Edge swing Ea',
      type: 'Multi-Day Order Block & Swing Trend Expansion EA',
      timeframe: 'H1 / H4',
      pairs: ['XAU/USD', 'XAG/USD', 'GBP/JPY', 'AUD/USD'],
      winRate: 84.1,
      tradesCount: 36,
      profitUsd: 1420.60,
      profitPips: 580.0,
      status: 'ACTIVE',
      riskPercent: 1.5,
      maxDrawdown: '3.4%',
      description: 'Captures sustained market expansions following Fair Value Gap fill and higher timeframe structure breaks.'
    },
    {
      id: 'bot-3',
      name: 'Pipnex News trader Ea',
      type: 'Macroeconomic NewsIQ & Volatility Straddle EA',
      timeframe: 'M5 / M15',
      pairs: ['USD/CAD', 'EUR/USD', 'XAU/USD', 'NAS100'],
      winRate: 91.2,
      tradesCount: 22,
      profitUsd: 831.00,
      profitPips: 290.4,
      status: 'ACTIVE',
      riskPercent: 0.75,
      maxDrawdown: '1.8%',
      description: 'Pre-event order book analysis and instant straddle brackets to capture CPI, NFP, and FOMC rate surges with slippage guards.'
    }
  ]);

  const toggleBotStatus = (id: string) => {
    setBots(prev => prev.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: b.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
        };
      }
      return b;
    }));
  };

  const activeBotsCount = bots.filter(b => b.status === 'ACTIVE').length;
  const totalProfitUsd = bots.reduce((acc, b) => acc + b.profitUsd, 0);
  const totalTrades = bots.reduce((acc, b) => acc + b.tradesCount, 0);

  const displayedBots = activeSubTab === 'live' ? bots.filter(b => b.status === 'ACTIVE') : bots;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto pb-10">
      
      {/* 1. Header Card */}
      <div className="bg-[#080911] border border-[#171926] rounded-3xl p-6 sm:p-7 space-y-3.5 shadow-xl">
        {/* Title + Platinum Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manage Bots
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1b162b] border border-purple-500/40 text-purple-300 text-[10px] font-bold font-mono tracking-wide flex items-center gap-1">
              💎 Platinum Active
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-xs text-gray-400 font-medium">
          Rules-first hybrid execution engine &amp; institutional EA management
        </div>

        {/* Badges: All MT5 brokers & All prop firms */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="px-3 py-1 rounded-full bg-[#18152b] border border-purple-500/35 text-purple-300 text-xs font-semibold">
            All MT5 brokers
          </span>
          <span className="px-3 py-1 rounded-full bg-[#18152b] border border-purple-500/35 text-purple-300 text-xs font-semibold">
            All prop firms
          </span>
        </div>

        {/* Supported Brokers and Prop Firms List */}
        <p className="text-[11px] text-gray-400 leading-relaxed font-sans pt-1">
          Deriv, Exness, XM, Just Markets, HFM, Vantage, IC Markets, Pepperstone, FBS, FxPro, Octa, FTMO, FundedNext — and any other MT5 broker or funded account.
        </p>
      </div>

      {/* 2. Four Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: ACTIVE BOTS */}
        <div className="bg-[#080911] border border-[#171926] rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[#121422] border border-[#202438] flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              ACTIVE BOTS
            </div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {activeBotsCount}
            </div>
          </div>
        </div>

        {/* Metric 2: TOTAL BOTS */}
        <div className="bg-[#080911] border border-[#171926] rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[#121422] border border-[#202438] flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              TOTAL BOTS
            </div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {bots.length}
            </div>
          </div>
        </div>

        {/* Metric 3: TOTAL TRADES */}
        <div className="bg-[#080911] border border-[#171926] rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[#121422] border border-[#202438] flex items-center justify-center text-gray-300">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              TOTAL TRADES
            </div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {totalTrades}
            </div>
          </div>
        </div>

        {/* Metric 4: NET P/L */}
        <div className="bg-[#080911] border border-[#171926] rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-[#09150e] border border-emerald-500/35 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              NET P/L
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              +$0.00
            </div>
          </div>
        </div>

      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#121422] text-white border border-[#24283e] shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c0e18]'
          }`}
        >
          All ({bots.length})
        </button>

        <button
          onClick={() => setActiveSubTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'live'
              ? 'bg-[#121422] text-white border border-[#24283e] shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c0e18]'
          }`}
        >
          Live ({activeBotsCount})
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-[#121422] text-white border border-[#24283e] shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c0e18]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Stats</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trades')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'trades'
              ? 'bg-[#121422] text-white border border-[#24283e] shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c0e18]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Trades</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-[#121422] text-white border border-[#24283e] shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c0e18]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>
      </div>

      {/* 4. Main Bot Cards Grid */}
      {(activeSubTab === 'all' || activeSubTab === 'live') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {displayedBots.map((b, index) => (
            <div 
              key={b.id}
              className="bg-[#090a14] border border-[#181b2e] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-purple-500/30 transition-all"
            >
              <div className="space-y-3">
                {/* Bot Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#14172b] border border-[#252c4e] flex items-center justify-center text-purple-300 font-mono font-bold text-sm shadow-sm">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {b.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-mono block">
                        {b.timeframe} · {b.pairs.join(', ')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    b.status === 'ACTIVE' 
                      ? 'bg-[#122b1c] text-emerald-400 border border-emerald-500/40' 
                      : 'bg-[#281b10] text-amber-400 border border-amber-500/40'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {/* Bot Description */}
                <p className="text-xs text-gray-400 leading-relaxed font-sans min-h-[36px]">
                  {b.description}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-[#0e1122] p-2.5 rounded-xl border border-[#1b213f]">
                    <span className="text-[10px] text-gray-500 block font-sans">WIN RATE</span>
                    <strong className="text-emerald-400 text-sm">{b.winRate}%</strong>
                  </div>

                  <div className="bg-[#0e1122] p-2.5 rounded-xl border border-[#1b213f]">
                    <span className="text-[10px] text-gray-500 block font-sans">NET PROFIT</span>
                    <strong className="text-emerald-400 text-sm">+$0.00</strong>
                  </div>

                  <div className="bg-[#0e1122] p-2.5 rounded-xl border border-[#1b213f]">
                    <span className="text-[10px] text-gray-500 block font-sans">TRADES / GAIN</span>
                    <strong className="text-white text-xs">{b.tradesCount} ({b.profitPips} pips)</strong>
                  </div>

                  <div className="bg-[#0e1122] p-2.5 rounded-xl border border-[#1b213f]">
                    <span className="text-[10px] text-gray-500 block font-sans">MAX DRAWDOWN</span>
                    <strong className="text-purple-300 text-xs">{b.maxDrawdown}</strong>
                  </div>
                </div>
              </div>

              {/* Bot Control Footer */}
              <div className="pt-3 border-t border-[#171a2e] flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleBotStatus(b.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      b.status === 'ACTIVE'
                        ? 'bg-[#2b1216] hover:bg-[#3d151c] text-[#ff4b58] border border-[#ff4b58]/35'
                        : 'bg-[#122b1c] hover:bg-[#193a26] text-emerald-400 border border-emerald-500/35'
                    }`}
                  >
                    {b.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{b.status === 'ACTIVE' ? 'Pause EA' : 'Resume EA'}</span>
                  </button>

                  <div className="text-[11px] font-mono text-gray-400">
                    Risk: <strong className="text-white">{b.riskPercent}%</strong>
                  </div>
                </div>

                {/* Direct 'Use Bot' CTA redirecting to Subscription */}
                <button
                  id={`use-bot-btn-${b.id}`}
                  onClick={() => {
                    if (onNavigateToSubscription) {
                      onNavigateToSubscription();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#5b3fe4] hover:from-purple-500 hover:to-[#4d32d0] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Use Bot</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 5. Sub-view for Stats / Trades / Logs */}
      {activeSubTab === 'stats' && (
        <div className="bg-[#080911] border border-[#171926] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Combined Institutional Portfolio Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-[#0e1122] border border-[#1b213f] space-y-1">
              <span className="text-gray-400 text-[10px] uppercase">Combined Profit Factor</span>
              <div className="text-xl font-bold text-emerald-400">2.84</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1122] border border-[#1b213f] space-y-1">
              <span className="text-gray-400 text-[10px] uppercase">Average Trade Duration</span>
              <div className="text-xl font-bold text-white">18 mins</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0e1122] border border-[#1b213f] space-y-1">
              <span className="text-gray-400 text-[10px] uppercase">Sharpe Ratio</span>
              <div className="text-xl font-bold text-purple-300">2.41</div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'trades' && (
        <div className="bg-[#080911] border border-[#171926] rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Live Execution Feed from Cloud EA Engines
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-gray-500 border-b border-[#161826] pb-2">
                  <th className="py-2">BOT</th>
                  <th className="py-2">PAIR</th>
                  <th className="py-2">TYPE</th>
                  <th className="py-2">LOT</th>
                  <th className="py-2">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141728]">
                <tr>
                  <td className="py-2.5 font-bold text-white">Pipnexai Scalper</td>
                  <td className="py-2.5">EUR/USD</td>
                  <td className="py-2.5 text-emerald-400">BUY</td>
                  <td className="py-2.5">0.50</td>
                  <td className="py-2.5 text-emerald-400 font-bold">+$184.20 (+14.2 pips)</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Nova Edge swing Ea</td>
                  <td className="py-2.5">XAU/USD</td>
                  <td className="py-2.5 text-emerald-400">BUY</td>
                  <td className="py-2.5">0.25</td>
                  <td className="py-2.5 text-emerald-400 font-bold">+$420.00 (+84.0 pips)</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Pipnex News trader Ea</td>
                  <td className="py-2.5">USD/CAD</td>
                  <td className="py-2.5 text-emerald-400">SELL</td>
                  <td className="py-2.5">0.40</td>
                  <td className="py-2.5 text-emerald-400 font-bold">+$310.50 (+31.0 pips)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="bg-[#080911] border border-[#171926] rounded-3xl p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>MT5 Real-Time Gateway Logs</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#04050a] border border-[#161828] text-gray-300 space-y-1.5 text-[11px] leading-relaxed">
            <div><span className="text-gray-500">[14:32:01]</span> <span className="text-purple-400">[Pipnexai Scalper]</span> Connected to broker socket with 4ms latency.</div>
            <div><span className="text-gray-500">[14:32:05]</span> <span className="text-indigo-400">[Nova Edge swing Ea]</span> Validated H4 order block on XAU/USD.</div>
            <div><span className="text-gray-500">[14:32:10]</span> <span className="text-cyan-400">[Pipnex News trader Ea]</span> Calendar sync complete. Next tier-1 event in 38m.</div>
          </div>
        </div>
      )}

    </div>
  );
};
