import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

export interface VerificationPayload {
  symbol: string;
  timeframe?: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  setupType?: string;
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  riskReward?: number;
  reasons?: string[];
  trend?: string;
  session?: string;
  rsi?: number;
  newsContext?: string;
  chartImageBase64?: string;
}

export interface VerificationResult {
  verdict: 'AGREE' | 'CAUTION' | 'DISAGREE' | 'SKIPPED';
  aiConfidence: number;
  summary: string;
  reasoning: string;
  alternative?: string;
  model: string;
}

interface Props {
  payload: VerificationPayload | null;
  enabled?: boolean;
  className?: string;
}

export const AIVerificationBadge: React.FC<Props> = ({ payload, enabled = true, className = '' }) => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || !payload || payload.direction === 'WAIT') {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/ai/verify-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then((d: any) => {
        if (cancelled) return;
        setResult(d?.verification || null);
      })
      .catch(() => {
        // Fail silently — user never notices
        if (!cancelled) setResult(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled, JSON.stringify(payload)]);

  // Completely silent when loading, skipped, or unavailable
  if (!enabled || loading || !result || result.verdict === 'SKIPPED') return null;

  const palette =
    result.verdict === 'AGREE' ? {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      border: 'border-emerald-500/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: 'AI Verified',
    } :
    result.verdict === 'DISAGREE' ? {
      bg: 'bg-rose-500/10 dark:bg-rose-950/30',
      border: 'border-rose-500/60',
      text: 'text-rose-700 dark:text-rose-300',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'AI Contradicts',
    } : {
      bg: 'bg-amber-500/10 dark:bg-amber-950/30',
      border: 'border-amber-500/60',
      text: 'text-amber-700 dark:text-amber-300',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'AI Caution',
    };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${palette.bg} ${palette.border} ${palette.text} text-[10px] font-bold uppercase tracking-wide hover:opacity-90 transition-opacity cursor-pointer`}
        title="Click to see AI reasoning"
      >
        {palette.icon}
        <span>{palette.label}</span>
        <span className="opacity-70 font-mono">{result.aiConfidence}%</span>
      </button>

      {open && (
        <div className={`absolute z-30 mt-2 w-72 p-3 rounded-xl bg-white dark:bg-[#0e101d] border ${palette.border} shadow-xl text-[11px] leading-relaxed ${palette.text}`}>
          <div className="font-bold mb-1">{result.summary}</div>
          <div className="text-gray-700 dark:text-gray-300">{result.reasoning}</div>
          {result.alternative && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#20243d] text-gray-700 dark:text-gray-300">
              <span className="font-bold">Alternative: </span>{result.alternative}
            </div>
          )}
          <div className="mt-2 pt-1 text-[9px] opacity-60 font-mono">
            model: {result.model}
          </div>
        </div>
      )}
    </div>
  );
};
