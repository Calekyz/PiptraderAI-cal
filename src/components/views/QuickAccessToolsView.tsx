import React, { useState } from 'react';
import { 
  Search, 
  Calculator, 
  Sparkles, 
  Trophy, 
  MessageSquare, 
  Calendar, 
  Layers, 
  BarChart3, 
  Lock, 
  ArrowRight,
  Crown,
  Globe,
  Zap,
  UploadCloud,
  Shield,
  Radio
} from 'lucide-react';
import { HorizontalQuickAccessMenu } from '../HorizontalQuickAccessMenu';

interface QuickAccessToolsProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenUpgrade?: (tier?: 'Pro' | 'Platinum' | 'Ultimate') => void;
}

export const QuickAccessTools: React.FC<QuickAccessToolsProps> = ({ 
  onNavigateToTab,
  onOpenUpgrade 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const primaryTools = [
    {
      id: 'position-calculator',
      title: 'Position Size Calculator',
      description: 'Accurate risk-based lot sizing — based on your balance, risk %, and stop-loss.',
      icon: Calculator,
      iconColor: 'text-emerald-400',
      badgeType: 'premium',
      badgeLabel: null,
      lockType: 'lock',
      heading: 'Premium Feature',
      subtitle: 'Upgrade your plan to access Position Size Calculator',
      targetTab: 'position-calculator',
      requiredTier: 'Pro' as const
    },
    {
      id: 'ai-strategy-builder',
      title: 'AI Strategy Builder',
      description: 'Build complete trading strategies with AI. Generate MQL5, PineScript code, and PDF reports.',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      badgeType: 'premium',
      badgeLabel: null,
      lockType: 'lock',
      heading: 'Premium Feature',
      subtitle: 'Upgrade your plan to access AI Strategy Builder',
      targetTab: 'ai-trading',
      requiredTier: 'Pro' as const
    },
    {
      id: 'proppass',
      title: 'PipNex PropPass',
      description: 'Pass prop firm challenges with AI auto-trading, risk management, and 24/7 compliance monitoring.',
      icon: Trophy,
      iconColor: 'text-purple-400',
      badgeType: 'platinum',
      badgeLabel: 'Platinum Feature',
      lockType: 'diamond',
      heading: 'Platinum Feature',
      subtitle: 'Upgrade your plan to access PipNex PropPass',
      targetTab: 'proppass',
      requiredTier: 'Platinum' as const
    },
    {
      id: 'ai-prompt-trading',
      title: 'AI Prompt Trading',
      description: 'Write your strategy, AI generates trades for MT5 execution. Full automation with risk controls.',
      icon: MessageSquare,
      iconColor: 'text-purple-400',
      badgeType: 'platinum',
      badgeLabel: 'Platinum Feature',
      lockType: 'diamond',
      heading: 'Platinum Feature',
      subtitle: 'Upgrade your plan to access AI Prompt Trading',
      targetTab: 'prompt-trading',
      requiredTier: 'Platinum' as const
    }
  ];

  const exploreMoreTools = [
    {
      id: 'economic-calendar-1',
      title: 'Economic Calendar',
      description: 'High impact news with countdown.',
      icon: Calendar,
      soon: true,
      targetTab: 'overview'
    },
    {
      id: 'economic-calendar-2',
      title: 'Economic Calendar',
      description: 'High impact news with countdown.',
      icon: Calendar,
      soon: true,
      targetTab: 'overview'
    },
    {
      id: 'pattern-detector',
      title: 'Pattern Detector',
      description: 'AI finds triangles, wedges, head & shoulders.',
      icon: Layers,
      soon: true,
      targetTab: 'upload-chart'
    },
    {
      id: 'forex-sentiment',
      title: 'Forex Sentiment',
      description: 'Check long vs short from major brokers.',
      icon: BarChart3,
      soon: true,
      targetTab: 'overview'
    }
  ];

  const filteredPrimary = primaryTools.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExplore = exploreMoreTools.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpgradeClick = (tier: 'Pro' | 'Platinum' | 'Ultimate', targetTab: string) => {
    if (onOpenUpgrade) {
      onOpenUpgrade(tier);
    } else {
      onNavigateToTab(targetTab);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 w-full max-w-5xl mx-auto py-2">
      
      {/* Horizontal Feature Quick Access Strip (Side-by-Side Horizontal Layout) */}
      <div className="w-full rounded-2xl bg-[#0c0e18] border border-[#1b1f35] p-3 shadow-md overflow-hidden">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-purple-300">
            <Zap className="w-3.5 h-3.5" />
            <span>PipNex AI Pro Quick Access</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Horizontal View</span>
        </div>
        <HorizontalQuickAccessMenu
          activeTab="quick-start"
          onNavigateToTab={onNavigateToTab}
          className="border-none bg-transparent py-1 px-0"
        />
      </div>

      {/* 1. Header Section matching Screenshot 1 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#c084fc] tracking-tight">
          Quick Access Tools
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          Your essential trading tools — powered by PipNex intelligence.
        </p>

        {/* Search tools bar matching screenshot */}
        <div className="flex justify-center pt-3">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-[#080a12] border border-[#1b1e2c] focus:border-purple-500/50 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 2. Main 4 Locked / Premium Cards Grid (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPrimary.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="relative rounded-2xl bg-[#06070c] border border-[#161826] p-7 flex flex-col justify-between items-center text-center space-y-6 shadow-xl min-h-[260px] overflow-hidden"
            >
              {/* Subtle Faded Tool Name & Icon at top */}
              <div className="w-full flex items-center justify-between opacity-30 text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${tool.iconColor}`} />
                  <span className="font-semibold text-white">{tool.title}</span>
                </div>
                {tool.badgeLabel && (
                  <span className="text-[10px] text-purple-300 font-mono">
                    {tool.badgeLabel}
                  </span>
                )}
              </div>

              {/* Center Lock / Diamond Icon & Upgrade Details */}
              <div className="flex flex-col items-center justify-center space-y-3 flex-1 py-1">
                {/* Center Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-[#141524] border border-[#262842] flex items-center justify-center text-purple-300 shadow-md">
                  {tool.lockType === 'lock' ? (
                    <Lock className="w-6 h-6 stroke-[1.75]" />
                  ) : (
                    <Sparkles className="w-6 h-6 stroke-[1.75]" />
                  )}
                </div>

                {/* Platinum Feature Badge if applicable */}
                {tool.badgeLabel && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1b162b] border border-purple-500/40 text-purple-300 text-[10px] font-bold font-mono">
                    <span>👑</span>
                    <span>{tool.badgeLabel}</span>
                  </div>
                )}

                {/* Heading */}
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {tool.heading}
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  {tool.subtitle}
                </p>
              </div>

              {/* Upgrade Button */}
              <div className="w-full pt-1">
                <button
                  onClick={() => handleUpgradeClick(tool.requiredTier, tool.targetTab)}
                  className="w-full max-w-xs mx-auto py-2.5 px-6 rounded-xl bg-[#9d83e9] hover:bg-[#ad94f8] text-[#0d0f19] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>Upgrade Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Explore More PipNex Tools Section */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400/20" />
          <h3 className="text-sm md:text-base font-bold text-purple-300 tracking-tight">
            Explore More PipNex Tools
          </h3>
        </div>

        {/* 4 Bottom Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExplore.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-[#06070c] border border-[#161826] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md hover:border-[#25283d] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-[#111322] border border-[#202438] flex items-center justify-center text-purple-400">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    {item.soon && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#121422] border border-[#222638] text-[10px] font-mono text-gray-400 font-bold">
                        Soon
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                      {item.description}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab(item.targetTab)}
                  className="w-full py-1.5 rounded-xl bg-[#0e101a] hover:bg-[#161828] border border-[#1b1f32] text-[11px] font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
