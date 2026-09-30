import { useEffect, useState } from 'react';

export interface SignalForVerification {
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
  latencyMs: number;
  cached?: boolean;
}

interface Options {
  enabled?: boolean;
}

/**
 * Fetch a silent AI verification for a signal.
 * Fails silent: on any error, `result` stays null and UI shows nothing extra.
 */
export function useSignalVerification(
  signal: SignalForVerification | null,
  options: Options = {}
) {
  const { enabled = true } = options;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable key so we don't refetch when only object identity changes
  const key = signal
    ? JSON.stringify({
        s: signal.symbol,
        d: signal.direction,
        c: Math.round((signal.confidence || 0) / 5) * 5,
        t: signal.timeframe || 'M15',
        n: signal.newsContext ? signal.newsContext.slice(0, 40) : '',
      })
    : null;

  useEffect(() => {
    if (!enabled || !signal || !key) {
      setResult(null);
      return;
    }
    if (signal.direction === 'WAIT') {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/ai/verify-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal),
    })
      .then(r => r.json())
      .then((d: any) => {
        if (cancelled) return;
        const v = d?.verification;
        // Never show SKIPPED to the user — just leave the badge hidden
        if (v && v.verdict !== 'SKIPPED') setResult(v);
        else setResult(null);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  return { result, loading };
}
