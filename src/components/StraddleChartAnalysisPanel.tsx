import React, { useState } from 'react';
import { 
  BarChart2, 
  RefreshCw, 
  Send, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  HelpCircle, 
  Target, 
  Droplets, 
  Compass, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { RealCandle, MarketQuote, TechnicalIndicators } from './views/AITradingView';

export interface StructuredAnalysis {
  marketOverview?: {
    symbol: string;
    timeframe: string;
    currentPrice: string;
    overallCondition: string;
  };
  trend?: {
    direction: 'Bullish' | 'Bearish' | 'Sideways' | 'Unclear';
    explanation: string;
  };
  priceStructure?: {
    swingPoints: string;
    breakOfStructure: string;
    consolidation: string;
  };
  keyLevels?: {
    support: string[];
    resistance: string[];
    breakoutArea: string;
    invalidationArea: string;
  };
  momentumVolatility?: {
    momentum: 'Strong' | 'Weak' | 'Increasing' | 'Decreasing' | string;
    volatility: 'High' | 'Medium' | 'Low' | string;
    explanation: string;
  };
  possibleScenarios?: {
    bullish?: {
      condition: string;
      targetArea?: string;
    };
    bearish?: {
      condition: string;
      targetArea?: string;
    };
    range?: {
      condition: string;
    };
  };
  whatToWatch?: string[];
  
  // Legacy / fallback properties
  marketStructure?: 'Bullish' | 'Bearish' | 'Sideways';
  momentum?: 'Strong' | 'Moderate' | 'Weak';
  support?: string;
  resistance?: string;
  volatility?: 'Low' | 'Medium' | 'High';
  marketStatus?: 'OPEN' | 'CLOSED';
  signal?: string;
  signalConfidence?: number;
  aiOutlook?: string;
  riskAnalysis?: {
    setupType?: string;
    entryArea: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    riskRewardRatio: string;
    recommendedRisk: string;
    tradeExplanation?: string;
  };
}

export interface ChatMessage {
  sender: 'gemina' | 'straddle' | 'user';
  text: string;
  time: string;
}

interface StraddleChartAnalysisPanelProps {
  symbol: string;
  timeframe: string;
  cleanSymbol: string;
  theme?: 'dark' | 'light';
  quote: MarketQuote | null;
  candles: RealCandle[];
  indicators: TechnicalIndicators | null;
  analysis: StructuredAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onAnalyze: () => void;
  chatMessages: ChatMessage[];
  inputText: string;
  setInputText: (val: string) => void;
  isChatTyping: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  onQuickAction: (actionText: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export const GeminaChartAnalysisPanel: React.FC<StraddleChartAnalysisPanelProps> = ({
  symbol,
  timeframe,
  cleanSymbol,
  theme = 'light',
  quote,
  candles,
  indicators,
  analysis,
  isAnalyzing,
  analysisError,
  onAnalyze,
  chatMessages,
  inputText,
  setInputText,
  isChatTyping,
  onSendMessage,
  onQuickAction,
  chatEndRef
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tradePlan: true,
    overview: true,
    trend: true,
    structure: true,
    levels: true,
    momentum: true,
    scenarios: true,
    watch: true
  });

  const isLight = theme === 'light';

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const trendDirection = analysis?.trend?.direction || analysis?.marketStructure || indicators?.marketStructure || 'Sideways';
  const isBullish = trendDirection.toLowerCase().includes('bull');
  const isBearish = trendDirection.toLowerCase().includes('bear');

  const priceDisplay = quote ? quote.price.toFixed(quote.decimals) : '0.00';

  const tradeSignal = analysis?.signal || (isBullish ? 'BUY / LONG SETUP' : isBearish ? 'SELL / SHORT SETUP' : 'WAIT — RANGE BOUND');
  const isBuySignal = tradeSignal.toUpperCase().includes('BUY') || tradeSignal.toUpperCase().includes('LONG');
  const isSellSignal = tradeSignal.toUpperCase().includes('SELL') || tradeSignal.toUpperCase().includes('SHORT');

  const handleCopySetup = () => {
    if (!analysis?.riskAnalysis) return;
    const { entryArea, stopLoss, takeProfit1, takeProfit2, riskRewardRatio, recommendedRisk } = analysis.riskAnalysis;
    const text = `🎯 STRADDLE AI TRADE SETUP
Symbol: ${cleanSymbol} (${timeframe})
Signal: ${tradeSignal}
Entry: ${entryArea}
Stop Loss (S.L): ${stopLoss}
Take Profit 1 (T.P 1): ${takeProfit1}
Take Profit 2 (T.P 2): ${takeProfit2}
Risk/Reward: ${riskRewardRatio}
Risk Size: ${recommendedRisk}
Generated on live market price: ${priceDisplay}`;

    navigator.clipboard.writeText(text);
    setCopiedSetup(true);
    setTimeout(() => setCopiedSetup(false), 2000);
  };

  return (
    <div 
      id="straddle-ai-panel" 
      className={`w-full lg:w-[410px] xl:w-[450px] border-t lg:border-t-0 lg:border-l flex flex-col shrink-0 overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#090b17] border-[#191d35] text-white'
      }`}
    >
      {/* Top Header */}
      <div className={`p-3.5 border-b flex items-center justify-between gap-2 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0c0e1e] border-[#16192f] text-white'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
            isLight ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-[#15182e] border-[#2b335a] text-purple-400'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className={`text-xs sm:text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Gemina AI Assistant
              </h2>
              <span className={`px-1.5 py-0.2 rounded-md border text-[9px] font-mono font-bold ${
                isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-[#19142e] border-purple-500/30 text-purple-300'
              }`}>
                DeepSeek
              </span>
            </div>
            <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Analyzing <strong className={isLight ? 'text-slate-900' : 'text-gray-200'}>{symbol}</strong> ({timeframe})
            </div>
          </div>
        </div>

        {/* View Switcher: Analysis vs Live Chat */}
        <div className={`flex items-center p-0.5 rounded-lg border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121528] border-[#202644]'
        }`}>
          <button
            id="tab-analysis-btn"
            onClick={() => setActiveTab('analysis')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-[#2962ff] text-white shadow-xs'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Analysis
          </button>
          <button
            id="tab-chat-btn"
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'chat'
                ? 'bg-[#2962ff] text-white shadow-xs'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
        
        {/* Prominent Action Button: [ 📊 Analyze Current Chart ] */}
        <div className="space-y-1.5">
          <button
            id="analyze-current-chart-btn"
            aria-label="Analyze current chart"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] hover:from-[#4338ca] hover:to-[#6d28d9] disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-950/20 cursor-pointer active:scale-[0.99] border border-indigo-400/30"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Current Chart...</span>
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4 stroke-[2.4]" />
                <span>Analyze Current Chart</span>
              </>
            )}
          </button>

          <div className={`text-[10px] text-center font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            <span>TradingView live feed active · Spot: {priceDisplay}</span>
          </div>
        </div>

        {/* 3 Status Badges in a Row: SYMBOL / INTERVAL / STATUS */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className={`border rounded-xl py-2 px-2 text-center shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e1124] border-[#1c223f]'
          }`}>
            <div className={`text-[9px] uppercase tracking-wider font-mono font-semibold ${
              isLight ? 'text-slate-500' : 'text-gray-500'
            }`}>
              SYMBOL
            </div>
            <div className={`text-xs font-bold font-mono mt-0.5 truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {cleanSymbol}
            </div>
          </div>

          <div className={`border rounded-xl py-2 px-2 text-center shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e1124] border-[#1c223f]'
          }`}>
            <div className={`text-[9px] uppercase tracking-wider font-mono font-semibold ${
              isLight ? 'text-slate-500' : 'text-gray-500'
            }`}>
              INTERVAL
            </div>
            <div className={`text-xs font-bold font-mono mt-0.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {timeframe}
            </div>
          </div>

          <div className={`border rounded-xl py-2 px-2 text-center shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0e1124] border-[#1c223f]'
          }`}>
            <div className={`text-[9px] uppercase tracking-wider font-mono font-semibold ${
              isLight ? 'text-slate-500' : 'text-gray-500'
            }`}>
              FEED
            </div>
            <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-Time</span>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {analysisError && (
          <div className="bg-rose-50 dark:bg-[#240e13] border border-rose-200 dark:border-rose-500/40 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Unable to analyze this chart</span>
            </div>
            <p className="text-rose-600 dark:text-gray-300 text-[11px] leading-relaxed">
              {analysisError}
            </p>
            <button
              onClick={onAnalyze}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isAnalyzing && (
          <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 ${
            isLight ? 'bg-purple-50/50 border-purple-100' : 'bg-[#0b0e20] border-[#1f2648]'
          }`}>
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            <div className="space-y-1">
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Evaluating {symbol} Chart Structure
              </h4>
              <p className={`text-[11px] max-w-[280px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Calculating swing pivots, EMAs, order flow imbalance, and probabilistic continuation pathways...
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: STRUCTURED ANALYSIS */}
        {activeTab === 'analysis' && !isAnalyzing && (
          <>
            {analysis ? (
              <div className="space-y-3.5">
                
                {/* 🌟 HIGHLIGHTED TRADE EXECUTION PLAN & STRATEGY CARD */}
                {analysis.riskAnalysis && (
                  <section 
                    aria-labelledby="trade-execution-heading" 
                    className={`rounded-2xl border-2 p-4 space-y-3.5 shadow-md relative overflow-hidden ${
                      isLight 
                        ? 'bg-gradient-to-b from-slate-50 to-white border-indigo-200' 
                        : 'bg-gradient-to-b from-[#0f142d] to-[#0a0d1f] border-indigo-500/50 shadow-indigo-950/60'
                    }`}
                  >
                    {/* Glowing Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isBuySignal ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300' : isSellSignal ? 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-300' : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                    }`} />

                    {/* Card Header: Signal Badge & Copy Action */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs ${
                          isBuySignal 
                            ? isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' 
                            : isSellSignal 
                            ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-950/80 text-rose-300 border border-rose-500/50' 
                            : isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                        }`}>
                          <Zap className="w-3.5 h-3.5" />
                          <span>{tradeSignal}</span>
                        </span>
                        
                        {analysis.signalConfidence && (
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono ${
                            isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-[#181c3b] border-[#2b3366] text-purple-300'
                          }`}>
                            {analysis.signalConfidence}% Confidence
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleCopySetup}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isLight 
                            ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                            : 'bg-[#181c3b] hover:bg-[#252c5c] border-[#2b3366] text-gray-300 hover:text-white'
                        }`}
                        title="Copy setup to clipboard"
                      >
                        {copiedSetup ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-indigo-500" />
                            <span>Copy Setup</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Setup Classification Subheading */}
                    {analysis.riskAnalysis.setupType && (
                      <div className={`text-[11px] font-mono flex items-center gap-1.5 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                        <Target className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Setup: <strong>{analysis.riskAnalysis.setupType}</strong></span>
                      </div>
                    )}

                    {/* 4 Execution Numeric Metric Cards */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {/* ENTRY */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                        isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-[#111736] border-blue-500/40'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-300 font-sans font-bold uppercase tracking-wider">
                          <span>Entry Zone</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 font-mono">MARKET</span>
                        </div>
                        <div className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {analysis.riskAnalysis.entryArea}
                        </div>
                        <span className={`text-[9px] font-sans ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Current reference level</span>
                      </div>

                      {/* STOP LOSS (S.L) */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                        isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-[#2b1218] border-rose-500/50'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-rose-700 dark:text-rose-300 font-sans font-bold uppercase tracking-wider">
                          <span>Stop Loss (S.L)</span>
                          <ShieldAlert className="w-3 h-3 text-rose-500" />
                        </div>
                        <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                          {analysis.riskAnalysis.stopLoss}
                        </div>
                        <span className="text-[9px] text-rose-600/80 dark:text-rose-300/70 font-sans">Strict invalidation level</span>
                      </div>

                      {/* TAKE PROFIT 1 (T.P 1) */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                        isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-[#0f271c] border-emerald-500/40'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-bold uppercase tracking-wider">
                          <span>Take Profit 1</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono">50% Scale</span>
                        </div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {analysis.riskAnalysis.takeProfit1}
                        </div>
                        <span className="text-[9px] text-emerald-600/80 dark:text-emerald-300/70 font-sans">Move SL to Breakeven</span>
                      </div>

                      {/* TAKE PROFIT 2 (T.P 2) */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 ${
                        isLight ? 'bg-teal-50/70 border-teal-200' : 'bg-[#0d2a2a] border-teal-500/40'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-teal-700 dark:text-teal-300 font-sans font-bold uppercase tracking-wider">
                          <span>Take Profit 2</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 font-mono">Runner Target</span>
                        </div>
                        <div className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                          {analysis.riskAnalysis.takeProfit2}
                        </div>
                        <span className="text-[9px] text-teal-600/80 dark:text-teal-300/70 font-sans">Final target objective</span>
                      </div>
                    </div>

                    {/* Risk & Reward Summary Line */}
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                      isLight ? 'bg-slate-100/70 border-slate-200 text-slate-800' : 'bg-[#12152e] border-[#222850] text-gray-200'
                    }`}>
                      <div>
                        <span className={isLight ? 'text-slate-500' : 'text-gray-400'}>Risk / Reward: </span>
                        <strong className="text-emerald-600 font-extrabold">{analysis.riskAnalysis.riskRewardRatio}</strong>
                      </div>
                      <div>
                        <span className={isLight ? 'text-slate-500' : 'text-gray-400'}>Risk Size: </span>
                        <strong className="text-indigo-600 font-extrabold">{analysis.riskAnalysis.recommendedRisk}</strong>
                      </div>
                    </div>

                    {/* Trade Explanation */}
                    {analysis.riskAnalysis.tradeExplanation && (
                      <div className={`text-[11px] leading-relaxed p-2.5 rounded-xl border ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0d1024] border-[#1d2242] text-gray-300'
                      }`}>
                        {analysis.riskAnalysis.tradeExplanation}
                      </div>
                    )}
                  </section>
                )}

                {/* Section 1: Trend & Condition */}
                {analysis.trend && (
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0c0e20] border-[#1c2242] text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Market Condition</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                        {analysis.trend.direction}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                      {analysis.trend.explanation}
                    </p>
                  </div>
                )}

                {/* Section 2: Key Levels */}
                {analysis.keyLevels && (
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0c0e20] border-[#1c2242] text-white'
                  }`}>
                    <span className="text-xs font-bold">Key Structural Levels</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className={`p-2 rounded-xl border ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                        <div className="text-[10px] text-emerald-700 font-bold">SUPPORT</div>
                        <div className="text-emerald-700 font-extrabold mt-0.5">{analysis.keyLevels.support.join(' · ')}</div>
                      </div>
                      <div className={`p-2 rounded-xl border ${isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/30 border-rose-500/30'}`}>
                        <div className="text-[10px] text-rose-700 font-bold">RESISTANCE</div>
                        <div className="text-rose-700 font-extrabold mt-0.5">{analysis.keyLevels.resistance.join(' · ')}</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className={`p-6 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0e20] border-[#191e3b]'
              }`}>
                <BarChart2 className="w-8 h-8 text-purple-500 opacity-80" />
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                  Ready to Analyze Current Chart
                </h3>
                <p className={`text-xs max-w-[280px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Click the button above to scan live candlestick structure, support/resistance, and scenario forecasts for {symbol}.
                </p>
              </div>
            )}

            {/* Quick Action Interactive Buttons */}
            <div className="pt-2 space-y-2">
              <div className={`text-[10px] uppercase tracking-wider font-mono font-semibold flex items-center gap-1.5 ${
                isLight ? 'text-slate-500' : 'text-gray-400'
              }`}>
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Quick Actions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Explain This', icon: HelpCircle, color: 'text-indigo-500' },
                  { label: 'Find Support & Resistance', icon: Target, color: 'text-emerald-500' },
                  { label: 'Analyze Trend', icon: TrendingUp, color: 'text-cyan-500' },
                  { label: 'Explain Liquidity', icon: Droplets, color: 'text-blue-500' },
                  { label: 'Find Possible Setups', icon: Compass, color: 'text-purple-500' },
                ].map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.label}
                      onClick={() => onQuickAction(act.label)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800' 
                          : 'bg-[#121630] hover:bg-[#1c224a] border-[#222956] text-gray-200 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${act.color}`} />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: CHAT STREAM */}
        {activeTab === 'chat' && (
          <div className="space-y-3 min-h-[300px] flex flex-col justify-between">
            <div className="space-y-2.5">
              {chatMessages.length === 0 ? (
                <div className={`p-6 text-center space-y-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  <MessageSquare className="w-8 h-8 mx-auto text-purple-500 opacity-60" />
                  <p className="text-xs">
                    Ask Gemina AI anything about the current <strong>{symbol}</strong> chart, key levels, or strategy adjustments.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col text-xs ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-[95%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#4f46e5] text-white rounded-br-xs'
                        : isLight 
                          ? 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-xs' 
                          : 'bg-[#101428] text-gray-200 border border-[#1f2648] rounded-bl-xs'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))
              )}

              {isChatTyping && (
                <div className="flex items-center gap-1.5 text-xs text-purple-600 font-mono p-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Gemina AI is evaluating market flow (DeepSeek)...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts in Chat */}
            <div className={`pt-2 border-t flex flex-wrap gap-1 ${isLight ? 'border-slate-200' : 'border-[#171a30]'}`}>
              {['Key Levels', 'Trend', 'Liquidity'].map((label) => (
                <button
                  key={label}
                  onClick={() => onQuickAction(label)}
                  className={`px-2 py-1 rounded-md text-[10px] cursor-pointer transition-colors ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' 
                      : 'bg-[#131730] text-gray-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Chat / Prompt Input Form */}
      <form 
        onSubmit={onSendMessage}
        className={`p-3 border-t space-y-1.5 shrink-0 transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0c0e1e] border-[#16192e]'
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message Gemina AI about this chart (DeepSeek)..."
            className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                : 'bg-[#070914] border-[#1d223f] text-white placeholder-gray-500'
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isChatTyping}
            className="p-2.5 rounded-xl bg-[#2962ff] hover:bg-[#1e4bd8] disabled:opacity-40 text-white transition-all cursor-pointer shadow-md shadow-blue-950/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className={`flex items-center justify-between text-[9px] font-mono uppercase tracking-widest px-1 ${
          isLight ? 'text-slate-500' : 'text-gray-500'
        }`}>
          <span>GEMINA AI DESK · DEEPSEEK</span>
          <span>{symbol} · {timeframe}</span>
        </div>
      </form>
    </div>
  );
};

export const StraddleChartAnalysisPanel = GeminaChartAnalysisPanel;

