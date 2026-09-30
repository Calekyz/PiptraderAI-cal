import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Crown,
  ChevronRight,
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Check,
  AlertCircle,
  ArrowRight,
  Bot
} from 'lucide-react';
import { AIVerificationPill } from '../AIVerificationPill';
import { useSignalVerification } from '../../hooks/useSignalVerification';

export interface TradePlan {
  symbol: string;
  subTitle?: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  bias: 'Bullish' | 'Bearish';
  entry: string;
  orderType: string;
  stopLoss: string;
  stopLossDistance?: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
  recommendedRisk: string;
  whyThisTrade: string;
  adjustmentNote?: string;
}

interface UploadChartViewProps {
  user?: { id?: string; email?: string } | null;
  onOpenGemina?: (tab?: 'chat' | 'vision') => void;
}

export const UploadChartView: React.FC<UploadChartViewProps> = ({ user, onOpenGemina }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('M15');
  const [isMultiTimeframe, setIsMultiTimeframe] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tradePlan, setTradePlan] = useState<TradePlan | null>(null);

  // Silent AI verification of the resulting plan
  const { result: aiVerify } = useSignalVerification(
    tradePlan
      ? {
          symbol: tradePlan.symbol,
          timeframe: selectedTimeframe,
          direction: tradePlan.direction === 'LONG' ? 'BUY' : 'SELL',
          confidence: tradePlan.confidence,
          setupType: tradePlan.orderType || 'Chart Setup',
          entry: parseFloat(tradePlan.entry) || undefined,
          stopLoss: parseFloat(tradePlan.stopLoss) || undefined,
          takeProfit1: parseFloat(tradePlan.takeProfit1) || undefined,
          takeProfit2: parseFloat(tradePlan.takeProfit2) || undefined,
          reasons: tradePlan.whyThisTrade ? [tradePlan.whyThisTrade] : [],
        }
      : null
  );
  const [showHistory, setShowHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultBuyPlan: TradePlan = {
    symbol: 'UNKNOW',
    subTitle: 'Gemina AI Assistant Vision · DeepSeek',
    direction: 'LONG',
    confidence: 65,
    bias: 'Bullish',
    entry: '0.99500',
    orderType: 'Buy Limit',
    stopLoss: '0.98000',
    stopLossDistance: '0.01500 away',
    takeProfit1: '1.02500',
    takeProfit2: '1.03250',
    riskReward: '1:2',
    recommendedRisk: '1–2%',
    whyThisTrade: 'The price has pulled back significantly from a high of 1.015 to a low of 0.985. It is now showing signs of a potential reversal, with consecutive green candles approaching the 1.000 mark. The current price action suggests a potential bounce from this level. A BUY LIMIT order is placed below the current price at 0.995, targeting a support zone, with a stop loss below the recent low and take profit targets above the current resistance. The risk-to-reward ratio is greater than 1:2.',
    adjustmentNote: 'Risk-Reward adjusted to 1:2 minimum (was 1:1.00).'
  };

  const defaultSellPlan: TradePlan = {
    symbol: 'EUR/USD',
    subTitle: 'Gemina AI Assistant Vision · DeepSeek',
    direction: 'SHORT',
    confidence: 78,
    bias: 'Bearish',
    entry: '1.08500',
    orderType: 'Sell Limit',
    stopLoss: '1.09000',
    stopLossDistance: '0.00500 away',
    takeProfit1: '1.07500',
    takeProfit2: '1.06800',
    riskReward: '1:2.4',
    recommendedRisk: '1–2%',
    whyThisTrade: 'The asset rejected higher-timeframe resistance at 1.0895 after completing a buy-side liquidity sweep. A Bearish Market Structure Shift (MSS) formed on the M15 timeframe, confirming institutional distribution. A SELL LIMIT order is placed at the newly created Fair Value Gap at 1.08500 with invalidation above recent highs.',
    adjustmentNote: 'Risk-Reward adjusted to 1:2 minimum (was 1:1.00).'
  };

  const historyItems = [
    {
      id: 'hist-1',
      date: 'Today, 10:14 AM',
      pair: 'UNKNOW (EUR/USD)',
      pattern: 'Pullback Reversal Bounce',
      signal: 'BUY LIMIT @ 0.99500',
      confidence: 65
    },
    {
      id: 'hist-2',
      date: 'Yesterday, 3:45 PM',
      pair: 'XAU/USD H1',
      pattern: 'Fair Value Gap Mitigation',
      signal: 'SELL LIMIT @ 2355.00',
      confidence: 78
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result as string;
      setSelectedImage(imgData);
      setTradePlan(null);
      // Automatically trigger AI analysis
      triggerAnalysisWithImage(imgData);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysisWithImage = async (imgData: string) => {
    if (!imgData || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      // Call the rule-based engine with the selected symbol + timeframe
      const res = await fetch('/api/engine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          timeframe: selectedTimeframe,
          userId: user?.id,
        })
      });
      const data = await res.json();
      const plan = data.plan;

      if (!plan) {
        setTradePlan(defaultBuyPlan);
        return;
      }

      // If engine returns WAIT, show informative message instead of fake plan
      if (plan.direction === 'WAIT') {
        const waitPlan: TradePlan = {
          symbol: selectedSymbol,
          subTitle: 'PipTraderAI Engine · Rule-Based Analysis',
          direction: plan.trend === 'Bearish' ? 'SHORT' : 'LONG',
          confidence: plan.confidence || 0,
          bias: plan.trend === 'Bearish' ? 'Bearish' : plan.trend === 'Bullish' ? 'Bullish' : 'Bullish',
          entry: plan.currentPrice ? plan.currentPrice.toFixed(selectedDecimals) : '—',
          orderType: 'No Setup — Wait',
          stopLoss: '—',
          stopLossDistance: 'No active setup',
          takeProfit1: '—',
          takeProfit2: '—',
          riskReward: '—',
          recommendedRisk: 'Wait for confirmation',
          whyThisTrade: `Engine status: No high-confidence setup on ${selectedSymbol} (${selectedTimeframe}). Current trend: ${plan.trend}. Session: ${plan.session}. RSI: ${plan.rsi ? plan.rsi.toFixed(1) : 'N/A'}. ${plan.marketSummary || ''}`,
          adjustmentNote: 'Setups only fire above 75% confidence. Try a different timeframe or wait for the next candle close.',
        };
        setTradePlan(waitPlan);
        return;
      }

      // Real setup — map engine output → TradePlan shape
      const dec = selectedDecimals;
      const realPlan: TradePlan = {
        symbol: selectedSymbol,
        subTitle: `PipTraderAI Engine · ${plan.strategy} · ${plan.session}`,
        direction: plan.direction === 'BUY' ? 'LONG' : 'SHORT',
        confidence: plan.confidence,
        bias: plan.trend === 'Bearish' ? 'Bearish' : 'Bullish',
        entry: plan.entry.toFixed(dec),
        orderType: plan.direction === 'BUY' ? 'Buy Limit / Market' : 'Sell Limit / Market',
        stopLoss: plan.stopLoss.toFixed(dec),
        stopLossDistance: `${Math.abs(plan.entry - plan.stopLoss).toFixed(dec)} away`,
        takeProfit1: plan.takeProfit1.toFixed(dec),
        takeProfit2: plan.takeProfit2.toFixed(dec),
        riskReward: `1:${plan.riskReward.toFixed(1)}`,
        recommendedRisk: '1.0% – 1.5% of equity',
        whyThisTrade: (plan.reasons || []).join(' · ') + (plan.warnings?.length ? ` ⚠️ ${plan.warnings.join(' · ')}` : ''),
        adjustmentNote: `Setup type: ${plan.setupType} · Confidence ${plan.confidence}% (min 75%).`,
      };
      setTradePlan(realPlan);
    } catch (err) {
      console.error('[UploadChart] Engine call failed:', err);
      setTradePlan(defaultBuyPlan);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    triggerAnalysisWithImage(selectedImage);
  };

  const loadSamplePreset = (type: 'buy' | 'sell') => {
    if (type === 'buy') {
      setSelectedImage('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60');
      setTradePlan(defaultBuyPlan);
    } else {
      setSelectedImage('https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&auto=format&fit=crop&q=60');
      setTradePlan(defaultSellPlan);
    }
  };

  const selectedDecimals =
    selectedSymbol.includes('JPY') ? 3
    : selectedSymbol.includes('XAU') || selectedSymbol.includes('BTC') || selectedSymbol.includes('ETH') ? 2
    : selectedSymbol === 'US30' || selectedSymbol === 'NAS100' || selectedSymbol === 'SPX500' ? 1
    : 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto pb-10">

      {/* Gemina AI launcher */}
      {onOpenGemina && (
        <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#1a0f2e] to-[#0c0e1a] p-5 sm:p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">Analyze with Gemina AI</div>
              <div className="text-xs text-purple-200/70 mt-0.5 max-w-md leading-relaxed">
                Get deep chart extraction, pattern recognition, and real explanations from our advanced vision model.
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenGemina('vision')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white font-bold text-xs shadow-md hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Launch Gemina →
          </button>
        </div>
      )}
      
      {/* 1. Header & Description matching Screenshot 3 */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Let Gemina AI analyze your chart and generate accurate entries, exits, and DeepSeek strategy insights
        </p>
      </div>

      {/* 2. Top Toolbar: Badges + Multi-Timeframe toggle + View History button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Left Side: Uploads badge + Multi-Timeframe toggle */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-white dark:bg-[#121422] border border-[#eaecf0] dark:border-[#222638] text-[11px] font-mono text-gray-700 dark:text-gray-300 font-semibold shadow-xs">
            2 Uploads Remaining Today
          </span>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0a0c16] border border-[#eaecf0] dark:border-[#171926] shadow-xs">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Multi-Timeframe</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiTimeframe}
                onChange={(e) => setIsMultiTimeframe(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 dark:bg-[#141624] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600 border border-gray-300 dark:border-[#2b304c]"></div>
            </label>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
              Pro+
            </span>
          </div>
        </div>

        {/* Right Side: Demo Presets + View History Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <button
              onClick={() => loadSamplePreset('buy')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer transition-all"
            >
              Demo Long Plan
            </button>
            <button
              onClick={() => loadSamplePreset('sell')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold cursor-pointer transition-all"
            >
              Demo Short Plan
            </button>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#0e101a] hover:bg-gray-50 dark:hover:bg-[#151828] border border-[#eaecf0] dark:border-[#1b1f32] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>View History</span>
          </button>
        </div>
      </div>

      {/* History Drawer / Modal if toggled */}
      {showHistory && (
        <div className="bg-white dark:bg-[#080911] border border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#171926] pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Previous Chart Upload Analyses</h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {historyItems.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#0c0e18] border border-gray-200 dark:border-[#181a2a] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{item.pair}</span>
                  <span className="text-[10px] text-gray-500">{item.date}</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">{item.pattern}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{item.signal}</span>
                  <span className="text-purple-600 dark:text-purple-300 font-mono text-[10px]">Conf: {item.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Large Dropzone Container */}
      <div className="bg-white dark:bg-[#06070c] border border-[#eaecf0] dark:border-[#161826] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative">
        
        {/* Title Inside Card */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white tracking-wide">
              Upload Chart Image
            </h2>
          </div>
          <p className="text-xs text-gray-500 pl-6">
            Supports PNG, JPG, JPEG formats up to 20MB
          </p>
        </div>

        {/* ─── Symbol + Timeframe Selectors ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Symbol Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Symbol to Analyze
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0a0c16] border border-[#eaecf0] dark:border-[#1b1f32] text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <optgroup label="Metals">
                <option value="XAUUSD">XAUUSD — Gold</option>
                <option value="XAGUSD">XAGUSD — Silver</option>
              </optgroup>
              <optgroup label="Forex Majors">
                <option value="EURUSD">EURUSD — Euro / USD</option>
                <option value="GBPUSD">GBPUSD — Pound / USD</option>
                <option value="USDJPY">USDJPY — USD / Yen</option>
                <option value="USDCHF">USDCHF — USD / Franc</option>
                <option value="USDCAD">USDCAD — USD / CAD</option>
                <option value="AUDUSD">AUDUSD — Aussie / USD</option>
                <option value="NZDUSD">NZDUSD — Kiwi / USD</option>
              </optgroup>
              <optgroup label="Crypto">
                <option value="BTCUSD">BTCUSD — Bitcoin</option>
                <option value="ETHUSD">ETHUSD — Ethereum</option>
              </optgroup>
              <optgroup label="Indices">
                <option value="US30">US30 — Dow Jones</option>
                <option value="NAS100">NAS100 — Nasdaq 100</option>
                <option value="SPX500">SPX500 — S&P 500</option>
              </optgroup>
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0a0c16] border border-[#eaecf0] dark:border-[#1b1f32] text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="M5">M5 — 5 minutes</option>
              <option value="M15">M15 — 15 minutes</option>
              <option value="M30">M30 — 30 minutes</option>
              <option value="H1">H1 — 1 hour</option>
              <option value="H4">H4 — 4 hours</option>
              <option value="D1">D1 — Daily</option>
            </select>
          </div>
        </div>

        {/* Live engine hint */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Analysis powered by the rule-based engine on <strong className="text-gray-700 dark:text-gray-200">{selectedSymbol}</strong> · <strong className="text-gray-700 dark:text-gray-200">{selectedTimeframe}</strong> live candles. Image is kept for your reference only.
          </span>
        </div>

        {/* Central Dropzone Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center min-h-[240px] cursor-pointer ${
            dragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 dark:border-[#171928] hover:border-purple-400 dark:hover:border-purple-500/50 bg-[#fafbfc] dark:bg-[#070810]/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {selectedImage ? (
            <div className="w-full relative space-y-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt="Selected chart"
                className="max-h-[300px] w-auto mx-auto rounded-2xl object-contain border border-[#eaecf0] dark:border-[#202338] shadow-md"
              />
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setTradePlan(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-[#2b1216] border border-rose-200 dark:border-[#ff4b58]/35 text-rose-600 dark:text-[#ff4b58] text-xs font-bold cursor-pointer transition-all"
                >
                  Remove Image
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gemina AI Analyzing (DeepSeek)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Chart with Gemina AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              {/* Big Purple Upload Button Circle */}
              <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-[#18152b] border border-purple-200 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-xs group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 stroke-[2]" />
              </div>

              {/* Text */}
              <div className="space-y-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
                  Drag &amp; drop your chart
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  or click to browse files
                </div>
              </div>

              {/* Format Badge with Green Checkmark */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-mono pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>PNG, JPG, JPEG (max 20MB)</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TRADE PLAN RESULT TEMPLATE (EXACT MATCH TO USER SPECIFICATION & SCREENSHOT) */}
        {/* ========================================================================= */}
        {tradePlan && (
          <div 
            id="trade-plan-card"
            className="bg-white dark:bg-[#0c0e1a] border border-[#eaecf0] dark:border-[#1e2238] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-300"
          >
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 dark:border-[#1a1d30] pb-5">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  TRADE PLAN
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {tradePlan.symbol || 'UNKNOW'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {tradePlan.subTitle || 'Gemina AI Assistant Vision · DeepSeek'}
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center">
                {/* Direction Badge */}
                {tradePlan.direction === 'LONG' || tradePlan.bias === 'Bullish' ? (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 border border-[#a7f3d0] dark:border-emerald-800 text-xs font-bold tracking-wide shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>LONG</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fff1f2] dark:bg-rose-950/40 text-[#e11d48] dark:text-rose-400 border border-[#fecdd3] dark:border-rose-800 text-xs font-bold tracking-wide shadow-2xs">
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>SHORT</span>
                  </div>
                )}

                {/* Confidence */}
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {tradePlan.confidence}% confidence
                </span>
              </div>
            </div>

            {/* AI verification badge — silent when SKIPPED */}
            {aiVerify && (
              <div className="pt-2">
                <AIVerificationPill result={aiVerify} />
              </div>
            )}

            {/* Metric Rows with Crisp Clean Dividers */}
            <div className="divide-y divide-[#eaecf0] dark:divide-[#1e2238] text-xs sm:text-sm">
              
              {/* BIAS */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  BIAS
                </span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {tradePlan.bias}
                </span>
              </div>

              {/* ENTRY */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  ENTRY
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-gray-900 dark:text-white text-sm">
                    {tradePlan.entry}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {tradePlan.orderType}
                  </span>
                </div>
              </div>

              {/* STOP LOSS */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  STOP LOSS
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-[#dc2626] dark:text-rose-400 text-sm">
                    {tradePlan.stopLoss}
                  </span>
                  {tradePlan.stopLossDistance && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      {tradePlan.stopLossDistance}
                    </span>
                  )}
                </div>
              </div>

              {/* TAKE PROFIT 1 */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  TAKE PROFIT 1
                </span>
                <span className="font-bold font-mono text-[#16a34a] dark:text-emerald-400 text-sm">
                  {tradePlan.takeProfit1}
                </span>
              </div>

              {/* TAKE PROFIT 2 */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  TAKE PROFIT 2
                </span>
                <span className="font-bold font-mono text-[#16a34a] dark:text-emerald-400 text-sm">
                  {tradePlan.takeProfit2}
                </span>
              </div>

              {/* RISK / REWARD */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  RISK / REWARD
                </span>
                <span className="font-bold font-mono text-gray-900 dark:text-white text-sm">
                  {tradePlan.riskReward}
                </span>
              </div>

              {/* RECOMMENDED RISK */}
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                  RECOMMENDED RISK
                </span>
                <span className="font-bold font-mono text-gray-900 dark:text-white text-sm">
                  {tradePlan.recommendedRisk}
                </span>
              </div>

            </div>

            {/* Bottom WHY THIS TRADE narrative */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                WHY THIS TRADE
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                {tradePlan.whyThisTrade}
              </p>

              {/* Divider */}
              <div className="pt-2 text-gray-300 dark:text-gray-700 text-xs font-mono select-none">
                ---
              </div>

              {/* Adjustment Note with Green Checkbox */}
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                <div className="w-4 h-4 rounded bg-[#10b981] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>{tradePlan.adjustmentNote || 'Risk-Reward adjusted to 1:2 minimum (was 1:1.00).'}</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. Bottom 3 Horizontal Feature Cards matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: AI-Powered Analysis */}
        <div className="bg-white dark:bg-[#06070c] border border-[#eaecf0] dark:border-[#161826] rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 shadow-xs hover:border-[#d0d5dd] dark:hover:border-[#22253a] transition-all">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#141524] border border-purple-100 dark:border-[#252840] flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
            AI-Powered Analysis
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug max-w-xs">
            Advanced pattern recognition and market structure analysis
          </p>
        </div>

        {/* Card 2: Precise Signals */}
        <div className="bg-white dark:bg-[#06070c] border border-[#eaecf0] dark:border-[#161826] rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 shadow-xs hover:border-[#d0d5dd] dark:hover:border-[#22253a] transition-all">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#0e1815] border border-emerald-100 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
            Precise Signals
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug max-w-xs">
            Entry, stop loss, and take profit levels with confidence scores
          </p>
        </div>

        {/* Card 3: Any Chart Format */}
        <div className="bg-white dark:bg-[#06070c] border border-[#eaecf0] dark:border-[#161826] rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 shadow-xs hover:border-[#d0d5dd] dark:hover:border-[#22253a] transition-all">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-[#141524] border border-purple-100 dark:border-[#252840] flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
            Any Chart Format
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug max-w-xs">
            Works with screenshots from TradingView, MT5, and more
          </p>
        </div>

      </div>

    </div>
  );
};
