import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Clock, Calendar, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { MacroEvent } from '../types';
import { useSignalVerification } from '../hooks/useSignalVerification';
import { AIVerificationPill } from './AIVerificationPill';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: MacroEvent[];
  user?: { id?: string; email?: string } | null;
}

const TARGET_KEYWORDS = ['NFP', 'NON-FARM', 'NONFARM', 'CPI', 'FOMC', 'PPI', 'FED FUNDS', 'INTEREST RATE'];

function isTargetEvent(ev: MacroEvent): boolean {
  const t = (ev.title || '').toUpperCase();
  return TARGET_KEYWORDS.some(k => t.includes(k));
}

function shortName(title: string): string {
  const t = title.toUpperCase();
  if (t.includes('NON-FARM') || t.includes('NONFARM') || t.includes('NFP')) return 'NFP';
  if (t.includes('FOMC') || t.includes('FED FUNDS') || t.includes('INTEREST RATE')) return 'FOMC';
  if (t.includes('CPI')) return 'CPI';
  if (t.includes('PPI')) return 'PPI';
  return title.slice(0, 20);
}

function parseSignal(text: string | null): { direction: 'BUY' | 'SELL' | 'WAIT'; confidence: number; symbol: string } {
  if (!text) return { direction: 'WAIT', confidence: 0, symbol: '' };
  const m = text.match(/Signal:\s*(BUY|SELL)\s*[—-]\s*(\d+)%\s*confidence/i);
  if (m) return { direction: m[1].toUpperCase() as any, confidence: parseInt(m[2], 10), symbol: '' };
  const b = text.match(/Engine Bias for (\S+):\s*(BULLISH|BEARISH|NEUTRAL)\s*\((\d+)%\s*confidence\)/i);
  if (b) {
    const dir = b[2].toUpperCase() === 'BULLISH' ? 'BUY' : b[2].toUpperCase() === 'BEARISH' ? 'SELL' : 'WAIT';
    return { direction: dir as any, confidence: parseInt(b[3], 10), symbol: b[1] };
  }
  return { direction: 'WAIT', confidence: 0, symbol: '' };
}

function formatCountdown(targetTs: number): string {
  const diff = targetTs - Date.now();
  if (diff <= 0) return 'Released';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const NewsEventSignalModal: React.FC<Props> = ({ isOpen, onClose, events, user }) => {
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<MacroEvent | null>(null);

  useEffect(() => {
    if (!isOpen) { setAnalysisText(null); setTarget(null); return; }

    const now = Date.now();
    const weekAhead = now + 7 * 24 * 3600 * 1000;
    const upcoming = (events || [])
      .filter(isTargetEvent)
      .filter(ev => {
        const ts = ev.timestamp || (ev.date ? new Date(ev.date).getTime() : 0);
        return ts >= now - 30 * 60 * 1000 && ts <= weekAhead;
      })
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const next = upcoming[0] || null;
    setTarget(next);

    if (!next) { setAnalysisText(null); return; }

    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const cur = String(next.currency || 'USD').toUpperCase();
        const pairMap: Record<string, string> = {
          USD: 'XAUUSD', EUR: 'EURUSD', GBP: 'GBPUSD', JPY: 'USDJPY',
          CHF: 'USDCHF', CAD: 'USDCAD', AUD: 'AUDUSD', NZD: 'NZDUSD',
        };
        const primaryPair = pairMap[cur] || 'XAUUSD';

        const [engineRes, newsRes] = await Promise.all([
          fetch('/api/engine/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: primaryPair, timeframe: 'M15', userId: user?.id })
          }).then(r => r.json()).catch(() => ({})),
          fetch('/api/engine/news-bias').then(r => r.json()).catch(() => ({})),
        ]);

        const plan = engineRes?.plan;
        const pairBias = (newsRes?.pairBiases || []).find((p: any) => p.pair === primaryPair);

        const parts: string[] = [];
        if (pairBias) {
          parts.push(`Engine Bias for ${pairBias.pair}: ${pairBias.bias} (${pairBias.confidence}% confidence)`);
          parts.push(pairBias.reason || '');
        }
        if (plan && plan.direction !== 'WAIT') {
          parts.push(`Signal: ${plan.direction} — ${plan.confidence}% confidence`);
          parts.push(`Setup Type: ${plan.setupType}`);
          if (plan.reasons?.length) plan.reasons.slice(0, 4).forEach((r: string) => parts.push(`✓ ${r}`));
        }
        setAnalysisText(parts.join('\n'));
      } catch {
        setAnalysisText(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [isOpen, events, user]);

  if (!isOpen) return null;

  // ── Scenario C: no event this week ─────────────────────────
  if (!target) {
    const allTargets = (events || []).filter(isTargetEvent)
      .map(ev => ({ ev, ts: ev.timestamp || (ev.date ? new Date(ev.date).getTime() : 0) }))
      .filter(x => x.ts > Date.now())
      .sort((a, b) => a.ts - b.ts);
    const nextAny = allTargets[0];

    return (
      <Shell onClose={onClose}>
        <div className="text-center py-10 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-purple-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">No NFP / CPI / FOMC / PPI this week</h3>
          {nextAny ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Next <strong className="text-purple-500">{shortName(nextAny.ev.title)}</strong>:
              <br />
              <span className="font-mono text-gray-900 dark:text-white">
                {new Date(nextAny.ts).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <br />
              <span className="text-xs mt-2 inline-block">Come back 2–3 days before the release for the engine's signal.</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Visit again when the next major release approaches.</p>
          )}
        </div>
      </Shell>
    );
  }

  // ── Determine scenario A/B/D ────────────────────────────────
  const sig = parseSignal(analysisText);
  const targetTs = target.timestamp || (target.date ? new Date(target.date).getTime() : Date.now());
  const hoursAway = (targetTs - Date.now()) / 3_600_000;
  const name = shortName(target.title);

  const isBuy = sig.direction === 'BUY';
  const isSell = sig.direction === 'SELL';
  const hasSignal = (isBuy || isSell) && sig.confidence >= 55;

  // Silent AI verification — declared AFTER all prerequisites so no TDZ error
  const { result: aiVerify } = useSignalVerification(
    hasSignal && sig.direction !== 'WAIT'
      ? {
          symbol: sig.symbol || target?.currency || 'XAUUSD',
          timeframe: 'M15',
          direction: sig.direction,
          confidence: sig.confidence,
          setupType: 'News Event Setup',
          reasons: analysisText
            ? analysisText.split('\n').filter(l => l.trim().startsWith('✓')).map(l => l.replace(/^\s*✓\s*/, ''))
            : [],
          newsContext: `${target.title} (${target.currency || 'USD'}) impact: ${target.impact}`,
        }
      : null
  );

  return (
    <Shell onClose={onClose}>
      {/* Event header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-[#161828]">
        <div className="w-11 h-11 rounded-2xl bg-[#faf9ff] dark:bg-[#141628] border border-purple-200 dark:border-[#272d4c] flex items-center justify-center text-2xl">
          {target.countryFlag || '🌐'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-gray-900 dark:text-white truncate">{target.title}</span>
            <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-500 text-white">{name}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatCountdown(targetTs)} away · {target.currency || 'USD'}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Analyzing {name} signal...</span>
        </div>
      ) : hasSignal ? (
        <>
          {/* ═══ BIG SIGNAL BANNER ═══ */}
          <div className={`relative overflow-hidden rounded-2xl border-2 p-6 shadow-xl ${
            isBuy ? 'bg-emerald-500/10 border-emerald-500' : 'bg-rose-500/10 border-rose-500'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                isBuy ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                {isBuy
                  ? <TrendingUp className="w-8 h-8 text-white" strokeWidth={3} />
                  : <TrendingDown className="w-8 h-8 text-white" strokeWidth={3} />}
              </div>
              <div>
                <div className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isBuy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isBuy ? 'STRONG BUY' : 'STRONG SELL'}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100">
                    {sig.symbol || target.currency || 'XAUUSD'}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {sig.confidence}% confidence
                  </span>
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-rose-500 text-white">
                    {name}
                  </span>
                </div>
              </div>
            </div>
            <p className={`mt-3 text-xs font-medium ${isBuy ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
              Engine predicts a <strong>{isBuy ? 'bullish' : 'bearish'}</strong> move on this {name} release.
            </p>
            {aiVerify && (
              <div className="mt-3">
                <AIVerificationPill result={aiVerify} />
              </div>
            )}
          </div>

          {/* Reasons */}
          {analysisText && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#0a0c16] border border-gray-200 dark:border-[#16192c]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Why this signal</span>
              </div>
              <pre className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {analysisText.split('\n').filter(l => !l.startsWith('Engine Bias')).join('\n')}
              </pre>
            </div>
          )}
        </>
      ) : (
        /* ── Scenario D: near but no clear signal ── */
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {name} in {formatCountdown(targetTs)}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Engine is waiting for candle confirmation. Check back 15–30 minutes before the release for the final signal.
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[#161828] flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-[#121422] text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#1a1e34] transition-colors cursor-pointer"
        >
          Close
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4c32d4] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </Shell>
  );
};

// ── Shared shell ──────────────────────────────────────────────
const Shell: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
    <div className="w-full max-w-lg bg-white dark:bg-[#0a0c16] border border-[#e5e7eb] dark:border-[#1a1e30] rounded-3xl p-6 shadow-2xl text-[#111111] dark:text-white relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 dark:bg-[#121422] text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1e2338] transition-colors cursor-pointer z-10"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 font-mono">High-Impact News Signal</span>
      </div>
      {children}
    </div>
  </div>
);
