import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
}

interface Stats {
  ok: boolean;
  balance?: number;
  equity?: number;
  daily_pnl?: number;
  open_positions?: number;
  last_stats_at?: string;
  reason?: string;
}

interface Signal {
  id: string;
  action: string;
  symbol: string;
  side: string | null;
  volume: number | null;
  sl: number | null;
  tp: number | null;
  status: 'PENDING' | 'DELIVERED' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  created_at: string;
  execution_ticket: number | null;
  execution_price: number | null;
  error_message: string | null;
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  DELIVERED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  EXECUTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  CANCELLED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export function Mt5TradingPanel({ user }: Props) {
  const email = user?.email || '';
  const [stats, setStats] = useState<Stats | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    symbol: 'XAUUSD.vcn',
    side: 'buy' as 'buy' | 'sell',
    volume: 0.1,
    sl: '',
    tp: '',
    comment: '',
  });

  const fetchStats = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch('/api/mt5/stats', { headers: { 'x-user-email': email } });
      const data = await res.json();
      setStats(data);
      if (!data.ok && data.reason === 'not_linked') {
        setError('Your MT5 account is not linked yet. Link it from the MT5 Connection page.');
      } else {
        setError(null);
      }
    } catch {
      setError('Could not reach the bridge');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const fetchSignals = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch('/api/mt5/signals', { headers: { 'x-user-email': email } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.signals)) {
        setSignals(data.signals.slice(0, 10));
      }
    } catch {}
  }, [email]);

  useEffect(() => {
    fetchStats();
    fetchSignals();
    const id = setInterval(() => {
      fetchStats();
      fetchSignals();
    }, 10000);
    return () => clearInterval(id);
  }, [fetchStats, fetchSignals]);

  const handleConfirm = () => setConfirming(true);

  const handleExecute = async () => {
    if (!email) return;
    setSubmitting(true);
    setConfirming(false);
    setLastResult(null);
    try {
      const payload: any = {
        action: 'open',
        symbol: form.symbol.trim(),
        side: form.side,
        volume: Number(form.volume),
        comment: form.comment.trim() || undefined,
      };
      if (form.sl.trim()) payload.sl = Number(form.sl);
      if (form.tp.trim()) payload.tp = Number(form.tp);

      const res = await fetch('/api/mt5/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok && data.signal_id) {
        setLastResult({ ok: true, message: `Signal sent: ${data.signal_id}. Waiting for EA to execute…` });
        setTimeout(() => { fetchSignals(); fetchStats(); }, 500);
      } else {
        setLastResult({ ok: false, message: data.error || data.reason || 'Signal failed' });
      }
    } catch (err: any) {
      setLastResult({ ok: false, message: err.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-[#1f2438] bg-[#0d0f1a] p-6 text-slate-400 text-sm">
        Sign in to access MT5 live trading.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Live Stats ── */}
      <div className="rounded-xl border border-[#1f2438] bg-[#0d0f1a] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">MT5 Live Account</h3>
          <button
            onClick={() => { fetchStats(); fetchSignals(); }}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded border border-[#222638]"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="text-xs text-slate-500">Loading live stats…</div>}

        {error && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        {stats?.ok && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Balance</div>
              <div className="text-lg font-bold text-white">
                ${stats.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Equity</div>
              <div className="text-lg font-bold text-white">
                ${stats.equity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Daily P&L</div>
              <div className={`text-lg font-bold ${(stats.daily_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(stats.daily_pnl ?? 0) >= 0 ? '+' : ''}${(stats.daily_pnl ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Open Positions</div>
              <div className="text-lg font-bold text-white">{stats.open_positions ?? 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Execute Form ── */}
      <div className="rounded-xl border border-[#1f2438] bg-[#0d0f1a] p-4">
        <h3 className="text-sm font-bold text-white mb-3">Execute Trade</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Symbol</label>
            <input
              type="text"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              className="w-full bg-[#0a0c16] border border-[#222638] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              placeholder="XAUUSD.vcn"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Volume (lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.volume}
              onChange={(e) => setForm({ ...form, volume: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#0a0c16] border border-[#222638] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Side</label>
          <div className="flex gap-2">
            <button
              onClick={() => setForm({ ...form, side: 'buy' })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                form.side === 'buy'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#0a0c16] border-[#222638] text-slate-400'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setForm({ ...form, side: 'sell' })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                form.side === 'sell'
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-[#0a0c16] border-[#222638] text-slate-400'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Stop Loss (opt.)</label>
            <input
              type="number"
              step="0.01"
              value={form.sl}
              onChange={(e) => setForm({ ...form, sl: e.target.value })}
              className="w-full bg-[#0a0c16] border border-[#222638] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              placeholder="4300.00"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Take Profit (opt.)</label>
            <input
              type="number"
              step="0.01"
              value={form.tp}
              onChange={(e) => setForm({ ...form, tp: e.target.value })}
              className="w-full bg-[#0a0c16] border border-[#222638] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              placeholder="4400.00"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Comment (opt.)</label>
          <input
            type="text"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full bg-[#0a0c16] border border-[#222638] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            placeholder="signal_778"
          />
        </div>

        {!confirming ? (
          <button
            onClick={handleConfirm}
            disabled={submitting || !stats?.ok}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending…' : 'Execute Trade'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
              Confirm: {form.side.toUpperCase()} {form.volume} {form.symbol} will be placed on your live MT5 account.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExecute}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm & Execute
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 rounded-lg bg-[#0a0c16] border border-[#222638] text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {lastResult && (
          <div className={`mt-3 text-xs px-3 py-2 rounded border ${
            lastResult.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {lastResult.message}
          </div>
        )}
      </div>

      {/* ── Signal History ── */}
      <div className="rounded-xl border border-[#1f2438] bg-[#0d0f1a] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Recent Signals</h3>
          <button
            onClick={fetchSignals}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded border border-[#222638]"
          >
            Refresh
          </button>
        </div>

        {signals.length === 0 ? (
          <div className="text-xs text-slate-500">No signals yet. Execute a trade above to create one.</div>
        ) : (
          <div className="space-y-2">
            {signals.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#1a1f2e] last:border-0 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-500 truncate">{s.id}</div>
                  <div className="text-white font-medium">
                    {s.side?.toUpperCase() ?? s.action.toUpperCase()} {s.volume ?? '?'} {s.symbol}
                    {s.sl ? <span className="text-slate-500 ml-1">SL {s.sl}</span> : null}
                    {s.tp ? <span className="text-slate-500 ml-1">TP {s.tp}</span> : null}
                  </div>
                  {s.execution_ticket && (
                    <div className="text-[10px] text-emerald-400">
                      Ticket #{s.execution_ticket} @ {s.execution_price?.toFixed(2)}
                    </div>
                  )}
                  {s.error_message && (
                    <div className="text-[10px] text-red-400">{s.error_message}</div>
                  )}
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${statusColor[s.status] || statusColor.PENDING}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Mt5TradingPanel;
