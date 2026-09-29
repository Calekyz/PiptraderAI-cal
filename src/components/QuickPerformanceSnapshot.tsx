import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, Activity, TrendingUp, Zap, Bot, Shield, CheckCircle2 } from 'lucide-react';

interface QuickPerformanceSnapshotProps {
  user?: { id?: string; plan?: string; mt5Connected?: boolean } | null;
  onStartAITrading?: () => void;
  className?: string;
}

export const QuickPerformanceSnapshot: React.FC<QuickPerformanceSnapshotProps> = ({
  user,
  onStartAITrading,
  className = '',
}) => {
  // ═══ REAL DATA STATE ═══
  const [analysesCount, setAnalysesCount] = useState(0);
  const [analysesToday, setAnalysesToday] = useState(0);
  const [tradesCount, setTradesCount] = useState(0);
  const [strategiesCount, setStrategiesCount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState<number | null>(null);
  const [preferredStrategy, setPreferredStrategy] = useState<string>('Not Selected');

  // ═══ FETCH REAL DATA FROM BACKEND ═══
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [a, j, s] = await Promise.all([
          fetch(`/api/chart-analyses?userId=${encodeURIComponent(user.id)}`).then(r => r.json()).catch(() => ({})),
          fetch(`/api/journal?userId=${encodeURIComponent(user.id)}`).then(r => r.json()).catch(() => ({})),
          fetch(`/api/strategies?userId=${encodeURIComponent(user.id)}`).then(r => r.json()).catch(() => ({})),
        ]);
        if (cancelled) return;

        const analyses = a.analyses || [];
        const trades = j.trades || [];
        const strategies = s.strategies || [];

        setAnalysesCount(analyses.length);
        setTradesCount(trades.length);
        setStrategiesCount(strategies.length);

        // Today's analyses
        const today = new Date().toISOString().split('T')[0];
        setAnalysesToday(analyses.filter((x: any) => (x.createdAt || '').startsWith(today)).length);

        // Avg confidence
        if (analyses.length > 0) {
          const confs = analyses.map((x: any) => Number(x.confidence) || 0).filter((n: number) => n > 0);
          if (confs.length > 0) {
            setAvgConfidence(Math.round(confs.reduce((s: number, n: number) => s + n, 0) / confs.length));
          }
        }

        // Preferred strategy (most common name)
        if (strategies.length > 0) {
          const counts: Record<string, number> = {};
          strategies.forEach((st: any) => {
            const name = st.name || 'Custom';
            counts[name] = (counts[name] || 0) + 1;
          });
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (top) setPreferredStrategy(top[0]);
        }
      } catch { /* silent */ }
    };

    load();
    const interval = setInterval(load, 30000); // refresh every 30s

    // Instant refresh when analysis completes
    const onComplete = () => {
      console.log('[Snapshot] Refresh triggered by analysis event');
      load();
    };
    window.addEventListener('pipnex:analysis-completed', onComplete);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('pipnex:analysis-completed', onComplete);
    };
  }, [user?.id]);

  // ═══ BUILD STATS FROM REAL DATA ═══
  const stats = [
    {
      label: 'AI Analyses Today',
      value: String(analysesToday),
      isAccent: false,
      tag: 'Today'
    },
    {
      label: 'Signals Generated',
      value: String(analysesCount),
      isAccent: false,
      tag: 'Real-Time'
    },
    {
      label: 'Charts Analyzed',
      value: String(analysesCount),
      isAccent: false,
      tag: 'Scanned'
    },
    {
      label: 'Preferred Strategy',
      value: preferredStrategy,
      isAccent: false,
      tag: 'Strategy'
    },
    {
      label: 'AI Confidence (Avg)',
      value: avgConfidence !== null ? `${avgConfidence}%` : '—',
      isAccent: true,
      tag: 'Quality'
    },
    {
      label: 'Auto-Trading',
      value: strategiesCount > 0 ? 'ACTIVE' : 'OFF',
      isAccent: false,
      tag: 'Status'
    },
    {
      label: 'Copy Trading',
      value: user?.mt5Connected ? 'Connected' : 'Not Configured',
      isAccent: false,
      tag: 'MT5 Bridge'
    },
  ];

  return (
    <div
      id="quick-performance-snapshot-widget"
      className={`w-full rounded-2xl bg-white dark:bg-[#0d0f1a] border border-[#e2e8f0] dark:border-[#1c2035] p-5 sm:p-6 shadow-xs dark:shadow-md transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f1f5f9] dark:border-[#161a2b]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f0edfe] dark:bg-[#1d1738] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-[#5b3fe4] dark:text-purple-400 shrink-0 shadow-2xs">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white tracking-tight">
              Quick Performance Snapshot
            </h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 font-medium">
              Live algorithmic execution telemetry and daily trading analytics
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onStartAITrading && (
          <button
            id="snapshot-start-ai-trading-btn"
            onClick={onStartAITrading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start AI Trading</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-5">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#121524] border border-[#e5e7eb] dark:border-[#1f243a] flex flex-col justify-between transition-colors hover:border-[#cbd5e1] dark:hover:border-[#2d3452]"
          >
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-[#64748b] dark:text-slate-400 leading-tight">
                {item.label}
              </div>
              <div
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  item.value === 'OFF'
                    ? 'text-amber-600 dark:text-amber-400'
                    : item.value === 'Not Selected' || item.value === 'Not Configured' || item.value === '—'
                    ? 'text-[#64748b] dark:text-slate-400'
                    : 'text-[#0f172a] dark:text-white'
                }`}
              >
                {item.value}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-medium text-[#94a3b8] dark:text-slate-500">
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
