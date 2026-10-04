import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import type { VerificationResult } from '../hooks/useSignalVerification';

interface Props {
  result: VerificationResult | null;
  className?: string;
}

/**
 * Stateless badge — renders an already-fetched verification result.
 * Returns null if result is null (so views can render unconditionally).
 */
export const AIVerificationPill: React.FC<Props> = ({ result, className = '' }) => {
  const [open, setOpen] = useState(false);
  if (!result) return null;

  const palette =
    result.verdict === 'AGREE'
      ? { bg: 'bg-emerald-500/10 dark:bg-emerald-950/30', border: 'border-emerald-500/60', text: 'text-emerald-700 dark:text-emerald-300', icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'AI Verified' }
      : result.verdict === 'DISAGREE'
      ? { bg: 'bg-rose-500/10 dark:bg-rose-950/30', border: 'border-rose-500/60', text: 'text-rose-700 dark:text-rose-300', icon: <XCircle className="w-3.5 h-3.5" />, label: 'AI Suggests Alternative' }
      : { bg: 'bg-amber-500/10 dark:bg-amber-950/30', border: 'border-amber-500/60', text: 'text-amber-700 dark:text-amber-300', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'AI Caution' };

  // Detect the AI's suggested direction from summary/reasoning text
  const suggestedDir = (() => {
    const text = `${result.summary || ''} ${result.reasoning || ''} ${result.alternative || ''}`.toUpperCase();
    if (/\bSELL\b|BEARISH/.test(text) && !/\bBUY\b|BULLISH/.test(text)) return 'SELL';
    if (/\bBUY\b|BULLISH/.test(text) && !/\bSELL\b|BEARISH/.test(text)) return 'BUY';
    return null;
  })();

  // Fix the 0% issue: if confidence is 0, show nothing
  const showConfidence = result.aiConfidence > 0;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${palette.bg} ${palette.border} ${palette.text} text-[10px] font-bold uppercase tracking-wide hover:opacity-90 transition-opacity cursor-pointer`}
        title="Click to see AI reasoning"
      >
        {palette.icon}
        <span>
          {result.verdict === 'DISAGREE' && suggestedDir
            ? `AI Suggests ${suggestedDir}`
            : palette.label}
        </span>
        {showConfidence && <span className="opacity-70 font-mono">{result.aiConfidence}%</span>}
      </button>

      {open && (
        <div className={`absolute z-30 mt-2 w-72 p-3 rounded-xl bg-white dark:bg-[#0e101d] border ${palette.border} shadow-xl text-[11px] leading-relaxed ${palette.text}`}>
          <div className="font-bold mb-1">{result.summary}</div>
          <div className="text-gray-700 dark:text-gray-300">{result.reasoning}</div>
          {result.alternative && (
            <div className={`mt-2 pt-2 border-t ${palette.border} border-opacity-50`}>
              <div className="font-bold uppercase text-[10px] mb-1 tracking-wider">AI's Alternative:</div>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.alternative}</div>
            </div>
          )}
          {!result.alternative && result.verdict === 'DISAGREE' && suggestedDir && (
            <div className={`mt-2 pt-2 border-t ${palette.border} border-opacity-50`}>
              <div className="font-bold uppercase text-[10px] mb-1 tracking-wider">Suggested Direction:</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded font-black text-xs ${
                  suggestedDir === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                }`}>
                  {suggestedDir}
                </span>
                <span className="text-[11px] text-gray-600 dark:text-gray-400">
                  Consider flipping your signal direction
                </span>
              </div>
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
