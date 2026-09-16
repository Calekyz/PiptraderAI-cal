import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeToggleProps {
  id?: string;
  theme: 'dark' | 'light';
  onToggle: () => void;
  variant?: 'pill' | 'circle' | 'expanded' | 'minimal';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id,
  theme,
  onToggle,
  variant = 'pill',
  className = ''
}) => {
  const isDark = theme === 'dark';

  if (variant === 'circle') {
    return (
      <button
        id={id || "theme-toggle-circle-btn"}
        onClick={onToggle}
        title={isDark ? 'Switch to Pure White Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Pure White Light Mode' : 'Switch to Dark Mode'}
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xs active:scale-95 border ${
          isDark
            ? 'bg-[#141624] hover:bg-[#1e2238] border-[#22273d] text-amber-400 hover:text-amber-300 shadow-amber-500/5'
            : 'bg-white hover:bg-gray-100 border-gray-200 text-slate-700 hover:text-slate-900 shadow-sm'
        } ${className}`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-800 transition-transform duration-300 rotate-0 hover:-rotate-12" />
          )}
        </div>
      </button>
    );
  }

  if (variant === 'expanded') {
    return (
      <button
        id={id || "theme-toggle-expanded-btn"}
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
          isDark
            ? 'bg-[#111322] hover:bg-[#181a2e] border-[#1e2238] text-white'
            : 'bg-white hover:bg-gray-50 border-gray-200 text-slate-900 shadow-sm'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-100 text-slate-700'
          }`}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold font-sans">
              {isDark ? 'Dark Mode' : 'Pure White Light Mode'}
            </div>
            <div className="text-[11px] text-gray-500 font-sans">
              {isDark ? 'Click to switch to Pure White' : 'Click to switch to Dark'}
            </div>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-colors ${
          isDark
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            : 'bg-slate-100 text-slate-800 border border-slate-200'
        }`}>
          {isDark ? 'DARK' : 'LIGHT'}
        </div>
      </button>
    );
  }

  // Default 'pill' variant
  return (
    <button
      id="theme-toggle-pill-btn"
      onClick={onToggle}
      title={isDark ? 'Switch to Pure White Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Pure White Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer border select-none active:scale-95 shadow-xs ${
        isDark
          ? 'bg-[#121424] hover:bg-[#1a1e34] border-[#22273d] text-gray-200'
          : 'bg-white hover:bg-gray-50 border-gray-200 text-slate-800 shadow-sm'
      } ${className}`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
        isDark ? 'bg-amber-400/15 text-amber-400' : 'bg-slate-100 text-slate-800'
      }`}>
        {isDark ? (
          <Sun className="w-3.5 h-3.5 animate-spin-slow" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </div>

      <span className="text-xs font-bold font-sans tracking-tight">
        {isDark ? 'Dark' : 'Light'}
      </span>

      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-400' : 'bg-emerald-500'}`} />
    </button>
  );
};
