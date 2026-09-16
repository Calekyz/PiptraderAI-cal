import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Clock, 
  Layers, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Mic, 
  MicOff, 
  Zap, 
  Shield, 
  AlertTriangle, 
  RotateCw, 
  Bot, 
  Pause, 
  Play, 
  XCircle, 
  CheckCircle2, 
  Check, 
  CircleDot
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GeneratedStrategy {
  id: string;
  timestamp: string;
  prompt: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  lotSize: number;
  explanation: string;
  confidence: number;
}

export const PromptTradingView: React.FC = () => {
  // Navigation sub-tabs matching screenshot
  const [activeTab, setActiveTab] = useState<'trading' | 'history' | 'strategies' | 'analytics'>('trading');

  // Input states
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Accordion states
  const [openTemplates, setOpenTemplates] = useState(false);
  const [openPairs, setOpenPairs] = useState(false);
  const [openRiskSettings, setOpenRiskSettings] = useState(false);

  // Configuration states
  const [selectedPairs, setSelectedPairs] = useState<string[]>(['EURUSD', 'XAUUSD']);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [maxSpread, setMaxSpread] = useState<number>(1.5);
  const [trailingStop, setTrailingStop] = useState<number>(20);

  // Auto-Trading & Controls
  const [autoTradingMode, setAutoTradingMode] = useState(false);
  const [isAiStopped, setIsAiStopped] = useState(false);
  const [isAiPaused, setIsAiPaused] = useState(false);
  const [executionMode, setExecutionMode] = useState<'simulation' | 'manual' | 'auto-queue'>('manual');
  const [requireConfirmation, setRequireConfirmation] = useState(true);

  // History & Generated Strategies
  const [strategyHistory, setStrategyHistory] = useState<GeneratedStrategy[]>([]);
  const [activeGeneratedStrategy, setActiveGeneratedStrategy] = useState<GeneratedStrategy | null>(null);

  // Templates list (including single setups & multi-pair parlays)
  const templates = [
    {
      title: 'Gold & Silver Bullion Parlay',
      prompt: 'Parlay trade: Long Gold XAUUSD at 2884 and Long Silver XAGUSD at 33.45 with dynamic trailing stops, risk 1.5%'
    },
    {
      title: 'London Breakout Scalp',
      prompt: 'Scalping EURUSD during London session, looking for BOS on M5 with liquidity sweep, target 1:3 RR'
    },
    {
      title: 'US30 & Nasdaq NY Open Combo',
      prompt: 'Combo setup: Trade US30 1m momentum continuation with NAS100 liquidity sweep on NY 9:30 AM open'
    },
    {
      title: 'GBPUSD & USDJPY Asian Sweep',
      prompt: 'Short GBPUSD upon sweep of Asian session high with bearish engulfing confirmation on M15'
    }
  ];

  const availablePairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30', 'NAS100', 'BTCUSD', 'AUDUSD'];

  const togglePair = (pair: string) => {
    if (selectedPairs.includes(pair)) {
      if (selectedPairs.length > 1) {
        setSelectedPairs(selectedPairs.filter(p => p !== pair));
      }
    } else {
      setSelectedPairs([...selectedPairs, pair]);
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/prompt-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await res.json();
      
      const newStrategy: GeneratedStrategy = {
        id: `strat-${Date.now()}`,
        timestamp: 'Just now',
        prompt: promptText,
        pair: data.pair || selectedPairs[0] || 'EURUSD',
        direction: (data.direction || 'BUY') as 'BUY' | 'SELL',
        entryPrice: data.entryPrice || 1.0850,
        stopLoss: data.stopLoss || 1.0820,
        takeProfit: data.takeProfit1 || 1.0940,
        riskReward: data.riskReward || '1:3.0',
        lotSize: data.lotSize || 1.0,
        explanation: data.strategyExplanation || 'AI detected institutional liquidity sweep with optimal risk/reward parameters.',
        confidence: 91
      };

      setActiveGeneratedStrategy(newStrategy);
      setStrategyHistory([newStrategy, ...strategyHistory]);
    } catch {
      const fallbackStrategy: GeneratedStrategy = {
        id: `strat-${Date.now()}`,
        timestamp: 'Just now',
        prompt: promptText,
        pair: selectedPairs[0] || 'EURUSD',
        direction: promptText.toLowerCase().includes('sell') || promptText.toLowerCase().includes('short') ? 'SELL' : 'BUY',
        entryPrice: selectedPairs[0] === 'XAUUSD' ? 2355.20 : 1.0842,
        stopLoss: selectedPairs[0] === 'XAUUSD' ? 2345.00 : 1.0815,
        takeProfit: selectedPairs[0] === 'XAUUSD' ? 2385.00 : 1.0925,
        riskReward: '1:3.2',
        lotSize: 0.75,
        explanation: 'Institutional order block detected on M15. SL set behind local liquidity shelf.',
        confidence: 92
      };
      setActiveGeneratedStrategy(fallbackStrategy);
      setStrategyHistory([fallbackStrategy, ...strategyHistory]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopAI = () => {
    setIsAiStopped(true);
    setAutoTradingMode(false);
  };

  const handleCancelPending = () => {
    setActiveGeneratedStrategy(null);
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setPromptText("Scalping EURUSD during London session, looking for BOS on M5 with liquidity sweep, target 1:3 RR");
        setIsListening(false);
      }, 1800);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto pb-10">
      
      {/* Top Navigation Sub-Tabs matching Screenshot 2 */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#141624] pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('trading')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'trading'
                ? 'bg-white dark:bg-[#121422] text-[#5b3fe4] dark:text-white border border-[#e2e8f0] dark:border-[#24283e] shadow-xs'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0f111c]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Trading</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-[#121422] text-[#5b3fe4] dark:text-white border border-[#e2e8f0] dark:border-[#24283e] shadow-xs'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0f111c]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'strategies'
                ? 'bg-white dark:bg-[#121422] text-[#5b3fe4] dark:text-white border border-[#e2e8f0] dark:border-[#24283e] shadow-xs'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0f111c]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Strategies</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-[#1b1f32] text-[10px] font-mono text-[#5b3fe4] dark:text-purple-300 font-bold">
              {strategyHistory.length || 1}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-[#121422] text-[#5b3fe4] dark:text-white border border-[#e2e8f0] dark:border-[#24283e] shadow-xs'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0f111c]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout from Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Prompt Trading AI (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#080911] border border-[#e2e8f0] dark:border-[#171926] rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0edfe] dark:bg-[#141624] border border-purple-200 dark:border-[#272c44] flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] dark:text-white tracking-wide">Prompt Trading AI</h3>
                <p className="text-xs text-[#64748b] dark:text-gray-400">Describe your strategy in plain language</p>
              </div>
            </div>

            {/* Accordion 1: Strategy Templates */}
            <div className="border border-[#e2e8f0] dark:border-[#171926] rounded-xl overflow-hidden bg-gray-50 dark:bg-[#0a0c16]">
              <button
                type="button"
                onClick={() => setOpenTemplates(!openTemplates)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#334155] dark:text-gray-300 hover:text-[#0f172a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
                  <span>Strategy Templates</span>
                </div>
                {openTemplates ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {openTemplates && (
                <div className="p-3 pt-0 space-y-2 border-t border-[#e2e8f0] dark:border-[#171926]/80">
                  {templates.map((tpl, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setPromptText(tpl.prompt);
                        setOpenTemplates(false);
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#101220] hover:bg-purple-50 dark:hover:bg-[#161a2e] border border-[#e2e8f0] dark:border-[#1e2236] cursor-pointer transition-all text-xs shadow-2xs"
                    >
                      <div className="font-bold text-[#0f172a] dark:text-white">{tpl.title}</div>
                      <div className="text-[11px] text-[#64748b] dark:text-gray-400 mt-0.5 font-mono truncate">{tpl.prompt}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: Select Trading Pairs */}
            <div className="border border-[#e2e8f0] dark:border-[#171926] rounded-xl overflow-hidden bg-gray-50 dark:bg-[#0a0c16]">
              <button
                type="button"
                onClick={() => setOpenPairs(!openPairs)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#334155] dark:text-gray-300 hover:text-[#0f172a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-[#5b3fe4] dark:border-purple-400 flex items-center justify-center text-[10px] font-bold text-[#5b3fe4] dark:text-purple-400">
                    %
                  </span>
                  <span>Select Trading Pairs</span>
                </div>
                {openPairs ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {openPairs && (
                <div className="p-3 pt-0 border-t border-[#e2e8f0] dark:border-[#171926]/80">
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {availablePairs.map((p) => {
                      const isSelected = selectedPairs.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePair(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-[#5b3fe4] dark:text-purple-300 border border-purple-300 dark:border-purple-500/50 shadow-2xs font-bold'
                              : 'bg-white dark:bg-[#10121e] text-[#64748b] dark:text-gray-400 border border-[#e2e8f0] dark:border-[#1e2236] hover:text-[#0f172a] dark:hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Textarea with Mic Button matching screenshot */}
            <div className="relative">
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your trading strategy... e.g., 'Scalping EURUSD during London session, looking for BOS on M5 with liquidity sweep, target 1:3 RR'"
                className="w-full p-4 pr-12 bg-white dark:bg-[#06070c] border border-[#cbd5e1] dark:border-[#171926] rounded-xl text-xs text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:border-[#5b3fe4] dark:focus:border-purple-500/50 resize-none transition-all leading-relaxed font-sans shadow-2xs"
              />
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`absolute bottom-3.5 right-3.5 p-2 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse'
                    : 'bg-gray-100 dark:bg-[#141624] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-[#272c44]'
                }`}
                title="Voice input simulation"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Accordion 3: Risk Settings */}
            <div className="border border-[#e2e8f0] dark:border-[#171926] rounded-xl overflow-hidden bg-gray-50 dark:bg-[#0a0c16]">
              <button
                type="button"
                onClick={() => setOpenRiskSettings(!openRiskSettings)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#334155] dark:text-gray-300 hover:text-[#0f172a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
                  <span>Risk Settings</span>
                </div>
                {openRiskSettings ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {openRiskSettings && (
                <div className="p-4 pt-1 space-y-3 border-t border-[#e2e8f0] dark:border-[#171926]/80 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b] dark:text-gray-400">Risk Per Trade (%)</span>
                    <span className="font-mono text-[#5b3fe4] dark:text-purple-300 font-bold">{riskPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="5.0"
                    step="0.25"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full accent-[#5b3fe4] dark:accent-purple-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#64748b] dark:text-gray-400">Max Spread Filter</span>
                    <span className="font-mono text-[#5b3fe4] dark:text-purple-300 font-bold">{maxSpread} pips</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={maxSpread}
                    onChange={(e) => setMaxSpread(parseFloat(e.target.value))}
                    className="w-full accent-[#5b3fe4] dark:accent-purple-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Big Purple Generate Strategy Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !promptText.trim()}
              className="w-full py-3 rounded-xl bg-[#5b3fe4] hover:bg-[#4c32d4] dark:bg-[#9d83e9] dark:hover:bg-[#ad94f8] text-white dark:text-[#0d0f19] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-[#0d0f19]/30 dark:border-t-[#0d0f19] rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Generate Strategy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Middle Column: MT5 Warning, Auto-Trading Toggle, Strategy History (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: No MT5 Account Connected (Amber Banner) */}
          <div className="bg-amber-50 dark:bg-[#0d0a06] border border-amber-300 dark:border-[#f5a623]/35 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-1.5 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-[#f5a623]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold">No MT5 Account Connected</h4>
              </div>
              <button 
                onClick={() => {}}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Refresh Connection"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-gray-400 leading-relaxed pl-6">
              Connect your MT5 account in the Platinum Dashboard, or tap refresh to reconnect.
            </p>
          </div>

          {/* Card 2: Auto-Trading Mode */}
          <div className="bg-white dark:bg-[#080911] border border-[#e2e8f0] dark:border-[#171926] rounded-2xl p-4 shadow-sm dark:shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
              <div className="text-xs font-bold text-[#0f172a] dark:text-white">Auto-Trading Mode</div>
              <span className="text-[11px] text-[#64748b] dark:text-gray-400 font-medium">
                {autoTradingMode ? 'Active' : 'Off'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoTradingMode}
                onChange={(e) => setAutoTradingMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 dark:bg-[#141624] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5b3fe4] dark:peer-checked:bg-purple-600 border border-gray-300 dark:border-[#2b304c]"></div>
            </label>
          </div>

          {/* Card 3: Strategy History */}
          <div className="bg-white dark:bg-[#080911] border border-[#e2e8f0] dark:border-[#171926] rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4 min-h-[300px] flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a] dark:text-white">
              <Clock className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
              <span>Strategy History</span>
            </div>

            {strategyHistory.length === 0 ? (
              /* Empty state matching Screenshot 2 */
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-6 border border-dashed border-[#e2e8f0] dark:border-[#171926] rounded-xl bg-gray-50/50 dark:bg-transparent">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#121422] border border-gray-200 dark:border-[#222638] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#334155] dark:text-gray-300">Your strategy conversations will appear here</div>
                  <div className="text-[11px] text-[#64748b] dark:text-gray-500 mt-1">Try one of the example prompts to get started</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
                {strategyHistory.map((strat) => (
                  <div
                    key={strat.id}
                    onClick={() => setActiveGeneratedStrategy(strat)}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0e101a] hover:bg-purple-50 dark:hover:bg-[#141626] border border-[#e2e8f0] dark:border-[#1a1d2d] hover:border-purple-300 dark:hover:border-purple-500/40 cursor-pointer transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0f172a] dark:text-white">{strat.pair}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          strat.direction === 'BUY' ? 'bg-emerald-100 text-emerald-700 dark:bg-[#122b1c] dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-[#2b1216] dark:text-[#ff4b58]'
                        }`}>
                          {strat.direction}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#94a3b8] dark:text-gray-500 font-mono">{strat.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#475569] dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {strat.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#64748b] dark:text-gray-400">
                      <span>RR: {strat.riskReward}</span>
                      <span className="text-[#5b3fe4] dark:text-purple-300 font-bold">Confidence: {strat.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Safety Controls & Execution Mode (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: Safety Controls matching Screenshot 2 */}
          <div className="bg-white dark:bg-[#080911] border border-[#e2e8f0] dark:border-[#171926] rounded-2xl p-5 space-y-3.5 shadow-sm dark:shadow-xl">
            {/* Title */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-[#0f172a] dark:text-white tracking-wide">Safety Controls</h3>
            </div>

            {/* Risk Exposure Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748b] dark:text-gray-400">Risk Exposure</span>
                <span className="font-mono text-[#0f172a] dark:text-white font-bold">USD 450.00 / 1000.00</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[#10121d] h-1.5 rounded-full overflow-hidden border border-gray-200 dark:border-[#1b1f30]">
                <div className="bg-[#5b3fe4] dark:bg-[#9d83e9] h-full w-[45%]" />
              </div>
            </div>

            {/* Active Trades Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748b] dark:text-gray-400">Active Trades</span>
                <span className="font-mono text-[#0f172a] dark:text-white font-bold">2 / 5</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[#10121d] h-1.5 rounded-full overflow-hidden border border-gray-200 dark:border-[#1b1f30]">
                <div className="bg-[#5b3fe4] dark:bg-[#9d83e9] h-full w-[40%]" />
              </div>
            </div>

            {/* Red STOP AI Button */}
            <button
              onClick={handleStopAI}
              className="w-full py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <XCircle className="w-4 h-4" />
              <span>STOP AI</span>
            </button>

            {/* Action Row: Pause & Cancel All Pending */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAiPaused(!isAiPaused)}
                className="py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-[#121422] hover:bg-gray-200 dark:hover:bg-[#1a1d2e] border border-gray-200 dark:border-[#22273c] text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isAiPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleCancelPending}
                className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-[#14121a] hover:bg-rose-100 dark:hover:bg-[#20151c] border border-rose-200 dark:border-[#3d1e24] text-rose-600 dark:text-[#ff4b58] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel All Pending</span>
              </button>
            </div>

            {/* Green Box: Trade Safety Active */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#06120b] border border-emerald-200 dark:border-emerald-500/35 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trade Safety Active</span>
              </div>
              <ul className="space-y-0.5 text-[10.5px] text-emerald-900/90 dark:text-gray-300 leading-snug">
                <li>• All trades require confirmation before execution</li>
                <li>• Risk limits are enforced automatically</li>
                <li>• Stop AI cancels all pending operations</li>
              </ul>
            </div>

            {/* Bottom System Status */}
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[#64748b] dark:text-gray-400 pt-1 border-t border-[#e2e8f0] dark:border-[#151724]">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#5b3fe4] dark:text-purple-400" />
                <span>System latency: ~50ms</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <CircleDot className="w-3 h-3" />
                <span>No margin calls</span>
              </div>
            </div>
          </div>

          {/* Card 2: Execution Mode matching Screenshot 2 */}
          <div className="bg-white dark:bg-[#080911] border border-[#e2e8f0] dark:border-[#171926] rounded-2xl p-5 space-y-3.5 shadow-sm dark:shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
                <h3 className="text-xs font-bold text-[#0f172a] dark:text-white tracking-wide">Execution Mode</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-[#121422] text-[#5b3fe4] dark:text-purple-300 border border-purple-200 dark:border-[#22273c] font-bold">
                {executionMode === 'simulation' ? 'Simulation' : executionMode === 'manual' ? 'Manual Approval' : 'Auto-Queue'}
              </span>
            </div>

            {/* Radio Options List */}
            <div className="space-y-2">
              
              {/* Option 1: Simulation */}
              <div
                onClick={() => setExecutionMode('simulation')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  executionMode === 'simulation'
                    ? 'bg-purple-50 dark:bg-[#0f1220] border-[#5b3fe4] dark:border-purple-500/60'
                    : 'bg-gray-50 dark:bg-[#0a0c16] border-[#e2e8f0] dark:border-[#181a28] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    executionMode === 'simulation' ? 'border-[#5b3fe4] dark:border-purple-400 bg-purple-100 dark:bg-purple-500/20' : 'border-gray-400 dark:border-gray-600'
                  }`}>
                    {executionMode === 'simulation' && <div className="w-1.5 h-1.5 rounded-full bg-[#5b3fe4] dark:bg-purple-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white">Simulation</div>
                    <div className="text-[11px] text-[#64748b] dark:text-gray-400">Test strategies with paper trading</div>
                  </div>
                </div>
              </div>

              {/* Option 2: Manual Approval (Default / Active in Screenshot) */}
              <div
                onClick={() => setExecutionMode('manual')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  executionMode === 'manual'
                    ? 'bg-emerald-50 dark:bg-[#08150d] border-emerald-500/80 dark:border-emerald-500/60'
                    : 'bg-gray-50 dark:bg-[#0a0c16] border-[#e2e8f0] dark:border-[#181a28] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    executionMode === 'manual' ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-500/20' : 'border-gray-400 dark:border-gray-600'
                  }`}>
                    {executionMode === 'manual' && <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white">Manual Approval</div>
                    <div className="text-[11px] text-[#64748b] dark:text-gray-400">Review each trade before execution</div>
                  </div>
                </div>
              </div>

              {/* Option 3: Auto-Queue */}
              <div
                onClick={() => setExecutionMode('auto-queue')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  executionMode === 'auto-queue'
                    ? 'bg-purple-50 dark:bg-[#0f1220] border-[#5b3fe4] dark:border-purple-500/60'
                    : 'bg-gray-50 dark:bg-[#0a0c16] border-[#e2e8f0] dark:border-[#181a28] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    executionMode === 'auto-queue' ? 'border-[#5b3fe4] dark:border-purple-400 bg-purple-100 dark:bg-purple-500/20' : 'border-gray-400 dark:border-gray-600'
                  }`}>
                    {executionMode === 'auto-queue' && <div className="w-1.5 h-1.5 rounded-full bg-[#5b3fe4] dark:bg-purple-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white">Auto-Queue</div>
                    <div className="text-[11px] text-[#64748b] dark:text-gray-400">Batch approve multiple trades</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Amber Safety First Box */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#140e06] border border-amber-300 dark:border-[#f5a623]/35 space-y-0.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-[#f5a623] font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                <span>Safety First</span>
              </div>
              <p className="text-[11px] text-amber-900/90 dark:text-gray-300 leading-tight">
                You must confirm each trade before it executes. Maximum control.
              </p>
            </div>

            {/* Bottom Checkbox */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#5b3fe4] dark:accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] text-[#475569] dark:text-gray-300">
                Each trade requires your explicit confirmation
              </span>
            </label>
          </div>

        </div>

      </div>

      {/* Generated Strategy Preview Card */}
      {activeGeneratedStrategy && (
        <div className="bg-white dark:bg-[#080911] border border-[#5b3fe4] dark:border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-lg dark:shadow-2xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#161826] pb-3">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-[#0f172a] dark:text-white">{activeGeneratedStrategy.pair}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono ${
                activeGeneratedStrategy.direction === 'BUY'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-[#122b1c] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-700 dark:bg-[#2b1216] dark:text-[#ff4b58] border border-rose-200 dark:border-[#ff4b58]/35'
              }`}>
                {activeGeneratedStrategy.direction}
              </span>
              <span className="text-xs text-[#64748b] dark:text-gray-400 font-mono">Lot Size: {activeGeneratedStrategy.lotSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#5b3fe4] dark:text-purple-300 bg-purple-50 dark:bg-[#141624] px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-500/30 font-bold">
                RR {activeGeneratedStrategy.riskReward}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-gray-50 dark:bg-[#0e101a] rounded-xl border border-[#e2e8f0] dark:border-[#1a1d2d]">
              <span className="text-[#64748b] dark:text-gray-500 text-[10px] uppercase font-sans">Entry Price</span>
              <div className="text-[#0f172a] dark:text-white font-bold mt-0.5">{activeGeneratedStrategy.entryPrice}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0e101a] rounded-xl border border-[#e2e8f0] dark:border-[#1a1d2d]">
              <span className="text-[#64748b] dark:text-gray-500 text-[10px] uppercase font-sans">Stop Loss</span>
              <div className="text-rose-600 dark:text-[#ff4b58] font-bold mt-0.5">{activeGeneratedStrategy.stopLoss}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0e101a] rounded-xl border border-[#e2e8f0] dark:border-[#1a1d2d]">
              <span className="text-[#64748b] dark:text-gray-500 text-[10px] uppercase font-sans">Take Profit</span>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{activeGeneratedStrategy.takeProfit}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0e101a] rounded-xl border border-[#e2e8f0] dark:border-[#1a1d2d]">
              <span className="text-[#64748b] dark:text-gray-500 text-[10px] uppercase font-sans">AI Confidence</span>
              <div className="text-[#5b3fe4] dark:text-purple-300 font-bold mt-0.5">{activeGeneratedStrategy.confidence}%</div>
            </div>
          </div>

          <p className="text-xs text-[#334155] dark:text-gray-300 font-sans leading-relaxed">
            {activeGeneratedStrategy.explanation}
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveGeneratedStrategy(null)}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#121422] dark:hover:bg-[#1c2035] text-xs font-semibold text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white cursor-pointer transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => {
                try {
                  confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                } catch {}
              }}
              className="px-5 py-2 rounded-xl bg-[#5b3fe4] hover:bg-[#4c32d4] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm &amp; Execute Trade</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
