import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Globe,
  Zap,
  MessageSquare,
  BarChart2,
  UploadCloud,
  Calculator,
  Shield,
  Layers,
  Radio,
  ChevronLeft,
  ChevronRight,
  Headphones,
  BookOpen
} from 'lucide-react';

export interface HorizontalNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isUploadBadge?: boolean;
  isPillBadge?: boolean;
  isSpecialIcon?: boolean;
}

export const HORIZONTAL_NAV_ITEMS: HorizontalNavItem[] = [
  { id: 'news-calendar', label: 'Factory News', icon: Globe },
  { id: 'quick-start', label: 'Quick Start', icon: Zap },
  { id: 'prompt-trading', label: 'Prompt Chart', icon: MessageSquare },
  { id: 'auto-trading', label: 'Auto Trading', icon: Zap },
  { id: 'ai-trading', label: 'AI Trading', icon: BarChart2 },
  { id: 'upload-chart', label: 'Upload Chart', icon: UploadCloud, isUploadBadge: true },
  { id: 'position-calculator', label: 'Position Calc', icon: Calculator },
  { id: 'proppass', label: 'PropPass', icon: Shield, isPillBadge: true },
  { id: 'manage-bots', label: 'Manage Bots', icon: Layers },
  { id: 'pulse-signals', label: 'Pulse Signals', icon: Radio },
  { id: 'contact-support', label: 'Support', icon: Headphones },
  { id: 'how-to-use', label: 'How to Use', icon: BookOpen },
];

interface HorizontalQuickAccessMenuProps {
  activeTab: string;
  onNavigateToTab: (tabId: string) => void;
  className?: string;
}

export const HorizontalQuickAccessMenu: React.FC<HorizontalQuickAccessMenuProps> = ({
  activeTab,
  onNavigateToTab,
  className = ''
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const scrollByDirection = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  };

  return (
    <nav
      id="pipnex-horizontal-quick-access-menu"
      aria-label="Quick Access Menu"
      className={`relative w-full bg-[#0b0d18] text-slate-200 border-b border-[#1b1f35] py-2 shadow-xs select-none transition-colors ${className}`}
    >
      {canScrollLeft && (
        <button
          type="button"
          id="quick-menu-scroll-left-btn"
          aria-label="Scroll menu left"
          onClick={() => scrollByDirection(-1)}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 w-7 h-7 rounded-full bg-[#12162a] border border-[#2a3150] text-slate-200 hover:text-white hover:bg-[#1b2140] shadow-md flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onWheel={(event) => {
          const el = event.currentTarget;
          if (el.scrollWidth <= el.clientWidth) return;
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          el.scrollLeft += event.deltaY;
          event.preventDefault();
        }}
        className="max-w-[1600px] mx-auto flex items-center justify-start gap-1.5 sm:gap-3 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap px-3 sm:px-6"
      >
        {HORIZONTAL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'quick-start' && activeTab === 'quick-access') ||
            (item.id === 'prompt-trading' && activeTab === 'prompt-chart') ||
            (item.id === 'news-calendar' && (activeTab === 'news' || activeTab === 'news-calendar'));

          if (item.isPillBadge) {
            return (
              <button
                key={item.id}
                id={`quick-menu-item-${item.id}`}
                onClick={() => onNavigateToTab(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#3b186b] text-[#d8b4fe] border border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                    : 'bg-[#18132d] hover:bg-[#261c47] text-[#c084fc] hover:text-white border border-[#6b21a8]/60 hover:border-[#a855f7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>{item.label}</span>
              </button>
            );
          }

          if (item.isUploadBadge) {
            return (
              <button
                key={item.id}
                id={`quick-menu-item-${item.id}`}
                onClick={() => onNavigateToTab(item.id)}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer shrink-0 group ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                    : 'bg-[#7c3aed] group-hover:bg-[#8b5cf6]'
                }`}>
                  <Icon className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                </div>
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`quick-menu-item-${item.id}`}
              onClick={() => onNavigateToTab(item.id)}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium tracking-tight whitespace-nowrap transition-all cursor-pointer shrink-0 group ${
                isActive
                  ? 'text-[#c084fc] bg-[#1a1630] font-semibold border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#131627]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isActive
                    ? 'text-[#c084fc]'
                    : 'text-slate-400 group-hover:text-purple-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          id="quick-menu-scroll-right-btn"
          aria-label="Scroll menu right"
          onClick={() => scrollByDirection(1)}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 w-7 h-7 rounded-full bg-[#12162a] border border-[#2a3150] text-slate-200 hover:text-white hover:bg-[#1b2140] shadow-md flex items-center justify-center cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
};
