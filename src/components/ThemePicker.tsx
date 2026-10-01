import React from 'react';
import { Check, Palette, Sparkles } from 'lucide-react';

export type AppTheme = 'aurora' | 'neon' | 'sunset';

interface ThemeMeta {
  id: AppTheme;
  name: string;
  tagline: string;
  primary: string;
  gradient: [string, string];
  bgPreview: string;
  accentPreview: string;
  badge?: string;
}

const THEMES: ThemeMeta[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Classic purple · the original',
    primary: '#5b3fe4',
    gradient: ['#7c3aed', '#a855f7'],
    bgPreview: '#07080d',
    accentPreview: '#5b3fe4',
    badge: 'Default',
  },
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Emerald · cyan · electric',
    primary: '#10b981',
    gradient: ['#059669', '#06b6d4'],
    bgPreview: '#04100d',
    accentPreview: '#10b981',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    tagline: 'Amber · rose · warm',
    primary: '#f97316',
    gradient: ['#ea580c', '#f43f5e'],
    bgPreview: '#110703',
    accentPreview: '#f97316',
  },
];

interface Props {
  current: AppTheme;
  onChange: (theme: AppTheme) => void;
}

export const ThemePicker: React.FC<Props> = ({ current, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-base font-bold text-[#0f172a] dark:text-white">
          <Palette className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
          <span>Appearance &amp; Visual Theme</span>
        </div>
        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
          Pick a colour palette. Applied instantly. Changes are reversible.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isActive = current === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              id={`theme-card-${theme.id}`}
              onClick={() => onChange(theme.id)}
              className={`text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer group ${
                isActive
                  ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                  : 'border-[#e5e7eb] dark:border-[#1e2238] hover:border-purple-300 dark:hover:border-purple-500/50'
              }`}
            >
              {/* Live colour preview */}
              <div
                className="h-20 relative overflow-hidden"
                style={{ backgroundColor: theme.bgPreview }}
              >
                {/* gradient blob */}
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-70"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
                  }}
                />
                {/* fake card */}
                <div
                  className="absolute left-3 top-3 w-16 h-3 rounded"
                  style={{ backgroundColor: `${theme.accentPreview}40` }}
                />
                <div
                  className="absolute left-3 top-8 w-24 h-2 rounded"
                  style={{ backgroundColor: `${theme.accentPreview}25` }}
                />
                <div
                  className="absolute left-3 bottom-3 px-2 py-1 rounded text-[9px] font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
                  }}
                >
                  {theme.name.toUpperCase()}
                </div>
              </div>

              {/* Card content */}
              <div className="p-3 bg-white dark:bg-[#0d0f1a]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-[#0f172a] dark:text-white">
                    {theme.name}
                  </span>
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : theme.badge ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {theme.badge}
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-[#64748b] dark:text-slate-400 leading-snug">
                  {theme.tagline}
                </div>

                {/* Colour swatches */}
                <div className="flex items-center gap-1 mt-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.gradient[0] }}
                    title="Primary"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.gradient[1] }}
                    title="Accent"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ backgroundColor: theme.bgPreview }}
                    title="Background"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f8f9fc] dark:bg-[#0f111d] border border-[#e5e7eb] dark:border-[#1e2238]">
        <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-relaxed">
          Theme is stored on this device. Choose <strong>Aurora</strong> to return to the classic look at any time.
        </p>
      </div>
    </div>
  );
};
