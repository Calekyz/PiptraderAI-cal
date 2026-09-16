import React, { useEffect, useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  decimals: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down';
  tradingViewSlug: string;
  category: 'Commodities' | 'Forex' | 'Crypto' | 'Indices';
}

const INITIAL_INSTRUMENTS: MarketTickerItem[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    price: 4454.990,
    decimals: 3,
    change: -147.155,
    changePercent: -3.20,
    direction: 'down',
    tradingViewSlug: 'XAUUSD',
    category: 'Commodities'
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.15821,
    decimals: 5,
    change: -0.00700,
    changePercent: -0.60,
    direction: 'down',
    tradingViewSlug: 'EURUSD',
    category: 'Forex'
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    price: 1.35370,
    decimals: 5,
    change: -0.01170,
    changePercent: -0.86,
    direction: 'down',
    tradingViewSlug: 'GBPUSD',
    category: 'Forex'
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    price: 78121.48,
    decimals: 2,
    change: -282.29,
    changePercent: -0.36,
    direction: 'down',
    tradingViewSlug: 'BTCUSD',
    category: 'Crypto'
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial Average',
    price: 53554.4,
    decimals: 1,
    change: -9.9,
    changePercent: -0.02,
    direction: 'down',
    tradingViewSlug: 'DJI',
    category: 'Indices'
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    price: 159.82,
    decimals: 2,
    change: -0.42,
    changePercent: -0.26,
    direction: 'down',
    tradingViewSlug: 'USDJPY',
    category: 'Forex'
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    price: 2445.80,
    decimals: 2,
    change: 18.50,
    changePercent: 0.76,
    direction: 'up',
    tradingViewSlug: 'ETHUSD',
    category: 'Crypto'
  },
  {
    symbol: 'WTIUSD',
    name: 'Crude Oil / US Dollar',
    price: 83.40,
    decimals: 2,
    change: 0.65,
    changePercent: 0.78,
    direction: 'up',
    tradingViewSlug: 'USOIL',
    category: 'Commodities'
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    price: 1.37850,
    decimals: 5,
    change: -0.00120,
    changePercent: -0.09,
    direction: 'down',
    tradingViewSlug: 'USDCAD',
    category: 'Forex'
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    price: 0.65420,
    decimals: 5,
    change: 0.00180,
    changePercent: 0.28,
    direction: 'up',
    tradingViewSlug: 'AUDUSD',
    category: 'Forex'
  }
];

interface ForexTickerProps {
  className?: string;
  onSelectSymbol?: (symbol: string) => void;
}

export const ForexTicker: React.FC<ForexTickerProps> = ({
  className = '',
  onSelectSymbol
}) => {
  const [instruments, setInstruments] = useState<MarketTickerItem[]>(INITIAL_INSTRUMENTS);

  // 1. Fetch live quotes from API periodically
  const fetchLiveQuotes = async () => {
    try {
      const symbolsQuery = 'XAU/USD,EUR/USD,GBP/USD,BTC/USD,US30,USD/JPY,ETH/USD,WTI/USD,USD/CAD,AUD/USD';
      const res = await fetch(`/api/market-data/quotes?symbols=${encodeURIComponent(symbolsQuery)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.quotes) && data.quotes.length > 0) {
        setInstruments((prev) => {
          return prev.map((item) => {
            const clean = item.symbol.toUpperCase();
            const matched = data.quotes.find((q: any) => {
              const qSym = (q.symbol || '').replace('/', '').toUpperCase();
              return qSym === clean || qSym.includes(clean) || clean.includes(qSym);
            });

            if (matched && matched.price) {
              const isPos = matched.change >= 0;
              return {
                ...item,
                price: matched.price,
                change: matched.change !== undefined ? matched.change : item.change,
                changePercent: matched.changePercent !== undefined ? matched.changePercent : item.changePercent,
                direction: isPos ? 'up' : 'down'
              };
            }
            return item;
          });
        });
      }
    } catch {
      // Continue gracefully
    }
  };

  // 2. Realistic micro-fluctuation every 3 seconds to simulate live TradingView WebSocket ticks
  useEffect(() => {
    fetchLiveQuotes();
    const apiInterval = setInterval(fetchLiveQuotes, 6000);

    const tickInterval = setInterval(() => {
      setInstruments((prev) =>
        prev.map((inst) => {
          // Select 2 random instruments per tick cycle to fluctuate
          if (Math.random() > 0.45) return inst;

          const volatilityFactor = inst.price > 1000 ? 0.0002 : (inst.price > 100 ? 0.0003 : 0.0001);
          const delta = (Math.random() - 0.49) * inst.price * volatilityFactor;
          const newPrice = Math.max(0.0001, inst.price + delta);
          const newChange = inst.change + delta;
          const newPercent = (newChange / (newPrice - newChange)) * 100;
          const isPos = newChange >= 0;

          return {
            ...inst,
            price: Number(newPrice.toFixed(inst.decimals)),
            change: Number(newChange.toFixed(inst.decimals)),
            changePercent: Number(newPercent.toFixed(2)),
            direction: isPos ? 'up' : 'down'
          };
        })
      );
    }, 3000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const formatPrice = (price: number, decimals: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatChange = (change: number, decimals: number) => {
    const prefix = change > 0 ? '+' : '';
    return prefix + change.toFixed(decimals);
  };

  const formatPercent = (percent: number) => {
    const prefix = percent > 0 ? '+' : '';
    return `(${prefix}${percent.toFixed(2)}%)`;
  };

  const handleInstrumentClick = (item: MarketTickerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectSymbol) {
      onSelectSymbol(item.symbol);
    }
    // Navigate directly to the specific market page on TradingView in a clean tab
    const tradingViewUrl = `https://www.tradingview.com/symbols/${item.tradingViewSlug}/`;
    window.open(tradingViewUrl, '_blank', 'noopener,noreferrer');
  };

  const renderTickerItem = (item: MarketTickerItem, index: number, prefix: string) => {
    const isPositive = item.direction === 'up' || item.change >= 0;

    return (
      <button
        key={`${prefix}-${item.symbol}-${index}`}
        id={`ticker-item-${item.symbol.toLowerCase()}-${prefix}`}
        onClick={(e) => handleInstrumentClick(item, e)}
        title={`Click to view live ${item.symbol} on TradingView`}
        className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold tracking-tight transition-all duration-150 select-none cursor-pointer group hover:bg-[#1f2438] rounded-md mx-1"
      >
        {/* Symbol */}
        <span className="text-white font-bold group-hover:text-[#00bcd4] transition-colors">
          {item.symbol}
        </span>

        {/* Middle Dot Separator */}
        <span className="text-gray-500 font-normal">·</span>

        {/* Current Price */}
        <span className="text-[#d1d4dc] font-bold tabular-nums">
          {formatPrice(item.price, item.decimals)}
        </span>

        {/* Absolute Change & Percentage Change with color coding */}
        <span
          className={`inline-flex items-center gap-1 font-bold tabular-nums ${
            isPositive
              ? 'text-[#00bcd4]' // Green cyan (#00bcd4)
              : 'text-[#f23645]' // Red (#f23645)
          }`}
        >
          <span>{formatChange(item.change, item.decimals)}</span>
          <span>{formatPercent(item.changePercent)}</span>
          <span className="text-[11px] leading-none ml-0.5">
            {isPositive ? '▲' : '▼'}
          </span>
        </span>

        {/* Subtle TradingView Indicator Icon on hover */}
        <ExternalLink className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
      </button>
    );
  };

  return (
    <div
      id="gemina-continuous-market-ticker"
      className={`w-full bg-[#0b0e11] border-b border-[#2a2e39] relative overflow-hidden select-none z-20 transition-colors ticker-wrapper ${className}`}
    >
      <div className="w-full flex items-center relative py-1.5 sm:py-2">
        {/* Left Fixed Badge: LIVE INDICATOR */}
        <div className="absolute left-0 top-0 bottom-0 z-30 bg-[#0b0e11]/95 backdrop-blur-xs pl-3 pr-3 sm:pr-4 flex items-center gap-2 border-r border-[#2a2e39] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00bcd4] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00bcd4]"></span>
          </span>
          <span className="text-[11px] font-bold text-[#d1d4dc] uppercase tracking-wider hidden xs:inline">
            Live
          </span>
        </div>

        {/* Infinite Scrolling Marquee Track (Seamless Single Bar Marquee) */}
        <div className="flex-1 overflow-hidden ml-16 sm:ml-20">
          <div className="animate-ticker flex items-center whitespace-nowrap">
            {/* Track 1 */}
            <div className="flex items-center shrink-0">
              {instruments.map((item, idx) => renderTickerItem(item, idx, 'track-1'))}
            </div>

            {/* Track 2 (Exact Duplicate for Seamless 0-jump Loop) */}
            <div className="flex items-center shrink-0">
              {instruments.map((item, idx) => renderTickerItem(item, idx, 'track-2'))}
            </div>
          </div>
        </div>

        {/* Right Subtle Fade Edge */}
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-[#0b0e11] to-transparent z-20" />
      </div>
    </div>
  );
};
