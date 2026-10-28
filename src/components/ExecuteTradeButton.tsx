import React, { useState } from 'react';
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getUserEmail } from '../lib/creditsClient';

interface Props {
  symbol: string;
  side: 'buy' | 'sell';
  volume?: number;
  sl?: number;
  tp?: number;
  comment?: string;
  label?: string;
  className?: string;
  onResult?: (result: { ok: boolean; message: string; ticket?: number }) => void;
}

export const ExecuteTradeButton: React.FC<Props> = ({
  symbol,
  side,
  volume = 0.1,
  sl,
  tp,
  comment = 'from signal',
  label,
  className = '',
  onResult
}) => {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = async () => {
    setConfirming(false);
    setLoading(true);
    setResult(null);
    try {
      const email = getUserEmail();
      if (!email) {
        const r = { ok: false, message: 'Please log in first' };
        setResult(r);
        onResult?.(r);
        return;
      }
      const res = await fetch('/api/mt5/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify({
          action: 'open',
          symbol: symbol.includes('.vcn') ? symbol : symbol + '.vcn',
          side,
          volume,
          sl,
          tp,
          comment
        })
      });
      const data = await res.json();
      if (data.ok) {
        const msg = data.simulation
          ? (data.message || 'Simulated — no real trade')
          : (data.message || `Executed — ticket #${data.ticket || data.signal_id || 'ok'}`);
        const r = { ok: true, message: msg, ticket: data.ticket };
        setResult(r);
        onResult?.(r);
      } else {
        const r = { ok: false, message: data.error || data.reason || 'Execute failed' };
        setResult(r);
        onResult?.(r);
      }
    } catch (err: any) {
      const r = { ok: false, message: err?.message || 'Network error' };
      setResult(r);
      onResult?.(r);
    } finally {
      setLoading(false);
    }
  };

  const color = side === 'buy'
    ? 'bg-emerald-600 hover:bg-emerald-500'
    : 'bg-rose-600 hover:bg-rose-500';

  if (result?.ok) {
    return (
      <div className={`text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 ${className}`}>
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span className="truncate">{result.message}</span>
      </div>
    );
  }
  if (result && !result.ok) {
    return (
      <div className={`text-[10px] px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1 ${className}`}>
        <XCircle className="w-3 h-3 shrink-0" />
        <span className="truncate">{result.message}</span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className={`flex gap-1 ${className}`}>
        <button
          onClick={run}
          disabled={loading}
          className={`flex-1 px-2 py-1 rounded text-[10px] font-bold text-white ${color} disabled:opacity-50`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-white"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white ${color} flex items-center gap-1 transition ${className}`}
    >
      <Zap className="w-3 h-3" />
      {label || `Execute ${side.toUpperCase()}`}
    </button>
  );
};

export default ExecuteTradeButton;
