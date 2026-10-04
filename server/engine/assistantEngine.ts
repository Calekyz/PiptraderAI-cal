// ============================================================================
// PIPNEX TRADING ENGINE — ASSISTANT ENGINE
// ----------------------------------------------------------------------------
// Rule-based chat assistant. No AI. No external services.
//
//   • Intent classifier (keyword + regex)
//   • Knowledge base (30+ platform FAQs)
//   • Live wiring to signal engine ("give me a setup for Gold")
//   • Live wiring to news engine ("is USD strong today?")
//   • Live wiring to user session ("what's my plan?")
//
// Called by /api/engine/chat endpoint.
// ============================================================================

import { UserProfile } from '../../src/types';

export interface AssistantContext {
  user?: UserProfile | null;
  // Injected by the caller (server.ts) so we don't import the network layer here
  signalEngine?: (symbol: string, timeframe?: string) => Promise<any> | any;
  newsEngine?: (events: ForexFactoryEvent[]) => any;
  forexFactoryEvents?: ForexFactoryEvent[];
  allPrices?: Record<string, number>;   // symbol → current price
}

export interface ForexFactoryEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | 'Non-Economic';
  actual?: string;
  forecast?: string;
  previous?: string;
  timestamp?: number;
  countdown?: string;
}

export interface AssistantReply {
  reply: string;
  intent: string;
  confidence: number;
  data?: any;
}

// ============================================================================
// SYMBOL ALIASES — map common names to canonical symbols
// ============================================================================
const SYMBOL_ALIASES: Record<string, string> = {
  // Gold
  gold: 'XAUUSD', xau: 'XAUUSD', xauusd: 'XAUUSD', 'xau/usd': 'XAUUSD',
  // Silver
  silver: 'XAGUSD', xag: 'XAGUSD', xagusd: 'XAGUSD', 'xag/usd': 'XAGUSD',
  // Forex majors
  euro: 'EURUSD', eurusd: 'EURUSD', 'eur/usd': 'EURUSD',
  cable: 'GBPUSD', pound: 'GBPUSD', gbpusd: 'GBPUSD', 'gbp/usd': 'GBPUSD',
  yen: 'USDJPY', usdjpy: 'USDJPY', 'usd/jpy': 'USDJPY',
  swissy: 'USDCHF', usdchf: 'USDCHF', 'usd/chf': 'USDCHF',
  loonie: 'USDCAD', usdcad: 'USDCAD', 'usd/cad': 'USDCAD',
  aussie: 'AUDUSD', audusd: 'AUDUSD', 'aud/usd': 'AUDUSD',
  kiwi: 'NZDUSD', nzdusd: 'NZDUSD', 'nzd/usd': 'NZDUSD',
  // Crypto
  bitcoin: 'BTCUSD', btc: 'BTCUSD', btcusd: 'BTCUSD', 'btc/usd': 'BTCUSD',
  ethereum: 'ETHUSD', eth: 'ETHUSD', ethusd: 'ETHUSD', 'eth/usd': 'ETHUSD',
  solana: 'SOLUSD', sol: 'SOLUSD',
  // Indices
  dow: 'US30', us30: 'US30',
  nasdaq: 'NAS100', nas100: 'NAS100', nas: 'NAS100',
  spx: 'SPX500', 'sp500': 'SPX500', spx500: 'SPX500',
  // Energy
  oil: 'WTIUSD', wti: 'WTIUSD', crude: 'WTIUSD',
};

// ============================================================================
// TIMEFRAME ALIASES
// ============================================================================
const TIMEFRAME_PATTERNS: Array<[RegExp, string]> = [
  [/\b(1m|m1|1min|1 minute)\b/i, 'M1'],
  [/\b(5m|m5|5min|5 minute)\b/i, 'M5'],
  [/\b(15m|m15|15min|15 minute)\b/i, 'M15'],
  [/\b(30m|m30|30min|30 minute)\b/i, 'M30'],
  [/\b(1h|h1|1hr|hour)\b/i, 'H1'],
  [/\b(4h|h4|4hr|4 hour)\b/i, 'H4'],
  [/\b(1d|d1|daily|day)\b/i, 'D1'],
  [/\b(1w|w1|weekly)\b/i, 'W1'],
];

// ============================================================================
// INTENT PATTERNS — checked in order
// ============================================================================
interface IntentRule {
  intent: string;
  patterns: RegExp[];
  weight?: number;   // higher = checked first
}

const INTENT_RULES: IntentRule[] = [
  // ─── Trading signals / setups ───
  {
    intent: 'get_setup',
    weight: 100,
    patterns: [
      /\b(setup|signal|analysis|analyze|analyse|trade idea|idea for)\b.*\b(gold|silver|euro|pound|yen|cable|aussie|kiwi|btc|eth|oil|nas|dow|spx|eurusd|gbpusd|usdjpy|xauusd|xagusd|btcusd|audusd|usdcad|usdchf|nzdusd)\b/i,
      /\b(give me|show me|what'?s? the|any)\b.*\b(setup|signal|analysis)\b/i,
      /\b(buy|sell|long|short)\b.*\b(gold|silver|euro|pound|yen|btc|eth|xauusd|eurusd|gbpusd)\b/i,
    ],
  },

  // ─── News / USD strength ───
  {
    intent: 'news_bias',
    weight: 95,
    patterns: [
      /\b(usd|dollar|fed|fomc|nfp|cpi|inflation)\b.*\b(strong|weak|bias|today|this week|analysis|outlook|forecast)\b/i,
      /\b(news|economic|fundamentals?)\b.*\b(usd|dollar|eur|gbp|jpy|gold|today)\b/i,
      /\b(is|will)\b.*\b(usd|dollar)\b.*\b(strong|weak|bullish|bearish)\b/i,
    ],
  },

  // ─── Platform knowledge: MT5 ───
  {
    intent: 'platform_mt5',
    weight: 80,
    patterns: [
      /\bmt5\b|\bmt4\b|\bmetatrader\b/i,
      /\bconnect\b.*\b(account|broker|terminal)\b/i,
      /\bbroker\b.*\bconnect\b/i,
    ],
  },

  // ─── Platform knowledge: Subscription / plans ───
  {
    intent: 'platform_pricing',
    weight: 80,
    patterns: [
      /\b(plan|pricing|subscription|upgrade|how much|cost|price|tier)\b/i,
      /\b(starter|pro|elite)\b.*\b(plan|cost|price)\b/i,
    ],
  },

  // ─── My account ───
  {
    intent: 'my_account',
    weight: 78,
    patterns: [
      /\b(my|current)\b.*\b(plan|account|subscription|balance|credits?)\b/i,
      /\bwhat'?s? my\b/i,
    ],
  },

  // ─── Payment methods ───
  {
    intent: 'platform_payment',
    weight: 75,
    patterns: [
      /\b(pay|payment|mpesa|m-?pesa|binance|usdt|deposit|how to pay)\b/i,
      /\b(accept|methods?)\b.*\b(pay|payment)\b/i,
    ],
  },

  // ─── Password reset ───
  {
    intent: 'platform_password',
    weight: 75,
    patterns: [
      /\bforgot\b.*\bpassword\b/i,
      /\breset\b.*\bpassword\b/i,
      /\b(can'?t|cannot)\b.*\b(login|sign in|log in)\b/i,
    ],
  },

  // ─── Signals navigation ───
  {
    intent: 'platform_signals_location',
    weight: 72,
    patterns: [
      /\bwhere\b.*\b(signal|pulse|setup|analysis)\b/i,
      /\bfind\b.*\b(signal|pulse)\b/i,
    ],
  },

  // ─── Upload chart ───
  {
    intent: 'platform_upload',
    weight: 72,
    patterns: [
      /\bupload\b.*\b(chart|image|screenshot)\b/i,
      /\bhow\b.*\b(upload|analyze|analyse)\b.*\b(chart|image)\b/i,
    ],
  },

  // ─── PropPass ───
  {
    intent: 'platform_proppass',
    weight: 70,
    patterns: [
      /\b(prop\s*pass|proppass|prop\s*firm|ftmo|fundednext|mff|funded)\b/i,
    ],
  },

  // ─── Bots / Auto trading ───
  {
    intent: 'platform_bots',
    weight: 70,
    patterns: [
      /\b(bot|bots|auto\s*trad|automation|ea|expert advisor)\b/i,
    ],
  },

  // ─── Contact support ───
  {
    intent: 'platform_support',
    weight: 68,
    patterns: [
      /\b(support|help|contact|human|agent|talk to)\b.*\b(person|human|team|support)?\b/i,
      /\b(phone|email|whatsapp)\b.*\b(support|contact)\b/i,
    ],
  },

  // ─── About the platform ───
  {
    intent: 'platform_about',
    weight: 65,
    patterns: [
      /\bwhat\b.*\b(pipnex|this platform|this site|you do|you offer)\b/i,
      /\bwho\b.*\b(you|are you)\b/i,
      /\babout\b.*\b(pipnex|platform)\b/i,
    ],
  },

  // ─── Referral ───
  {
    intent: 'platform_referral',
    weight: 65,
    patterns: [
      /\b(referral|refer|invite|affiliate)\b/i,
    ],
  },

  // ─── Greeting ───
  {
    intent: 'greeting',
    weight: 60,
    patterns: [
      /^\s*(hi|hello|hey|good\s*(morning|afternoon|evening)|yo)\s*[!?.,]?\s*$/i,
    ],
  },

  // ─── Thanks ───
  {
    intent: 'thanks',
    weight: 60,
    patterns: [
      /\b(thank|thanks|appreciate|cheers)\b/i,
    ],
  },
];

// ============================================================================
// KNOWLEDGE BASE — static platform FAQ responses
// ============================================================================
export const KNOWLEDGE_BASE: Record<string, string> = {
  // ─── MT5 / Broker ───
  platform_mt5: `**Connecting your MT5 account:**

1. Click your profile picture (top-right corner)
2. Select **MT5 Account Connection**
3. Enter your:
   • MT5 login number
   • Password
   • Server name (e.g., "ICMarkets-Live03")
4. Click **Connect**

Status turns green within 5 seconds. Once connected, you can use Auto Trading, Cloud Bots, and PropPass (Elite plan or higher).

If you get an error, double-check your server name — it must match exactly what appears in your MT5 terminal.`,

  // ─── Pricing / Plans ───
  platform_pricing: `**PipTraderAI offers 3 membership tiers:**

**Starter — $45 / ½ month**
• 10 chart uploads per day
• Advanced chart analysis
• Pulse signals (2/day)
• AI news trading analysis

**Pro — $95 / month** ⭐ MOST POPULAR
• 24 chart uploads per day
• Signal of the Day (90%+ accuracy)
• AI auto trading
• PipTraderAI PropPass
• Unlimited custom setups

**Elite — $195 / 3 months**
• Everything in Pro
• Cloud Bots (run without PC)
• FREE VPS included
• MT5 account connection
• Priority AI processing

Go to **Subscription** in the left sidebar to upgrade.`,

  // ─── Payment ───
  platform_payment: `**Two payment methods accepted:**

**M-Pesa (Kenya)**
• Automated STK Push → PIN prompt on your phone
• Manual: Pay to Till **372203**, then submit the confirmation code
• Instant activation

**Binance USDT (Global)**
• TRC20 wallet: TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s
• Binance ID: 1067841957
• Send USDT → submit the transaction hash

To pay: Subscription → Upgrade → Choose plan → Choose payment method.`,

  // ─── Password reset ───
  platform_password: `**Resetting your password:**

1. On the login screen, click **Forgot Password?**
2. Enter your registered email
3. Check your inbox (and spam folder) for a reset link
4. Click the link and create a new password

If the email doesn't arrive within 5 minutes, contact **Pipnexaicustomer@gmail.com**.

⚠️ Never share your password with anyone — including our team.`,

  // ─── Where to find signals ───
  platform_signals_location: `**Where to find signals:**

**1. Pulse Signals** (left sidebar)
→ Real-time scalp and swing signals with confidence scores and R:R ratios.

**2. Signal of the Day**
→ On the Overview page (top section)
→ Requires Pro plan or higher

**3. Upload Chart** (left sidebar)
→ Upload any chart screenshot → engine detects setups instantly

Click any signal to see: entry, stop loss, take profits, risk-reward, and full reasoning.`,

  // ─── Upload chart ───
  platform_upload: `**Uploading a chart for analysis:**

1. Click **Upload Chart** in the left sidebar
2. Paste or upload your chart image
3. Enter the symbol (e.g., XAUUSD)
4. Enter the timeframe (M15, H1, etc.)
5. Click **Analyze**

The engine will detect:
• Market structure (BOS, CHoCH)
• Order Blocks and Fair Value Gaps
• Support and Resistance
• Trade plan (entry, SL, TP1, TP2, R:R)

⚠️ **Important:** The engine needs the symbol + timeframe to work. It doesn't read prices from the image alone.`,

  // ─── PropPass ───
  platform_proppass: `**PropPass — prop firm challenge engine:**

Available on Pro and Elite plans.

**What it does:**
• Detects prop-firm compliant setups (FTMO, FundedNext, MFF)
• Enforces max daily drawdown (auto SL)
• Tracks progress toward profit target
• Manages Phase 1 → Phase 2 → Funded transition

**Access:** PropPass in the left sidebar.

Enter your challenge details (firm, account size, login) and the engine handles risk management per firm rules.`,

  // ─── Bots ───
  platform_bots: `**Automated bots (auto trading):**

Available on Pro and Elite plans.

**Setup steps:**
1. Left sidebar → **Auto Trading**
2. Configure your strategy (symbol, timeframe, risk %, lot size)
3. Connect MT5 (if not already)
4. Enable the bot

**Risk management built in:**
• Max 1% risk per trade
• Max 3% daily loss → auto-pause
• News lockout ±15 min around high-impact events
• Session filter (London + NY recommended)

**Cloud Bots** (Elite plan): run without your PC on our servers with a free VPS.`,

  // ─── Support ───
  platform_support: `**Contacting support:**

📧 **Email:** Pipnexaicustomer@gmail.com
📱 **Phone / WhatsApp:** +254726222093

Response time: under 1 hour (24/7 priority desk for Pro & Elite).

**Or open a ticket:**
→ Left sidebar → **Contact Support** → New Ticket

Include a screenshot and describe the issue clearly — it speeds up resolution.`,

  // ─── About ───
  platform_about: `**About PipTraderAI:**

We're an institutional-grade AI trading intelligence platform for Forex, Commodities, Indices, and Crypto.

**What we offer:**
• 🤖 AI chart analysis (SMC, CRT, Price Action)
• 📊 Live signals (Pulse + Signal of the Day)
• 📰 Real-time news & economic calendar
• ⚡ Automated bots (Pro & Elite)
• 🛡️ PropPass (prop firm challenge engine)
• 📸 Upload chart → instant analysis

**Important:** PipTraderAI is a decision-support tool. We are not a broker, financial advisor, or trade executor. Trading involves risk — never trade money you cannot afford to lose.`,

  // ─── Referral ───
  platform_referral: `**PipTraderAI Referral Program:**

Earn real money when your referrals subscribe.

**How it works:**
1. Go to **Overview** page → Referral Program section
2. Copy your unique referral link
3. Share it with friends, on social media, or your community
4. When they subscribe to any plan, you earn:
   • **$5** per Starter / Pro referral
   • **$10** per Elite / Ultimate referral
   • **$36** per Platinum referral

**Payouts:**
• Withdraw once balance ≥ $75
• Use balance to pay for your own subscription
• Paid to M-Pesa or Binance USDT`,

  // ─── Greeting ───
  greeting: `👋 Hey there! I'm Nova Assistant.

I can help you with:
• 📈 Trading setups — try "Give me a setup for Gold"
• 📰 News bias — try "Is USD strong today?"
• 🎯 Platform help — "How do I connect MT5?"
• 💳 Plans — "What plans do you offer?"

What can I help you with?`,

  // ─── Thanks ───
  thanks: `You're welcome! If you need anything else — a setup, a news check, or platform help — just ask. 📈`,
};

// ============================================================================
// MAIN INTENT CLASSIFIER
// ============================================================================
export function classifyIntent(message: string): { intent: string; confidence: number } {
  const msg = message.trim();
  if (!msg) return { intent: 'unknown', confidence: 0 };

  // Sort rules by weight descending
  const sortedRules = [...INTENT_RULES].sort((a, b) => (b.weight || 0) - (a.weight || 0));

  for (const rule of sortedRules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(msg)) {
        return { intent: rule.intent, confidence: rule.weight || 50 };
      }
    }
  }

  return { intent: 'unknown', confidence: 0 };
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================
export function extractSymbol(message: string): string | null {
  const msg = message.toLowerCase();

  // Direct canonical match (e.g., "EURUSD", "XAU/USD")
  const canonicalMatch = msg.match(/\b([a-z]{3}\/?[a-z]{3})\b/);
  if (canonicalMatch) {
    const raw = canonicalMatch[1].replace('/', '').toUpperCase();
    // Validate against known pairs
    const valid = ['EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD',
                   'XAUUSD','XAGUSD','BTCUSD','ETHUSD','SOLUSD','US30','NAS100',
                   'SPX500','WTIUSD'];
    if (valid.includes(raw)) return raw;
  }

  // Alias match
  for (const [alias, symbol] of Object.entries(SYMBOL_ALIASES)) {
    const re = new RegExp(`\\b${alias}\\b`, 'i');
    if (re.test(msg)) return symbol;
  }

  return null;
}

export function extractTimeframe(message: string): string | null {
  for (const [pattern, tf] of TIMEFRAME_PATTERNS) {
    if (pattern.test(message)) return tf;
  }
  return null;
}

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================
function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (n >= 10) return n.toFixed(decimals);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

// ============================================================================
// FORMAT: SIGNAL RESPONSE
// ============================================================================
function formatSignalResponse(plan: any, symbol: string, timeframe: string): string {
  if (!plan || plan.direction === 'WAIT') {
    return `**${symbol} · ${timeframe}**\n\nNo clean setup right now. ${plan?.marketSummary || 'Market is consolidating — wait for confirmation.'}\n\n${plan?.warnings?.length ? '⚠️ ' + plan.warnings.join('\n⚠️ ') : ''}`;
  }

  const dirEmoji = plan.direction === 'BUY' ? '🟢' : '🔴';
  const lines: string[] = [];

  lines.push(`**${symbol} · ${timeframe}** — ${plan.session} session`);
  lines.push('');
  lines.push(`${dirEmoji} **${plan.direction}** — Confidence **${plan.confidence}%**`);
  lines.push(`Setup: ${plan.setupType}`);
  lines.push(`Trend: ${plan.trend}`);
  lines.push('');
  lines.push(`**Entry:**  ${formatNumber(plan.entry)}`);
  lines.push(`**Stop Loss:**  ${formatNumber(plan.stopLoss)}`);
  lines.push(`**TP1:**  ${formatNumber(plan.takeProfit1)}`);
  lines.push(`**TP2:**  ${formatNumber(plan.takeProfit2)}`);
  lines.push(`**R:R:**  1:${plan.riskReward.toFixed(1)}`);
  lines.push('');

  if (plan.reasons && plan.reasons.length > 0) {
    lines.push('**Why:**');
    for (const r of plan.reasons) lines.push(`✓ ${r}`);
  }

  if (plan.warnings && plan.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️ **Warnings:**');
    for (const w of plan.warnings) lines.push(`⚠️ ${w}`);
  }

  lines.push('');
  lines.push('_Not financial advice. Always manage your risk (1% per trade max)._');

  return lines.join('\n');
}

// ============================================================================
// FORMAT: NEWS RESPONSE
// ============================================================================
function formatNewsResponse(bias: any): string {
  if (!bias) {
    return 'News data is temporarily unavailable. Please try again in a moment.';
  }

  const lines: string[] = [];
  const usd = bias.usd;
  const arrow = usd.score > 1.5 ? '🔺' : usd.score < -1.5 ? '🔻' : '➡️';

  lines.push(`**USD Strength:** ${arrow} **${usd.label}** (${usd.score > 0 ? '+' : ''}${usd.score})`);
  lines.push('');

  if (usd.reasons.length > 0) {
    lines.push('**Drivers:**');
    for (const r of usd.reasons) lines.push(`• ${r}`);
    lines.push('');
  }

  if (bias.pairBiases.length > 0) {
    lines.push('**Top Pair Biases:**');
    for (const pb of bias.pairBiases.slice(0, 5)) {
      const emoji = pb.bias === 'BUY' ? '🟢' : pb.bias === 'SELL' ? '🔴' : '⚪';
      lines.push(`${emoji} **${pb.pair}** — ${pb.bias} (${pb.confidence}% confidence)`);
    }
    lines.push('');
  }

  if (bias.upcomingHighImpact.length > 0) {
    lines.push('**Upcoming High-Impact Events:**');
    for (const e of bias.upcomingHighImpact) {
      lines.push(`⏰ ${e.currency} ${e.title} — ${e.countdown || 'soon'}`);
    }
    lines.push('');
  }

  if (bias.warnings.length > 0) {
    lines.push('⚠️ **Notes:**');
    for (const w of bias.warnings) lines.push(`• ${w}`);
  }

  return lines.join('\n');
}

// ============================================================================
// FORMAT: MY ACCOUNT
// ============================================================================
function formatMyAccount(user: UserProfile | null | undefined): string {
  if (!user) {
    return 'You are not signed in. Please sign in to view your account details.';
  }

  const plan = user.plan || 'Pending';
  const planEmoji =
    plan === 'Elite' ? '👑' :
    plan === 'Pro' ? '⭐' :
    plan === 'Starter' ? '🚀' :
    '⏳';

  const lines: string[] = [];
  lines.push(`Hi **${user.firstName}**! 👋`);
  lines.push('');
  lines.push(`**Email:** ${user.email}`);
  lines.push(`**Plan:** ${planEmoji} ${plan}`);
  lines.push(`**Country:** ${user.countryCode}`);

  if (plan === 'Pending') {
    lines.push('');
    lines.push('Your account is awaiting admin plan assignment. Once approved, you\'ll get full access.');
    lines.push('');
    lines.push('Want to speed this up? Open **Subscription** and upgrade directly.');
  }

  return lines.join('\n');
}

// ============================================================================
// FALLBACK RESPONSE
// ============================================================================
function fallbackResponse(): string {
  return `I can help you with:

**📈 Trading**
• "Give me a setup for Gold"
• "Any setup on EURUSD M15?"
• "Analyze Bitcoin"

**📰 News & Bias**
• "Is USD strong today?"
• "What's happening with the dollar?"
• "Any high-impact news coming?"

**🎯 Platform Help**
• "How do I connect MT5?"
• "What plans do you offer?"
• "Where can I find signals?"
• "How do I upload a chart?"

**💳 Account**
• "What's my plan?"
• "How do I reset my password?"

Just ask in your own words — I'll figure it out.`;
}

// ============================================================================
// MAIN ENTRY
// ============================================================================
export async function respondToUser(
  message: string,
  ctx: AssistantContext
): Promise<AssistantReply> {
  const { intent, confidence } = classifyIntent(message);

  // ─── Trading setup ───
  if (intent === 'get_setup') {
    const symbol = extractSymbol(message);
    const timeframe = extractTimeframe(message) || 'M15';

    if (!symbol) {
      return {
        reply: `Which symbol would you like a setup for? For example:\n• Gold (XAUUSD)\n• EUR/USD\n• Bitcoin (BTCUSD)\n• NAS100`,
        intent,
        confidence,
      };
    }

    if (!ctx.signalEngine) {
      return {
        reply: `Setup analysis for ${symbol} is temporarily unavailable. Please try the **Upload Chart** or **AI Trading** section in the app.`,
        intent,
        confidence,
      };
    }

    try {
      const plan = await ctx.signalEngine(symbol, timeframe);
      return {
        reply: formatSignalResponse(plan, symbol, timeframe),
        intent,
        confidence,
        data: plan,
      };
    } catch (err: any) {
      return {
        reply: `Could not fetch market data for ${symbol}. Please try again in a moment.`,
        intent,
        confidence,
      };
    }
  }

  // ─── News bias ───
  if (intent === 'news_bias') {
    if (!ctx.newsEngine || !ctx.forexFactoryEvents) {
      return {
        reply: 'News analysis is temporarily unavailable. Check the **News & Calendar** section in the app.',
        intent,
        confidence,
      };
    }

    try {
      const bias = ctx.newsEngine(ctx.forexFactoryEvents);
      return {
        reply: formatNewsResponse(bias),
        intent,
        confidence,
        data: bias,
      };
    } catch (err) {
      return {
        reply: 'Could not analyze news right now. Please check the News tab.',
        intent,
        confidence,
      };
    }
  }

  // ─── My account ───
  if (intent === 'my_account') {
    return {
      reply: formatMyAccount(ctx.user),
      intent,
      confidence,
    };
  }

  // ─── Knowledge base (platform FAQ) ───
  if (KNOWLEDGE_BASE[intent]) {
    const raw = KNOWLEDGE_BASE[intent];
    const reply = interpolate(raw, {
      firstName: ctx.user?.firstName || 'Trader',
      plan: ctx.user?.plan || 'Pending',
    });
    return { reply, intent, confidence };
  }

  // ─── Unknown ───
  return {
    reply: fallbackResponse(),
    intent: 'unknown',
    confidence: 0,
  };
}

// ============================================================================
// SYNC VERSION (for use in synchronous code)
// ============================================================================
export function respondToUserSync(message: string, ctx: AssistantContext): AssistantReply {
  const { intent, confidence } = classifyIntent(message);

  if (intent === 'get_setup') {
    const symbol = extractSymbol(message);
    if (!symbol) {
      return {
        reply: `Which symbol would you like a setup for? Try: "Give me a setup for Gold" or "EURUSD M15"`,
        intent,
        confidence,
      };
    }
    if (!ctx.signalEngine) {
      return {
        reply: `Setup analysis for ${symbol} is temporarily unavailable.`,
        intent,
        confidence,
      };
    }
    // signalEngine may be async — caller should use respondToUser instead
    return {
      reply: `Please use the async version for live signal lookups.`,
      intent,
      confidence,
    };
  }

  if (intent === 'news_bias') {
    if (!ctx.newsEngine || !ctx.forexFactoryEvents) {
      return {
        reply: 'News analysis is temporarily unavailable.',
        intent,
        confidence,
      };
    }
    const bias = ctx.newsEngine(ctx.forexFactoryEvents);
    return {
      reply: formatNewsResponse(bias),
      intent,
      confidence,
      data: bias,
    };
  }

  if (intent === 'my_account') {
    return {
      reply: formatMyAccount(ctx.user),
      intent,
      confidence,
    };
  }

  if (KNOWLEDGE_BASE[intent]) {
    return {
      reply: KNOWLEDGE_BASE[intent],
      intent,
      confidence,
    };
  }

  return {
    reply: fallbackResponse(),
    intent: 'unknown',
    confidence: 0,
  };
}
