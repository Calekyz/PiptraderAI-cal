import React, { useState } from 'react';
import { 
  Sun, 
  Moon,
  Bell, 
  User, 
  ChevronRight, 
  Diamond, 
  AlertTriangle, 
  LogOut, 
  Trash2, 
  Check, 
  ShieldCheck, 
  X, 
  Sparkles,
  Lock,
  Shield,
  Key,
  Users,
  Activity,
  UserCheck,
  Unlock,
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Sliders
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout?: () => void;
  onOpenUpgrade?: (tier?: 'Pro' | 'Platinum' | 'Ultimate') => void;
  currentTheme?: 'dark' | 'light';
  onSetTheme?: (mode: 'dark' | 'light') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onOpenUpgrade,
  currentTheme = 'dark',
  onSetTheme
}) => {
  // Notification Toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [tradeAlerts, setTradeAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);

  // Modals for Profile & Privacy
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit Profile Form State
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');

  // Admin Panel Security & Gatekeeper State
  const ADMIN_WHITELIST = ['pipnexaicustomer@gmail.com', 'oruchodaniel21@gmail.com'];
  const isWhitelistedAdmin = Boolean(
    user?.email && ADMIN_WHITELIST.includes(user.email.toLowerCase().trim())
  );

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  const handleOpenAdminModal = () => {
    setAdminUsername('');
    setAdminPassword('');
    setAdminAuthError('');
    setIsAdminAuthModalOpen(true);
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim() === 'SuperAdmin' && adminPassword.trim() === 'SecurePass2024') {
      setIsAdminUnlocked(true);
      setIsAdminAuthModalOpen(false);
      setAdminAuthError('');
      setAdminUsername('');
      setAdminPassword('');
    } else {
      setAdminAuthError('Access Denied: Invalid administrator credentials.');
    }
  };

  const handleLockAdminPanel = () => {
    setIsAdminUnlocked(false);
    setAdminUsername('');
    setAdminPassword('');
  };

  // Admin Trading Dashboard State
  const [activeTimeframe, setActiveTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D'>('15M');
  const [adminTradeToast, setAdminTradeToast] = useState<{ type: 'BUY' | 'SELL'; message: string } | null>(null);
  const [adminLotSize, setAdminLotSize] = useState('1.00');

  const handleExecuteAdminTrade = (action: 'BUY' | 'SELL', price: string) => {
    setAdminTradeToast({
      type: action,
      message: `Admin ${action} order executed: ${adminLotSize} Lot(s) @ ${price} (Spread: 0.8 pips)`
    });
    setTimeout(() => {
      setAdminTradeToast(null);
    }, 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      firstName,
      lastName,
      email
    });
    setIsEditProfileOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      
      {/* 1. Appearance Card (Dark & Light Mode with Dark as Default) */}
      <div className="bg-white dark:bg-[#0d0f1a] border border-[#e5e7eb] dark:border-[#1e2238] rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-[#0f172a] dark:text-white">
            <Sparkles className="w-4 h-4 text-[#5b3fe4] dark:text-purple-400" />
            <span>Appearance &amp; Visual Theme</span>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
            Switch between Dark Mode (default) and Light Mode.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#0f172a] dark:text-slate-200 block mb-3">Choose Theme</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {/* Dark Mode Card */}
            <div 
              id="theme-option-dark"
              onClick={() => onSetTheme && onSetTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                currentTheme === 'dark'
                  ? 'bg-[#151829] dark:bg-[#151829] border-purple-500 ring-2 ring-purple-500/20'
                  : 'bg-gray-50 dark:bg-[#0f111d] border-[#e5e7eb] dark:border-[#1e2238] hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  currentTheme === 'dark'
                    ? 'bg-purple-900/50 border border-purple-500/40 text-purple-300'
                    : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-500'
                }`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                    <span>Dark Mode</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Default</span>
                  </div>
                  <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5">Sleek, low-glare institutional dark theme</div>
                </div>
              </div>
              {currentTheme === 'dark' && (
                <div className="w-6 h-6 rounded-full bg-[#5b3fe4] dark:bg-purple-600 text-white flex items-center justify-center text-xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Light Mode Card */}
            <div 
              id="theme-option-light"
              onClick={() => onSetTheme && onSetTheme('light')}
              className={`p-4 rounded-2xl border text-left transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-[#f0edfe] border-purple-400 ring-2 ring-purple-400/20'
                  : 'bg-gray-50 dark:bg-[#0f111d] border-[#e5e7eb] dark:border-[#1e2238] hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  currentTheme === 'light'
                    ? 'bg-white border border-purple-200 text-[#5b3fe4]'
                    : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-500'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0f172a] dark:text-white">Light Mode</div>
                  <div className="text-[11px] text-[#475569] dark:text-slate-400 mt-0.5">Clean, daylight high-contrast workspace</div>
                </div>
              </div>
              {currentTheme === 'light' && (
                <div className="w-6 h-6 rounded-full bg-[#5b3fe4] text-white flex items-center justify-center text-xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Notifications Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
            <Bell className="w-4 h-4 text-[#5b3fe4]" />
            <span>Notifications</span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Manage your alert preferences
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Push Notifications */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-bold text-[#0f172a] text-xs sm:text-sm">Push Notifications</div>
              <div className="text-[#475569] text-xs mt-0.5">Receive notifications about your account</div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                pushNotifications ? 'bg-[#5b3fe4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                  pushNotifications ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Trade Alerts */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-bold text-[#0f172a] text-xs sm:text-sm">Trade Alerts</div>
              <div className="text-[#475569] text-xs mt-0.5">Get notified when trades are executed</div>
            </div>
            <button
              onClick={() => setTradeAlerts(!tradeAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                tradeAlerts ? 'bg-[#5b3fe4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                  tradeAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Price Alerts */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-bold text-[#0f172a] text-xs sm:text-sm">Price Alerts</div>
              <div className="text-[#475569] text-xs mt-0.5">Alerts when prices hit your targets</div>
            </div>
            <button
              onClick={() => setPriceAlerts(!priceAlerts)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                priceAlerts ? 'bg-[#5b3fe4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                  priceAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Account Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
            <User className="w-4 h-4 text-[#5b3fe4]" />
            <span>Account</span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Manage your account settings
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-[#f0edfe] border border-[#e5e7eb] text-xs font-semibold text-[#0f172a] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#64748b] group-hover:text-[#5b3fe4]" />
              <span>Edit Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#5b3fe4]" />
          </button>

          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-[#f0edfe] border border-[#e5e7eb] text-xs font-semibold text-[#0f172a] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#64748b] group-hover:text-[#5b3fe4]" />
              <span>Privacy &amp; Security</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#5b3fe4]" />
          </button>
        </div>
      </div>

      {/* 4. MT5 Account Connection (Platinum Feature) */}
      <div className="bg-white border border-[#e5e7eb] rounded-3xl p-8 text-center shadow-xs relative overflow-hidden flex flex-col items-center justify-center space-y-3">
        {/* Diamond Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#f0edfe] border border-purple-200 flex items-center justify-center text-[#5b3fe4] mb-1">
          <Diamond className="w-6 h-6" />
        </div>

        {/* Platinum Feature Badge */}
        <div>
          <span className="px-3 py-1 rounded-full bg-[#f0edfe] text-[#5b3fe4] text-[10px] font-bold uppercase tracking-wider font-mono border border-purple-200">
            💎 Platinum Feature
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#0f172a]">
          MT5 Account Connection
        </h3>

        {/* Subtitle */}
        <p className="text-xs text-[#475569] max-w-md leading-relaxed">
          Connect your MT5 account for automated trading, PropPass, and AI position sizing.
        </p>

        {/* Upgrade to Platinum Button */}
        <div className="pt-2">
          <button
            onClick={() => onOpenUpgrade?.('Platinum')}
            className="px-6 py-2.5 rounded-xl bg-[#5b3fe4] hover:bg-[#4d32d0] active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Upgrade to Platinum</span>
          </button>
        </div>
      </div>

      {/* 5. Danger Zone Card */}
      <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-rose-600">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Danger Zone</span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Irreversible actions
          </p>
        </div>

        <div className="space-y-3">
          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] text-[#0f172a] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Sign Out</span>
          </button>

          {/* Delete Account Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* 6. Strictly Secured Admin Trading Dashboard (Rendered ONLY for Whitelisted Emails) */}
      {isWhitelistedAdmin && (
        <div id="admin-trading-dashboard-section" className="bg-[#0b0f19] border-2 border-purple-900/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white transition-all relative overflow-hidden">
          
          {/* Ambient background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>📊 Admin Trading Panel</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    VIP Control
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Institutional Master Terminal for <span className="text-purple-300 font-mono font-medium">{user.email}</span>
                </p>
              </div>
            </div>

            {isAdminUnlocked ? (
              <button
                id="btn-lock-admin-panel"
                onClick={handleLockAdminPanel}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Panel</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" />
                <span className="font-semibold">Locked</span>
              </span>
            )}
          </div>

          {!isAdminUnlocked ? (
            /* Locked State Trigger Overlay / Card */
            <div className="relative z-10 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-8 text-center space-y-4 shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
                <Key className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Secondary Gatekeeper Authentication</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  The Admin Trading Panel is restricted. Enter your secondary administrative credentials to unlock direct order execution, institutional telemetry, and market depth controls.
                </p>
              </div>
              <div className="pt-2">
                <button
                  id="btn-open-admin-panel"
                  onClick={handleOpenAdminModal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-[0.98]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Click to Unlock Admin Panel</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unlocked Full Admin Trading Dashboard */
            <div className="space-y-6 animate-in fade-in duration-300 relative z-10">
              
              {/* Trade Execution Feedback Toast */}
              {adminTradeToast && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${
                  adminTradeToast.type === 'BUY'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>{adminTradeToast.message}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    Filled in 12ms
                  </span>
                </div>
              )}

              {/* 1. Header Price & Level Stats Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Large Prominent Price Display */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Pair</span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        XAU/USD (Gold)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                        $4,503.96
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +3.2%
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">24h Net Gain</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">+$139.75 USD</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Spread: 0.8 pips</span>
                  </div>
                </div>

                {/* Support & Resistance Levels Display */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Key Pivot Levels</span>
                    <span className="text-[10px] font-mono text-purple-300">AI Calc</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 font-medium">Resistance Level</span>
                      <span className="font-mono font-bold text-rose-400">4,525.00</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 font-medium">Support Level</span>
                      <span className="font-mono font-bold text-emerald-400">Support: 4500.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Mock TradingView Chart Area */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5 relative overflow-hidden space-y-4">
                
                {/* Chart Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                      <span>XAUUSD</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-purple-400 font-semibold">{activeTimeframe}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-400">O: 4498.20</span>
                      <span className="text-rose-400 hidden sm:inline">H: 4508.50</span>
                      <span className="text-amber-400 hidden sm:inline">L: 4492.10</span>
                      <span className="text-white font-extrabold">C: 4503.96</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Timeframe Switcher */}
                    <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {(['1M', '5M', '15M', '1H', '1D'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setActiveTimeframe(tf)}
                          className={`px-2 py-1 rounded-md transition-all ${
                            activeTimeframe === tf
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    {/* Visual TradingView Watermark / Label */}
                    <div className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-500/30 text-blue-300 text-[10px] font-bold tracking-wider font-mono flex items-center gap-1">
                      <span>TradingView</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Candlestick & Indicator Canvas Mockup */}
                <div className="h-64 sm:h-72 w-full bg-[#080b12] rounded-xl border border-slate-900 relative flex flex-col justify-between p-3 overflow-hidden select-none">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-20">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-r border-b border-slate-700" />
                    ))}
                  </div>

                  {/* Resistance & Support Guideline Overlays */}
                  <div className="absolute top-8 left-0 right-0 border-b border-dashed border-rose-500/40 flex justify-between px-3 text-[10px] font-mono text-rose-400 pointer-events-none">
                    <span>Resistance: 4,525.00</span>
                    <span>TP2 Zone</span>
                  </div>
                  <div className="absolute bottom-12 left-0 right-0 border-b border-dashed border-emerald-500/40 flex justify-between px-3 text-[10px] font-mono text-emerald-400 pointer-events-none">
                    <span>Support: 4,500.00</span>
                    <span>Demand Zone (Entry)</span>
                  </div>

                  {/* SVG Candlestick & Price Action Flow */}
                  <svg className="w-full h-full absolute inset-0 pt-6 pb-8 px-4" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="adminChartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area under trend */}
                    <path
                      d="M 20,150 Q 80,130 140,160 T 260,110 T 380,120 T 480,70 T 580,45 L 580,180 L 20,180 Z"
                      fill="url(#adminChartGlow)"
                    />

                    {/* Smooth Price Curve Line */}
                    <path
                      d="M 20,150 Q 80,130 140,160 T 260,110 T 380,120 T 480,70 T 580,45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Candlestick Wicks & Bodies Mockup */}
                    {/* Candle 1 (Bull) */}
                    <line x1="60" y1="120" x2="60" y2="170" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="54" y="130" width="12" height="30" fill="#10b981" rx="1" />

                    {/* Candle 2 (Bear) */}
                    <line x1="110" y1="135" x2="110" y2="180" stroke="#ef4444" strokeWidth="1.5" />
                    <rect x="104" y="145" width="12" height="25" fill="#ef4444" rx="1" />

                    {/* Candle 3 (Bull) */}
                    <line x1="170" y1="110" x2="170" y2="165" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="164" y="125" width="12" height="35" fill="#10b981" rx="1" />

                    {/* Candle 4 (Bull) */}
                    <line x1="230" y1="95" x2="230" y2="150" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="224" y="105" width="12" height="30" fill="#10b981" rx="1" />

                    {/* Candle 5 (Bear pullback) */}
                    <line x1="290" y1="100" x2="290" y2="145" stroke="#ef4444" strokeWidth="1.5" />
                    <rect x="284" y="110" width="12" height="22" fill="#ef4444" rx="1" />

                    {/* Candle 6 (Bull breakout) */}
                    <line x1="350" y1="75" x2="350" y2="130" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="344" y="85" width="12" height="35" fill="#10b981" rx="1" />

                    {/* Candle 7 (Bull impulse) */}
                    <line x1="420" y1="55" x2="420" y2="110" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="414" y="65" width="12" height="35" fill="#10b981" rx="1" />

                    {/* Candle 8 (Current Live Active Candle) */}
                    <line x1="500" y1="35" x2="500" y2="90" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="494" y="45" width="12" height="35" fill="#10b981" rx="1" />

                    {/* Live Pulsing Price Node */}
                    <circle cx="580" cy="45" r="5" fill="#10b981" />
                    <circle cx="580" cy="45" r="10" fill="#10b981" opacity="0.3" className="animate-ping" />
                  </svg>

                  {/* Volume Bars at Bottom */}
                  <div className="relative z-10 flex items-end justify-between h-8 gap-1 opacity-50 px-2">
                    {[35, 55, 20, 80, 45, 90, 65, 100, 75, 95].map((v, idx) => (
                      <div
                        key={idx}
                        className={`w-full rounded-t-sm ${idx % 2 === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ height: `${v}%` }}
                      />
                    ))}
                  </div>

                  {/* Floating Price Tag */}
                  <div className="absolute right-3 top-10 bg-emerald-500 text-slate-950 font-mono font-extrabold text-[11px] px-2 py-0.5 rounded shadow-md pointer-events-none">
                    4,503.96
                  </div>
                </div>

                {/* 3. High-Impact Action Trading Buttons (BUY / SELL) */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Order Lot Size:</span>
                      <div className="flex items-center gap-1">
                        {['0.10', '0.50', '1.00', '5.00'].map((lot) => (
                          <button
                            key={lot}
                            onClick={() => setAdminLotSize(lot)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                              adminLotSize === lot
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {lot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                      <span>Margin: <strong>$45.04</strong></span>
                      <span>Max Slippage: <strong>0.2</strong></span>
                    </div>
                  </div>

                  {/* Large Action Buttons Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Red SELL Button (with 120 / Sell Price) */}
                    <button
                      id="admin-btn-sell"
                      onClick={() => handleExecuteAdminTrade('SELL', '4,503.20')}
                      className="group relative overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-between border border-rose-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white">
                          <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-extrabold tracking-wider">SELL</div>
                          <div className="text-xs text-rose-200 font-mono font-medium">Vol: 120 Units</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-lg font-bold">4,503.20</div>
                        <div className="text-[10px] text-rose-200">Bid Price</div>
                      </div>
                    </button>

                    {/* Green BUY Button */}
                    <button
                      id="admin-btn-buy"
                      onClick={() => handleExecuteAdminTrade('BUY', '4,504.60')}
                      className="group relative overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-between border border-emerald-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white">
                          <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-extrabold tracking-wider">BUY</div>
                          <div className="text-xs text-emerald-200 font-mono font-medium">Instant Execution</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-lg font-bold">4,504.60</div>
                        <div className="text-[10px] text-emerald-200">Ask Price</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Telemetry & User Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Total Users */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Users</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">1,245</div>
                  </div>
                </div>

                {/* System Status */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5 sm:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">System Status</div>
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span>🟢 All Systems Operational</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sign-ups */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>Recent Sign-ups</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {['John Doe', 'Jane Smith', 'Alice Wonder'].map((member, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-200"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                        {member.charAt(0)}
                      </div>
                      <span className="font-medium">{member}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Admin Gatekeeper Modal (Username & Password) */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Admin Gatekeeper</h3>
              </div>
              <button
                onClick={() => {
                  setIsAdminAuthModalOpen(false);
                  setAdminAuthError('');
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Please enter secondary administrative credentials to proceed.
            </p>

            {adminAuthError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2 animate-in shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter admin username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    setAdminAuthError('');
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-sm"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#e5e7eb] rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Edit Profile Details</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#475569] block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-[#0f172a] focus:outline-none focus:border-[#5b3fe4]"
                />
              </div>
              <div>
                <label className="text-[#475569] block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-[#0f172a] focus:outline-none focus:border-[#5b3fe4]"
                />
              </div>
              <div>
                <label className="text-[#475569] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-[#0f172a] focus:outline-none focus:border-[#5b3fe4] font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-[#475569] rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5b3fe4] text-white font-bold rounded-xl hover:bg-[#4d32d0]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#e5e7eb] rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Privacy &amp; Security Settings</h3>
              <button onClick={() => setIsPrivacyOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0f172a]">Two-Factor Authentication (2FA)</div>
                  <div className="text-[#475569] text-[11px] mt-0.5">Protect your account with OTP authenticator</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">Enabled</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#e5e7eb]">
                <div className="font-bold text-[#0f172a]">Active Session Encryption</div>
                <div className="text-[#475569] text-[11px] mt-0.5">TLS 1.3 256-bit encrypted broker bridge keys</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-2 bg-[#5b3fe4] text-white text-xs font-semibold rounded-xl hover:bg-[#4d32d0]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Warning Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#0f172a]">Delete PipNex Account?</h3>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Are you sure you want to delete your account? All automated bot parameters, backtesting logs, and MT5 API bridge keys will be permanently erased.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-[#475569] rounded-xl hover:bg-gray-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  onLogout?.();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
