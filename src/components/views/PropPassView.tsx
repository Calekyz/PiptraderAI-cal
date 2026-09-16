import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  RotateCcw, 
  FileText, 
  Zap, 
  Plus, 
  BarChart2, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Lock, 
  Server, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface PropAccount {
  id: string;
  firm: string;
  accountNumber: string;
  server: string;
  accountSize: number;
  phase: 'Phase 1 (Evaluation)' | 'Phase 2 (Verification)' | 'Funded Live';
  dailyLossLimit: number;
  maxDrawdownLimit: number;
  profitTarget: number;
  currentEquity: number;
  currentDailyLoss: number;
  currentDrawdown: number;
  status: 'ACTIVE' | 'PAUSED' | 'PASSED';
}

const PROP_FIRMS = [
  { name: 'FTMO', defaultMaxDaily: 5, defaultMaxTotal: 10, defaultTarget: 10 },
  { name: 'FundedNext (Stellar)', defaultMaxDaily: 5, defaultMaxTotal: 10, defaultTarget: 8 },
  { name: 'Funding Pips', defaultMaxDaily: 5, defaultMaxTotal: 10, defaultTarget: 8 },
  { name: 'The Funded Trader', defaultMaxDaily: 5, defaultMaxTotal: 10, defaultTarget: 10 },
  { name: 'E8 Markets', defaultMaxDaily: 4, defaultMaxTotal: 8, defaultTarget: 8 },
  { name: 'Alpha Capital', defaultMaxDaily: 5, defaultMaxTotal: 10, defaultTarget: 8 }
];

export const PropPassView: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'progress' | 'auto-trade' | 'history'>('overview');
  
  // Connected Prop accounts state
  const [accounts, setAccounts] = useState<PropAccount[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // New account form state
  const [selectedFirm, setSelectedFirm] = useState<string>('FTMO');
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [server, setServer] = useState<string>('FTMO-Server');
  const [phase, setPhase] = useState<'Phase 1 (Evaluation)' | 'Phase 2 (Verification)' | 'Funded Live'>('Phase 1 (Evaluation)');

  // Handle Connect
  const handleConnectAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    const firmConfig = PROP_FIRMS.find(f => f.name === selectedFirm) || PROP_FIRMS[0];

    const newAcc: PropAccount = {
      id: `prop-${Date.now()}`,
      firm: selectedFirm,
      accountNumber: accountNumber.trim(),
      server: server.trim() || `${selectedFirm}-Live`,
      accountSize: accountSize,
      phase: phase,
      dailyLossLimit: firmConfig.defaultMaxDaily,
      maxDrawdownLimit: firmConfig.defaultMaxTotal,
      profitTarget: firmConfig.defaultTarget,
      currentEquity: accountSize + 2850,
      currentDailyLoss: 0.42,
      currentDrawdown: 1.15,
      status: 'ACTIVE'
    };

    setAccounts([...accounts, newAcc]);
    setIsConnectModalOpen(false);
    setAccountNumber('');
    setPassword('');
  };

  const handleReset = () => {
    setAccounts([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header matching exact screenshot */}
      <div className="bg-[#0c0d15] border border-[#1d2030] rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141624] border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623] shadow-sm shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                PipNex <span className="text-[#f5a623]">PropPass</span>
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#2b220e] text-[#f5a623] border border-[#f5a623]/35 font-bold">
                ULTIMATE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Challenge traded to the rulebook — drawdown &amp; daily loss watched every second.
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span>Report</span>
          </button>

          <button
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('auto-trading');
              } else {
                setActiveSubTab('auto-trade');
              }
            }}
            className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/50 transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Trade</span>
          </button>
        </div>
      </div>

      {/* 2. Top Card: "How PropPass works" */}
      <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 sm:p-7 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#161826] pb-3">
          <h3 className="text-base font-bold text-white tracking-tight">How PropPass works</h3>
          <span className="text-[10px] font-mono uppercase font-bold text-gray-500 tracking-wider">
            THREE STEPS
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed max-w-4xl">
          Connect the MT5 account your firm gave you, tell us who funded you, and PropPass trades inside your firm's rules — standing down before a daily loss or drawdown limit is ever touched.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 01 */}
          <div className="space-y-1.5">
            <span className="text-sm font-bold font-mono text-[#f5a623] block">0 1</span>
            <div className="text-sm font-bold text-white">Connect your account</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Add the MT5 login from your prop firm.
            </p>
          </div>

          {/* Step 02 */}
          <div className="space-y-1.5">
            <span className="text-sm font-bold font-mono text-[#f5a623] block">0 2</span>
            <div className="text-sm font-bold text-white">Set it up in 3 steps</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pick your firm and trading style — we fill in the rules.
            </p>
          </div>

          {/* Step 03 */}
          <div className="space-y-1.5">
            <span className="text-sm font-bold font-mono text-[#f5a623] block">0 3</span>
            <div className="text-sm font-bold text-white">Press start</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              PropPass trades and tracks progress toward the target.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center">
        <div className="bg-[#0b0c14] border border-[#1a1d2a] p-1 rounded-2xl flex items-center gap-1 shadow-sm">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'overview'
                ? 'bg-[#141624] text-white border border-[#2b304c] shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#10121c]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('progress')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'progress'
                ? 'bg-[#141624] text-white border border-[#2b304c] shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#10121c]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>

          <button
            onClick={() => setActiveSubTab('auto-trade')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'auto-trade'
                ? 'bg-[#141624] text-white border border-[#2b304c] shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#10121c]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Trade</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-[#141624] text-white border border-[#2b304c] shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#10121c]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 4. Prop Firm MT5 Connection Card */}
      <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Prop Firm MT5 Connection</div>
              <div className="text-xs text-gray-400">Dedicated bridge for prop firm accounts</div>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#161828] text-purple-300 border border-[#25293d] font-bold uppercase">
            Prop Firm Bridge
          </span>
        </div>

        {/* Connect Button or Connected Account Pill */}
        {accounts.length === 0 ? (
          <div className="pt-2">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#24283e] hover:border-purple-500/50 bg-[#0e1018] hover:bg-[#121422] text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Connect Prop Firm Account</span>
              </div>
              <span className="text-xs font-mono text-gray-500">0/2</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#141624] border border-[#272c44] flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{acc.firm}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#122b1c] text-emerald-400 border border-emerald-500/30">
                        {acc.phase}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Account #{acc.accountNumber} • ${acc.accountSize.toLocaleString()} Size • Server: {acc.server}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right font-mono text-xs">
                    <div className="text-gray-400 text-[10px]">Equity</div>
                    <div className="text-white font-bold">${acc.currentEquity.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-[#2b1216] text-[#ff4b58] hover:bg-[#3b191e] border border-[#ff4b58]/30 font-semibold"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}

            {accounts.length < 2 && (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#24283e] hover:border-purple-500/40 text-xs font-semibold text-gray-400 hover:text-white transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Connect Second Prop Account</span>
                </div>
                <span className="text-xs font-mono text-gray-500">{accounts.length}/2</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Main Content Area depending on subtab and connection status */}
      {accounts.length === 0 ? (
        /* Empty State matching screenshot */
        <div className="border border-dashed border-[#1f2338] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 bg-[#08090f]/60 shadow-lg min-h-[260px]">
          <div className="w-14 h-14 rounded-2xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shadow-sm">
            <Shield className="w-7 h-7 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              No Funded Account Configured
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              Connect your prop firm MT5 account above, then go to the Auto-Trading tab to configure challenge rules.
            </p>
          </div>

          <button
            onClick={() => {
              if (accounts.length === 0) {
                setIsConnectModalOpen(true);
              } else {
                setActiveSubTab('auto-trade');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950/50 transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Setup Auto-Trading</span>
          </button>
        </div>
      ) : (
        /* Active Connected Dashboard Views */
        <div className="space-y-6">
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Loss Guard */}
              <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Daily Loss Guard</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-[#122b1c] px-2 py-0.5 rounded border border-emerald-500/30">
                    SAFE
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">0.42% <span className="text-xs text-gray-500">/ 5.00% max</span></div>
                <div className="w-full bg-[#10121c] h-2 rounded-full overflow-hidden border border-[#1c1f30]">
                  <div className="bg-emerald-500 h-full w-[8.4%]" />
                </div>
                <div className="text-[11px] text-gray-400">Auto stand-down triggers at 4.0% daily.</div>
              </div>

              {/* Max Drawdown Sentinel */}
              <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Total Drawdown Sentinel</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-[#122b1c] px-2 py-0.5 rounded border border-emerald-500/30">
                    SAFE
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">1.15% <span className="text-xs text-gray-500">/ 10.00% max</span></div>
                <div className="w-full bg-[#10121c] h-2 rounded-full overflow-hidden border border-[#1c1f30]">
                  <div className="bg-purple-500 h-full w-[11.5%]" />
                </div>
                <div className="text-[11px] text-gray-400">Hard equity trailing stop activated.</div>
              </div>

              {/* Profit Target Progress */}
              <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Phase 1 Target ($10,000)</span>
                  <span className="text-[10px] font-mono font-bold text-[#f5a623] bg-[#2b220e] px-2 py-0.5 rounded border border-[#f5a623]/30">
                    28.5%
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">+$2,850.00</div>
                <div className="w-full bg-[#10121c] h-2 rounded-full overflow-hidden border border-[#1c1f30]">
                  <div className="bg-emerald-500 h-full w-[28.5%]" />
                </div>
                <div className="text-[11px] text-gray-400">Remaining to pass: $7,150.00</div>
              </div>
            </div>
          )}

          {activeSubTab === 'progress' && (
            <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white">Live Challenge Progression &amp; Health</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                  <div className="text-gray-400 text-[10px]">Trading Days</div>
                  <div className="text-base font-bold text-white mt-1">4 / 4 Min Days</div>
                  <div className="text-emerald-400 text-[10px] mt-0.5">✓ Requirement Met</div>
                </div>
                <div className="p-3.5 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                  <div className="text-gray-400 text-[10px]">Win Rate</div>
                  <div className="text-base font-bold text-white mt-1">78.4%</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">18 Wins / 5 Losses</div>
                </div>
                <div className="p-3.5 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                  <div className="text-gray-400 text-[10px]">Profit Factor</div>
                  <div className="text-base font-bold text-purple-400 mt-1">3.12</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">High Efficiency</div>
                </div>
                <div className="p-3.5 bg-[#10121c] rounded-2xl border border-[#1c1f30]">
                  <div className="text-gray-400 text-[10px]">Rule Violations</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">0 Violations</div>
                  <div className="text-emerald-400 text-[10px] mt-0.5">100% Compliant</div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'auto-trade' && (
            <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">PropPass Rulebook Trading Engine</h3>
                  <p className="text-xs text-gray-400">Algorithmic risk boundaries strictly enforced</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#122b1c] text-emerald-400 border border-emerald-500/30 font-bold">
                  ACTIVE EXECUTION
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#10121c] border border-[#1c1f30] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Max Risk Per Trade</span>
                  <span className="font-mono text-purple-300 font-bold">0.50% ($500.00)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">News Volatility Guard</span>
                  <span className="font-mono text-emerald-400 font-bold">Close trades 5m before High-Impact</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Weekend Carry</span>
                  <span className="font-mono text-[#f5a623] font-bold">Auto-Close Friday 21:00 UTC</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'history' && (
            <div className="bg-[#0b0c14] border border-[#1a1d2a] rounded-3xl p-6 space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white">PropPass Audit Trail</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-[#10121c] rounded-xl border border-[#1c1f30] flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">BUY XAUUSD 0.85 Lots</span>
                    <div className="text-[10px] text-gray-500">TP Hit at 2368.50 (+38 pips)</div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">+$323.00</span>
                    <div className="text-[10px] text-gray-500">Today 10:14</div>
                  </div>
                </div>
                <div className="p-3 bg-[#10121c] rounded-xl border border-[#1c1f30] flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">SELL EURUSD 1.50 Lots</span>
                    <div className="text-[10px] text-gray-500">TP Hit at 1.0825 (+22 pips)</div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">+$330.00</span>
                    <div className="text-[10px] text-gray-500">Today 08:30</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Connect Account Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c0d15] border border-[#1d2030] rounded-3xl p-6 sm:p-7 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#161826]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#141624] border border-[#f5a623]/40 flex items-center justify-center text-[#f5a623]">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Connect Prop Firm MT5 Account</h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-2 rounded-xl bg-[#141624] border border-[#22253a] text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectAccount} className="space-y-4 pt-4">
              {/* Prop Firm Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Select Prop Firm</label>
                <select
                  value={selectedFirm}
                  onChange={(e) => {
                    setSelectedFirm(e.target.value);
                    setServer(`${e.target.value}-Server`);
                  }}
                  className="w-full px-3.5 py-2 bg-[#10121c] border border-[#1c1f30] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500/50"
                >
                  {PROP_FIRMS.map(f => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Account Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Account Size</label>
                <select
                  value={accountSize}
                  onChange={(e) => setAccountSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-[#10121c] border border-[#1c1f30] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value={10000}>$10,000</option>
                  <option value={25000}>$25,000</option>
                  <option value={50000}>$50,000</option>
                  <option value={100000}>$100,000</option>
                  <option value={200000}>$200,000</option>
                </select>
              </div>

              {/* Phase */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Challenge Phase</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Phase 1 (Evaluation)', 'Phase 2 (Verification)', 'Funded Live'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPhase(p)}
                      className={`p-2 rounded-xl text-[11px] font-semibold transition-all text-center ${
                        phase === p
                          ? 'bg-[#141624] border border-purple-500/60 text-purple-300'
                          : 'bg-[#10121c] border border-[#1c1f30] text-gray-400'
                      }`}
                    >
                      {p.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* MT5 Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">MT5 Account / Login</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 5092144"
                  className="w-full px-3.5 py-2 bg-[#10121c] border border-[#1c1f30] rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Investor Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Password / Investor Key</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-[#10121c] border border-[#1c1f30] rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Server */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Broker Server</label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="e.g. FTMO-Demo or FundedNext-Server"
                  className="w-full px-3.5 py-2 bg-[#10121c] border border-[#1c1f30] rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141624] text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Establish Bridge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c0d15] border border-[#1d2030] rounded-3xl p-6 sm:p-7 shadow-2xl text-white relative space-y-5">
            {/* Header: 15-16px semibold/bold white title with clean sans-serif typography */}
            <div className="flex items-center justify-between pb-4 border-b border-[#161826]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#141624] border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15.5px] font-bold text-white tracking-tight">
                      PropPass Compliance Certificate
                    </h3>
                  </div>
                  <div className="text-[12px] text-gray-400 mt-0.5">
                    Verified: Aug 23, 2026 • Real-Time MT5 Telemetry
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-xl bg-[#141624] hover:bg-[#1c1f32] border border-[#22253a] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges Bar: Compact uppercase badges for categories and currencies with bold white text */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#161828] border border-[#272c44] text-[10.5px] font-bold font-mono text-white uppercase tracking-wider">
                PROP COMPLIANCE
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#122b1c] border border-emerald-500/40 text-[10.5px] font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% PASSED
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#141624] border border-[#272c44] text-[10.5px] font-bold font-mono text-white uppercase tracking-wider">
                CURRENCY: USD
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#25182e] border border-purple-500/30 text-[10.5px] font-bold font-mono text-purple-300 uppercase tracking-wider">
                ID: #PP-8924-AUDIT
              </span>
            </div>

            {/* Metrics Card: Modern Financial Template Structure */}
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#10121c] border border-[#1c1f30] divide-y divide-[#171a29]">
                
                {/* Row 1: Risk Sentinel Status */}
                <div className="flex items-center justify-between py-2.5 first:pt-0">
                  <span className="text-[13px] font-medium text-gray-300">Risk Sentinel Status</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#122b1c] border border-emerald-500/30 text-[11px] font-bold font-mono text-emerald-400 uppercase">
                      100% PASSED
                    </span>
                  </div>
                </div>

                {/* Row 2: Max Daily Drawdown Reached */}
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-[13px] font-medium text-gray-300">Max Daily Drawdown Reached</span>
                    <div className="text-[11.5px] text-gray-500 font-mono">Enforced threshold: 5.0%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13.5px] font-bold font-mono text-white">0.42%</div>
                    <div className="text-[11px] text-gray-400 font-mono">(Limit 5.0%)</div>
                  </div>
                </div>

                {/* Row 3: Max Overall Drawdown Reached */}
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-[13px] font-medium text-gray-300">Max Overall Drawdown Reached</span>
                    <div className="text-[11.5px] text-gray-500 font-mono">Enforced threshold: 10.0%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13.5px] font-bold font-mono text-white">1.15%</div>
                    <div className="text-[11px] text-gray-400 font-mono">(Limit 10.0%)</div>
                  </div>
                </div>

                {/* Row 4: Firm Rule Compatibility */}
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <span className="text-[13px] font-medium text-gray-300">Firm Rule Compatibility</span>
                  <div className="flex items-center gap-1.5">
                    {['FTMO', 'FundedNext', 'Pips'].map((firm) => (
                      <span
                        key={firm}
                        className="px-2 py-0.5 rounded bg-[#161828] border border-[#272c44] text-[11px] font-bold font-mono text-purple-300"
                      >
                        {firm}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Secondary Information & Timestamp: 12-13px gray text */}
              <div className="space-y-1.5 px-1">
                <p className="text-[12.5px] text-gray-400 leading-relaxed font-sans">
                  PropPass maintains sub-second risk telemetry with automated stop-loss placement, preventing challenge disqualifications.
                </p>
                <div className="text-[12px] text-gray-500 font-mono flex items-center justify-between pt-1">
                  <span>Audit Engine: Sentinel v4.8</span>
                  <span>Latency: 14ms (Direct Gateway)</span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-3 rounded-xl bg-[#141624] hover:bg-[#1e2338] border border-[#2b304c] hover:border-purple-500/40 text-[13px] font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
