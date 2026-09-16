import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Crown, 
  Radio, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Filter, 
  ExternalLink 
} from 'lucide-react';
import { MarketPulse } from '../MarketPulse';

interface PulseSignalsViewProps {
  onBack?: () => void;
  onOpenUpgrade?: (tier?: 'Pro' | 'Platinum' | 'Ultimate') => void;
  onExecuteSignal?: (signal: any) => void;
}

interface PulseSignal {
  id: string;
  symbol: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Crypto';
  direction: 'BUY' | 'SELL';
  type: string;
  interval: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
  confidence: number;
  setupType: string;
  status: 'ACTIVE' | 'PENDING' | 'TARGET 1 HIT';
  pipsGain: string;
  timeAgo: string;
  briefThesis: string;
}

export const PulseSignalsView: React.FC<PulseSignalsViewProps> = ({
  onBack,
  onOpenUpgrade,
  onExecuteSignal
}) => {
  const [signals, setSignals] = useState<PulseSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Forex' | 'Commodities' | 'Crypto'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(45);

  const fetchSignals = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/pulse-signals');
      const data = await res.json();
      if (data.success && Array.isArray(data.signals)) {
        setSignals(data.signals);
        setLastUpdated('Just now');
        setRefreshCountdown(45);
      }
    } catch (err) {
      console.warn('Could not fetch pulse signals, using offline dataset', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    fetchSignals(true);

    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchSignals(false);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (sig: PulseSignal) => {
    const text = `🎯 PIPNEX PULSE SIGNAL (${sig.symbol} - ${sig.interval})
Direction: ${sig.direction} (${sig.type})
Entry: ${sig.entryPrice}
Stop Loss: ${sig.stopLoss}
Take Profit 1: ${sig.takeProfit1}
Take Profit 2: ${sig.takeProfit2}
Risk/Reward: ${sig.riskReward}
Setup: ${sig.setupType}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSignals = signals.filter(sig => {
    if (activeCategory === 'All') return true;
    return sig.category === activeCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto pb-10">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#161828] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#121424] hover:bg-[#1a1e36] text-gray-300 hover:text-white border border-[#232742] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                PipNex Pulse Signals
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Live Feed</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Automated M15 institutional trade setups with entry, risk invalidation &amp; take-profit targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-[11px] font-mono text-gray-400 bg-[#0d0f1c] px-3 py-1.5 rounded-xl border border-[#1b1f36] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Scan: {refreshCountdown}s</span>
          </div>

          <button
            onClick={() => fetchSignals(false)}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl bg-[#12152a] hover:bg-[#1b203e] border border-[#242b50] text-gray-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Re-Scan</span>
          </button>
        </div>
      </div>

      {/* Multi-Asset Live Market Pulse */}
      <MarketPulse />

      {/* 2. Compact Metric Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-[#0d0f1b] p-1 rounded-xl border border-[#191d33] text-xs">
          {(['All', 'Forex', 'Commodities', 'Crypto'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1b1f38] text-white border border-[#2c335a] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>Displaying <strong className="text-white">{filteredSignals.length}</strong> active algorithmic setups</span>
        </div>
      </div>

      {/* 3. Signals Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#080a14] border border-[#161828] rounded-3xl">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-white">Scanning Live Market Structure</h3>
            <p className="text-xs text-gray-400 mt-1">PipNex AI evaluating M15 order blocks, liquidity pools &amp; Fair Value Gaps...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map(sig => {
            const isBuy = sig.direction === 'BUY';
            const isTargetHit = sig.status === 'TARGET 1 HIT';

            return (
              <div
                key={sig.id}
                className="bg-[#090b16] border border-[#171b30] hover:border-purple-500/40 rounded-2xl p-4.5 space-y-3.5 shadow-lg transition-all flex flex-col justify-between group"
              >
                {/* Card Header: Symbol & Direction Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isBuy ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                          <span>{sig.symbol}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({sig.interval})</span>
                        </div>
                        <div className="text-[10px] text-gray-400">{sig.name}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                        isBuy ? 'bg-[#0f2e1e] text-emerald-400 border border-emerald-500/30' : 'bg-[#2e1017] text-rose-400 border border-rose-500/30'
                      }`}>
                        {sig.direction}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">{sig.timeAgo}</span>
                    </div>
                  </div>

                  {/* Setup Type & Status Banner */}
                  <div className="mt-3 flex items-center justify-between gap-1 text-[10px] font-mono bg-[#0f1222] p-1.5 rounded-lg border border-[#1c223f]">
                    <span className="text-purple-300 font-semibold truncate">
                      {sig.setupType}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      isTargetHit ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400'
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                </div>

                {/* Compact Metric Value Matrix: ENTRY / SL / TP1 / TP2 */}
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                  <div className="bg-[#0f1120] p-2 rounded-xl border border-[#1b2038]">
                    <div className="text-[8px] uppercase tracking-wider text-gray-500 font-bold">ENTRY</div>
                    <div className="text-[11px] font-bold text-gray-200 mt-0.5 truncate">{sig.entryPrice}</div>
                  </div>

                  <div className="bg-[#0f1120] p-2 rounded-xl border border-[#1b2038]">
                    <div className="text-[8px] uppercase tracking-wider text-gray-500 font-bold">SL</div>
                    <div className="text-[11px] font-bold text-rose-400 mt-0.5 truncate">{sig.stopLoss}</div>
                  </div>

                  <div className="bg-[#0f1120] p-2 rounded-xl border border-[#1b2038]">
                    <div className="text-[8px] uppercase tracking-wider text-gray-500 font-bold">TP 1</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-0.5 truncate">{sig.takeProfit1}</div>
                  </div>

                  <div className="bg-[#0f1120] p-2 rounded-xl border border-[#1b2038]">
                    <div className="text-[8px] uppercase tracking-wider text-gray-500 font-bold">TP 2</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-0.5 truncate">{sig.takeProfit2}</div>
                  </div>
                </div>

                {/* Setup Stats: R:R / Confidence / Performance */}
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-[#14172a]">
                  <span className="flex items-center gap-1">
                    <span>R:R</span>
                    <strong className="text-white">{sig.riskReward}</strong>
                  </span>

                  <span className="flex items-center gap-1">
                    <span>Confidence</span>
                    <strong className="text-purple-300">{sig.confidence}%</strong>
                  </span>

                  <span className="text-emerald-400 font-bold">
                    {sig.pipsGain}
                  </span>
                </div>

                {/* Brief Thesis */}
                <p className="text-[11px] text-gray-300 leading-snug bg-[#0d0f1e] p-2 rounded-lg border border-[#181d36]">
                  {sig.briefThesis}
                </p>

                {/* Action Buttons: Copy Setup / Execute */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(sig)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#121426] hover:bg-[#1a1e38] border border-[#222744] hover:border-purple-500/40 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {copiedId === sig.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>Copy Setup</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (onExecuteSignal) {
                        onExecuteSignal(sig);
                      } else {
                        handleCopy(sig);
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Trade</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Upgrade Callout if user wants unlimited automated alerts */}
      <div className="bg-[#090b17] border border-[#1a1e36] rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Direct Metatrader &amp; Webhook Integration
            </h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Stream signals directly into your MT4/MT5 PipNex bots with instant automated 1-click execution.
          </p>
        </div>

        <button
          onClick={() => onOpenUpgrade?.('Platinum')}
          className="px-5 py-2.5 rounded-xl bg-[#a78bfa] hover:bg-[#bba4fb] text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
        >
          Upgrade for Webhooks
        </button>
      </div>
    </div>
  );
};
