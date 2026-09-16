import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  RotateCcw, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Percent,
  RefreshCw,
  Clock
} from 'lucide-react';

interface InstrumentConfig {
  symbol: string;
  apiSymbol: string;
  name: string;
  pipSize: number;
  contractSize: number;
  pipDecimals: number;
  defaultPrice: number;
  defaultSlDelta: number;
  defaultTpDelta: number;
}

const INSTRUMENTS: Record<string, InstrumentConfig> = {
  'XAUUSD': {
    symbol: 'XAUUSD',
    apiSymbol: 'XAU/USD',
    name: 'Gold (Spot)',
    pipSize: 0.01,
    contractSize: 100,
    pipDecimals: 2,
    defaultPrice: 2904.50,
    defaultSlDelta: 12.00,
    defaultTpDelta: 24.00,
  },
  'EURUSD': {
    symbol: 'EURUSD',
    apiSymbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    pipSize: 0.0001,
    contractSize: 100000,
    pipDecimals: 4,
    defaultPrice: 1.0842,
    defaultSlDelta: 0.0025,
    defaultTpDelta: 0.0050,
  },
  'GBPUSD': {
    symbol: 'GBPUSD',
    apiSymbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    pipSize: 0.0001,
    contractSize: 100000,
    pipDecimals: 4,
    defaultPrice: 1.2915,
    defaultSlDelta: 0.0030,
    defaultTpDelta: 0.0060,
  },
  'USDJPY': {
    symbol: 'USDJPY',
    apiSymbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    pipSize: 0.01,
    contractSize: 100000,
    pipDecimals: 2,
    defaultPrice: 154.28,
    defaultSlDelta: 0.45,
    defaultTpDelta: 0.90,
  },
  'USDCAD': {
    symbol: 'USDCAD',
    apiSymbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    pipSize: 0.0001,
    contractSize: 100000,
    pipDecimals: 4,
    defaultPrice: 1.3980,
    defaultSlDelta: 0.0025,
    defaultTpDelta: 0.0050,
  },
  'AUDUSD': {
    symbol: 'AUDUSD',
    apiSymbol: 'AUD/USD',
    name: 'Australian Dollar / USD',
    pipSize: 0.0001,
    contractSize: 100000,
    pipDecimals: 4,
    defaultPrice: 0.6580,
    defaultSlDelta: 0.0020,
    defaultTpDelta: 0.0040,
  },
  'US30': {
    symbol: 'US30',
    apiSymbol: 'US30',
    name: 'Dow Jones Index',
    pipSize: 1.0,
    contractSize: 1,
    pipDecimals: 1,
    defaultPrice: 43800.0,
    defaultSlDelta: 120.0,
    defaultTpDelta: 250.0,
  },
  'NAS100': {
    symbol: 'NAS100',
    apiSymbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    pipSize: 1.0,
    contractSize: 1,
    pipDecimals: 1,
    defaultPrice: 20450.0,
    defaultSlDelta: 80.0,
    defaultTpDelta: 160.0,
  },
  'BTCUSD': {
    symbol: 'BTCUSD',
    apiSymbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    pipSize: 1.0,
    contractSize: 1,
    pipDecimals: 1,
    defaultPrice: 96450.0,
    defaultSlDelta: 950.0,
    defaultTpDelta: 2200.0,
  },
  'ETHUSD': {
    symbol: 'ETHUSD',
    apiSymbol: 'ETH/USD',
    name: 'Ethereum / US Dollar',
    pipSize: 1.0,
    contractSize: 1,
    pipDecimals: 1,
    defaultPrice: 3420.0,
    defaultSlDelta: 45.0,
    defaultTpDelta: 110.0,
  }
};

export const PositionCalculatorView: React.FC = () => {
  // Account settings state
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [leverage, setLeverage] = useState<string>('1:100');
  const [riskPercent, setRiskPercent] = useState<string>('1');

  // Trade parameters state
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [entryPrice, setEntryPrice] = useState<string>('2904.50');
  const [stopLoss, setStopLoss] = useState<string>('2892.50');
  const [takeProfit, setTakeProfit] = useState<string>('2928.50');

  // Real-time market state
  const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false);
  const [priceLastUpdated, setPriceLastUpdated] = useState<string>('');

  // UI state
  const [copied, setCopied] = useState<boolean>(false);

  const currentInstrument = INSTRUMENTS[selectedSymbol] || INSTRUMENTS['XAUUSD'];

  // Fetch real-time market price for instrument
  const fetchLiveInstrumentPrice = async (symbolKey: string) => {
    const inst = INSTRUMENTS[symbolKey];
    if (!inst) return;
    setIsFetchingPrice(true);
    try {
      const res = await fetch(`/api/market-data/price?symbol=${encodeURIComponent(inst.apiSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quote && data.quote.price) {
          const livePrice = data.quote.price;
          setEntryPrice(livePrice.toFixed(inst.pipDecimals));
          if (direction === 'BUY') {
            setStopLoss((livePrice - inst.defaultSlDelta).toFixed(inst.pipDecimals));
            setTakeProfit((livePrice + inst.defaultTpDelta).toFixed(inst.pipDecimals));
          } else {
            setStopLoss((livePrice + inst.defaultSlDelta).toFixed(inst.pipDecimals));
            setTakeProfit((livePrice - inst.defaultTpDelta).toFixed(inst.pipDecimals));
          }
          setPriceLastUpdated(new Date().toLocaleTimeString());
        }
      }
    } catch {
      // Quiet fallback
    } finally {
      setIsFetchingPrice(false);
    }
  };

  // Handle instrument change
  const handleInstrumentChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const inst = INSTRUMENTS[symbol];
    if (inst) {
      setEntryPrice(inst.defaultPrice.toFixed(inst.pipDecimals));
      if (direction === 'BUY') {
        setStopLoss((inst.defaultPrice - inst.defaultSlDelta).toFixed(inst.pipDecimals));
        setTakeProfit((inst.defaultPrice + inst.defaultTpDelta).toFixed(inst.pipDecimals));
      } else {
        setStopLoss((inst.defaultPrice + inst.defaultSlDelta).toFixed(inst.pipDecimals));
        setTakeProfit((inst.defaultPrice - inst.defaultTpDelta).toFixed(inst.pipDecimals));
      }
      fetchLiveInstrumentPrice(symbol);
    }
  };

  // Switch direction and flip SL / TP
  const handleDirectionChange = (newDir: 'BUY' | 'SELL') => {
    if (newDir === direction) return;
    setDirection(newDir);
    const entry = parseFloat(entryPrice) || currentInstrument.defaultPrice;
    const slDist = currentInstrument.defaultSlDelta;
    const tpDist = currentInstrument.defaultTpDelta;

    if (newDir === 'BUY') {
      setStopLoss((entry - slDist).toFixed(currentInstrument.pipDecimals));
      setTakeProfit((entry + tpDist).toFixed(currentInstrument.pipDecimals));
    } else {
      setStopLoss((entry + slDist).toFixed(currentInstrument.pipDecimals));
      setTakeProfit((entry - tpDist).toFixed(currentInstrument.pipDecimals));
    }
  };

  // Reset to default
  const handleReset = () => {
    setAccountBalance('10000');
    setLeverage('1:100');
    setRiskPercent('1');
    setDirection('BUY');
    setSelectedSymbol('XAUUSD');
    setEntryPrice('2904.50');
    setStopLoss('2892.50');
    setTakeProfit('2928.50');
  };

  // Directional Validation check
  const validationWarning = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (isNaN(entry) || isNaN(sl)) return null;

    if (direction === 'BUY') {
      if (sl >= entry) {
        return 'For a BUY position, Stop Loss must be BELOW the entry price.';
      }
      if (!isNaN(tp) && tp <= entry) {
        return 'For a BUY position, Take Profit must be ABOVE the entry price.';
      }
    } else {
      if (sl <= entry) {
        return 'For a SELL position, Stop Loss must be ABOVE the entry price.';
      }
      if (!isNaN(tp) && tp >= entry) {
        return 'For a SELL position, Take Profit must be BELOW the entry price.';
      }
    }
    return null;
  }, [direction, entryPrice, stopLoss, takeProfit]);

  // Calculations
  const calculation = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const riskPct = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;

    if (balance <= 0 || riskPct <= 0 || entry <= 0 || sl <= 0 || entry === sl) {
      return null;
    }

    // Risk amount in currency ($)
    const riskAmountUsd = (balance * riskPct) / 100;

    // Price difference to SL
    const slPriceDiff = Math.abs(entry - sl);
    // Pips distance to SL
    const slPips = slPriceDiff / currentInstrument.pipSize;

    // Pip value per 1.0 standard lot
    let pipValuePerStandardLot = 10;
    if (selectedSymbol === 'XAUUSD') {
      pipValuePerStandardLot = currentInstrument.contractSize * currentInstrument.pipSize; // 100 * 0.01 = $1.00 per pip per lot
    } else if (selectedSymbol === 'US30' || selectedSymbol === 'NAS100' || selectedSymbol === 'BTCUSD' || selectedSymbol === 'ETHUSD') {
      pipValuePerStandardLot = currentInstrument.contractSize * currentInstrument.pipSize; // 1 * 1.0 = $1.00
    } else if (selectedSymbol === 'EURUSD' || selectedSymbol === 'GBPUSD' || selectedSymbol === 'AUDUSD') {
      pipValuePerStandardLot = 10; // $10 per pip on 100k contract
    } else if (selectedSymbol === 'USDJPY') {
      pipValuePerStandardLot = (100000 * 0.01) / (entry || 154.28); // ~$6.48
    } else if (selectedSymbol === 'USDCAD') {
      pipValuePerStandardLot = (100000 * 0.0001) / (entry || 1.3980); // ~$7.15
    }

    // Lot size = Risk Amount / (Pips * Pip Value per 1 Lot)
    const exactLotSize = riskAmountUsd / (slPips * pipValuePerStandardLot);
    const roundedLotSize = Math.max(0.01, Math.round(exactLotSize * 100) / 100);

    // Units
    const units = roundedLotSize * currentInstrument.contractSize;

    // TP calculations if provided
    let tpPips = 0;
    let rewardAmountUsd = 0;
    let riskRewardRatio = 0;

    if (tp > 0 && tp !== entry) {
      const tpPriceDiff = Math.abs(tp - entry);
      tpPips = tpPriceDiff / currentInstrument.pipSize;
      rewardAmountUsd = tpPips * pipValuePerStandardLot * roundedLotSize;
      if (riskAmountUsd > 0) {
        riskRewardRatio = rewardAmountUsd / riskAmountUsd;
      }
    }

    // Leverage numeric multiplier
    const levMultiplier = leverage === '∞' ? 2000 : parseInt(leverage.replace('1:', ''), 10) || 100;
    const notionalValue = units * entry;
    const marginRequired = notionalValue / levMultiplier;

    return {
      riskAmountUsd,
      slPips,
      slPriceDiff,
      lotSize: roundedLotSize,
      exactLotSize,
      units,
      tpPips,
      rewardAmountUsd,
      riskRewardRatio,
      marginRequired,
      pipValue: pipValuePerStandardLot * roundedLotSize
    };
  }, [accountBalance, riskPercent, leverage, entryPrice, stopLoss, takeProfit, currentInstrument, selectedSymbol]);

  // Copy results summary
  const handleCopyResults = () => {
    if (!calculation) return;
    const text = `PipNex Position Calculation:
Pair: ${selectedSymbol} (${direction})
Entry: ${entryPrice}
Stop Loss: ${stopLoss} (${calculation.slPips.toFixed(1)} pips)
Take Profit: ${takeProfit || 'N/A'}
Recommended Lot Size: ${calculation.lotSize} Lots
Risk: $${calculation.riskAmountUsd.toFixed(2)} (${riskPercent}%)
Potential Profit: $${calculation.rewardAmountUsd.toFixed(2)}
Risk/Reward: 1:${calculation.riskRewardRatio.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-[#0c0d15] border border-[#1d2030] rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shadow-sm shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Position Size Calculator</h2>
            <p className="text-xs text-gray-400">Professional risk management tool</p>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleCopyResults}
            disabled={!calculation}
            className="px-3.5 py-2 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 active:scale-[0.98]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Account Settings & Trade Parameters */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Account Settings Card */}
          <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="text-purple-400 font-mono font-bold">$</span>
              <h3>Account Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Balance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Account Balance</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#10121c] border border-[#1c1f30] focus:border-purple-500/50 rounded-xl text-xs font-mono font-bold text-white placeholder-gray-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Leverage */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Leverage</span>
                </div>
                
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#10121c] border border-[#1c1f30] focus:border-purple-500/50 rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all"
                >
                  <option value="1:10">1:10</option>
                  <option value="1:20">1:20</option>
                  <option value="1:30">1:30</option>
                  <option value="1:50">1:50</option>
                  <option value="1:100">1:100</option>
                  <option value="1:200">1:200</option>
                  <option value="1:500">1:500</option>
                  <option value="1:1000">1:1000</option>
                  <option value="1:2000">1:2000</option>
                  <option value="∞">∞</option>
                </select>

                {/* Leverage Quick Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  {['1:100', '1:500', '1:1000', '1:2000', '∞'].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLeverage(lev)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        leverage === lev
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[#10121c] text-gray-400 hover:text-gray-200 border border-[#1c1f30]'
                      }`}
                    >
                      {lev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Per Trade */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-gray-300">Risk Per Trade</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  placeholder="1"
                  className="w-full pl-3.5 pr-8 py-2.5 bg-[#10121c] border border-[#1c1f30] focus:border-purple-500/50 rounded-xl text-xs font-mono font-bold text-white placeholder-gray-500 focus:outline-none transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono font-bold">
                  %
                </span>
              </div>

              {/* Risk Preset Pills */}
              <div className="flex items-center gap-2 pt-1">
                {['0.5%', '1%', '2%', '3%'].map((pct) => {
                  const val = pct.replace('%', '');
                  const isActive = riskPercent === val;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setRiskPercent(val)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[#10121c] text-gray-400 hover:text-gray-200 border border-[#1c1f30]'
                      }`}
                    >
                      {pct}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Trade Parameters Card */}
          <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Target className="w-4 h-4 text-purple-400" />
              <h3>Trade Parameters</h3>
            </div>

            {/* Trade Direction (Large Toggle Buttons) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Trade Direction</label>
              <div className="grid grid-cols-2 gap-3">
                {/* BUY / LONG */}
                <button
                  type="button"
                  onClick={() => handleDirectionChange('BUY')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    direction === 'BUY'
                      ? 'bg-[#22c55e] text-white shadow-lg shadow-green-950/40 ring-1 ring-green-400/40'
                      : 'bg-[#10121c] text-gray-400 hover:text-gray-200 border border-[#1c1f30]'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>BUY / LONG</span>
                </button>

                {/* SELL / SHORT */}
                <button
                  type="button"
                  onClick={() => handleDirectionChange('SELL')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    direction === 'SELL'
                      ? 'bg-[#ef4444] text-white shadow-lg shadow-red-950/40 ring-1 ring-red-400/40'
                      : 'bg-[#10121c] text-gray-400 hover:text-gray-200 border border-[#1c1f30]'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>SELL / SHORT</span>
                </button>
              </div>
            </div>

            {/* Trading Instrument */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Trading Instrument</label>
                <button
                  type="button"
                  onClick={() => fetchLiveInstrumentPrice(selectedSymbol)}
                  disabled={isFetchingPrice}
                  className="px-2 py-0.5 rounded-lg bg-[#141624] hover:bg-[#1f2338] border border-[#2b304c] hover:border-purple-500/40 text-purple-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  title="Fetch real-time live price from market feed"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingPrice ? 'animate-spin text-purple-400' : 'text-purple-300'}`} />
                  <span>{isFetchingPrice ? 'Syncing...' : 'Fetch Live Price'}</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedSymbol}
                  onChange={(e) => handleInstrumentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#10121c] border border-[#1c1f30] focus:border-purple-500/50 rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all pr-12"
                >
                  {Object.values(INSTRUMENTS).map((inst) => (
                    <option key={inst.symbol} value={inst.symbol}>
                      {inst.symbol} ({inst.name})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161828] text-purple-300 border border-[#25293d]">
                    {currentInstrument.pipSize}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>Pip size: {currentInstrument.pipSize} | Contract: {currentInstrument.contractSize.toLocaleString()}</span>
                {priceLastUpdated && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Updated: {priceLastUpdated}
                  </span>
                )}
              </div>
            </div>

            {/* Validation Warning Alert */}
            {validationWarning && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-snug">{validationWarning}</span>
              </div>
            )}

            {/* 3 Price Inputs: Entry Price, Stop Loss, Take Profit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              
              {/* Entry Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder={currentInstrument.defaultPrice.toFixed(currentInstrument.pipDecimals)}
                  className="w-full px-3.5 py-2.5 bg-[#10121c] border border-[#1c1f30] focus:border-purple-500/50 rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Stop Loss (Required) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Stop Loss</label>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#2b1216] text-[#ff4b58] border border-[#ff4b58]/35 uppercase">
                    Required
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-[#10121c] border border-[#ff4b58]/40 focus:border-[#ff4b58] rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

              {/* Take Profit (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Take Profit</label>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#122b1c] text-emerald-400 border border-emerald-500/30 uppercase">
                    Optional
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-[#10121c] border border-emerald-500/40 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Calculation Results & Risk Management */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Calculation Results Card */}
          <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 flex flex-col justify-between shadow-lg min-h-[380px]">
            <div>
              <div className="border-b border-[#161826] pb-3 mb-4">
                <h3 className="text-sm font-bold text-white">Calculation Results</h3>
                <p className="text-xs text-gray-400">Your recommended position size</p>
              </div>

              {calculation ? (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Hero Lot Size Card */}
                  <div className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase font-mono block">Recommended Lot Size</span>
                      <div className="text-3xl font-bold font-mono text-white tracking-tight mt-0.5">
                        {calculation.lotSize} <span className="text-sm text-purple-400 font-sans font-bold">Lots</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ≈ {calculation.units.toLocaleString()} units
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#122b1c] text-emerald-400 border border-emerald-500/30 font-mono uppercase">
                        Safe Size
                      </span>
                      <div className="text-xs text-gray-400 font-mono mt-1">
                        Margin: <span className="text-white font-bold">${calculation.marginRequired.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                      <div className="text-gray-400 text-[11px]">Risk Amount</div>
                      <div className="text-sm font-bold font-mono text-[#ff4b58] mt-0.5">
                        -${calculation.riskAmountUsd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">({riskPercent}% of balance)</div>
                    </div>

                    <div className="p-3 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                      <div className="text-gray-400 text-[11px]">Potential Profit</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                        +${calculation.rewardAmountUsd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {calculation.tpPips > 0 ? `(${calculation.tpPips.toFixed(1)} pips)` : 'TP not set'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                      <div className="text-gray-400 text-[11px]">Stop Loss Distance</div>
                      <div className="text-sm font-bold font-mono text-white mt-0.5">
                        {calculation.slPips.toFixed(1)} <span className="text-xs font-sans text-gray-400">Pips</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">Δ {calculation.slPriceDiff.toFixed(currentInstrument.pipDecimals)}</div>
                    </div>

                    <div className="p-3 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                      <div className="text-gray-400 text-[11px]">Risk / Reward</div>
                      <div className="text-sm font-bold font-mono text-purple-300 mt-0.5">
                        1 : {calculation.riskRewardRatio.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {calculation.riskRewardRatio >= 2 ? 'Optimal 1:2+' : 'Standard'}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Empty / Initial state matching screenshot */
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 text-gray-500">
                  <div className="w-12 h-12 rounded-2xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-gray-500">
                    <Calculator className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-medium">
                    Enter entry and stop loss to calculate
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            {calculation && (
              <div className="pt-3 border-t border-[#161826]">
                <button
                  onClick={handleCopyResults}
                  className="w-full py-2.5 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copy Calculated Trade Parameters</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Risk Management Card (Yellow / Amber outlined card from screenshot) */}
          <div className="bg-[#0b0c14] border border-[#f5a623]/35 rounded-3xl p-6 space-y-3.5 shadow-lg">
            <div className="flex items-center gap-2 text-[#f5a623] font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-white text-sm">Risk Management</h4>
            </div>

            <div className="space-y-2 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="flex items-start gap-2">
                <span className="text-[#f5a623] font-bold">•</span>
                <span>Risk 1–2% per trade maximum</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#f5a623] font-bold">•</span>
                <span>Always use stop loss protection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#f5a623] font-bold">•</span>
                <span>Target minimum 1:2 risk/reward</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#f5a623] font-bold">•</span>
                <span>Never risk more than you can afford to lose</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: How It Works */}
      <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white">How It Works</h3>
          <p className="text-xs text-gray-400">Understanding position size calculation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">
              Step 1
            </div>
            <div className="text-sm font-bold text-white">Risk Amount</div>
            <div className="text-xs font-mono text-gray-400">Balance × Risk %</div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">
              Step 2
            </div>
            <div className="text-sm font-bold text-white">Pip Distance</div>
            <div className="text-xs font-mono text-gray-400">|Entry − Stop Loss| ÷ Pip Size</div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">
              Step 3
            </div>
            <div className="text-sm font-bold text-white">Lot Size</div>
            <div className="text-xs font-mono text-gray-400">Risk Amount ÷ (Pips × Pip Value)</div>
          </div>

        </div>
      </div>
    </div>
  );
};
