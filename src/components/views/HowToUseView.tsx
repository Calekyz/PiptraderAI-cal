import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Play, Clock, Search, BookOpen, X, CheckCircle2,
  ChevronRight, Volume2, Maximize2, Rocket, HelpCircle, Upload,
  Radio, MessageSquare, ArrowRight, ChevronDown,
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
  tryAction?: { tab?: string; label: string };
  /** Optional YouTube video URL (fallback if admin hasn't set one) */
  youtubeUrl?: string;
}

interface HowToUseViewProps {
  user?: { firstName?: string; isVerified?: boolean; mt5Connected?: boolean; plan?: string };
  onNavigateToTab?: (tab: string) => void;
  onOpenMT5?: () => void;
  onOpenNova?: (tab?: 'chat' | 'vision') => void;
}

// ─── YouTube URL parser ──────────────────────────────────────
// Accepts any of: youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed/ID · raw 11-char ID
function getYouTubeId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : trimmed;
}

interface FAQItem { q: string; a: string; }

export const HowToUseView: React.FC<HowToUseViewProps> = ({
  user,
  onNavigateToTab,
  onOpenMT5,
  onOpenNova,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialGuide | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  const [setupProgress, setSetupProgress] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('pipnex_setup_progress');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    setSetupProgress((prev) => {
      const next = { ...prev };
      next.accountCreated = true;
      if (user?.isVerified) next.verify = true;
      if (user?.mt5Connected) next.mt5 = true;
      if (user?.plan && user.plan !== 'Pending') next.plan = true;
      return next;
    });
  }, [user?.isVerified, user?.mt5Connected, user?.plan]);

  useEffect(() => {
    try { localStorage.setItem('pipnex_setup_progress', JSON.stringify(setupProgress)); } catch {}
  }, [setupProgress]);

  useEffect(() => {
    fetch('/api/tutorials')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.videos && typeof d.videos === 'object') {
          setVideoUrls(d.videos);
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  const categories = ['All','Getting Started','Signal Of The Day','News IQ','Refer & Earn','Upload Chart','Upload Charts','How to Subscribe','MT5 Connection','Pulse Signals','Build Bot','AI Trading','Auto Trading'];

  const tutorials: TutorialGuide[] = [
    { id:'intro', category:'Getting Started', categoryBadge:'Getting Started', bannerTitle:'Introduction', headline:'PIPTRADERAI - Official Platform Introduction | Getting Started', description:"Welcome to PIPTRADERAI. Get an overview of the platform and the tools to master automated forex trading.", duration:'0:45s', accentColor:'from-[#3b156b] to-[#1e0d3d]', mockupType:'phone-auth', keySteps:['Platform navigation overview & workspace tours','Understanding AI bot engine capabilities','Exploring Nova AI Voice & Vision Assistant'], tryAction:{ label:'Take the dashboard tour' } },
    { id:'signup', category:'Getting Started', categoryBadge:'Getting Started', bannerTitle:'Sign Up', headline:'PIPTRADERAI - How to Create Your Account | Sign Up', description:"Learn how to create your PIPTRADERAI account in under a minute.", duration:'0:50s', accentColor:'from-[#2e1057] to-[#18092d]', mockupType:'phone-auth', keySteps:['Filling out verified trader registration details','Setting up secure 256-bit encrypted passwords','Activating free trial access'] },
    { id:'signin', category:'Getting Started', categoryBadge:'Getting Started', bannerTitle:'Sign In', headline:'PIPTRADERAI - How to Sign In | Access Your Account', description:"Learn how to sign in to your PIPTRADERAI account securely.", duration:'0:45s', accentColor:'from-[#26104a] to-[#130725]', mockupType:'phone-auth', keySteps:['Accessing your trading dashboard quickly','Using two-factor security authentication','Recovering your account if you forget your password'] },
    { id:'sotd', category:'Signal Of The Day', categoryBadge:'Signal Of The Day', bannerTitle:'Signal of the Day', headline:'PIPTRADERAI - Signal of the Day | AI-Powered Trading Setups', description:"Our engine generates a high-probability daily setup with entry, stop loss and take-profit levels.", duration:'1:10s', accentColor:'from-[#1e1160] to-[#0e0838]', mockupType:'phone-signals', keySteps:['Understanding entry, stop-loss and take-profit zones','Verifying signals with the AI verification badge','Copying signal details directly to MT5'], tryAction:{ tab:'pulse-signals', label:'View Pulse Signals' } },
    { id:'newsiq', category:'News IQ', categoryBadge:'News IQ', bannerTitle:'News IQ', headline:'PIPTRADERAI - NewsIQ | AI Fundamental Market Analysis', description:"Fundamental analysis on NFP, CPI, FOMC and PPI with clear BUY/SELL predictions.", duration:'1:20s', accentColor:'from-[#1a1550] to-[#0b0830]', mockupType:'cards', keySteps:['Reading the STRONG BUY / STRONG SELL banner','Understanding the AI verification verdict','Timing entries around high-impact news'], tryAction:{ tab:'news-calendar', label:'Open News & Calendar' } },
    { id:'referral', category:'Refer & Earn', categoryBadge:'Refer & Earn', bannerTitle:'Refer & Earn', headline:'PIPTRADERAI - Referral Program | How to Refer & Earn', description:"Share PIPTRADERAI with others and earn credits on every successful signup.", duration:'1:05s', accentColor:'from-[#231567] to-[#100839]', mockupType:'phone-refer', keySteps:['Locating your unique referral link','Sharing with your trading community','Earning credits on every successful signup'] },
    { id:'upload-chart', category:'Upload Chart', categoryBadge:'Upload Chart', bannerTitle:'Upload Chart', headline:'PIPTRADERAI - How to Upload a Trading Chart for AI Analysis', description:"Upload any chart screenshot — Nova AI Vision reads the chart and gives you a full trade plan.", duration:'1:15s', accentColor:'from-[#2b1568] to-[#180b3d]', mockupType:'phone-chart', keySteps:['Taking a clean chart screenshot','Nova AI Vision reading your chart','Interpreting the entry, stop and take-profit plan'], tryAction:{ tab:'upload-chart', label:'Upload a chart now' } },
    { id:'mtf-intel', category:'Upload Charts', categoryBadge:'Multi-Timeframe', bannerTitle:'Multi-Timeframe', headline:'PIPTRADERAI - Multi-Timeframe Intelligence | Analyze Multiple Timeframes', description:"Analyze the same setup across M15, H1, H4 and D1 in one screen.", duration:'1:30s', accentColor:'from-[#142058] to-[#0a1030]', mockupType:'cards', keySteps:['Switching between timeframes instantly','Spotting confluence across H1 / H4 / D1','Locking in higher-probability entries'], tryAction:{ tab:'upload-chart', label:'Try multi-TF upload' } },
    { id:'subscribe', category:'How to Subscribe', categoryBadge:'How to Subscribe', bannerTitle:'Subscribe', headline:'PIPTRADERAI - How to Subscribe | Choose Your Trading Plan', description:"Learn how to subscribe to a PIPTRADERAI plan and unlock premium features.", duration:'1:00s', accentColor:'from-[#1e1160] to-[#0e0838]', mockupType:'cards', keySteps:['Comparing Starter, Pro and Elite plans','Unlocking Pulse Signals and automated bots','Managing billing and payment methods'], tryAction:{ tab:'subscription', label:'View plans' } },
    { id:'mt5', category:'MT5 Connection', categoryBadge:'MT5 Connection', bannerTitle:'MT5 Connection', headline:'PIPTRADERAI - How to Connect Your MT5 Account', description:"Connect MetaTrader 5 for live execution, position syncing and automated trading.", duration:'1:40s', accentColor:'from-[#113055] to-[#081828]', mockupType:'desktop-builder', keySteps:['Finding your MT5 login and server details','Entering credentials securely','Verifying the live connection status'], tryAction:{ label:'Connect MT5 now' } },
    { id:'pulse-sig', category:'Pulse Signals', categoryBadge:'Pulse Signals', bannerTitle:'Pulse Signals', headline:'PIPTRADERAI - Pulse Signals | Real-Time AI Trading Intelligence', description:"Live feed of institutional setups across forex, commodities and crypto. Every signal is AI-verified.", duration:'1:25s', accentColor:'from-[#143451] to-[#0a1a28]', mockupType:'phone-signals', keySteps:['Reading the live signal feed','Interpreting the AI Caution / Verified badge','Executing with the one-click Trade button'], tryAction:{ tab:'pulse-signals', label:'Open Pulse Signals' } },
    { id:'strategy-builder', category:'Build Bot', categoryBadge:'Build Bot', bannerTitle:'Build Bot', headline:'PIPTRADERAI - Build Your Own Trading Bot with AI', description:"Build, backtest and deploy automated trading strategies without coding.", duration:'2:00s', accentColor:'from-[#231467] to-[#120836]', mockupType:'desktop-builder', keySteps:['Describing your strategy in plain English','Backtesting against historical data','Deploying to your connected MT5 account'], tryAction:{ tab:'manage-bots', label:'Open Manage Bots' } },
    { id:'ai-trading', category:'AI Trading', categoryBadge:'AI Trading', bannerTitle:'AI Trading', headline:'PIPTRADERAI - AI Trading System & Real-Time Setups', description:"Ask Nova AI anything about a live chart and get instant structure analysis + Nova review.", duration:'1:50s', accentColor:'from-[#2a1163] to-[#150735]', mockupType:'phone-chart', keySteps:['Asking Nova AI questions about live charts','Reading the Nova Review card below each reply','Acting on Nova recommendations'], tryAction:{ tab:'ai-trading', label:'Open AI Trading' } },
    { id:'auto-trading', category:'Auto Trading', categoryBadge:'Auto Trading', bannerTitle:'Auto Trading', headline:'PIPTRADERAI - Automated MT5 Execution Engine', description:"Let the engine place trades automatically with risk guardrails and 1% max risk per trade.", duration:'2:10s', accentColor:'from-[#1a0f52] to-[#0a0524]', mockupType:'desktop-builder', keySteps:['Enabling auto-trading on your account','Setting max risk per trade and daily limits','Monitoring open positions in real time'], tryAction:{ tab:'auto-trading', label:'Open Auto Trading' } },
  ];

  const filteredTutorials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tutorials.filter((t) => {
      const catMatch = selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase();
      const searchMatch = !q || t.headline.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.bannerTitle.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [tutorials, selectedCategory, searchQuery]);

  const checklist = [
    { id:'accountCreated', label:'Create your account', done:true, action:null as null | { label:string; onClick:()=>void } },
    { id:'verify', label:'Verify your email', done: !!user?.isVerified, action:{ label:'Verify now', onClick: () => onNavigateToTab?.('settings') } },
    { id:'mt5', label:'Connect your MT5 account', done: !!user?.mt5Connected, action:{ label:'Connect MT5', onClick: () => onOpenMT5?.() } },
    { id:'plan', label:'Choose a trading plan', done: !!user?.plan && user.plan !== 'Pending', action:{ label:'View plans', onClick: () => onNavigateToTab?.('subscription') } },
    { id:'firstChart', label:'Upload your first chart', done: !!setupProgress.firstChart, action:{ label:'Upload now', onClick: () => onNavigateToTab?.('upload-chart') } },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const progressPct = Math.round((doneCount / checklist.length) * 100);

  const faqs: FAQItem[] = [
    { q:'How do I connect my MT5 account?', a:'Click your profile menu (top-right) → "MT5 Account Connection" → enter your MT5 login, password and server name. The connection is verified instantly and encrypted. Disconnect any time from the same menu.' },
    { q:'What is the difference between Pulse Signals and AI Trading?', a:'Pulse Signals is a live feed of institutional setups across many symbols. AI Trading is a chat experience where you ask Nova AI specific questions about a chart and get real-time structure analysis plus recommendations.' },
    { q:'How does Nova AI verify signals?', a:'Every engine signal goes through a silent AI review. Nova returns AGREE (validated), CAUTION (weakness detected) or DISAGREE (with an alternative). Click the badge next to a signal to read the reasoning.' },
    { q:'Are my uploaded charts safe?', a:'Yes. Uploaded charts go to Google Gemini Vision for analysis only. They are not stored on our servers. You have 3 AI chart uploads per platform cycle.' },
    { q:'What is a "STRONG BUY" vs a "STRONG SELL"?', a:'Highest-confidence directional signals. STRONG BUY = engine + AI verifier both see upside; STRONG SELL = both see downside. Always use the entry, stop-loss and take-profit shown.' },
    { q:'How do I turn on Auto Trading?', a:'Auto Trading requires Pro or Elite plan and a connected MT5 account. Go to Auto Trading tab, enable the toggle, set max risk (we recommend 1%), and the engine places trades automatically.' },
    { q:'What happens if the AI is unavailable?', a:'The engine works independently. If Nova AI is temporarily unavailable, signals still display — just without the AI verification badge. Nothing breaks.' },
    { q:'How do I cancel my subscription?', a:'Go to Subscription tab → Manage → Cancel. Your plan stays active until end of cycle, then reverts to Starter.' },
    { q:'Can I trade from multiple devices?', a:'Yes. Your account works on desktop, tablet and mobile. Add to home screen for a native app experience (iOS: Share → Add to Home Screen; Android: ⋮ Menu → Install app).' },
    { q:'How does the referral program work?', a:'Share your unique referral link from Refer & Earn. Every trader who signs up and subscribes to a plan gives you account credits toward your own subscription.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1e2440] bg-gradient-to-br from-[#1a0f2e] via-[#100a22] to-[#0a0818] p-6 sm:p-8">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 font-mono">How to Use · Quick Start</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Get productive in 5 minutes</h1>
            <p className="text-sm text-purple-200/70 mt-1.5 max-w-2xl leading-relaxed">
              Welcome to PipTraderAI{user?.firstName ? ', ' + user.firstName : ''}. Follow the checklist, watch the guides, and you will be placing AI-verified setups in no time.
            </p>
          </div>
          <button onClick={() => onOpenNova?.('chat')} className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white text-xs font-bold shadow-lg hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Ask Nova AI
          </button>
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="rounded-3xl border border-[#1e2440] bg-[#0a0c18] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#1a1d30]">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">Your Setup Progress</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-purple-300">{doneCount} / {checklist.length} complete</span>
              <span className="text-sm font-black text-white font-mono">{progressPct}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[#131730] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500" style={{ width: progressPct + '%' }} />
          </div>
        </div>
        <div className="divide-y divide-[#14172a]">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4 hover:bg-[#0c0f20] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ' + (item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#252a44] text-transparent')}>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <span className={'text-sm ' + (item.done ? 'text-gray-400 line-through' : 'text-white font-semibold')}>{item.label}</span>
              </div>
              {!item.done && item.action && (
                <button onClick={item.action.onClick} className="shrink-0 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1">
                  {item.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {item.done && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Done ✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search guides — try 'MT5', 'upload', 'news'..." className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#0a0c18] border border-[#1c2038] focus:border-purple-500/60 text-sm text-white placeholder-gray-500 outline-none transition-colors" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#181c30] text-gray-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ' + (isSelected ? 'bg-[#181b2e] text-white border border-purple-500/50 shadow-sm' : 'bg-[#0a0b12] text-gray-400 hover:text-gray-200 hover:bg-[#121422] border border-[#171929]')}>
                {cat}
              </button>
            );
          })}
        </div>
        {filteredTutorials.length === 0 && (
          <div className="py-12 text-center space-y-2 rounded-2xl border border-dashed border-[#1e2338] bg-[#0a0c18]">
            <HelpCircle className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">No guides match "{searchQuery}"</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer">Clear filters</button>
          </div>
        )}
      </div>

      {/* TUTORIAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTutorials.map((tut) => (
          <div key={tut.id} onClick={() => { setSelectedTutorial(tut); setIsPlaying(false); }} className="group bg-[#080911] border border-[#161828] hover:border-purple-500/40 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-950/20">
            <div className={'relative h-44 bg-gradient-to-br ' + tut.accentColor + ' p-4 flex flex-col justify-between overflow-hidden'}>
              <div className="flex items-center gap-1.5 text-white/90 font-mono text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>PipTraderAI</span>
              </div>
              <div className="z-10 my-auto">
                <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">{tut.bannerTitle}</h3>
              </div>
              <div className="absolute right-3 top-4 bottom-4 w-28 bg-[#0a0b14]/80 rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-sm flex flex-col justify-between overflow-hidden transform rotate-2 group-hover:rotate-0 transition-transform">
                <div className="w-6 h-1 bg-white/20 rounded-full mx-auto mb-1" />
                <div className="space-y-1 my-auto">
                  <div className="h-2 w-16 bg-purple-400/40 rounded" />
                  <div className="h-1.5 w-12 bg-white/20 rounded" />
                  <div className="h-3 w-20 bg-purple-600/30 rounded mt-2 border border-purple-500/20" />
                </div>
                <div className="h-1 w-8 bg-white/10 rounded-full mx-auto" />
              </div>
              <div className="flex items-center justify-end z-10">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-purple-300" />
                  <span>{tut.duration}</span>
                </span>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="mb-2">
                  <span className="text-[10px] font-semibold text-gray-400 bg-[#121422] border border-[#202438] px-2.5 py-0.5 rounded-full">{tut.categoryBadge}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">{tut.headline}</h4>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">{tut.description}</p>
              </div>
              <div className="pt-2 border-t border-[#141624] flex items-center justify-between text-[11px] text-purple-400 font-semibold">
                <span>Open Guide</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-3xl border border-[#1e2440] bg-[#0a0c18] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#1a1d30]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">Frequently Asked Questions</h2>
          </div>
        </div>
        <div className="divide-y divide-[#14172a]">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i}>
                <button onClick={() => setOpenFaq(isOpen ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#0c0f20] transition-colors cursor-pointer text-left">
                  <span className={'text-sm font-semibold ' + (isOpen ? 'text-purple-300' : 'text-white')}>{faq.q}</span>
                  <ChevronDown className={'w-4 h-4 shrink-0 text-gray-500 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
                </button>
                {isOpen && (<div className="px-4 pb-4 -mt-1"><p className="text-[13px] text-gray-400 leading-relaxed">{faq.a}</p></div>)}
              </div>
            );
          })}
        </div>
      </div>

      {/* READY TO PRACTICE */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1a0f2e] via-[#0f0d1e] to-[#0a0818] p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-4">
          <Rocket className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Ready to practice?</h2>
            <p className="text-xs text-purple-200/70 mt-1">Jump straight into the tools you just learned about.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => onNavigateToTab?.('upload-chart')} className="p-3.5 rounded-2xl bg-[#0f1428] hover:bg-[#181c34] border border-[#232744] hover:border-purple-500/50 transition-all cursor-pointer text-left group">
            <Upload className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Upload Chart</div>
            <div className="text-[10px] text-gray-400 mt-0.5">AI vision analysis</div>
          </button>
          <button onClick={() => onNavigateToTab?.('pulse-signals')} className="p-3.5 rounded-2xl bg-[#0f1428] hover:bg-[#181c34] border border-[#232744] hover:border-emerald-500/50 transition-all cursor-pointer text-left group">
            <Radio className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Pulse Signals</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Live setups feed</div>
          </button>
          <button onClick={() => onNavigateToTab?.('ai-trading')} className="p-3.5 rounded-2xl bg-[#0f1428] hover:bg-[#181c34] border border-[#232744] hover:border-purple-500/50 transition-all cursor-pointer text-left group">
            <MessageSquare className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">AI Trading</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Chat with Nova</div>
          </button>
          <button onClick={() => onOpenNova?.('chat')} className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1a0f2e] to-[#0f0d1e] border border-purple-500/40 hover:border-purple-400 transition-all cursor-pointer text-left group">
            <Sparkles className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Ask Nova</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Instant AI chat</div>
          </button>
        </div>
      </div>

      {/* TUTORIAL MODAL */}
      {selectedTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090a12] border border-[#1d2033] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0d0e1a] border-b border-[#1a1d2e] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-[#171a2e] border border-[#2b304c] flex items-center justify-center text-purple-400 shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">{selectedTutorial.headline}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">Duration: {selectedTutorial.duration}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTutorial(null)} className="p-1.5 rounded-xl bg-[#141624] text-gray-400 hover:text-white cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {((videoUrls[selectedTutorial.id] || selectedTutorial.youtubeUrl)) ? (
              <div className="relative bg-black w-full aspect-video">
                <iframe
                  src={'https://www.youtube.com/embed/' + getYouTubeId((videoUrls[selectedTutorial.id] || selectedTutorial.youtubeUrl) || '') + '?autoplay=1&rel=0&modestbranding=1'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedTutorial.headline}
                />
              </div>
            ) : (
              <div className="relative bg-[#05060b] h-64 sm:h-80 flex items-center justify-center overflow-hidden">
                <div className={'absolute inset-0 bg-gradient-to-br ' + selectedTutorial.accentColor + ' opacity-50'} />
                <div className="relative z-10 text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-purple-600/40 border-2 border-purple-500/60 text-purple-200 flex items-center justify-center mx-auto shadow-2xl">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                  <div className="text-sm font-bold text-white">Video coming soon</div>
                  <div className="text-xs text-purple-200/70 max-w-sm mx-auto">
                    This tutorial video will be published shortly. Meanwhile, check the key learning outcomes below.
                  </div>
                </div>
              </div>
            )}
            <div className="p-5 space-y-3 bg-[#0a0b14]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Key Learning Outcomes</h4>
              <div className="space-y-2">
                {selectedTutorial.keySteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 bg-[#10121f] p-2.5 rounded-xl border border-[#1b1e30]">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              {selectedTutorial.tryAction && (
                <div className="pt-3 border-t border-[#1a1d30] flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-400">Ready to try it on the live platform?</div>
                  <button onClick={() => {
                    if (selectedTutorial.id === 'mt5') onOpenMT5?.();
                    else if (selectedTutorial.tryAction && selectedTutorial.tryAction.tab) onNavigateToTab?.(selectedTutorial.tryAction.tab);
                    setSelectedTutorial(null);
                  }} className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white text-[11px] font-bold shadow-md hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                    {selectedTutorial.tryAction.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
