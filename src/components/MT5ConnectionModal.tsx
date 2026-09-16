import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Lock, 
  ExternalLink, 
  Server, 
  Key, 
  ShieldCheck, 
  Diamond, 
  Link2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';

interface MT5ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenUpgrade?: (tier?: 'Pro' | 'Platinum' | 'Ultimate') => void;
}

export const MT5ConnectionModal: React.FC<MT5ConnectionModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenUpgrade
}) => {
  const isPlatinum = user.plan === 'Platinum' || user.plan === 'Ultimate';

  const [broker, setBroker] = useState('FTMO-Server');
  const [accountNumber, setAccountNumber] = useState('10984218');
  const [serverType, setServerType] = useState<'demo' | 'live'>('live');
  const [password, setPassword] = useState('••••••••••••');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setStatusMessage('Connected successfully to MetaTrader 5 Bridge.');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0c0d18] text-white border border-[#232742] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1b1e33] flex items-center justify-between bg-[#0f1122]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">MT5 Account Connection</h3>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Diamond className="w-2.5 h-2.5 fill-amber-400" />
                  Platinum
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Direct low-latency bridge to your MetaTrader 5 brokerage terminal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#171a2e] hover:bg-[#222744] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!isPlatinum ? (
            <div className="p-5 rounded-2xl bg-[#161226] border border-purple-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Platinum Feature</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  MetaTrader 5 live execution bridge is exclusively available for Platinum &amp; Ultimate members.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpgrade?.('Platinum');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                Upgrade to Platinum
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Account Type</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#141628] p-1 rounded-xl border border-[#232742]">
                    <button
                      type="button"
                      onClick={() => setServerType('live')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        serverType === 'live' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setServerType('demo')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        serverType === 'demo' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Demo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Broker / Server</label>
                  <input
                    type="text"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="e.g. FTMO-Server, IC-Markets"
                    className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">MT5 Account Number / Login</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 10984218"
                  className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Investor / Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter MT5 account password"
                  className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-Bit Encrypted Link</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#16192e] hover:bg-[#202442] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isConnected ? 'Sync MT5' : 'Connect MT5'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Connected Bridge Details */}
          <div className="p-4 rounded-2xl bg-[#090b14] border border-[#1b1f38] space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span>Bridge Protocol:</span>
              <span className="font-mono text-gray-200">WebSocket EA v4.9</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Execution Latency:</span>
              <span className="font-mono text-emerald-400">&lt; 14ms (London LD4)</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Auto-Lot Guard:</span>
              <span className="font-mono text-purple-300">Enabled (1.5% Max)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
