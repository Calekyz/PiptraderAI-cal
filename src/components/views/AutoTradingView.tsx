import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Link2,
  Unlink,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AutoTradingViewProps {
  user?: UserProfile;
  onOpenUpgrade?: () => void;
}

interface BotStatusPayload {
  connected: boolean;
  botEmail?: string | null;
  me?: any;
  ea?: { connected?: boolean } | null;
  risk?: {
    active?: boolean;
    session?: any;
    current?: { balance?: number; equity?: number; drawdown?: number; profit?: number };
  } | null;
  account?: any;
  errors?: { [k: string]: string | null };
}

function fmtMoney(n: number | undefined | null): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const AutoTradingView: React.FC<AutoTradingViewProps> = ({ user, onOpenUpgrade }) => {
  const isPremium = user?.plan === 'Pro' || user?.plan === 'Elite';

  const [status, setStatus] = useState<BotStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect modal
  const [showConnect, setShowConnect] = useState(false);
  const [botEmail, setBotEmail] = useState('');
  const [botPassword, setBotPassword] = useState('');

  const email = user?.email || '';

  const fetchStatus = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bridge/status', {
        headers: { 'x-user-email': email },
      });
      const data: BotStatusPayload & { error?: string } = await res.json();
      if (res.status === 401 && (data as any).error === 'not_connected') {
        setStatus({ connected: false });
      } else if (!res.ok) {
        setError((data as any).error || `Status failed (${res.status})`);
        setStatus({ connected: false });
      } else {
        setStatus(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Auto-refresh every 20s when connected
  useEffect(() => {
    if (!status?.connected) return;
    const id = setInterval(fetchStatus, 20000);
    return () => clearInterval(id);
  }, [status?.connected, fetchStatus]);

  const handleConnect = async () => {
    if (!botEmail || !botPassword) {
      setError('Enter bot email and password');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/bridge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify({ botEmail, botPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Connect failed');
      } else {
        setShowConnect(false);
        setBotEmail('');
        setBotPassword('');
        await fetchStatus();
      }
    } catch (e: any) {
      setError(e?.message || 'Connect failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your bot account? You can reconnect anytime.')) return;
    setActionLoading(true);
    try {
      await fetch('/api/bridge/disconnect', {
        method: 'POST',
        headers: { 'x-user-email': email },
      });
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRiskAction = async (action: 'start' | 'stop') => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bridge/risk-${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify({
          startingBalance: status?.account?.balance,
          slAmount: 200,
          tpAmount: null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || `${action} failed`);
      }
      await fetchStatus();
    } catch (e: any) {
      setError(e?.message || `${action} failed`);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Locked (non-premium) ────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="min-h-[72vh] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-[#140f09]/95 border border-[#593d18] rounded-2xl p-7 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-[#f5a623]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pro &amp; Elite Feature
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] text-gray-300 leading-relaxed">
            Auto Trading lets you link your cloud bot account and control live
            execution directly from PipTraderAI. Upgrade to unlock.
          </p>
          <button
            onClick={() => onOpenUpgrade?.()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#ff7b00] text-black font-bold text-sm hover:brightness-110 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────
  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  // ─── Not connected ───────────────────────────────────────────
  if (!status?.connected) {
    return (
      <>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}
          <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Connect Your Bot Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Link your cloud bot account to control Auto Trading from here.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300 leading-relaxed">
              We use your bot-platform credentials once to obtain a secure token.
              Your password is never stored — only the resulting token.
            </div>

            <button
              onClick={() => setShowConnect(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Connect Bot Account
            </button>
          </div>
        </div>

        {showConnect && (
          <ConnectModal
            email={botEmail}
            password={botPassword}
            setEmail={setBotEmail}
            setPassword={setBotPassword}
            submitting={connecting}
            error={error}
            onClose={() => { setShowConnect(false); setError(null); }}
            onSubmit={handleConnect}
          />
        )}
      </>
    );
  }

  // ─── Connected ───────────────────────────────────────────────
  const acct = status.account || {};
  const risk = status.risk || {};
  const cur = risk.current || {};
  const eaConnected = Boolean(status.ea?.connected);
  const riskActive = Boolean(risk.active);
  const profit = typeof cur.profit === 'number' ? cur.profit : 0;
  const profitPositive = profit >= 0;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Auto Trading</h2>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Connected as <span className="text-slate-200 font-medium">{status.botEmail}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-2 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Unlink className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Status row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Bot"
          value={riskActive ? 'Running' : 'Stopped'}
          accent={riskActive ? 'emerald' : 'slate'}
        />
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="EA Link"
          value={eaConnected ? 'Online' : 'Offline'}
          accent={eaConnected ? 'emerald' : 'rose'}
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          label="Balance"
          value={`$${fmtMoney(acct.balance)}`}
          accent="slate"
        />
        <StatCard
          icon={profitPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          label="Session P&L"
          value={`${profitPositive ? '+' : ''}$${fmtMoney(profit)}`}
          accent={profitPositive ? 'emerald' : 'rose'}
        />
      </div>

      {/* Account snapshot */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Live Account
          </div>
          <div className="text-[11px] text-slate-500">
            {acct.company} · {acct.server}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <KV label="Equity" value={`$${fmtMoney(acct.equity)}`} />
          <KV label="Free Margin" value={`$${fmtMoney(acct.margin_free)}`} />
          <KV label="Margin Level" value={acct.margin_level ? `${fmtMoney(acct.margin_level)}%` : '—'} />
          <KV label="Leverage" value={acct.leverage ? `1:${acct.leverage}` : '—'} />
          <KV label="Login" value={String(acct.login || '—')} />
          <KV label="Currency" value={acct.currency || '—'} />
          <KV label="Name" value={acct.name || '—'} />
          <KV label="Trade Allowed" value={acct.trade_allowed === 1 ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Risk session */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Risk Session
          </div>
          <div className="flex items-center gap-2">
            {riskActive ? (
              <button
                onClick={() => handleRiskAction('stop')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Pause className="w-3.5 h-3.5" />
                {actionLoading ? 'Stopping...' : 'Stop Auto Trading'}
              </button>
            ) : (
              <button
                onClick={() => handleRiskAction('start')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {actionLoading ? 'Starting...' : 'Start Auto Trading'}
              </button>
            )}
          </div>
        </div>

        {riskActive ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <KV label="Starting Balance" value={`$${fmtMoney(risk.session?.starting_balance)}`} />
            <KV label="Current Balance" value={`$${fmtMoney(cur.balance)}`} />
            <KV label="Current Equity" value={`$${fmtMoney(cur.equity)}`} />
            <KV label="Drawdown" value={`$${fmtMoney(cur.drawdown)}`} />
            <KV label="SL Amount" value={`$${fmtMoney(risk.session?.sl_amount)}`} />
            <KV label="TP Amount" value={risk.session?.tp_amount ? `$${fmtMoney(risk.session.tp_amount)}` : 'None'} />
            <KV label="Started" value={risk.session?.created_at ? new Date(risk.session.created_at).toLocaleString() : '—'} />
            <KV label="Session ID" value={String(risk.session?.id || '—')} />
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-4">
            No active risk session. Click <span className="text-emerald-400 font-semibold">Start Auto Trading</span> to begin.
          </div>
        )}
      </div>

      {/* Partial-error warning */}
      {status.errors && Object.values(status.errors).some((e) => e && e !== 'not_connected') && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Some data failed to load
          </div>
          {Object.entries(status.errors).map(([k, v]) =>
            v && v !== 'not_connected' ? <div key={k}>· {k}: {v}</div> : null
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'emerald' | 'rose' | 'slate';
}> = ({ icon, label, value, accent }) => {
  const accentCls =
    accent === 'emerald' ? 'text-emerald-400 bg-emerald-500/10' :
    accent === 'rose'    ? 'text-rose-400 bg-rose-500/10' :
                           'text-slate-300 bg-slate-500/10';
  return (
    <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentCls}`}>
          {icon}
        </div>
      </div>
      <div className="text-base font-bold text-white">{value}</div>
    </div>
  );
};

const KV: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-slate-100 mt-0.5">{value}</div>
  </div>
);

const ConnectModal: React.FC<{
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}> = ({ email, password, setEmail, setPassword, submitting, error, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-[#0e1224] border border-purple-500/40 rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-base">Connect Bot Account</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your cloud bot platform credentials. We use them once to get a secure token; your password is not stored.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bot Account Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bot Account Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !email || !password}
          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {submitting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  </div>
);

export default AutoTradingView;
