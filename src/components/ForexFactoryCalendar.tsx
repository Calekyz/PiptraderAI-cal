import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Bell, 
  BellRing, 
  FileText, 
  BarChart2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  Flame, 
  Check, 
  X, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { MacroEvent } from '../types';

interface ForexFactoryCalendarProps {
  onOpenMacroAnalysis: (event: MacroEvent) => void;
}

const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD', 'CNY'];
const IMPACTS = ['High', 'Medium', 'Low', 'Non-Economic'];

export const ForexFactoryCalendar: React.FC<ForexFactoryCalendarProps> = ({
  onOpenMacroAnalysis,
}) => {
  const [period, setPeriod] = useState<'thisweek' | 'nextweek'>('thisweek');
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodLabel, setPeriodLabel] = useState('This Week');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['High', 'Medium', 'Low', 'Non-Economic']);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Interactive UI states
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [alertsSet, setAlertsSet] = useState<Record<string, boolean>>({});
  const [filterOnlyUpcoming, setFilterOnlyUpcoming] = useState(true); // ✅ CHANGED: default to true
  const [upNextHighlightId, setUpNextHighlightId] = useState<string | null>(null);

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const upNextRef = useRef<HTMLTableRowElement | null>(null);

  // Fetch Live ForexFactory Calendar Data
  const fetchCalendarData = async (targetPeriod: 'thisweek' | 'nextweek') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/forex-factory-calendar?period=${targetPeriod}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
        if (data.periodLabel) {
          setPeriodLabel(data.periodLabel);
        }
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        // Find the immediate next upcoming event
        const now = Date.now();
        const upcoming = data.events.find((e: MacroEvent) => (e.timestamp || 0) > now && (e.impact === 'High' || e.impact === 'Medium'));
        if (upcoming) {
          setUpNextHighlightId(upcoming.id);
        } else if (data.events.length > 0) {
          setUpNextHighlightId(data.events[0].id);
        }
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(period);
  }, [period]);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAlert = (eventId: string) => {
    setAlertsSet(prev => {
      const next = !prev[eventId];
      return { ...prev, [eventId]: next };
    });
  };

  const handleNextPeriod = () => {
    setPeriod(prev => (prev === 'thisweek' ? 'nextweek' : 'thisweek'));
  };

  const handlePrevPeriod = () => {
    setPeriod(prev => (prev === 'nextweek' ? 'thisweek' : 'nextweek'));
  };

  const handleUpNextJump = () => {
    if (upNextRef.current) {
      upNextRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFilterOnlyUpcoming(prev => !prev);
    }
  };

  // Filtered & Grouped Events
  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const now = Date.now();

    return events.filter(evt => {
      // Search
      if (query) {
        const titleMatch = evt.title.toLowerCase().includes(query);
        const currMatch = (evt.currency || '').toLowerCase().includes(query);
        const countryMatch = (evt.country || '').toLowerCase().includes(query);
        if (!titleMatch && !currMatch && !countryMatch) return false;
      }

      // Currency
      if (selectedCurrency !== 'ALL' && evt.currency !== selectedCurrency) {
        return false;
      }

      // Impact
      const eventImpact = evt.impact === 'Holiday' ? 'Non-Economic' : evt.impact;
      if (!selectedImpacts.includes(eventImpact)) {
        return false;
      }

      // Only upcoming toggle
      if (filterOnlyUpcoming && (evt.timestamp || 0) < now && evt.actual) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCurrency, selectedImpacts, filterOnlyUpcoming]);

  // Group events by dayDate
  const groupedEvents = useMemo(() => {
    const groups: Record<string, MacroEvent[]> = {};
    for (const evt of filteredEvents) {
      const key = evt.dayDate || 'Upcoming Events';
      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    }
    return groups;
  }, [filteredEvents]);

  // Helpers for impact styling
  const renderImpactFolder = (impact: MacroEvent['impact']) => {
    switch (impact) {
      case 'High':
        return (
          <div 
            title="High Impact Expected (Red Folder)" 
            className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#e11d48] text-white shadow-xs"
          >
            <div className="w-2.5 h-1.5 border-t border-white/60 -mt-0.5" />
          </div>
        );
      case 'Medium':
        return (
          <div 
            title="Medium Impact Expected (Orange Folder)" 
            className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#ea580c] text-white shadow-xs"
          >
            <div className="w-2.5 h-1.5 border-t border-white/60 -mt-0.5" />
          </div>
        );
      case 'Low':
        return (
          <div 
            title="Low Impact Expected (Yellow Folder)" 
            className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-[#eab308] text-gray-900 shadow-xs"
          >
            <div className="w-2.5 h-1.5 border-t border-black/30 -mt-0.5" />
          </div>
        );
      case 'Holiday':
      case 'Non-Economic':
      default:
        return (
          <div 
            title="Non-Economic / Bank Holiday (Grey Folder)" 
            className="flex items-center justify-center w-5 h-4 rounded-[3px] bg-gray-300 text-gray-700 shadow-xs"
          >
            <div className="w-2.5 h-1.5 border-t border-black/20 -mt-0.5" />
          </div>
        );
    }
  };

  return (
    <div 
      id="forexfactory-economic-calendar-section"
      className="w-full bg-white border border-[#e5e7eb] rounded-2xl shadow-xs overflow-hidden space-y-4 p-5 md:p-6"
    >
      {/* SECTION HEADER: NewsIQ — Upcoming Macro Events */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0f172a]" />
            <h2 className="text-base font-bold text-[#0f172a] tracking-tight">
              NewsIQ — Upcoming Macro Events
            </h2>
          </div>
          <p className="text-xs text-[#64748b]">
            NFP &amp; CPI releases affecting XAUUSD and USD pairs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Feed</span>
          </div>
        </div>
      </div>

      {/* HIGHLIGHTED UPCOMING MACRO EVENTS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Next Up Highlight Card */}
        <div 
          onClick={() => {
            const nextEvt = events.find(e => e.id === upNextHighlightId) || events[0];
            if (nextEvt) onOpenMacroAnalysis(nextEvt);
          }}
          className="p-4 rounded-xl bg-[#f5f3ff] border border-[#ddd6fe] shadow-xs space-y-2.5 cursor-pointer hover:border-[#5b3fe4] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#5b3fe4] text-white text-[10px] font-bold shadow-xs">
                ✨ Next Up
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#e5e7eb] text-[#334155] text-[10px] font-medium">
                Unemployment
              </span>
            </div>
            <span className="font-bold text-xs text-[#0f172a] font-mono">US</span>
          </div>

          <div>
            <div className="font-bold text-sm text-[#0f172a] group-hover:text-[#5b3fe4] transition-colors">
              Unemployment Claims
            </div>
            <div className="text-[11px] text-[#64748b] font-mono">
              8/27/2026, 3:30:00 PM UTC
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-purple-200/60 text-[11px] font-mono text-[#475569]">
            <span>Consensus: <strong className="text-[#0f172a] font-bold">208K</strong></span>
            <span>Previous: <strong className="text-[#0f172a] font-bold">206K</strong></span>
          </div>
        </div>

        {/* High Impact Upcoming Card */}
        <div 
          onClick={() => {
            const fomcEvt = events.find(e => e.impact === 'High') || events[1];
            if (fomcEvt) onOpenMacroAnalysis(fomcEvt);
          }}
          className="p-4 rounded-xl bg-white border border-[#e5e7eb] shadow-xs space-y-2.5 cursor-pointer hover:border-rose-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                High
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                FOMC
              </span>
            </div>
            <span className="font-bold text-xs text-[#0f172a] font-mono">US</span>
          </div>

          <div>
            <div className="font-bold text-sm text-[#0f172a] group-hover:text-rose-600 transition-colors">
              Fed Chairman Warsh Speaks
            </div>
            <div className="text-[11px] text-[#64748b] font-mono">
              8/28/2026, 5:00:00 PM UTC
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#f1f5f9] text-[11px] font-mono text-[#475569]">
            <span>Impact: <strong className="text-rose-600 font-bold">Extreme Volatility</strong></span>
            <span className="text-[#5b3fe4] font-semibold group-hover:underline">Analyze with AI →</span>
          </div>
        </div>
      </div>

      {/* 1. HORIZONTAL CALENDAR HEADER (ForexFactory-Style Top Bar) */}
      <div className="p-3.5 md:p-4 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left: Navigation Period controls */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Period Arrows + Label */}
          <div className="flex items-center bg-white border border-[#e5e7eb] rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevPeriod}
              title="Previous Week"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 text-xs md:text-sm font-bold text-[#0f172a] font-mono tracking-tight flex items-center gap-1.5 select-none">
              <CalendarIcon className="w-3.5 h-3.5 text-[#5b3fe4]" />
              <span>{periodLabel}</span>
            </div>

            <button
              onClick={handleNextPeriod}
              title="Next Week"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Up Next Quick Jump Pill */}
          <button
            onClick={handleUpNextJump}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              filterOnlyUpcoming 
                ? 'bg-amber-500 text-white' 
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Up Next</span>
          </button>

          {/* ForexFactory Live Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live ForexFactory Feed</span>
          </div>
        </div>

        {/* Right: Search Events + Filter + Refresh + Source Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, currency..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#e5e7eb] rounded-xl text-xs text-[#0f172a] placeholder-gray-400 focus:outline-none focus:border-[#5b3fe4] shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Dropdown Toggle */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                showFilterDropdown || selectedCurrency !== 'ALL' || selectedImpacts.length < 4
                  ? 'bg-[#5b3fe4] text-white border-[#5b3fe4]'
                  : 'bg-white text-[#334155] border-[#e5e7eb] hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {(selectedCurrency !== 'ALL' || selectedImpacts.length < 4) && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            {/* Filter Flyout Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-xl z-50 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                  <span className="font-bold text-[#0f172a]">Calendar Filters</span>
                  <button
                    onClick={() => {
                      setSelectedCurrency('ALL');
                      setSelectedImpacts(['High', 'Medium', 'Low', 'Non-Economic']);
                    }}
                    className="text-[11px] text-[#5b3fe4] hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                {/* Impact Checklist */}
                <div>
                  <label className="block font-bold text-[#334155] mb-2">Impact</label>
                  <div className="space-y-1.5">
                    {IMPACTS.map((imp) => {
                      const active = selectedImpacts.includes(imp);
                      return (
                        <button
                          key={imp}
                          type="button"
                          onClick={() => {
                            setSelectedImpacts(prev => 
                              active ? prev.filter(x => x !== imp) : [...prev, imp]
                            );
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            active 
                              ? 'bg-purple-50 border-[#5b3fe4]/40 text-[#0f172a]' 
                              : 'bg-transparent border-[#e5e7eb] text-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {renderImpactFolder(imp as any)}
                            <span className="font-medium">{imp === 'Non-Economic' ? 'Non-Economic / Holiday' : `${imp} Impact`}</span>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-[#5b3fe4]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Currency Selector */}
                <div>
                  <label className="block font-bold text-[#334155] mb-2">Currency</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSelectedCurrency(curr)}
                        className={`py-1 rounded-lg text-center font-mono font-bold transition-all cursor-pointer ${
                          selectedCurrency === curr
                            ? 'bg-[#5b3fe4] text-white'
                            : 'bg-gray-100 text-[#475569] hover:bg-gray-200'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f1f5f9] flex justify-end">
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-3 py-1.5 bg-[#5b3fe4] hover:bg-[#4d32d0] text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchCalendarData(period)}
            title="Refresh from ForexFactory"
            className="p-2 rounded-xl bg-white text-[#64748b] hover:text-[#0f172a] border border-[#e5e7eb] hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5b3fe4]' : ''}`} />
          </button>

          {/* Direct ForexFactory Link */}
          <a
            href="https://www.forexfactory.com/calendar"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1 text-[11px] font-semibold text-[#5b3fe4] hover:underline px-2 py-1"
          >
            <span>ForexFactory.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 2. MAIN ECONOMIC CALENDAR TABLE */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[850px] font-sans">
          {/* Table Header Columns */}
          <thead>
            <tr className="bg-gray-100/80 border-b border-[#e5e7eb] text-[11px] uppercase tracking-wider font-bold text-[#64748b] select-none">
              <th className="py-2.5 px-3 w-28 text-left font-mono">Date</th>
              <th className="py-2.5 px-3 w-20 text-left font-mono">Time</th>
              <th className="py-2.5 px-3 w-24 text-left font-mono">Currency</th>
              <th className="py-2.5 px-2 w-14 text-center">Impact</th>
              <th className="py-2.5 px-3 text-left">Event</th>
              <th className="py-2.5 px-2 w-14 text-center">Alerts</th>
              <th className="py-2.5 px-2 w-14 text-center">Detail</th>
              <th className="py-2.5 px-3 w-24 text-right font-mono">Actual</th>
              <th className="py-2.5 px-3 w-24 text-right font-mono">Forecast</th>
              <th className="py-2.5 px-3 w-24 text-right font-mono">Previous</th>
              <th className="py-2.5 px-2 w-16 text-center">Graph</th>
            </tr>
          </thead>

          {/* Table Body: Grouped by Day */}
          <tbody className="divide-y divide-[#f1f5f9] text-xs">
            {loading && events.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                    <div className="w-7 h-7 border-2 border-[#5b3fe4] border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-xs">Loading live economic releases from ForexFactory...</span>
                  </div>
                </td>
              </tr>
            ) : Object.keys(groupedEvents).length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  <div className="space-y-1">
                    <p className="font-semibold text-[#0f172a]">No economic events match your filter criteria.</p>
                    <p className="text-[11px]">Try adjusting the currency or impact filters above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              Object.entries(groupedEvents).map(([dayDate, dayEvents]) => (
                <React.Fragment key={dayDate}>
                  {/* Distinct Day Group Header Banner */}
                  <tr className="bg-gray-50/90 border-t-2 border-b border-[#e5e7eb]">
                    <td colSpan={11} className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#0f172a] tracking-wide font-mono">
                            {dayDate}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            ({dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                          {dayEvents.some(e => e.impact === 'High') && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">
                              {dayEvents.filter(e => e.impact === 'High').length} High Impact
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Individual Event Rows */}
                  {dayEvents.map((evt, idx) => {
                    const isExpanded = expandedEventId === evt.id;
                    const isUpNext = upNextHighlightId === evt.id;
                    const isAlerted = Boolean(alertsSet[evt.id]);
                    const isHigh = evt.impact === 'High';

                    return (
                      <React.Fragment key={evt.id}>
                        <tr
                          ref={isUpNext ? upNextRef : null}
                          className={`group transition-colors ${
                            isUpNext
                              ? 'bg-purple-50/40 hover:bg-purple-50/70'
                              : 'hover:bg-gray-50/70'
                          } ${isExpanded ? 'bg-gray-50/90' : ''}`}
                        >
                          {/* 1. Date */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748b]">
                            {idx === 0 ? (
                              <span className="font-bold text-[#1e293b]">{evt.dayName}</span>
                            ) : null}
                          </td>

                          {/* 2. Time */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#334155] whitespace-nowrap">
                            {evt.time || 'All Day'}
                          </td>

                          {/* 3. Currency */}
                          <td className="py-2.5 px-3 font-mono text-xs font-bold text-[#0f172a] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{evt.countryFlag}</span>
                              <span>{evt.currency}</span>
                            </span>
                          </td>

                          {/* 4. Impact Folder Icon */}
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex justify-center items-center">
                              {renderImpactFolder(evt.impact)}
                            </div>
                          </td>

                          {/* 5. Event Title */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                                className={`font-semibold cursor-pointer hover:text-[#5b3fe4] transition-colors ${
                                  isHigh 
                                    ? 'text-[#0f172a] font-bold' 
                                    : 'text-[#334155]'
                                }`}
                              >
                                {evt.title}
                              </span>
                              {isUpNext && (
                                <span className="px-1.5 py-0.5 rounded bg-[#f5f3ff] text-[#5b3fe4] text-[9px] font-extrabold uppercase font-mono tracking-wider border border-[#ddd6fe] shrink-0">
                                  Next In {evt.countdown}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Alerts Toggle */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => toggleAlert(evt.id)}
                              title={isAlerted ? 'Alert active for this release' : 'Set release reminder alert'}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isAlerted
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                            >
                              {isAlerted ? (
                                <BellRing className="w-3.5 h-3.5" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>

                          {/* 7. Detail Expand Button */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                              title="Toggle release detail"
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'text-[#5b3fe4] bg-purple-50'
                                  : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </td>

                          {/* 8. Actual */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                            {evt.actual ? (
                              <span className={
                                evt.betterThanForecast === 'better'
                                  ? 'text-emerald-600'
                                  : evt.betterThanForecast === 'worse'
                                  ? 'text-rose-600'
                                  : 'text-[#0f172a]'
                              }>
                                {evt.actual}
                              </span>
                            ) : (
                              <span className="text-gray-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 9. Forecast */}
                          <td className="py-2.5 px-3 text-right font-mono text-[#64748b] whitespace-nowrap">
                            {evt.forecast && evt.forecast !== 'N/A' ? evt.forecast : '-'}
                          </td>

                          {/* 10. Previous */}
                          <td className="py-2.5 px-3 text-right font-mono text-[#94a3b8] whitespace-nowrap">
                            {evt.previous && evt.previous !== 'N/A' ? evt.previous : '-'}
                          </td>

                          {/* 11. Graph & AI Analysis */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => onOpenMacroAnalysis(evt)}
                              title="ForexFactory Volatility & AI Guard Analysis"
                              className="p-1 rounded-lg text-gray-400 hover:text-[#5b3fe4] hover:bg-purple-50 transition-all cursor-pointer"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded ForexFactory Detail Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50/90 border-b border-[#e5e7eb]">
                            <td colSpan={11} className="py-4 px-6">
                              <div className="max-w-4xl space-y-3 animate-in fade-in duration-150">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#0f172a]">
                                      {evt.title} ({evt.currency})
                                    </span>
                                    <span className="text-xs">{evt.countryFlag}</span>
                                    <span className="text-[11px] font-mono text-gray-500">
                                      {evt.formattedDate} · {evt.time}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => onOpenMacroAnalysis(evt)}
                                      className="px-3 py-1.5 rounded-lg bg-[#5b3fe4] hover:bg-[#4d32d0] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>AI Volatility &amp; PipNex Guard Analysis</span>
                                    </button>

                                    <a
                                      href={evt.sourceUrl || 'https://www.forexfactory.com/calendar'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#334155] hover:bg-white text-xs font-semibold flex items-center gap-1"
                                    >
                                      <span>View on ForexFactory</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                  {/* Specs Card */}
                                  <div className="p-3 bg-white rounded-xl border border-[#e5e7eb] space-y-1.5">
                                    <div className="text-[10px] font-mono font-bold uppercase text-gray-400">Release Specs</div>
                                    <div className="flex justify-between py-0.5 border-b border-[#f1f5f9]">
                                      <span className="text-gray-500">Source:</span>
                                      <span className="font-semibold text-[#1e293b]">{evt.country} Statistics Agency</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-[#f1f5f9]">
                                      <span className="text-gray-500">Frequency:</span>
                                      <span className="font-semibold text-[#1e293b]">Monthly</span>
                                    </div>
                                    <div className="flex justify-between py-0.5">
                                      <span className="text-gray-500">Usual Effect:</span>
                                      <span className="font-semibold text-emerald-600">Actual &gt; Forecast is good for currency</span>
                                    </div>
                                  </div>

                                  {/* Primary Affected Pairs */}
                                  <div className="p-3 bg-white rounded-xl border border-[#e5e7eb] space-y-1.5">
                                    <div className="text-[10px] font-mono font-bold uppercase text-gray-400">Primary Pairs Affected</div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {(evt.affectedPairs || ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD']).map(p => (
                                        <span key={p} className="px-2 py-0.5 rounded-md bg-gray-100 text-[#0f172a] font-mono text-[11px] font-bold border border-[#e5e7eb]">
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                    <p className="text-[11px] text-[#64748b] pt-1">
                                      Recommended Bot SL Buffer: <strong className="text-[#0f172a] font-mono">+15–25 Pips</strong>
                                    </p>
                                  </div>

                                  {/* Overview Note */}
                                  <div className="p-3 bg-white rounded-xl border border-[#e5e7eb] space-y-1">
                                    <div className="text-[10px] font-mono font-bold uppercase text-gray-400">Indicator Summary</div>
                                    <p className="text-[11px] text-[#475569] leading-relaxed">
                                      {evt.detail || evt.analysisSummary || `Official macroeconomic data release for ${evt.country}. High liquidity impact expected across forex and gold pairs.`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. CALENDAR FOOTER LEGEND & SYNC METADATA */}
      <div className="p-3.5 md:p-4 bg-[#f8fafc] border-t border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#64748b] font-mono">
        {/* Impact Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#334155] uppercase tracking-wider text-[10px]">Impact Legend:</span>
          <div className="flex items-center gap-1.5">
            {renderImpactFolder('High')}
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            {renderImpactFolder('Medium')}
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            {renderImpactFolder('Low')}
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            {renderImpactFolder('Non-Economic')}
            <span>Non-Economic</span>
          </div>
        </div>

        {/* Sync Info */}
        <div className="flex items-center gap-2">
          <span>Data provided by ForexFactory.com</span>
          {lastUpdated && <span>· Updated at {lastUpdated}</span>}
        </div>
      </div>
    </div>
  );
};
