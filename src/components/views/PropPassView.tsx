import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, RotateCcw, BarChart2, TrendingUp, TrendingDown,
  Clock, CheckCircle2, AlertTriangle, Save, Edit3, X, Loader2,
  Zap, ArrowUpRight, Wallet, Target, Activity,
} from 'lucide-react';

interface PropSettings {
  firm: string;
  accountSize: number;
  maxDailyLossPct: number;
  profitTargetPct: number;
  days: number;
  updatedAt?: string;
}

interface LiveStatus {
  balance: number;
  equity: number;
  startingBalance: number;
  profit: number;
  profitPct: number;
  drawdownPct: number;
  targetPct: number;
  maxLossPct: number;
  progressPct: number;
  drawdownUsagePct: number;
  riskActive: boolean;
  accountLogin?: number | string;
  accountServer?: string;
  accountBroker?: string;
  accountCurrency?: string;
}

interface PropStatusResponse {
  success: boolean;
  connected: boolean;
  settings: PropSettings | null;
  live: LiveStatus | null;
  error?: string;
}

interface PropPassViewProps {
  onNavigateToTab?: (tab: string) => void;
}

const FIRMS = ['FTMO', 'FundedNext', 'Funding Pips', 'The Funded Trader', 'E8 Markets', 'Alpha Capital', 'Other'];

const DEFAULT_SETTINGS: PropSettings = {
  firm: 'FTMO',
  accountSize: 100000,
  maxDailyLossPct: 5,
  profitTargetPct: 10,
  days: 30,
};

export const PropPassView: React.FC<PropPassViewProps> = ({ onNavigateToTab }) => {
  const [status, setStatus] = useState<PropStatusResponse | null>(null);
  const [settings, setSettings] = useState<PropSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Get user email from localStorage (same pattern as other views)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pipnex_active_session_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) setUserEmail(String(parsed.email).toLowerCase().trim());
      }
    } catch {}
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bridge/prop-status', {
        headers: { 'x-user-email': userEmail },
      });
      const data: PropStatusResponse = await res.json();
      setStatus(data);
      if (data.settings) setSettings(data.settings);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prop status');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    fetchStatus();
    const id = setInterval(fetchStatus, 30000);
    return () => clearInterval(id);
  }, [userEmail, fetchStatus]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/bridge/prop-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('Settings saved.');
        setEditing(false);
        await fetchStatus();
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  const live = status?.live;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">PropPass</h1>
            <p className="text-xs text-slate-400 mt-0.5">Track your prop firm challenge in real time</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300 disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Not connected banner */}
      {!status?.connected && (
        <div className="p-5 rounded-2xl bg-[#0f1224] border border-[#1e233d] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">No bot account connected</div>
              <div className="text-xs text-slate-400 mt-0.5">Connect via Auto Trading to see live balance and drawdown</div>
            </div>
            <button
              onClick={() => onNavigateToTab?.('auto-trading')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              Go to Auto Trading →
            </button>
          </div>
        </div>
      )}

      {/* Settings card */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Challenge Rules
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditing(false); if (status?.settings) setSettings(status.settings); }}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
            </div>
          )}
        </div>

        {!editing && status?.settings ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <KV label="Firm" value={settings.firm} />
            <KV label="Account Size" value={`$${Number(settings.accountSize).toLocaleString()}`} />
            <KV label="Profit Target" value={`${settings.profitTargetPct}%`} />
            <KV label="Max Daily Loss" value={`${settings.maxDailyLossPct}%`} />
            <KV label="Days Allowed" value={String(settings.days)} />
            <KV label="Last Updated" value={settings.updatedAt ? new Date(settings.updatedAt).toLocaleDateString() : '—'} />
          </div>
        ) : !status?.settings && !editing ? (
          <div className="text-center py-4">
            <div className="text-xs text-slate-400 mb-3">No challenge rules configured yet</div>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              Configure Challenge →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prop Firm</label>
              <select
                value={settings.firm}
                onChange={(e) => setSettings({ ...settings, firm: e.target.value })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
              >
                {FIRMS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Size ($)</label>
              <input
                type="number"
                value={settings.accountSize}
                onChange={(e) => setSettings({ ...settings, accountSize: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Profit Target (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.profitTargetPct}
                onChange={(e) => setSettings({ ...settings, profitTargetPct: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max Daily Loss (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.maxDailyLossPct}
                onChange={(e) => setSettings({ ...settings, maxDailyLossPct: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Days Allowed</label>
              <input
                type="number"
                value={settings.days}
                onChange={(e) => setSettings({ ...settings, days: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live progress (only if connected) */}
      {live && (
        <>
          {/* Stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Wallet className="w-4 h-4" />}
              label="Current Balance"
              value={`${live.accountCurrency || 'USD'} ${Number(live.balance).toFixed(2)}`}
              accent="slate"
            />
            <StatCard
              icon={live.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              label="Net P&L"
              value={`${live.profit >= 0 ? '+' : ''}${Number(live.profit).toFixed(2)}`}
              sub={`${live.profitPct >= 0 ? '+' : ''}${live.profitPct}%`}
              accent={live.profit >= 0 ? 'emerald' : 'rose'}
            />
            <StatCard
              icon={<Activity className="w-4 h-4" />}
              label="Bot Status"
              value={live.riskActive ? 'Running' : 'Stopped'}
              accent={live.riskActive ? 'emerald' : 'slate'}
            />
            <StatCard
              icon={<ArrowUpRight className="w-4 h-4" />}
              label="Account"
              value={live.accountLogin ? `#${live.accountLogin}` : '—'}
              sub={live.accountBroker || ''}
              accent="slate"
            />
          </div>

          {/* Progress bars */}
          <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 space-y-4">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" /> Challenge Progress
            </div>

            {/* Target progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Profit Target ({live.targetPct}%)</span>
                <span className="font-mono font-bold text-emerald-400">{live.progressPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#0a0d1c] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, live.progressPct))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {live.profit >= 0 ? `${live.profitPct}% of ${live.targetPct}%` : 'No progress yet — start trading'}
              </div>
            </div>

            {/* Drawdown usage */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Drawdown Used ({live.maxLossPct}% max)</span>
                <span className={`font-mono font-bold ${
                  live.drawdownUsagePct >= 85 ? 'text-rose-400' :
                  live.drawdownUsagePct >= 60 ? 'text-amber-400' :
                  'text-slate-300'
                }`}>{live.drawdownUsagePct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#0a0d1c] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    live.drawdownUsagePct >= 85 ? 'bg-gradient-to-r from-rose-600 to-rose-500' :
                    live.drawdownUsagePct >= 60 ? 'bg-gradient-to-r from-amber-600 to-amber-500' :
                    'bg-gradient-to-r from-blue-600 to-blue-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, live.drawdownUsagePct))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Current drawdown: {live.drawdownPct}% of {live.maxLossPct}%
                {live.drawdownUsagePct >= 85 && <span className="text-rose-400 ml-2">⚠️ Near limit</span>}
              </div>
            </div>

            {/* Warning banner if close to limit */}
            {live.drawdownUsagePct >= 85 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-300">
                  <strong>Danger zone:</strong> {live.drawdownUsagePct}% of your daily loss allowance is used.
                  Consider stopping the bot to protect your challenge.
                </div>
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateToTab?.('auto-trading')}
              className="px-4 py-2 rounded-xl bg-[#181d38] hover:bg-[#22294e] text-slate-200 text-xs font-bold"
            >
              Manage Bot →
            </button>
            <button
              onClick={fetchStatus}
              className="px-4 py-2 rounded-xl bg-[#181d38] hover:bg-[#22294e] text-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────

const KV: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-slate-100 mt-0.5">{value}</div>
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: 'emerald' | 'rose' | 'slate';
}> = ({ icon, label, value, sub, accent }) => {
  const cls =
    accent === 'emerald' ? 'text-emerald-400 bg-emerald-500/10' :
    accent === 'rose' ? 'text-rose-400 bg-rose-500/10' :
    'text-slate-300 bg-slate-500/10';
  return (
    <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cls}`}>{icon}</div>
      </div>
      <div className="text-base font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
};

export default PropPassView;
