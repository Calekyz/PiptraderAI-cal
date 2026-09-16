import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Clock,
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Share2,
  CheckCircle2,
  X,
  Radio,
  Flame,
  BarChart2,
  Newspaper,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { MacroEvent } from '../../types';

export interface FFNewsItem {
  id: string;
  title: string;
  headline: string;
  source: string;
  author: string;
  authorAvatar?: string;
  publishedAt: string;
  category: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  colorCode: 'red' | 'yellow' | 'blue';
  summary: string;
  content: string;
  affectedPairs: string[];
  tags: string[];
  url: string;
  readTime: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  commentsCount: number;
  viewsCount: number;
}

export interface FFCalendarRow {
  eventId: string;
  id: string;
  title: string;
  country: string;
  countryFlag: string;
  currency: string;
  impactLevel: 'High' | 'Medium' | 'Low' | 'Non-Economic' | 'Holiday';
  colorCode: 'red' | 'yellow' | 'blue' | 'gray';
  dateTime: string;
  date: string;
  time: string;
  dayDate: string;
  dayName: string;
  formattedDate: string;
  timeZone: string;
  timestamp: number;
  countdown: string;
  actual?: string;
  forecast: string;
  previous: string;
  consensus: string;
  betterThanForecast?: 'better' | 'worse' | 'neutral' | 'pending';
  description: string;
  detail: string;
  affectedPairs: string[];
  bias: string;
  history?: Array<{
    date: string;
    actual: string;
    forecast: string;
    previous: string;
  }>;
}

export interface FFMarketItem {
  symbol: string;
  name: string;
  category: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down';
  high24h: number;
  low24h: number;
  bullishSentiment: number;
  bearishSentiment: number;
  dailyVolume: string;
  trend: string;
}

// Supported timezones with user friendly labels and offsets
export const TIMEZONE_OPTIONS = [
  { id: 'local', label: 'Local Time (Browser Detected)', tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  { id: 'America/New_York', label: 'New York (EDT/EST, ForexFactory Default)', tz: 'America/New_York' },
  { id: 'Europe/London', label: 'London (GMT / BST)', tz: 'Europe/London' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time)', tz: 'UTC' },
  { id: 'Africa/Nairobi', label: 'Nairobi / East Africa (EAT, UTC+3)', tz: 'Africa/Nairobi' },
  { id: 'Europe/Paris', label: 'Frankfurt / Paris (CET, UTC+1)', tz: 'Europe/Paris' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST, UTC+9)', tz: 'Asia/Tokyo' },
  { id: 'Asia/Singapore', label: 'Singapore / HK (SGT, UTC+8)', tz: 'Asia/Singapore' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST, UTC+10)', tz: 'Australia/Sydney' },
];

export const CATEGORIES_LIST = [
  'All News',
  'Forex News',
  'Economic Calendar',
  'Technical Analysis',
  'Fundamental Analysis',
  'Central Bank News',
  'Market Sentiment',
  'Major Currency Pairs',
  'Commodities',
  'Cryptocurrency'
] as const;

interface ForexFactoryNewsViewProps {
  onOpenMacroAnalysis?: (event: MacroEvent) => void;
  onNavigateToChart?: (pair: string) => void;
}

export const ForexFactoryNewsView: React.FC<ForexFactoryNewsViewProps> = ({
  onOpenMacroAnalysis,
  onNavigateToChart
}) => {
  // 1. Timezone & Time Filters State
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    localStorage.getItem('pipnex_ff_timezone') || 'America/New_York'
  );
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'thisweek' | 'nextweek' | 'all'>('thisweek');

  // 2. Navigation Category Tab State
  const [activeCategory, setActiveCategory] = useState<string>('All News');

  // 3. Calendar & Search Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['High', 'Medium', 'Low', 'Non-Economic']);

  // 4. Data states
  const [newsArticles, setNewsArticles] = useState<FFNewsItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<FFCalendarRow[]>([]);
  const [marketQuotes, setMarketQuotes] = useState<FFMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // 5. Modals State
  const [selectedArticle, setSelectedArticle] = useState<FFNewsItem | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<FFCalendarRow | null>(null);

  // Persist timezone preference
  const handleTimezoneChange = (tz: string) => {
    setSelectedTimezone(tz);
    localStorage.setItem('pipnex_ff_timezone', tz);
  };

  // Fetch all live data from backend ForexFactory Engine
  const loadAllData = async () => {
    try {
      setIsRefreshing(true);
      const period = dateFilter === 'nextweek' ? 'nextweek' : 'thisweek';

      const [calRes, newsRes, quotesRes] = await Promise.all([
        fetch(`/api/forex-factory/calendar?period=${period}`),
        fetch(`/api/forex-factory/news?category=${encodeURIComponent(activeCategory)}`),
        fetch('/api/forex-factory/market-overview')
      ]);

      if (calRes.ok) {
        const calData = await calRes.json();
        if (calData.events) setCalendarEvents(calData.events);
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.articles) setNewsArticles(newsData.articles);
      }

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        if (quotesData.quotes) setMarketQuotes(quotesData.quotes);
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error fetching ForexFactory live feed:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dateFilter, activeCategory]);

  // Real-time dynamic Timezone conversion utility
  const formatTimeInTimezone = (isoOrDateStr: string | number, tz: string): { time: string; dateStr: string; full: string } => {
    try {
      const date = new Date(isoOrDateStr);
      if (isNaN(date.getTime())) {
        return { time: 'All Day', dateStr: 'Today', full: 'All Day' };
      }

      const targetTz = tz === 'local' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : tz;

      const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: targetTz
      }).toLowerCase();

      const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: targetTz
      });

      return { time: timeFormatted, dateStr: dateFormatted, full: `${dateFormatted} ${timeFormatted}` };
    } catch {
      return { time: 'Scheduled', dateStr: 'Today', full: 'Scheduled' };
    }
  };

  // Convert and filter calendar events – only shows events from today’s UTC date onwards
  const processedCalendarEvents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const now = new Date();
    const currentUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();

    return calendarEvents.filter(evt => {
      // 🔥 CRITICAL: Remove any event whose date is strictly before today's UTC midnight
      if (evt.dateTime || evt.date) {
        const evtDate = new Date(evt.dateTime || evt.date);
        if (!isNaN(evtDate.getTime())) {
          const evtUtcMidnight = new Date(Date.UTC(evtDate.getUTCFullYear(), evtDate.getUTCMonth(), evtDate.getUTCDate())).getTime();
          if (evtUtcMidnight < currentUtcMidnight) {
            return false; // past event – hidden
          }
        }
      }

      // 1. Currency filter
      if (selectedCurrency !== 'ALL' && evt.currency !== selectedCurrency) {
        return false;
      }

      // 2. Impact filter
      const imp = evt.impactLevel === 'Holiday' ? 'Non-Economic' : evt.impactLevel;
      if (!selectedImpacts.includes(imp)) {
        return false;
      }

      // 3. Search query
      if (query) {
        const titleMatch = (evt.title || '').toLowerCase().includes(query);
        const currMatch = (evt.currency || '').toLowerCase().includes(query);
        const countryMatch = (evt.country || '').toLowerCase().includes(query);
        if (!titleMatch && !currMatch && !countryMatch) return false;
      }

      // 4. Additional date filter (today/tomorrow) – applied after the UTC check
      if (dateFilter === 'today') {
        const evtDate = new Date(evt.dateTime || evt.date);
        if (!isNaN(evtDate.getTime())) {
          const evtUtcMidnight = new Date(Date.UTC(evtDate.getUTCFullYear(), evtDate.getUTCMonth(), evtDate.getUTCDate())).getTime();
          if (evtUtcMidnight !== currentUtcMidnight) return false;
        }
      } else if (dateFilter === 'tomorrow') {
        const tomorrowUtcMidnight = currentUtcMidnight + 86400000;
        const evtDate = new Date(evt.dateTime || evt.date);
        if (!isNaN(evtDate.getTime())) {
          const evtUtcMidnight = new Date(Date.UTC(evtDate.getUTCFullYear(), evtDate.getUTCMonth(), evtDate.getUTCDate())).getTime();
          if (evtUtcMidnight !== tomorrowUtcMidnight) return false;
        }
      }

      return true;
    });
  }, [calendarEvents, selectedCurrency, selectedImpacts, searchQuery, selectedTimezone, dateFilter]);

  // Group events by day in the selected timezone
  const groupedCalendarEvents = useMemo(() => {
    const groups: Record<string, FFCalendarRow[]> = {};
    for (const evt of processedCalendarEvents) {
      const converted = formatTimeInTimezone(evt.dateTime || evt.date, selectedTimezone);
      const key = converted.dateStr || evt.dayDate || 'Upcoming Economic Events';
      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    }
    return groups;
  }, [processedCalendarEvents, selectedTimezone]);

  // Impact folder icon helper
  const renderImpactFolder = (impact: FFCalendarRow['impactLevel']) => {
    switch (impact) {
      case 'High':
        return (
          <div title="High Impact Expected (Red Folder)" className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#e11d48] text-white shadow-xs">
            <div className="w-2.5 h-1.5 border-t border-white/70 -mt-0.5" />
          </div>
        );
      case 'Medium':
        return (
          <div title="Medium Impact Expected (Orange Folder)" className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#ea580c] text-white shadow-xs">
            <div className="w-2.5 h-1.5 border-t border-white/70 -mt-0.5" />
          </div>
        );
      case 'Low':
        return (
          <div title="Low Impact Expected (Yellow Folder)" className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#eab308] text-gray-900 shadow-xs">
            <div className="w-2.5 h-1.5 border-t border-black/30 -mt-0.5" />
          </div>
        );
      case 'Non-Economic':
      case 'Holiday':
      default:
        return (
          <div title="Non-Economic / Bank Holiday (Grey Folder)" className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-gray-300 text-gray-700 shadow-xs">
            <div className="w-2.5 h-1.5 border-t border-black/20 -mt-0.5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-[1600px] mx-auto pb-16">
      
      {/* 1. TOP HEADER & TIME CHANGE BAR */}
      <div className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#171a27]">
          
          {/* Brand & Section Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#f0edfe] dark:bg-[#18152e] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-[#0f172a] dark:text-white tracking-tight font-mono">
                  ForexFactory News &amp; Calendar
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Official Feed
                </span>
              </div>
              <p className="text-xs text-[#64748b] dark:text-slate-400">
                Real-time economic releases, macroeconomic breaking news, impact ratings, and multi-timezone synchronization.
              </p>
            </div>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="ff-refresh-btn"
              onClick={loadAllData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#141624] hover:bg-gray-100 dark:hover:bg-[#1c2035] text-xs font-semibold text-[#0f172a] dark:text-white border border-[#e5e7eb] dark:border-[#22273d] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#5b3fe4]' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync ForexFactory'}</span>
            </button>

            <a
              href="https://www.forexfactory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#5b3fe4]/10 hover:bg-[#5b3fe4]/20 text-xs font-bold text-[#5b3fe4] dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 transition-colors"
            >
              <span>ForexFactory.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. TIME CHANGE & TIMEZONE CONTROL PANEL (CRITICAL USER REQUIREMENT) */}
        <div 
          id="forexfactory-time-change-panel"
          className="p-4 rounded-2xl bg-[#fafafa] dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1e2238] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          {/* Timezone Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a] dark:text-white">
              <Clock className="w-4 h-4 text-[#5b3fe4]" />
              <span>TIME CHANGE / TIMEZONE:</span>
            </div>

            <div className="relative">
              <select
                id="ff-timezone-select"
                value={selectedTimezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white dark:bg-[#181a2e] border border-purple-300 dark:border-purple-500/40 rounded-xl px-3.5 py-2 pr-9 text-xs font-semibold text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b3fe4] shadow-xs cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="text-[11px] text-[#64748b] dark:text-slate-400 font-mono">
              Current Zone: <strong className="text-[#5b3fe4] dark:text-purple-300 font-bold">{selectedTimezone}</strong>
            </div>
          </div>

          {/* Date Range / Period Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#475569] dark:text-slate-300 mr-1 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> Date:
            </span>
            {(['today', 'tomorrow', 'thisweek', 'nextweek', 'all'] as const).map((filterKey) => {
              const labels: Record<string, string> = {
                today: 'Today',
                tomorrow: 'Tomorrow',
                thisweek: 'This Week',
                nextweek: 'Next Week',
                all: 'All Upcoming'
              };

              const isActive = dateFilter === filterKey;

              return (
                <button
                  key={filterKey}
                  id={`ff-date-filter-${filterKey}`}
                  onClick={() => setDateFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5b3fe4] text-white shadow-xs'
                      : 'bg-white dark:bg-[#181a2e] border border-[#e5e7eb] dark:border-[#22273d] text-[#475569] dark:text-slate-300 hover:border-purple-300'
                  }`}
                >
                  {labels[filterKey]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 10 CATEGORIES HORIZONTAL NAVIGATION TABS (ALL CLICKABLE & FUNCTIONAL) */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider font-mono">
            News Categories &amp; Feeds:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
            {CATEGORIES_LIST.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  id={`ff-category-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] shadow-xs scale-102'
                      : 'bg-[#f1f5f9] dark:bg-[#131627] text-[#475569] dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#1a1e34]'
                  }`}
                >
                  {cat === 'Economic Calendar' && '📅 '}
                  {cat === 'Central Bank News' && '🏛️ '}
                  {cat === 'Market Sentiment' && '📊 '}
                  {cat === 'Commodities' && '🪙 '}
                  {cat === 'Cryptocurrency' && '₿ '}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. LIVE MARKET SENTIMENT & QUOTES STRIP */}
      <div className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#171a27] mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-extrabold text-[#0f172a] dark:text-white uppercase tracking-wider font-mono">
              Live ForexFactory Market Overview &amp; Sentiment
            </span>
          </div>
          <span className="text-[11px] text-[#64748b] dark:text-slate-400 font-mono">
            Updated: {lastRefreshedAt.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {marketQuotes.map((q) => {
            const isUp = q.direction === 'up' || q.change >= 0;
            return (
              <div
                key={q.symbol}
                id={`market-quote-${q.symbol.replace('/', '')}`}
                onClick={() => onNavigateToChart && onNavigateToChart(q.symbol)}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1c2035] hover:border-[#5b3fe4] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f172a] dark:text-white group-hover:text-[#5b3fe4] font-mono">
                    {q.symbol}
                  </span>
                  <span className={`text-[10px] font-bold font-mono ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#0f172a] dark:text-white font-mono mt-1">
                  {q.price > 100 ? q.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : q.price.toFixed(4)}
                </div>
                <div className="mt-1.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[9px] text-[#64748b] font-mono">
                    <span>Bull: {q.bullishSentiment}%</span>
                    <span>Bear: {q.bearishSentiment}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-rose-200 dark:bg-rose-950 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${q.bullishSentiment}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MAIN CONTENT SPLIT: ECONOMIC CALENDAR VIEW vs NEWS ARTICLES GRID */}
      {activeCategory === 'Economic Calendar' ? (
        /* ECONOMIC CALENDAR VIEW (FULL FOREXFACTORY FORMAT) */
        <div className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
          
          {/* Calendar Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#171a27]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="ff-cal-search-input"
                  type="text"
                  placeholder="Search events (e.g. NFP, CPI, Powell)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#141624] border border-[#e5e7eb] dark:border-[#22273d] text-[#0f172a] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#5b3fe4] w-64"
                />
              </div>

              {/* Currency Pills */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF'].map((curr) => (
                  <button
                    key={curr}
                    id={`ff-curr-${curr}`}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                      selectedCurrency === curr
                        ? 'bg-[#5b3fe4] text-white'
                        : 'bg-gray-100 dark:bg-[#181a2e] text-[#475569] dark:text-slate-400 hover:bg-gray-200'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Toggles */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#64748b] dark:text-slate-400 mr-1 font-mono">Impact:</span>
              {[
                { id: 'High', label: 'High', color: 'bg-rose-500' },
                { id: 'Medium', label: 'Med', color: 'bg-amber-500' },
                { id: 'Low', label: 'Low', color: 'bg-yellow-400' },
                { id: 'Non-Economic', label: 'Non-Econ', color: 'bg-gray-400' },
              ].map((imp) => {
                const isSelected = selectedImpacts.includes(imp.id);
                return (
                  <button
                    key={imp.id}
                    id={`ff-impact-${imp.id}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedImpacts(selectedImpacts.filter(i => i !== imp.id));
                      } else {
                        setSelectedImpacts([...selectedImpacts, imp.id]);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gray-100 dark:bg-[#1a1e34] border border-[#e5e7eb] dark:border-[#2a304e] text-[#0f172a] dark:text-white'
                        : 'opacity-40 line-through text-gray-400'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${imp.color}`} />
                    <span>{imp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Table by Day */}
          <div className="space-y-6">
            {Object.keys(groupedCalendarEvents).length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm font-semibold">No calendar events found matching your current filters.</p>
              </div>
            ) : (
              Object.entries(groupedCalendarEvents).map(([dayTitle, dayEvents]) => (
                <div key={dayTitle} className="space-y-2">
                  {/* Day Date Header in Selected Timezone */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#141628] border border-gray-200 dark:border-[#1e2238]">
                    <div className="flex items-center gap-2 font-mono font-black text-xs text-[#0f172a] dark:text-white">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#5b3fe4]" />
                      <span>{dayTitle}</span>
                    </div>
                    <span className="text-[11px] text-[#64748b] dark:text-slate-400 font-mono">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} ({selectedTimezone})
                    </span>
                  </div>

                  {/* Events Table Container */}
                  <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb] dark:border-[#1a1e30]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#0e101c] border-b border-[#e5e7eb] dark:border-[#1a1e30] text-[#64748b] dark:text-slate-400 font-mono text-[11px]">
                          <th className="py-2.5 px-3 font-bold w-24">TIME ({selectedTimezone.split('/')[1] || selectedTimezone})</th>
                          <th className="py-2.5 px-2 font-bold w-14">CURR</th>
                          <th className="py-2.5 px-2 font-bold w-12 text-center">IMPACT</th>
                          <th className="py-2.5 px-3 font-bold">EVENT / RELEASE</th>
                          <th className="py-2.5 px-3 font-bold text-right w-20">ACTUAL</th>
                          <th className="py-2.5 px-3 font-bold text-right w-20">FORECAST</th>
                          <th className="py-2.5 px-3 font-bold text-right w-20">PREVIOUS</th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">ANALYSIS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#171a27]">
                        {dayEvents.map((evt) => {
                          const converted = formatTimeInTimezone(evt.dateTime || evt.date, selectedTimezone);
                          const isBetter = evt.betterThanForecast === 'better';
                          const isWorse = evt.betterThanForecast === 'worse';

                          return (
                            <tr
                              key={evt.id || evt.eventId}
                              id={`cal-row-${evt.id || evt.eventId}`}
                              onClick={() => setSelectedEventModal(evt)}
                              className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer transition-colors group"
                            >
                              {/* Time Column in User Selected Timezone */}
                              <td className="py-2.5 px-3 font-mono font-bold text-[#0f172a] dark:text-slate-200">
                                {converted.time}
                              </td>

                              {/* Currency Column */}
                              <td className="py-2.5 px-2">
                                <span className="flex items-center gap-1 font-mono font-bold text-[#0f172a] dark:text-white">
                                  <span>{evt.countryFlag}</span>
                                  <span>{evt.currency}</span>
                                </span>
                              </td>

                              {/* Impact Folder */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="inline-flex">
                                  {renderImpactFolder(evt.impactLevel)}
                                </div>
                              </td>

                              {/* Event Name */}
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-[#0f172a] dark:text-white group-hover:text-[#5b3fe4] transition-colors">
                                  {evt.title}
                                </div>
                                <div className="text-[10px] text-[#64748b] dark:text-slate-400 truncate max-w-md">
                                  {evt.detail || evt.description}
                                </div>
                              </td>

                              {/* Actual Column */}
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {evt.actual ? (
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    isBetter 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-extrabold'
                                      : isWorse 
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 font-extrabold'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {evt.actual}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Pending</span>
                                )}
                              </td>

                              {/* Forecast Column */}
                              <td className="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-slate-300">
                                {evt.forecast || evt.consensus || '—'}
                              </td>

                              {/* Previous Column */}
                              <td className="py-2.5 px-3 text-right font-mono text-gray-500 dark:text-slate-400">
                                {evt.previous || '—'}
                              </td>

                              {/* Details / AI Macro Action Trigger */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  id={`cal-ai-btn-${evt.id || evt.eventId}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenMacroAnalysis) {
                                      onOpenMacroAnalysis({
                                        id: evt.id,
                                        title: evt.title,
                                        country: evt.country,
                                        countryFlag: evt.countryFlag,
                                        currency: evt.currency,
                                        impact: evt.impactLevel as any,
                                        category: 'Economic Calendar',
                                        countdown: evt.countdown,
                                        dateStr: converted.full,
                                        consensus: evt.forecast || evt.consensus,
                                        previous: evt.previous,
                                        actual: evt.actual
                                      });
                                    } else {
                                      setSelectedEventModal(evt);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-[#f0edfe] dark:bg-[#1c1635] text-[#5b3fe4] dark:text-purple-300 hover:bg-[#5b3fe4] hover:text-white transition-colors"
                                  title="Gemina AI Macro Setup Plan"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* NEWS ARTICLES GRID (ALL OTHER CATEGORIES) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#5b3fe4]" />
              <h2 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                {activeCategory} Articles ({newsArticles.length})
              </h2>
            </div>
            <div className="text-xs text-[#64748b] dark:text-slate-400 font-mono">
              Displaying in timezone: <strong className="text-[#5b3fe4] dark:text-purple-300">{selectedTimezone}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsArticles.map((art) => {
              const convertedTime = formatTimeInTimezone(art.publishedAt, selectedTimezone);
              const isHigh = art.impactLevel === 'High';
              const isBullish = art.sentiment === 'Bullish';
              const isBearish = art.sentiment === 'Bearish';

              return (
                <div
                  key={art.id}
                  id={`news-card-${art.id}`}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#171a27] rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-[#5b3fe4] transition-all cursor-pointer flex flex-col justify-between group space-y-3.5"
                >
                  <div className="space-y-2.5">
                    {/* Header Chips */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/40'
                          : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40'
                      }`}>
                        {art.impactLevel} Impact
                      </span>

                      <span className={`flex items-center gap-1 text-[11px] font-bold font-mono ${
                        isBullish ? 'text-emerald-600' : isBearish ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : isBearish ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        {art.sentiment}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="font-extrabold text-sm md:text-base text-[#0f172a] dark:text-white group-hover:text-[#5b3fe4] transition-colors leading-snug">
                      {art.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-[#64748b] dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  {/* Affected Currency Pairs Tags */}
                  <div className="pt-2 border-t border-gray-100 dark:border-[#171a27] space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {art.affectedPairs.map((pair) => (
                        <span
                          key={pair}
                          className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#181a2e] text-[10px] font-mono font-bold text-[#475569] dark:text-slate-300"
                        >
                          {pair}
                        </span>
                      ))}
                    </div>

                    {/* Author & Converted Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-[#64748b] dark:text-slate-400 font-mono">
                      <span className="truncate">{art.author}</span>
                      <span className="shrink-0">{convertedTime.full}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. ARTICLE READER MODAL (FULL ARTICLE CONTENT) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            id="ff-article-modal"
            className="w-full max-w-2xl bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#1e2238] rounded-3xl p-6 shadow-2xl text-[#0f172a] dark:text-white relative flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-[#171a27] gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f0edfe] dark:bg-[#1c1635] text-[#5b3fe4] dark:text-purple-300 text-[10px] font-extrabold font-mono">
                    {selectedArticle.category}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {formatTimeInTimezone(selectedArticle.publishedAt, selectedTimezone).full} ({selectedTimezone})
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-[#0f172a] dark:text-white leading-tight">
                  {selectedArticle.title}
                </h2>
              </div>

              <button
                id="close-article-modal-btn"
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#1a1e34] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Full Content */}
            <div className="overflow-y-auto custom-scrollbar my-4 space-y-4 pr-1">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1c2035] flex items-center justify-between text-xs font-mono">
                <div>
                  Author: <strong>{selectedArticle.author}</strong> ({selectedArticle.source})
                </div>
                <div className="flex items-center gap-2">
                  <span>Sentiment: <strong className="text-[#5b3fe4]">{selectedArticle.sentiment}</strong></span>
                  <span>Views: {selectedArticle.viewsCount.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-[#334155] dark:text-slate-300 whitespace-pre-line">
                {selectedArticle.content}
              </div>

              {/* Gemina AI Trade Interpretation */}
              <div className="p-4 rounded-2xl bg-[#f5f3ff] dark:bg-[#14122b] border border-purple-200 dark:border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#5b3fe4] dark:text-purple-300 font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemina AI Macro Takeaway &amp; Strategy:</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-slate-300 leading-normal">
                  High volatility expected on {selectedArticle.affectedPairs.join(', ')}. Look for post-news confirmation candles on the M15 timeframe before executing momentum breakout entries.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-[#171a27] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedArticle.affectedPairs.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedArticle(null);
                      if (onNavigateToChart) onNavigateToChart(p);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a2e] hover:bg-[#5b3fe4] hover:text-white text-xs font-bold font-mono transition-colors"
                  >
                    Open {p} Chart
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EVENT DEEP DIVE MODAL */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            id="ff-event-modal"
            className="w-full max-w-xl bg-white dark:bg-[#0c0e18] border border-[#e5e7eb] dark:border-[#1e2238] rounded-3xl p-6 shadow-2xl text-[#0f172a] dark:text-white relative flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#171a27]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{selectedEventModal.countryFlag}</span>
                <div>
                  <h3 className="font-extrabold text-base text-[#0f172a] dark:text-white">
                    {selectedEventModal.title}
                  </h3>
                  <div className="text-[11px] text-[#64748b] font-mono">
                    {formatTimeInTimezone(selectedEventModal.dateTime || selectedEventModal.date, selectedTimezone).full} ({selectedTimezone})
                  </div>
                </div>
              </div>

              <button
                id="close-event-modal-btn"
                onClick={() => setSelectedEventModal(null)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#1a1e34] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar my-4 space-y-4 pr-1 text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1c2035]">
                  <div className="text-[10px] text-[#64748b]">ACTUAL</div>
                  <div className="text-sm font-extrabold text-emerald-600 mt-0.5">
                    {selectedEventModal.actual || 'Pending'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1c2035]">
                  <div className="text-[10px] text-[#64748b]">FORECAST</div>
                  <div className="text-sm font-extrabold text-[#0f172a] dark:text-white mt-0.5">
                    {selectedEventModal.forecast || selectedEventModal.consensus || '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111322] border border-[#e5e7eb] dark:border-[#1c2035]">
                  <div className="text-[10px] text-[#64748b]">PREVIOUS</div>
                  <div className="text-sm font-extrabold text-[#64748b] mt-0.5">
                    {selectedEventModal.previous || '—'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="font-bold font-mono text-[#0f172a] dark:text-white">Event Description:</div>
                <p className="text-[#475569] dark:text-slate-300 leading-relaxed">
                  {selectedEventModal.description || selectedEventModal.detail}
                </p>
              </div>

              {/* Historical Releases */}
              {selectedEventModal.history && selectedEventModal.history.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold font-mono text-[#0f172a] dark:text-white">Historical Releases:</div>
                  <div className="rounded-xl border border-[#e5e7eb] dark:border-[#1c2035] overflow-hidden">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-gray-50 dark:bg-[#111322] text-[#64748b] border-b border-[#e5e7eb] dark:border-[#1c2035]">
                        <tr>
                          <th className="p-2">Release Date</th>
                          <th className="p-2 text-right">Actual</th>
                          <th className="p-2 text-right">Forecast</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#171a27]">
                        {selectedEventModal.history.map((h, i) => (
                          <tr key={i}>
                            <td className="p-2 text-[#475569] dark:text-slate-300">{h.date}</td>
                            <td className="p-2 text-right font-bold text-emerald-600">{h.actual}</td>
                            <td className="p-2 text-right text-gray-500">{h.forecast}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[#171a27] flex items-center justify-end">
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
