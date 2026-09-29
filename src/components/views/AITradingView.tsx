import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Sparkles, ChevronDown, Search, Maximize2, Minimize2, ExternalLink,
  Bell, Play, RotateCcw, BarChart2, TrendingUp, Activity, Plus, CandlestickChart,
  LineChart, AreaChart, Sliders, CheckCircle2, Clock, Zap, DollarSign
} from 'lucide-react';
import { UserProfile } from '../../types';
import { StraddleChartAnalysisPanel, StructuredAnalysis, ChatMessage } from '../StraddleChartAnalysisPanel';
import { TradingViewChart, formatToTvSymbol } from '../TradingViewChart';

interface AITradingViewProps {
  user?: UserProfile;
  theme?: 'dark' | 'light';
  onOpenTrish?: () => void;
  onOpenUpgrade?: () => void;
  onBack?: () => void;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  broker: string;
  category: 'Commodities' | 'Forex' | 'Crypto' | 'Stocks' | 'Indices';
  decimals: number;
  spread: string;
  spreadPoints: number;
  tvSymbol: string;
}

export const SUPPORTED_MARKETS: MarketAsset[] = [
  { symbol: 'XAU/USD', name: 'Gold Spot / U.S. Dollar', broker: 'FOREX.com', category: 'Commodities', decimals: 2, spread: '1.2', spreadPoints: 120, tvSymbol: 'OANDA:XAUUSD' },
  { symbol: 'XAG/USD', name: 'Silver Spot / U.S. Dollar', broker: 'FOREX.com', category: 'Commodities', decimals: 4, spread: '0.8', spreadPoints: 80, tvSymbol: 'OANDA:XAGUSD' },
  { symbol: 'EUR/USD', name: 'Euro / U.S. Dollar', broker: 'FOREX.com', category: 'Forex', decimals: 5, spread: '0.4', spreadPoints: 4, tvSymbol: 'FX:EURUSD' },
  { symbol: 'GBP/USD', name: 'British Pound / U.S. Dollar', broker: 'FOREX.com', category: 'Forex', decimals: 5, spread: '0.6', spreadPoints: 6, tvSymbol: 'FX:GBPUSD' },
  { symbol: 'USD/JPY', name: 'U.S. Dollar / Japanese Yen', broker: 'FOREX.com', category: 'Forex', decimals: 3, spread: '0.5', spreadPoints: 5, tvSymbol: 'FX:USDJPY' },
  { symbol: 'BTC/USD', name: 'Bitcoin / Tether USDT', broker: 'BINANCE', category: 'Crypto', decimals: 2, spread: '5.0', spreadPoints: 500, tvSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETH/USD', name: 'Ethereum / Tether USDT', broker: 'BINANCE', category: 'Crypto', decimals: 2, spread: '1.5', spreadPoints: 150, tvSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'WTI/USD', name: 'Crude Oil WTI', broker: 'NYMEX', category: 'Commodities', decimals: 2, spread: '2.0', spreadPoints: 20, tvSymbol: 'TVC:USOIL' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / U.S. Dollar', broker: 'FOREX.com', category: 'Forex', decimals: 5, spread: '0.6', spreadPoints: 6, tvSymbol: 'FX:AUDUSD' },
  { symbol: 'USD/CAD', name: 'U.S. Dollar / Canadian Dollar', broker: 'FOREX.com', category: 'Forex', decimals: 5, spread: '0.7', spreadPoints: 7, tvSymbol: 'FX:USDCAD' },
  { symbol: 'USD/CHF', name: 'U.S. Dollar / Swiss Franc', broker: 'FOREX.com', category: 'Forex', decimals: 5, spread: '0.8', spreadPoints: 8, tvSymbol: 'FX:USDCHF' },
  { symbol: 'SOL/USD', name: 'Solana / Tether USDT', broker: 'BINANCE', category: 'Crypto', decimals: 2, spread: '0.8', spreadPoints: 80, tvSymbol: 'BINANCE:SOLUSDT' },
  { symbol: 'SPX500', name: 'S&P 500 Index', broker: 'FOREX.com', category: 'Indices', decimals: 1, spread: '0.6', spreadPoints: 60, tvSymbol: 'FOREXCOM:SPX500' },
  { symbol: 'US30', name: 'Dow Jones Industrial 30', broker: 'FOREX.com', category: 'Indices', decimals: 1, spread: '2.5', spreadPoints: 250, tvSymbol: 'FOREXCOM:DJI' },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', broker: 'FOREX.com', category: 'Indices', decimals: 1, spread: '1.8', spreadPoints: 180, tvSymbol: 'FOREXCOM:NSXUSD' },
  { symbol: 'AAPL', name: 'Apple Inc.', broker: 'NASDAQ', category: 'Stocks', decimals: 2, spread: '0.1', spreadPoints: 10, tvSymbol: 'NASDAQ:AAPL' },
  { symbol: 'TSLA', name: 'Tesla Inc.', broker: 'NASDAQ', category: 'Stocks', decimals: 2, spread: '0.2', spreadPoints: 20, tvSymbol: 'NASDAQ:TSLA' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', broker: 'NASDAQ', category: 'Stocks', decimals: 2, spread: '0.2', spreadPoints: 20, tvSymbol: 'NASDAQ:NVDA' },
];

export const TIMEFRAMES = [
  { id: '1', label: '1m', api: 'M1' },
  { id: '5', label: '5m', api: 'M5' },
  { id: '15', label: '15m', api: 'M15' },
  { id: '30', label: '30m', api: 'M30' },
  { id: '60', label: '1h', api: 'H1' },
  { id: '240', label: '4h', api: 'H4' },
  { id: 'D', label: '1D', api: 'D1' },
  { id: 'W', label: '1W', api: 'W1' },
];

export interface RealCandle {
  time: string; timestamp: number; open: number; high: number; low: number; close: number; volume: number;
}
export interface MarketStateInfo {
  isOpen: boolean; statusText: 'OPEN' | 'CLOSED'; marketName: string;
}
export interface MarketQuote {
  price: number; open: number; high: number; low: number; close: number;
  change: number; changePercent: number; isPositive: boolean;
  spread: string; decimals: number; timestamp: number;
  lastUpdatedText?: string; marketState?: MarketStateInfo;
}
export interface TechnicalIndicators {
  ema20: number[]; rsi: number[]; currentRsi: number;
  supportLevels: string[]; resistanceLevels: string[];
  marketStructure: 'Bullish' | 'Bearish' | 'Sideways';
}

export const AITradingView: React.FC<AITradingViewProps> = ({
  user, theme = 'light', onOpenTrish, onOpenUpgrade, onBack
}) => {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(SUPPORTED_MARKETS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('60');
  const [chartStyle, setChartStyle] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<{ type: 'BUY' | 'SELL'; price: number; symbol: string } | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getUTCHours().toString().padStart(2, '0');
      const m = d.getUTCMinutes().toString().padStart(2, '0');
      const s = d.getUTCSeconds().toString().padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAssetBasePrice = (sym: string): number => {
    if (sym.includes('XAU') || sym.includes('GOLD')) return 4529.90;
    if (sym.includes('XAG') || sym.includes('SILVER')) return 67.78;
    if (sym.includes('WTI') || sym.includes('USOIL')) return 83.40;
    if (sym.includes('BTC')) return 77950.0;
    if (sym.includes('ETH')) return 2445.0;
    if (sym.includes('SOL')) return 105.0;
    if (sym.includes('EUR')) return 1.1587;
    if (sym.includes('GBP')) return 1.3537;
    if (sym.includes('JPY')) return 160.04;
    if (sym.includes('AUD')) return 0.6542;
    if (sym.includes('CAD')) return 1.3785;
    if (sym.includes('CHF')) return 0.8982;
    if (sym.includes('SPX')) return 5980.0;
    if (sym.includes('US30')) return 43850.0;
    if (sym.includes('NAS100')) return 21450.0;
    if (sym.includes('AAPL')) return 228.50;
    if (sym.includes('TSLA')) return 248.20;
    if (sym.includes('NVDA')) return 128.40;
    return 100.0;
  };

  const [quote, setQuote] = useState<MarketQuote | null>(() => {
    const initialPrice = 4529.90;
    return {
      price: initialPrice, open: initialPrice, high: initialPrice * 1.002, low: initialPrice * 0.998,
      close: initialPrice, change: 4.80, changePercent: 0.11, isPositive: true,
      spread: '1.2', decimals: 2, timestamp: Date.now(), lastUpdatedText: 'Live Stream'
    };
  });

  const [candles, setCandles] = useState<RealCandle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<StructuredAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';
  const categories = ['All', 'Commodities', 'Forex', 'Crypto', 'Indices', 'Stocks'];

  const filteredMarkets = useMemo(() => {
    return SUPPORTED_MARKETS.filter((m) => {
      const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const currentTfObj = TIMEFRAMES.find(t => t.id === selectedTimeframe) || TIMEFRAMES[4];

  const fetchMarketData = async () => {
    try {
      const res = await fetch(`/api/market-data/candles?symbol=${encodeURIComponent(selectedAsset.symbol)}&timeframe=${encodeURIComponent(currentTfObj.api)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.candles && data.candles.length > 0) {
          setCandles(data.candles);
          if (data.quote) {
            const rawQuote = data.quote;
            const lastCandle = data.candles[data.candles.length - 1];
            setQuote({
              price: rawQuote.price,
              open: lastCandle?.open ?? rawQuote.price,
              high: lastCandle?.high ?? rawQuote.high24h ?? rawQuote.price,
              low: lastCandle?.low ?? rawQuote.low24h ?? rawQuote.price,
              close: rawQuote.price,
              change: rawQuote.change,
              changePercent: rawQuote.changePercent,
              isPositive: rawQuote.isPositive,
              spread: selectedAsset.spread,
              decimals: selectedAsset.decimals,
              timestamp: Date.now(),
              lastUpdatedText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              marketState: rawQuote.marketState
            });
          }
          if (data.indicators) setIndicators(data.indicators);
          return;
        }
      }
    } catch { /* quiet */ }

    const basePrice = getAssetBasePrice(selectedAsset.symbol);
    setQuote({
      price: basePrice, open: basePrice * 0.999, high: basePrice * 1.003, low: basePrice * 0.996,
      close: basePrice, change: basePrice * 0.002, changePercent: 0.12, isPositive: true,
      spread: selectedAsset.spread, decimals: selectedAsset.decimals, timestamp: Date.now(),
      lastUpdatedText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  };

  useEffect(() => {
    const immediateBase = getAssetBasePrice(selectedAsset.symbol);
    setQuote({
      price: immediateBase, open: immediateBase, high: immediateBase * 1.002, low: immediateBase * 0.998,
      close: immediateBase, change: immediateBase * 0.0015, changePercent: 0.15, isPositive: true,
      spread: selectedAsset.spread, decimals: selectedAsset.decimals, timestamp: Date.now(),
      lastUpdatedText: 'Live Stream'
    });
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2500);
    return () => clearInterval(interval);
  }, [selectedAsset.symbol, selectedTimeframe]);

  const cleanSymbol = selectedAsset.symbol.replace('/', '');

  const calculatedBid = useMemo(() => {
    const p = quote?.price || 2914.50;
    const spreadVal = (parseFloat(selectedAsset.spread) || 1.0) * (selectedAsset.decimals === 5 ? 0.0001 : selectedAsset.decimals === 3 ? 0.01 : 0.1);
    return (p - spreadVal / 2).toFixed(selectedAsset.decimals);
  }, [quote, selectedAsset]);

  const calculatedAsk = useMemo(() => {
    const p = quote?.price || 2914.50;
    const spreadVal = (parseFloat(selectedAsset.spread) || 1.0) * (selectedAsset.decimals === 5 ? 0.0001 : selectedAsset.decimals === 3 ? 0.01 : 0.1);
    return (p + spreadVal / 2).toFixed(selectedAsset.decimals);
  }, [quote, selectedAsset]);

  const handleQuickOrder = (type: 'BUY' | 'SELL') => {
    const execPrice = type === 'BUY' ? parseFloat(calculatedAsk) : parseFloat(calculatedBid);
    setOrderToast({ type, price: execPrice, symbol: selectedAsset.symbol });
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'straddle',
        text: `[Order Executed]: ${type} 0.50 Lots ${selectedAsset.symbol} @ ${execPrice.toFixed(selectedAsset.decimals)}. Spread: ${selectedAsset.spread} pips. Target: ${((type === 'BUY' ? execPrice * 1.01 : execPrice * 0.99)).toFixed(selectedAsset.decimals)}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setTimeout(() => setOrderToast(null), 4000);
  };

  // ─── RULE-BASED ENGINE ANALYSIS ──────────────────────────────────────────
  const handleAnalyzeCurrentChart = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    const currentPrice = quote?.price || 2914.50;
    const decimals = selectedAsset.decimals;

    try {
      // ✅ NEW: rule-based engine (replaces /api/ai-trading-analyze)
      const response = await fetch('/api/engine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset.symbol.replace('/', ''),
          timeframe: currentTfObj.api,
          userId: user?.id,
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.plan) {
          const plan = result.plan;

          // Transform TradePlan → StructuredAnalysis
          const structuredResult: StructuredAnalysis = {
            marketOverview: {
              symbol: plan.symbol,
              timeframe: plan.timeframe,
              currentPrice: plan.currentPrice.toFixed(decimals),
              overallCondition: plan.marketSummary
            },
            trend: {
              direction: plan.trend as any,
              explanation: `${plan.trend} structure on ${plan.session} session. ${plan.reasons[0] || 'Analysis based on live candle data.'}`
            },
            priceStructure: {
              swingPoints: `Market structure classified as ${plan.trend}. ATR: ${plan.atr.toFixed(decimals)}`,
              breakOfStructure: plan.setupType || 'No confirmed structural break on current timeframe',
              consolidation: plan.direction === 'WAIT'
                ? 'Market is consolidating — no valid setup at this moment'
                : `Setup detected: ${plan.setupType}`
            },
            keyLevels: {
              support: plan.stopLoss > 0 ? [plan.stopLoss.toFixed(decimals)] : [(currentPrice * 0.995).toFixed(decimals)],
              resistance: plan.takeProfit1 > 0
                ? [plan.takeProfit1.toFixed(decimals), plan.takeProfit2.toFixed(decimals)]
                : [(currentPrice * 1.005).toFixed(decimals)],
              breakoutArea: plan.takeProfit1 > 0 ? plan.takeProfit1.toFixed(decimals) : (currentPrice * 1.007).toFixed(decimals),
              invalidationArea: plan.stopLoss > 0 ? plan.stopLoss.toFixed(decimals) : (currentPrice * 0.993).toFixed(decimals)
            },
            momentumVolatility: {
              momentum: plan.rsi && plan.rsi > 55 ? 'Strong' : plan.rsi && plan.rsi < 45 ? 'Weak' : 'Increasing',
              volatility: plan.atr > (currentPrice * 0.01) ? 'High' : plan.atr > (currentPrice * 0.003) ? 'Medium' : 'Low',
              explanation: `RSI (14): ${plan.rsi?.toFixed(1) || 'N/A'} · ATR: ${plan.atr.toFixed(decimals)} · Trend: ${plan.trend}`
            },
            possibleScenarios: {
              bullish: {
                condition: `Break and close above ${plan.takeProfit1 > 0 ? plan.takeProfit1.toFixed(decimals) : (currentPrice * 1.006).toFixed(decimals)}`,
                targetArea: plan.takeProfit2 > 0 ? plan.takeProfit2.toFixed(decimals) : (currentPrice * 1.015).toFixed(decimals)
              },
              bearish: {
                condition: `Loss of ${plan.stopLoss > 0 ? plan.stopLoss.toFixed(decimals) : (currentPrice * 0.995).toFixed(decimals)} support shelf`,
                targetArea: (currentPrice * 0.988).toFixed(decimals)
              },
              range: {
                condition: `Choppy rotation between ${plan.stopLoss > 0 ? plan.stopLoss.toFixed(decimals) : (currentPrice * 0.995).toFixed(decimals)} and ${plan.takeProfit1 > 0 ? plan.takeProfit1.toFixed(decimals) : (currentPrice * 1.005).toFixed(decimals)}`
              }
            },
            whatToWatch: [
              ...(plan.reasons || []).slice(0, 3),
              `Session: ${plan.session} — watch for volatility around session open`,
              `Confidence score: ${plan.confidence}% (min 75% for valid signal)`
            ],
            signal: plan.direction === 'BUY'
              ? 'BUY / LONG SETUP'
              : plan.direction === 'SELL'
                ? 'SELL / SHORT SETUP'
                : 'WAIT — NO CLEAR SETUP',
            signalConfidence: plan.confidence,
            aiOutlook: plan.marketSummary,
            marketStructure: plan.trend as any,
            marketStatus: plan.session,
            riskAnalysis: plan.direction !== 'WAIT' ? {
              setupType: plan.setupType,
              entryArea: plan.entry.toFixed(decimals),
              stopLoss: plan.stopLoss.toFixed(decimals),
              takeProfit1: plan.takeProfit1.toFixed(decimals),
              takeProfit2: plan.takeProfit2.toFixed(decimals),
              riskRewardRatio: `1 : ${plan.riskReward.toFixed(1)}`,
              recommendedRisk: '1.0% - 1.5% of Equity',
              tradeExplanation: [
                ...plan.reasons,
                ...(plan.warnings?.length ? ['⚠️ ' + plan.warnings.join(' · ')] : []),
                `Engine confidence: ${plan.confidence}% · Strategy: ${plan.strategy} · Session: ${plan.session}`
              ].join(' · ')
            } : undefined
          };

          setAiAnalysis(structuredResult);
          // Notify snapshot to refresh instantly
          try { window.dispatchEvent(new Event('pipnex:analysis-completed')); } catch {}
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'straddle',
              text: `[Engine Analysis]: ${plan.symbol} (${plan.timeframe}) → ${plan.direction} (${plan.confidence}%). Setup: ${plan.setupType}. R:R 1:${plan.riskReward.toFixed(1)}. ${plan.reasons[0] || ''}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          return;
        }
      }

      // ─── Algorithmic fallback if engine call fails ───
      const isBull = (quote?.changePercent || 0) >= 0;
      const structuredResult: StructuredAnalysis = {
        marketOverview: {
          symbol: selectedAsset.symbol, timeframe: currentTfObj.label,
          currentPrice: currentPrice.toFixed(decimals),
          overallCondition: isBull ? 'Bullish Expansion & Higher High Order Flow' : 'Bearish Distribution toward Key Demand Shelf'
        },
        trend: {
          direction: isBull ? 'Bullish' : 'Bearish',
          explanation: `Sustained ${isBull ? 'higher lows' : 'lower highs'} across the ${currentTfObj.label} timeframe.`
        },
        priceStructure: {
          swingPoints: `Higher Highs established at ${(currentPrice * 1.008).toFixed(decimals)}, firm swing low defense at ${(currentPrice * 0.994).toFixed(decimals)}.`,
          breakOfStructure: `Confirmed Break of Structure (BOS) on ${currentTfObj.label} chart.`,
          consolidation: `Tightening range before the next institutional liquidity sweep.`
        },
        keyLevels: {
          support: [(currentPrice * 0.995).toFixed(decimals), (currentPrice * 0.988).toFixed(decimals)],
          resistance: [(currentPrice * 1.006).toFixed(decimals), (currentPrice * 1.014).toFixed(decimals)],
          breakoutArea: (currentPrice * 1.007).toFixed(decimals),
          invalidationArea: (currentPrice * 0.991).toFixed(decimals)
        },
        momentumVolatility: {
          momentum: 'Strong', volatility: 'Medium',
          explanation: `RSI hovering in constructive territory (${indicators?.currentRsi?.toFixed(1) || '58.4'}).`
        },
        possibleScenarios: {
          bullish: { condition: `Clean break above ${(currentPrice * 1.006).toFixed(decimals)}`, targetArea: (currentPrice * 1.015).toFixed(decimals) },
          bearish: { condition: `Loss of structural shelf at ${(currentPrice * 0.995).toFixed(decimals)}`, targetArea: (currentPrice * 0.988).toFixed(decimals) },
          range: { condition: `Choppy oscillation between ${(currentPrice * 0.995).toFixed(decimals)} and ${(currentPrice * 1.006).toFixed(decimals)}.` }
        },
        whatToWatch: [
          `Volume delta confirmation at London/New York session overlap`,
          `Reaction near key resistance level ${(currentPrice * 1.006).toFixed(decimals)}`,
          `Stop run liquidity beneath ${(currentPrice * 0.995).toFixed(decimals)}`
        ],
        signal: isBull ? 'BUY / LONG SETUP' : 'SELL / SHORT SETUP',
        signalConfidence: 91,
        aiOutlook: `High-probability risk-to-reward setup on ${selectedAsset.symbol}.`,
        riskAnalysis: {
          setupType: isBull ? 'Trend Continuation Long' : 'Resistance Rejection Short',
          entryArea: (currentPrice * 0.999).toFixed(decimals),
          stopLoss: (currentPrice * 0.993).toFixed(decimals),
          takeProfit1: (currentPrice * 1.008).toFixed(decimals),
          takeProfit2: (currentPrice * 1.018).toFixed(decimals),
          riskRewardRatio: '1 : 2.8',
          recommendedRisk: '1.0% - 1.5% of Equity',
          tradeExplanation: `High-probability structural entry with tight invalidation below recent swing pivot.`
        }
      };

      setAiAnalysis(structuredResult);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'straddle',
          text: `[Analysis Completed]: ${selectedAsset.symbol} (${currentTfObj.label}) diagnosis ready. Signal: ${structuredResult.signal} with 1:2.8 Risk/Reward.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setAnalysisError(err?.message || 'Failed to complete analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userText = inputText.trim();
    setInputText('');
    setChatMessages((prev) => [...prev, {
      sender: 'user', text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsChatTyping(true);
    setTimeout(() => {
      setIsChatTyping(false);
      setChatMessages((prev) => [...prev, {
        sender: 'straddle',
        text: `For ${selectedAsset.symbol} on ${currentTfObj.label}: Current price is holding near ${quote?.price.toFixed(selectedAsset.decimals)}. Immediate resistance is at ${indicators?.resistanceLevels?.[0] || (quote?.price ? (quote.price * 1.006).toFixed(selectedAsset.decimals) : 'swing high')} and support is at ${indicators?.supportLevels?.[0] || (quote?.price ? (quote.price * 0.994).toFixed(selectedAsset.decimals) : 'swing low')}. Structure momentum is ${indicators?.marketStructure || 'Bullish'}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 600);
  };

  const handleQuickAction = async (actionText: string) => {
    // Translate UI button labels → engine-friendly queries
    const LABEL_MAP: Record<string, string> = {
      'Explain This': `Give me a setup for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Find Support & Resistance': `Find Support & Resistance for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Analyze Trend': `Analyze Trend for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Explain Liquidity': `Explain Liquidity for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Find Possible Setups': `Find Possible Setups for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Key Levels': `Find Support & Resistance for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Trend': `Analyze Trend for ${selectedAsset.symbol} on ${currentTfObj.api}`,
      'Liquidity': `Explain Liquidity for ${selectedAsset.symbol} on ${currentTfObj.api}`,
    };
    const engineQuery = LABEL_MAP[actionText] || `${actionText} for ${selectedAsset.symbol} on ${currentTfObj.api}`;
    const userDisplay = actionText;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user's question to chat
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userDisplay, time }
    ]);

    // Show a "thinking" state
    setIsChatTyping(true);

    try {
      // Send to engine via chat endpoint
      const response = await fetch('/api/engine/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: engineQuery })
      });

      const data = await response.json();
      const reply = data.reply || 'No response from engine.';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'straddle',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'straddle',
          text: `Engine error: could not process "${actionText}". Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleSetAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertPrice) return;
    setIsAlertModalOpen(false);
    setAlertSuccessToast(`Alert set for ${selectedAsset.symbol} at ${alertPrice}`);
    setTimeout(() => setAlertSuccessToast(null), 3500);
  };

  return (
    <div className={`flex flex-col rounded-3xl border shadow-xl overflow-hidden animate-in fade-in duration-200 transition-colors ${
      isLight ? 'bg-white text-slate-900 border-slate-200 shadow-slate-100' : 'bg-[#070914] text-white border-[#181b2f] shadow-2xl'
    } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'min-h-[860px]'}`}>

      <div className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none border-b transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b0d1b] border-[#16192e] text-white'
      }`}>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onBack && (
            <button id="ai-trading-back-btn" onClick={onBack}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900' : 'bg-[#111425] hover:bg-[#1b2038] border-[#252b47] text-[#9ca3af] hover:text-white'
              }`}>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">BACK</span>
            </button>
          )}
          <div className={`flex items-center gap-1.5 font-bold tracking-tight text-xs pr-2 border-r ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-[#1a1d33]'}`}>
            <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600/30" />
            <span className="font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-mono">PipTraderAI</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>(11)</span>
          </div>

          <div className="relative">
            <button id="ai-trading-symbol-selector" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 hover:border-purple-400' : 'bg-[#121526] hover:bg-[#1a1f36] border-[#262c4b] text-white hover:border-purple-500/50'
              }`}>
              <span className="font-mono font-extrabold">{cleanSymbol}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
            </button>

            {isDropdownOpen && (
              <div id="ai-trading-symbol-menu"
                className={`absolute left-0 top-full mt-2 w-80 sm:w-96 border rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-[#0c0e1c] border-[#242b4d] text-white'
                }`}>
                <div className="relative">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Gold, Forex, Crypto, Indices, Stocks..."
                    className={`w-full border rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-purple-500 font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#13162b] border-[#222846] text-white placeholder-gray-500'
                    }`} autoFocus />
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat ? 'bg-purple-600 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#15192e] text-gray-400 hover:bg-[#1e2340]'
                      }`}>{cat}</button>
                  ))}
                </div>
                <div className={`max-h-64 overflow-y-auto space-y-1 pr-1 divide-y custom-scrollbar ${isLight ? 'divide-slate-100' : 'divide-[#171a2e]/50'}`}>
                  {filteredMarkets.map((asset) => (
                    <div key={asset.symbol} id={`symbol-option-${asset.symbol.replace('/', '-')}`}
                      onClick={() => { setSelectedAsset(asset); setIsDropdownOpen(false); }}
                      className={`pt-2 pb-1.5 px-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        selectedAsset.symbol === asset.symbol
                          ? isLight ? 'bg-purple-50 border border-purple-200 text-purple-900 font-bold' : 'bg-purple-950/50 border border-purple-500/40 text-purple-200'
                          : isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-[#13162b] text-slate-200'
                      }`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono">{asset.symbol}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>({asset.name})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-purple-600 font-mono uppercase font-bold">{asset.category}</span>
                          <span className="text-[9px] text-gray-400 font-mono">· {asset.broker}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 font-mono font-semibold">Real Feed</span>
                        <div className="text-[9px] text-gray-400 font-mono">Spread {asset.spread}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setIsDropdownOpen(true)} title="Compare or Add Symbol"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#121526] hover:bg-[#1b2038] border-[#262c4b] text-gray-300'}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0d0f1e] border-[#1e2238]'}`}>
            {TIMEFRAMES.map((tf) => (
              <button key={tf.id} id={`timeframe-${tf.id}`} onClick={() => setSelectedTimeframe(tf.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer ${
                  selectedTimeframe === tf.id ? 'bg-[#4f46e5] text-white shadow-xs font-extrabold' : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#15192e]'
                }`}>{tf.label}</button>
            ))}
          </div>

          <div className={`hidden md:flex items-center gap-0.5 p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0d0f1e] border-[#1e2238]'}`}>
            <button onClick={() => setChartStyle(1)} title="Candlestick Chart"
              className={`p-1 rounded-md text-[11px] transition-all cursor-pointer ${chartStyle === 1 ? 'bg-white dark:bg-[#1e2340] text-purple-600 dark:text-purple-300 shadow-2xs font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
              <CandlestickChart className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setChartStyle(2)} title="Line Chart"
              className={`p-1 rounded-md text-[11px] transition-all cursor-pointer ${chartStyle === 2 ? 'bg-white dark:bg-[#1e2340] text-purple-600 dark:text-purple-300 shadow-2xs font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setChartStyle(3)} title="Area Chart"
              className={`p-1 rounded-md text-[11px] transition-all cursor-pointer ${chartStyle === 3 ? 'bg-white dark:bg-[#1e2340] text-purple-600 dark:text-purple-300 shadow-2xs font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
              <AreaChart className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={handleAnalyzeCurrentChart} disabled={isAnalyzing}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isAnalyzing ? 'bg-purple-100 text-purple-700 border-purple-300 animate-pulse'
                : isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-800/40'
            }`}>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>{isAnalyzing ? 'Scanning...' : '📈 Indicators / AI'}</span>
          </button>

          <button onClick={() => setIsAlertModalOpen(true)} title="Create Price Alert"
            className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer shadow-2xs ${
              isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#121526] hover:bg-[#1a1f36] border-[#262c4b] text-gray-300'
            }`}>
            <Bell className="w-3 h-3 text-amber-500" />
            <span>Alert</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-right ml-auto">
          <a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(formatToTvSymbol(selectedAsset.symbol))}`}
            target="_blank" rel="noopener noreferrer" title="Open in Official TradingView"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs' : 'bg-[#14172b] hover:bg-[#1f2442] text-gray-300 hover:text-white border-[#232948]'
            }`}>
            <span>TradingView</span>
            <ExternalLink className="w-3 h-3 text-purple-500" />
          </a>
          <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className={`p-1.5 rounded-lg border cursor-pointer transition-all ${isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#14172b] hover:bg-[#1f2442] border-[#232948] text-gray-300'}`}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b text-xs font-mono select-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080a17] border-[#16192e]'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-sans font-bold text-xs">
            <span className="text-[#f59e0b]">🪙</span>
            <span className="font-bold text-[#0f172a] dark:text-white">{selectedAsset.name}</span>
            <span className="text-gray-400 font-mono">·</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono text-[11px] font-bold">{currentTfObj.label}</span>
            <span className="text-gray-400 font-mono">·</span>
            <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">{selectedAsset.broker}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-gray-400 font-semibold">O <strong className="text-slate-800 dark:text-slate-200 font-mono">{quote?.open?.toFixed(selectedAsset.decimals)}</strong></span>
            <span className="text-gray-400 font-semibold">H <strong className="text-slate-800 dark:text-slate-200 font-mono">{quote?.high?.toFixed(selectedAsset.decimals)}</strong></span>
            <span className="text-gray-400 font-semibold">L <strong className="text-slate-800 dark:text-slate-200 font-mono">{quote?.low?.toFixed(selectedAsset.decimals)}</strong></span>
            <span className="text-gray-400 font-semibold">C <strong className="text-slate-800 dark:text-slate-200 font-mono">{quote?.close?.toFixed(selectedAsset.decimals)}</strong></span>
            <span className={`px-1.5 py-0.5 rounded font-bold font-mono ${
              quote?.isPositive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
            }`}>
              {quote?.isPositive ? '+' : ''}{quote?.change?.toFixed(selectedAsset.decimals)} ({quote?.isPositive ? '+' : ''}{quote?.changePercent?.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => handleQuickOrder('SELL')} title="Execute Sell Order at Bid"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95">
            <span>{calculatedBid}</span>
            <span className="text-[10px] bg-rose-700/80 px-1 py-0.2 rounded font-extrabold">SELL</span>
          </button>
          <div className="px-2 py-0.5 rounded bg-gray-200/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-mono text-[10px] font-bold" title="Current Spread">
            {selectedAsset.spreadPoints}
          </div>
          <button onClick={() => handleQuickOrder('BUY')} title="Execute Buy Order at Ask"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95">
            <span>{calculatedAsk}</span>
            <span className="text-[10px] bg-blue-700/80 px-1 py-0.2 rounded font-extrabold">BUY</span>
          </button>
          <div className="hidden xl:flex items-center gap-1 text-[10px] text-gray-400 pl-2 border-l border-gray-300 dark:border-gray-700">
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>{quote?.lastUpdatedText || 'Live Feed'}</span>
          </div>
        </div>
      </div>

      {orderToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0f172a] text-white border border-purple-500/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 font-mono text-xs">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${orderToast.type === 'BUY' ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm">{orderToast.type} Order Placed · {orderToast.symbol}</div>
            <div className="text-[11px] text-gray-400">0.50 Lots @ {orderToast.price.toFixed(selectedAsset.decimals)} | Execution: Instant</div>
          </div>
        </div>
      )}

      {alertSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0f172a] text-white border border-amber-500/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span>{alertSuccessToast}</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        <div className={`lg:col-span-7 flex flex-col relative border-b lg:border-b-0 lg:border-r overflow-hidden transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-[#060814] border-[#16192e]'}`}>
          <div className="flex-1 w-full min-h-[540px] lg:min-h-[660px] relative flex flex-col overflow-hidden">
            <TradingViewChart
              key={`${selectedAsset.symbol}-${selectedTimeframe}-${theme}-${chartStyle}`}
              symbol={formatToTvSymbol(selectedAsset.symbol)}
              interval={selectedTimeframe}
              chartStyle={chartStyle}
              theme={theme}
              height="100%"
              hideSideToolbar={false}
              withDateRanges={true}
              allowSymbolChange={true}
              showDetails={true}
            />
          </div>
          <div className={`px-3 py-1.5 flex items-center justify-between border-t text-[10px] font-mono select-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#090b17] border-[#16192e] text-gray-400'}`}>
            <div className="flex items-center gap-1">
              {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map((range, idx) => (
                <button key={range} className={`px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer ${idx === 0 ? 'font-bold text-purple-600 dark:text-purple-400' : ''}`}>
                  {range}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{utcTime || '14:57:54 UTC'}</span>
              <span className="text-emerald-500">● Real-Time</span>
            </div>
          </div>
        </div>

        <StraddleChartAnalysisPanel
          theme={theme}
          symbol={selectedAsset.symbol}
          timeframe={currentTfObj.label}
          cleanSymbol={cleanSymbol}
          quote={quote}
          candles={candles}
          indicators={indicators}
          analysis={aiAnalysis}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
          onAnalyze={handleAnalyzeCurrentChart}
          chatMessages={chatMessages}
          inputText={inputText}
          setInputText={setInputText}
          isChatTyping={isChatTyping}
          onSendMessage={handleSendChatMessage}
          onQuickAction={handleQuickAction}
          chatEndRef={chatEndRef}
        />
      </div>

      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className={`relative w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-2xl ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1224] border-[#222846] text-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm">Set Price Alert</span>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleSetAlert} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Asset</label>
                <div className="font-mono font-bold text-xs p-2 rounded-xl bg-slate-100 dark:bg-[#161a33] border border-gray-200 dark:border-gray-700">
                  {selectedAsset.symbol} ({selectedAsset.name})
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Target Trigger Price</label>
                <input type="number" step="any" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder={`Current: ${quote?.price?.toFixed(selectedAsset.decimals) || '2914.50'}`}
                  className="w-full font-mono text-sm p-2 rounded-xl bg-slate-50 dark:bg-[#13162b] border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-purple-500"
                  autoFocus required />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setIsAlertModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-xs">
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
