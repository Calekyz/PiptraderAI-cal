import React, { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  decimals: number;
  change: number;
  changePercent: number;
  iconType: 'btc' | 'us30' | 'gold' | 'eur' | 'nas' | 'oil' | 'gbp' | 'jpy';
}

const INITIAL_ASSETS: MarketAsset[] = [
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    price: 67387.63,
    decimals: 2,
    change: -137.71,
    changePercent: -3.60,
    iconType: 'btc',
  },
  {
    symbol: 'US30',
    name: 'Wall Street 30 / Dow Jones',
    price: 53550.4,
    decimals: 1,
    change: 5.9,
    changePercent: 0.01,
    iconType: 'us30',
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    price: 4454.990,
    decimals: 3,
    change: -147.16,
    changePercent: -0.52,
    iconType: 'gold',
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.08425,
    decimals: 5,
    change: 0.00185,
    changePercent: 0.17,
    iconType: 'eur',
  },
  {
    symbol: 'NAS100',
    name: 'US Tech 100 / Nasdaq',
    price: 21450.8,
    decimals: 1,
    change: 188.4,
    changePercent: 0.89,
    iconType: 'nas',
  },
];

interface MarketPulseProps {
  onOpenFullMarket?: () => void;
  className?: string;
}

export const MarketPulse: React.FC<MarketPulseProps> = ({
  onOpenFullMarket,
  className = '',
}) => {
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [flashSymbol, setFlashSymbol] = useState<{ symbol: string; dir: 'up' | 'down' } | null>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  // Live market price fluctuation tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prevAssets) => {
        // Pick one asset to fluctuate slightly
        const targetIdx = Math.floor(Math.random() * prevAssets.length);
        return prevAssets.map((asset, idx) => {
          if (idx !== targetIdx) return asset;

          const tickDirection = Math.random() > 0.48 ? 1 : -1;
          const fluctuationPercent = (Math.random() * 0.08) * tickDirection;
          const delta = (asset.price * fluctuationPercent) / 100;
          const newPrice = Math.max(0.00001, asset.price + delta);
          const newChange = asset.change + delta;
          const newChangePercent = Number(((newChange / (asset.price - asset.change)) * 100).toFixed(2));

          setFlashSymbol({ symbol: asset.symbol, dir: tickDirection > 0 ? 'up' : 'down' });
          setTimeout(() => setFlashSymbol(null), 900);

          return {
            ...asset,
            price: Number(newPrice.toFixed(asset.decimals)),
            change: Number(newChange.toFixed(asset.decimals > 2 ? 3 : 2)),
            changePercent: newChangePercent,
          };
        });
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, decimals: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const renderIcon = (type: MarketAsset['iconType']) => {
    switch (type) {
      case 'btc':
        return (
          <div className="w-5 h-5 rounded-full bg-[#f7931a] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
            ₿
          </div>
        );
      case 'us30':
        return (
          <div className="w-5 h-5 rounded-full bg-[#00a3e0] text-white flex items-center justify-center text-[9.5px] font-extrabold shrink-0 shadow-xs tracking-tighter">
            30
          </div>
        );
      case 'gold':
        return (
          <div className="w-5 h-5 rounded-full bg-[#e5a919] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
              <path d="M4 17h16l-3-6H7l-3 6zm4-8h8l-2-4H10l-2 4z" />
            </svg>
          </div>
        );
      case 'eur':
        return (
          <div className="w-5 h-5 rounded-full bg-[#003399] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
            €
          </div>
        );
      case 'nas':
        return (
          <div className="w-5 h-5 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[9px] font-extrabold shrink-0 shadow-xs">
            NQ
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            $
          </div>
        );
    }
  };

  // Render a single asset card block
  const renderAssetCard = (asset: MarketAsset, indexKey: string) => {
    const isPositive = asset.change >= 0;
    const isFlashing = flashSymbol?.symbol === asset.symbol;
    const flashUp = isFlashing && flashSymbol?.dir === 'up';
    const flashDown = isFlashing && flashSymbol?.dir === 'down';

    return (
      <div
        key={indexKey}
        className={`w-[200px] sm:w-[220px] md:w-[240px] shrink-0 p-4 sm:p-4.5 flex flex-col justify-between border-r border-[#e2e8f0] dark:border-[#1e2235] transition-colors select-none ${
          flashUp
            ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
            : flashDown
            ? 'bg-rose-500/10 dark:bg-rose-500/15'
            : 'hover:bg-white/80 dark:hover:bg-[#111422]'
        }`}
      >
        {/* Asset Header: Icon + Ticker Symbol */}
        <div className="flex items-center gap-2 mb-2.5">
          {renderIcon(asset.iconType)}
          <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-[#f1f5f9] tracking-wide">
            {asset.symbol}
          </span>
        </div>

        {/* Current Price */}
        <div className="space-y-1">
          <div
            className={`text-lg sm:text-xl md:text-[22px] font-extrabold font-mono tracking-tight text-[#0f172a] dark:text-white transition-all ${
              flashUp
                ? 'text-emerald-600 dark:text-emerald-400 scale-[1.02]'
                : flashDown
                ? 'text-rose-600 dark:text-rose-400 scale-[1.02]'
                : ''
            }`}
          >
            {formatPrice(asset.price, asset.decimals)}
          </div>

          {/* Price Change & Percentage */}
          <div
            className={`text-xs sm:text-[13px] font-bold font-mono transition-colors ${
              isPositive
                ? 'text-emerald-600 dark:text-[#00d084]'
                : 'text-rose-600 dark:text-[#ff4b58]'
            }`}
          >
            {isPositive ? '+' : ''}
            {formatPrice(asset.change, asset.decimals > 2 ? 3 : 2)} ({isPositive ? '+' : ''}
            {asset.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="market-pulse-redesigned-section"
      className={`w-full rounded-2xl bg-white dark:bg-[#07090e] border border-[#e2e8f0] dark:border-[#171926] p-5 md:p-6 shadow-xs dark:shadow-xl space-y-4 transition-all ${className}`}
    >
      {/* Header section matching screenshot */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {/* Chart Grid Icon */}
            <div className="w-6 h-6 rounded-lg bg-white dark:bg-[#0f111c] border border-gray-200 dark:border-[#222638] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                {/* Grid lines */}
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" className="text-gray-300 dark:text-[#252a40]" strokeWidth="0.8" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" className="text-gray-300 dark:text-[#252a40]" strokeWidth="0.8" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" className="text-gray-300 dark:text-[#252a40]" strokeWidth="0.8" />
                <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" className="text-gray-300 dark:text-[#252a40]" strokeWidth="0.8" />
                <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" className="text-gray-300 dark:text-[#252a40]" strokeWidth="0.8" />
                {/* Upward red line */}
                <path d="M4 18 L10 14 L15 17 L20 6" fill="none" stroke="#ff4b58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Market Pulse</span>
              <span className="text-[10.5px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 font-bold tracking-wider">
                LIVE
              </span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#64748b] dark:text-[#8e99ac] font-normal pl-8.5">
            Real-time market updates
          </p>
        </div>

        {/* Hover / Auto-scroll indicator badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#64748b] dark:text-gray-400 bg-gray-50 dark:bg-[#0c0e18] px-2.5 py-1 rounded-lg border border-[#e2e8f0] dark:border-[#1c2035]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hover to pause</span>
        </div>
      </div>

      {/* Continuously Scrolling Marquee Ticker with Infinite Loop & Pause on Hover */}
      <div 
        className="ticker-wrapper relative w-full rounded-xl bg-gray-50/70 dark:bg-[#0c0e18] border border-[#e2e8f0] dark:border-[#1a1d2e] overflow-hidden shadow-2xs group"
      >
        {/* Subtle Edge Vignette Fade Effects */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-8 z-10 bg-gradient-to-r from-gray-50/90 dark:from-[#0c0e18] to-transparent" />
        <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-50/90 dark:from-[#0c0e18] to-transparent" />

        {/* Animated Marquee Strip (Duplicated sets side-by-side for infinite seamless loop) */}
        <div 
          className="animate-ticker flex items-stretch"
          style={{
            animationPlayState: isPausedByUser ? 'paused' : undefined,
          }}
        >
          {/* Primary Set 1 */}
          <div className="flex items-stretch">
            {assets.map((asset, idx) => renderAssetCard(asset, `set1-${asset.symbol}-${idx}`))}
          </div>

          {/* Secondary Duplicate Set 2 (seamless infinite loop) */}
          <div className="flex items-stretch" aria-hidden="true">
            {assets.map((asset, idx) => renderAssetCard(asset, `set2-${asset.symbol}-${idx}`))}
          </div>

          {/* Tertiary Duplicate Set 3 (ensures zero gaps on ultra-wide screens) */}
          <div className="flex items-stretch" aria-hidden="true">
            {assets.map((asset, idx) => renderAssetCard(asset, `set3-${asset.symbol}-${idx}`))}
          </div>
        </div>
      </div>

      {/* Action button: Open Full Market Page matching screenshot */}
      <div className="pt-1 flex items-center justify-between">
        <button
          id="open-full-market-page-btn"
          onClick={onOpenFullMarket}
          className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0e101b] hover:bg-gray-200 dark:hover:bg-[#161a2b] border border-gray-200 dark:border-[#22273e] text-xs sm:text-sm font-semibold text-[#0f172a] dark:text-white transition-all cursor-pointer shadow-xs active:scale-98 inline-flex items-center gap-2"
        >
          <span>Open Full Market Page</span>
        </button>

        <span className="text-[11px] font-mono text-[#64748b] dark:text-gray-500">
          5 Instruments • Real-Time Feed
        </span>
      </div>
    </div>
  );
};
