import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { ExecuteTradeButton } from './ExecuteTradeButton';
import { UserProfile } from '../types';

interface PulseSignal {
  id?: string;
  pair?: string;
  symbol?: string;
  direction?: 'BUY' | 'SELL' | 'buy' | 'sell';
  entry?: number;
  entryPrice?: number;
  stopLoss?: number;
  sl?: number;
  takeProfit?: number;
  tp?: number;
  confidence?: number;
  reasoning?: string;
  timeframe?: string;
  createdAt?: string;
}

interface Props {
  user: UserProfile | null;
}

export const SignalsPanel: React.FC<Props> = ({ user }) => {
  const [signals, setSignals] = useState<PulseSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/pulse-signals');
      const data = await res.json();
      const list = data?.signals || data?.data || (Array.isArray(data) ? data : []);
      setSignals(list.slice(0, 8));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 p-4">Loading live signals…</div>;
  }

  if (error) {
    return <div className="text-xs text-amber-400 p-4">Signals unavailable: {error}</div>;
  }

  if (signals.length === 0) {
    return (
      <div className="text-xs text-slate-500 p-4 border border-dashed border-[#1f2438] rounded-xl">
        No live signals right now. AutoScan refreshes every 30 min.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals.map((s, i) => {
        const dirRaw = String(s.direction || '').toUpperCase();
        const dir: 'buy' | 'sell' = dirRaw === 'SELL' ? 'sell' : 'buy';
        const sym = (s.symbol || s.pair || 'XAUUSD').replace('.vcn', '');
        const isBuy = dir === 'buy';
        return (
          <div key={s.id || i} className="p-3 rounded-xl bg-[#0a0c16] border border-[#1a1d2d] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`p-1.5 rounded-lg ${isBuy ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                {isBuy ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{sym}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                    {dirRaw}
                  </span>
                  {s.confidence != null && (
                    <span className="text-[10px] text-purple-400 font-bold">{Math.round(s.confidence)}%</span>
                  )}
                  {s.timeframe && (
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{s.timeframe}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                  {s.entryPrice != null && <span>Entry {s.entryPrice}</span>}
                  {s.entry != null && <span>Entry {s.entry}</span>}
                  {(s.stopLoss ?? s.sl) != null && <span className="text-rose-400">SL {s.stopLoss ?? s.sl}</span>}
                  {(s.takeProfit ?? s.tp) != null && <span className="text-emerald-400">TP {s.takeProfit ?? s.tp}</span>}
                </div>
              </div>
            </div>
            <ExecuteTradeButton
              symbol={sym}
              side={dir}
              volume={0.1}
              sl={s.stopLoss ?? s.sl}
              tp={s.takeProfit ?? s.tp}
              comment={`signal_${s.id || i}`}
              label={`Execute ${dirRaw}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SignalsPanel;
