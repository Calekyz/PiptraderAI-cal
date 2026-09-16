import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  Clock, 
  Search, 
  BookOpen, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Volume2, 
  Maximize2 
} from 'lucide-react';

interface TutorialGuide {
  id: string;
  category: string;
  categoryBadge: string;
  bannerTitle: string;
  headline: string;
  description: string;
  duration: string;
  accentColor: string;
  mockupType: 'phone-auth' | 'phone-signals' | 'phone-chart' | 'phone-refer' | 'desktop-builder' | 'cards';
  keySteps: string[];
}

export const HowToUseView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialGuide | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const categories = [
    'All',
    'Getting Started',
    'Signal Of The Day',
    'News IQ',
    'Refer & Earn',
    'Upload Chart',
    'Upload Charts',
    'How to Subscribe',
    'MT5 Connection',
    'Pulse Signals',
    'Build Bot',
    'AI Trading',
    'Auto Trading'
  ];

  const tutorials: TutorialGuide[] = [
    {
      id: 'intro',
      category: 'Getting Started',
      categoryBadge: 'Getting Started',
      bannerTitle: 'Introduction',
      headline: 'PIPNEX AI - Official Platform Introduction | Getting Started',
      description: 'Welcome to PIPNEX AI. In this introduction, we\'ll give you an overview of the platform and the tools available to help you master automated forex trading.',
      duration: '0:45s',
      accentColor: 'from-[#3b156b] to-[#1e0d3d]',
      mockupType: 'phone-auth',
      keySteps: [
        'Platform navigation overview & workspace tours',
        'Understanding AI bot engine capabilities and latency limits',
        'Exploring Gemina AI Voice & Vision Assistant for instant market briefings'
      ]
    },
    {
      id: 'signup',
      category: 'Getting Started',
      categoryBadge: 'Getting Started',
      bannerTitle: 'Sign Up',
      headline: 'PIPNEX AI - How to Create Your Account | Sign Up',
      description: 'Learn how to create your PIPNEX AI account. This quick tutorial walks you through the account creation process so you can get started immediately.',
      duration: '0:50s',
      accentColor: 'from-[#2e1057] to-[#18092d]',
      mockupType: 'phone-auth',
      keySteps: [
        'Filling out verified trader registration details',
        'Setting up secure 256-bit encrypted passwords',
        'Activating free trial access to core trading modules'
      ]
    },
    {
      id: 'signin',
      category: 'Getting Started',
      categoryBadge: 'Getting Started',
      bannerTitle: 'Sign In',
      headline: 'PIPNEX AI - How to Sign In | Access Your Account',
      description: 'Learn how to sign in to your PIPNEX AI account and access your trading dashboard. In this quick tutorial, we\'ll show you how to securely log in.',
      duration: '0:27s',
      accentColor: 'from-[#321359] to-[#190a2e]',
      mockupType: 'phone-auth',
      keySteps: [
        'Entering credentials and bypassing session timeouts',
        'Two-factor authentication (2FA) verification steps',
        'Restoring saved bot parameters and strategy configurations'
      ]
    },
    {
      id: 'sotd',
      category: 'Signal Of The Day',
      categoryBadge: 'Signal Of The Day',
      bannerTitle: 'Signal Of The Day',
      headline: 'PIPNEX AI - Signal of the Day | AI-Powered Trading Setups',
      description: 'Discover PIPNEX AI\'s Signal of the Day feature. Receive an AI-assisted trading setup with market analysis, trade direction, entries, and targets.',
      duration: '0:42s',
      accentColor: 'from-[#3b156b] to-[#1a0833]',
      mockupType: 'phone-signals',
      keySteps: [
        'Reviewing daily high-probability setups curated by AI models',
        'Examining entry, Take Profit 1/2, and Stop Loss parameters',
        'Executing directly into your connected broker terminal'
      ]
    },
    {
      id: 'newsiq',
      category: 'News IQ',
      categoryBadge: 'News IQ',
      bannerTitle: 'News IQ',
      headline: 'PIPNEX AI - NewsIQ | AI Fundamental Market Analysis',
      description: 'Learn how NewsIQ helps you understand market-moving news with AI-powered fundamental analysis. NewsIQ analyzes global economic releases.',
      duration: '1:06m',
      accentColor: 'from-[#2c0f52] to-[#140626]',
      mockupType: 'phone-chart',
      keySteps: [
        'Tracking CPI, NFP, and Central Bank interest rate decisions',
        'AI sentiment scoring and volatility forecast ranges',
        'Auto-pausing active bots before high-impact red folder news'
      ]
    },
    {
      id: 'referral',
      category: 'Refer & Earn',
      categoryBadge: 'Refer & Earn',
      bannerTitle: 'Referral Program',
      headline: 'PIPNEX AI - Referral Program | How to Refer & Earn',
      description: 'Learn how the PIPNEX AI referral program works and how you can share PIPNEX AI with others. Follow this tutorial to access your referral link.',
      duration: '1:12m',
      accentColor: 'from-[#3f1673] to-[#200b3b]',
      mockupType: 'phone-refer',
      keySteps: [
        'Generating your custom affiliate referral links',
        'Tracking signups and subscription commissions in real-time',
        'Receiving monthly payouts via Crypto (USDT) or Bank Wire'
      ]
    },
    {
      id: 'upload-chart',
      category: 'Upload Chart',
      categoryBadge: 'Upload Chart',
      bannerTitle: 'Upload Charts',
      headline: 'PIPNEX AI - How to Upload a Trading Chart for AI Analysis',
      description: 'Learn how to upload your trading chart to PIPNEX AI and get AI-powered market analysis. Simply upload your chart and let our system evaluate setups.',
      duration: '1:57m',
      accentColor: 'from-[#351261] to-[#1c0a33]',
      mockupType: 'phone-chart',
      keySteps: [
        'Taking clean screenshots from TradingView, MT4, or MT5',
        'Uploading PNG/JPG to the PipNex Vision Engine',
        'Receiving instant support/resistance and order block readouts'
      ]
    },
    {
      id: 'mtf-intel',
      category: 'Upload Charts',
      categoryBadge: 'Upload Charts',
      bannerTitle: 'Multi-Timeframe Intelligence',
      headline: 'PIPNEX AI - Multi-Timeframe Intelligence | Analyze Multiple Timeframes',
      description: 'Learn how PIPNEX AI uses Multi-Timeframe Intelligence to analyze your market across different timeframes. Get a broader perspective.',
      duration: '2:20m',
      accentColor: 'from-[#3a136b] to-[#1c0836]',
      mockupType: 'phone-chart',
      keySteps: [
        'Correlating Daily trend structure with H1 and M15 execution entry zones',
        'Detecting multi-timeframe liquidity sweeps and fair value gaps',
        'Increasing risk-to-reward ratio from 1:2 to 1:4+'
      ]
    },
    {
      id: 'subscribe',
      category: 'How to Subscribe',
      categoryBadge: 'How to Subscribe',
      bannerTitle: 'Payment Method',
      headline: 'PIPNEX AI - How to Subscribe | Choose Your Trading Plan',
      description: 'Learn how to subscribe to a PIPNEX AI plan and access the platform\'s premium trading features. This tutorial walks you through selecting a plan.',
      duration: '1:18m',
      accentColor: 'from-[#33115e] to-[#17062b]',
      mockupType: 'cards',
      keySteps: [
        'Comparing Pro, Platinum, and Ultimate Institutional tiers',
        'Selecting secure Card or SyncPay crypto checkout',
        'Immediate instant unlocking of automated bot licenses'
      ]
    },
    {
      id: 'mt5',
      category: 'MT5 Connection',
      categoryBadge: 'MT5 Connection',
      bannerTitle: 'MT5 Connection',
      headline: 'PIPNEX AI - How to Connect Your MT5 Account',
      description: 'Learn how to connect your MetaTrader 5 account to PIPNEX AI. Once connected, you can access PIPNEX AI\'s trading tools and execute strategies.',
      duration: '0:48s',
      accentColor: 'from-[#381466] to-[#1b0a30]',
      mockupType: 'phone-auth',
      keySteps: [
        'Finding your MT5 broker server name and investor/master password',
        'Authorizing the zero-latency PipNex Bridge EA',
        'Verifying connected heartbeat status in Settings'
      ]
    },
    {
      id: 'pulse-sig',
      category: 'Pulse Signals',
      categoryBadge: 'Pulse Signals',
      bannerTitle: 'Pulse Signals',
      headline: 'PIPNEX AI - Pulse Signals | Real-Time AI Trading Intelligence',
      description: 'Discover PIPNEX Pulse Signals — AI-powered market intelligence designed to help you identify potential trading opportunities across forex and commodities.',
      duration: '1:22s',
      accentColor: 'from-[#300e5c] to-[#18062e]',
      mockupType: 'phone-signals',
      keySteps: [
        'Enabling browser and email push notifications for instant entries',
        'Interpreting institutional order flow and confidence levels',
        'Automating Take Profit trailing brackets'
      ]
    },
    {
      id: 'strategy-builder',
      category: 'Build Bot',
      categoryBadge: 'Build Bot',
      bannerTitle: 'AI Strategy Builder',
      headline: 'PIPNEX AI - Build Your Own Trading Bot with AI',
      description: 'Learn how to build your own automated trading bot using PIPNEX AI\'s Strategy Builder. Simply describe your trading rules in plain English.',
      duration: '3:00m',
      accentColor: 'from-[#3f1673] to-[#200b3b]',
      mockupType: 'desktop-builder',
      keySteps: [
        'Writing natural language strategy prompts (e.g. "Buy Gold on Asian low sweep")',
        'Configuring max lot sizes, daily stop limits, and trailing steps',
        'Backtesting against 5 years of historical tick data'
      ]
    },
    {
      id: 'ai-trading',
      category: 'AI Trading',
      categoryBadge: 'AI Trading',
      bannerTitle: 'AI Trading',
      headline: 'PIPNEX AI - AI Trading System & Real-Time Setups',
      description: 'Master how the neural trade confirmation algorithms filter false breakouts and detect institutional liquidity pools.',
      duration: '1:45m',
      accentColor: 'from-[#32115e] to-[#18072e]',
      mockupType: 'phone-chart',
      keySteps: [
        'Understanding algorithmic confidence filters (>85%)',
        'Automated multi-session volume confirmation',
        'Instant one-click execution from analysis to MT5'
      ]
    },
    {
      id: 'auto-trading',
      category: 'Auto Trading',
      categoryBadge: 'Auto Trading',
      bannerTitle: 'Auto Trading',
      headline: 'PIPNEX AI - Automated MT5 Execution Engine',
      description: 'Step-by-step setup guide for hands-free bot execution with strict risk guardrails and prop firm pass protection.',
      duration: '2:15m',
      accentColor: 'from-[#2e0e57] to-[#16062b]',
      mockupType: 'phone-auth',
      keySteps: [
        'Setting maximum daily loss guardrails (<4%)',
        'Configuring automated weekend and high-impact news exit rules',
        'Live trade tracking with real-time telemetry logs'
      ]
    }
  ];

  const filteredTutorials = selectedCategory === 'All'
    ? tutorials
    : tutorials.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Pills Bar matching Screenshot 3 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#181b2e] text-white border border-purple-500/50 shadow-sm'
                  : 'bg-[#0a0b12] text-gray-400 hover:text-gray-200 hover:bg-[#121422] border border-[#171929]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tutorial Cards Grid matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTutorials.map((tut) => (
          <div
            key={tut.id}
            onClick={() => {
              setSelectedTutorial(tut);
              setIsPlaying(false);
            }}
            className="group bg-[#080911] border border-[#161828] hover:border-purple-500/40 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-950/20"
          >
            {/* Top Purple Gradient Artwork Thumbnail */}
            <div className={`relative h-44 bg-gradient-to-br ${tut.accentColor} p-4 flex flex-col justify-between overflow-hidden`}>
              {/* Brand Logo & Watermark */}
              <div className="flex items-center gap-1.5 text-white/90 font-mono text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>pipnex</span>
              </div>

              {/* Center Title Art */}
              <div className="z-10 my-auto">
                <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {tut.bannerTitle}
                </h3>
              </div>

              {/* Visual Device Mockup Art overlay */}
              <div className="absolute right-3 top-4 bottom-4 w-28 bg-[#0a0b14]/80 rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-sm flex flex-col justify-between overflow-hidden transform rotate-2 group-hover:rotate-0 transition-transform">
                <div className="w-6 h-1 bg-white/20 rounded-full mx-auto mb-1" />
                <div className="space-y-1 my-auto">
                  <div className="h-2 w-16 bg-purple-400/40 rounded" />
                  <div className="h-1.5 w-12 bg-white/20 rounded" />
                  <div className="h-3 w-20 bg-purple-600/30 rounded mt-2 border border-purple-500/20" />
                </div>
                <div className="h-1 w-8 bg-white/10 rounded-full mx-auto" />
              </div>

              {/* Bottom Duration Badge */}
              <div className="flex items-center justify-end z-10">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-purple-300" />
                  <span>{tut.duration}</span>
                </span>
              </div>

              {/* Play Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>
            </div>

            {/* Card Content Details */}
            <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                {/* Category Badge */}
                <div className="mb-2">
                  <span className="text-[10px] font-semibold text-gray-400 bg-[#121422] border border-[#202438] px-2.5 py-0.5 rounded-full">
                    {tut.categoryBadge}
                  </span>
                </div>

                {/* Headline Title */}
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                  {tut.headline}
                </h4>

                {/* Summary Description */}
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {tut.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#141624] flex items-center justify-between text-[11px] text-purple-400 font-semibold">
                <span>Watch Tutorial</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Video / Tutorial Player Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090a12] border border-[#1d2033] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-4 bg-[#0d0e1a] border-b border-[#1a1d2e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#171a2e] border border-[#2b304c] flex items-center justify-center text-purple-400">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedTutorial.headline}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">Duration: {selectedTutorial.duration}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="p-1.5 rounded-xl bg-[#141624] text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Canvas */}
            <div className="relative bg-[#05060b] h-64 sm:h-80 flex items-center justify-center overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedTutorial.accentColor} opacity-50`} />
              
              {/* Simulated Interactive Playing State */}
              <div className="relative z-10 text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center mx-auto shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <Play className={`w-6 h-6 ml-1 ${isPlaying ? 'opacity-50' : 'fill-current'}`} />
                </div>
                <div className="text-sm font-bold text-white">
                  {isPlaying ? 'Playing PIPNEX AI High-Def Masterclass...' : 'Click to Play High-Def Video Guide'}
                </div>
                <div className="text-xs text-purple-200/80 max-w-sm mx-auto">
                  Interactive step-by-step walkthrough narrated with subtitles and MT5 demonstration.
                </div>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-md p-2.5 flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <Volume2 className="w-3.5 h-3.5 hover:text-white" />
                  <span className="text-[10px] font-mono">0:12 / {selectedTutorial.duration}</span>
                </div>
                <div className="w-1/3 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-1/4" />
                </div>
                <Maximize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Key Action Steps */}
            <div className="p-5 space-y-3 bg-[#0a0b14]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Key Learning Outcomes
              </h4>
              <div className="space-y-2">
                {selectedTutorial.keySteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 bg-[#10121f] p-2.5 rounded-xl border border-[#1b1e30]">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
