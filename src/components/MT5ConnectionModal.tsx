import React, { useState, useEffect } from 'react';
import {
  X, Check, Lock, ShieldCheck, Diamond, Link2, RefreshCw,
  AlertCircle, Loader2, Save, Eraser, Wallet, Server,
} from 'lucide-react';
import { UserProfile } from '../types';

interface MT5ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenUpgrade?: (tier?: 'Starter' | 'Pro' | 'Elite') => void;
}

interface SavedDetails {
  broker: string;
  login: string;
  server: string;
  hasPassword: boolean;
  updatedAt: string | null;
}

interface LiveAccount {
  balance: number;
  equity: number;
  login: number | string;
  server: string;
  company: string;
  currency: string;
  name?: string;
}

export const MT5ConnectionModal: React.FC<MT5ConnectionModalProps> = ({
  isOpen, onClose, user, onOpenUpgrade,
}) => {
  const isElite = user.plan === 'Elite';

  const [broker, setBroker] = useState('');
  const [login, setLogin] = useState('');
  const [server, setServer] = useState('');
  const [password, setPassword] = useState('');

  const [saved, setSaved] = useState<SavedDetails | null>(null);
  const [liveAccount, setLiveAccount] = useState<LiveAccount | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.email) return;
    loadDetails();
  }, [isOpen, user?.email]);

  const loadDetails = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/bridge/mt5-details', {
        headers: { 'x-user-email': user.email },
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.saved);
        setLiveAccount(data.liveAccount);
        if (data.saved) {
          setBroker(data.saved.broker || '');
          setLogin(data.saved.login || '');
          setServer(data.saved.server || '');
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!broker.trim() || !login.trim() || !server.trim()) {
      setStatusMessage({ type: 'error', text: 'Broker, login, and server are required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/bridge/mt5-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user.email },
        body: JSON.stringify({ broker, login, server, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'MT5 details saved successfully.' });
        setPassword('');
        await loadDetails();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Save failed' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Network error' });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/bridge/status', {
        headers: { 'x-user-email': user.email },
      });
      const data = await res.json();
      if (res.status === 401) {
        setStatusMessage({ type: 'error', text: 'No bot account linked. Connect via the Auto Trading tab first.' });
      } else if (data.success && data.connected && data.account?.login) {
        const acct = data.account;
        setLiveAccount(acct);
        setStatusMessage({
          type: 'success',
          text: `Live: ${acct.company} · ${acct.currency} ${Number(acct.balance || 0).toFixed(2)}`,
        });
      } else {
        setStatusMessage({ type: 'info', text: 'Bot session active — no MT5 account attached yet.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Test failed' });
    } finally { setTesting(false); }
  };

  const handleResetForm = () => {
    setBroker(saved?.broker || '');
    setLogin(saved?.login || '');
    setServer(saved?.server || '');
    setPassword('');
    setStatusMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0c0d18] text-white border border-[#232742] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1b1e33] flex items-center justify-between bg-[#0f1122] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">MT5 Account Connection</h3>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Diamond className="w-2.5 h-2.5 fill-amber-400" /> Elite
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Save your MetaTrader 5 credentials for PropPass tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#171a2e] hover:bg-[#222744] text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {!isElite ? (
            <div className="p-5 rounded-2xl bg-[#161226] border border-purple-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Elite Feature</h4>
                <p className="text-xs text-gray-400 mt-1">MetaTrader 5 connection is exclusively available for Elite members.</p>
              </div>
              <button
                onClick={() => { onClose(); onOpenUpgrade?.('Elite'); }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs"
              >
                Upgrade to Elite
              </button>
            </div>
          ) : (
            <>
              {/* Live account badge */}
              {liveAccount && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-emerald-300 font-semibold">Live from bot platform</div>
                    <div className="text-sm font-bold text-white truncate">
                      {liveAccount.company || 'MT5'} · {liveAccount.currency || 'USD'} {Number(liveAccount.balance || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-emerald-300/70 truncate">
                      Login {liveAccount.login} · {liveAccount.server}
                    </div>
                  </div>
                </div>
              )}

              {loading && !saved && (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading saved details…
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block flex items-center gap-1.5">
                      <Server className="w-3 h-3" /> Broker
                    </label>
                    <input
                      type="text"
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                      placeholder="e.g. Valetax, FTMO"
                      className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Server</label>
                    <input
                      type="text"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      placeholder="e.g. ValetaxGlobal-Live3"
                      className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">MT5 Login / Account Number</label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="e.g. 561013124"
                    className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">
                    Investor Password {saved?.hasPassword && <span className="text-emerald-400 text-[10px]">(already saved — leave blank to keep)</span>}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={saved?.hasPassword ? '••••••••••••' : 'Enter MT5 password'}
                    className="w-full bg-[#131526] border border-[#242947] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {statusMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                      : 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                  }`}>
                    {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      : statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {saved?.updatedAt && (
                  <div className="text-[10px] text-gray-500 text-center">
                    Last saved: {new Date(saved.updatedAt).toLocaleString()}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3 py-2 rounded-xl bg-[#16192e] hover:bg-[#202442] text-gray-300 text-xs font-semibold flex items-center gap-1.5"
                    title="Reset to last saved"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Reset
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing}
                      className="px-4 py-2 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-950/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Test Connection
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save MT5 Details
                    </button>
                  </div>
                </div>
              </form>

              <div className="p-4 rounded-2xl bg-[#090b14] border border-[#1b1f38] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Encrypted server-side storage
                </span>
                <span className="text-emerald-400">KV encrypted</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MT5ConnectionModal;
