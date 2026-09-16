import React, { useEffect, useRef, useState, memo } from 'react';
import { Sparkles, Maximize2, ExternalLink, RefreshCw } from 'lucide-react';

export interface TradingViewChartProps {
  symbol?: string; // e.g. "OANDA:XAUUSD", "OANDA:XAGUSD", "FX:EURUSD", "XAU/USD", "XAG/USD"
  interval?: string; // e.g. "1", "5", "15", "30", "60", "240", "D", "W"
  theme?: 'dark' | 'light';
  chartStyle?: number; // 1 = Candlesticks, 2 = Line, 3 = Area, 0 = Bars, 8 = Heikin Ashi
  autosize?: boolean;
  height?: string | number;
  width?: string | number;
  hideSideToolbar?: boolean;
  withDateRanges?: boolean;
  allowSymbolChange?: boolean;
  showDetails?: boolean;
  studies?: string[];
  className?: string;
  onSymbolChange?: (symbol: string) => void;
}

/**
 * Maps standard user ticker strings to TradingView formatted tickers
 */
export function formatToTvSymbol(symbol: string): string {
  if (!symbol) return 'OANDA:XAUUSD';
  const clean = symbol.trim().toUpperCase();
  if (clean.includes(':')) return clean;

  const raw = clean.replace('/', '').replace('-', '').replace(' ', '');

  // Metals & Commodities (matching Screenshot 2: Gold Spot / U.S. Dollar OANDA)
  if (raw === 'XAUUSD' || clean.includes('GOLD')) return 'OANDA:XAUUSD';
  if (raw === 'XAGUSD' || clean.includes('SILVER')) return 'OANDA:XAGUSD';
  if (raw === 'USOIL' || raw === 'WTIUSD' || clean.includes('CRUDE')) return 'TVC:USOIL';
  if (raw === 'UKOIL' || raw === 'BRENT') return 'TVC:UKOIL';
  if (raw === 'COPPER' || raw === 'HG1!') return 'COMEX:HG1!';
  if (raw === 'NATGAS' || raw === 'NG1!') return 'NYMEX:NG1!';

  // Major Forex Pairs
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'EURAUD', 'GBPAUD'];
  if (forexPairs.includes(raw)) return `FX:${raw}`;

  // Crypto
  if (raw === 'BTCUSD' || raw === 'BTCUSDT' || clean.includes('BITCOIN')) return 'BINANCE:BTCUSDT';
  if (raw === 'ETHUSD' || raw === 'ETHUSDT' || clean.includes('ETHEREUM')) return 'BINANCE:ETHUSDT';
  if (raw === 'SOLUSD' || raw === 'SOLUSDT' || clean.includes('SOLANA')) return 'BINANCE:SOLUSDT';
  if (raw === 'XRPUSD' || raw === 'XRPUSDT') return 'BINANCE:XRPUSDT';
  if (raw === 'DOGEUSD' || raw === 'DOGEUSDT') return 'BINANCE:DOGEUSDT';

  // Indices
  if (raw === 'SPX500' || raw === 'US500' || raw === 'SPX') return 'FOREXCOM:SPX500';
  if (raw === 'US30' || raw === 'DJI' || raw === 'DOW') return 'FOREXCOM:DJI';
  if (raw === 'NAS100' || raw === 'NDX' || raw === 'USTEC') return 'FOREXCOM:NSXUSD';
  if (raw === 'GER40' || raw === 'DAX') return 'FOREXCOM:GER40';
  if (raw === 'UK100' || raw === 'FTSE') return 'FOREXCOM:UK100';

  // Stocks
  const stocks = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META'];
  if (stocks.includes(raw)) return `NASDAQ:${raw}`;

  return `OANDA:${raw}`;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({
  symbol = 'OANDA:XAUUSD',
  interval = '60',
  theme = 'light',
  chartStyle = 1,
  autosize = true,
  height = '100%',
  width = '100%',
  hideSideToolbar = false,
  withDateRanges = true,
  allowSymbolChange = true,
  showDetails = true,
  studies = ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formattedSymbol = formatToTvSymbol(symbol);
  const isLight = theme === 'light';
  const containerId = useRef(`tv_chart_${Math.random().toString(36).substring(2, 9)}`).current;

  // Convert standard intervals (e.g. M15 -> 15, H1 -> 60, D1 -> D)
  const tvInterval = (() => {
    const i = interval.toUpperCase();
    if (i === 'M1' || i === '1M') return '1';
    if (i === 'M5' || i === '5M') return '5';
    if (i === 'M15' || i === '15M') return '15';
    if (i === 'M30' || i === '30M') return '30';
    if (i === 'H1' || i === '1H' || i === '60') return '60';
    if (i === 'H4' || i === '4H' || i === '240') return '240';
    if (i === 'D1' || i === '1D' || i === 'D') return 'D';
    if (i === 'W1' || i === '1W' || i === 'W') return 'W';
    return interval;
  })();

  // Embed URL for real-time TradingView widget matching Screenshot 2
  const tvEmbedUrl = `https://s.tradingview.com/widgetembed/?frameElementId=${containerId}_frame&symbol=${encodeURIComponent(
    formattedSymbol
  )}&interval=${tvInterval}&hidesidetoolbar=${hideSideToolbar ? '1' : '0'}&symboledit=${
    allowSymbolChange ? '1' : '0'
  }&saveimage=1&toolbarbg=${isLight ? 'ffffff' : '07080d'}&studies=${encodeURIComponent(
    JSON.stringify(studies)
  )}&theme=${isLight ? 'light' : 'dark'}&style=${chartStyle}&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&locale=en`;

  return (
    <div 
      className={`tradingview-widget-container w-full h-full relative overflow-hidden flex flex-col transition-colors duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'bg-[#07080d] text-white'
      } ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height, width: typeof width === 'number' ? `${width}px` : width }}
    >
      {/* TradingView Live Chart Frame */}
      <div 
        id={containerId} 
        ref={containerRef} 
        className="w-full flex-1 min-h-[500px] h-full relative"
      >
        <iframe
          key={`${formattedSymbol}-${tvInterval}-${theme}-${chartStyle}`}
          id={`${containerId}_frame`}
          src={tvEmbedUrl}
          title={`TradingView Advanced Live Chart for ${formattedSymbol}`}
          className="w-full h-full border-0 absolute inset-0 min-h-[520px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
