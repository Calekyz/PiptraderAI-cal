import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Database, Lock, AlertTriangle, HardDrive } from 'lucide-react';
import { AdminApi } from '../api';

interface DataStat {
  key: string;
  label: string;
  rows: number;
  oldest: string | null;
  newest: string | null;
  bytes: number;
  bytesFormatted: string;
  notes?: string | null;
  error?: string;
}

const RETENTION_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
  { label: '⚠ All (wipe everything)', value: 0 },
];

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export const DataRetentionView: React.FC = () => {
  const [stats, setStats] = useState<DataStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [retention, setRetention] = useState<number>(90);
  const [openCategory, setOpenCategory] = useState<DataStat | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const s = await AdminApi.getDataStats();
      setStats(s);
    } catch (err: any) {
      setMessage(`Failed to load stats: ${err?.message || 'unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClear = async () => {
    if (!openCategory) return;
    if (confirmText !== 'DELETE') {
      setMessage('Type DELETE to confirm.');
      return;
    }
    if (!adminPassword) {
      setMessage('Admin password required.');
      return;
    }
    try {
      setClearing(true);
      setMessage(null);
      const res = await AdminApi.clearRetention(openCategory.key, retention, adminPassword, confirmText);
      setMessage(`✅ ${res.message}`);
      setOpenCategory(null);
      setAdminPassword('');
      setConfirmText('');
      await loadStats();
    } catch (err: any) {
      setMessage(`❌ ${err?.message || 'Clear failed'}`);
    } finally {
      setClearing(false);
    }
  };

  const totalBytes = stats.reduce((acc, s) => acc + (s.bytes || 0), 0);
  const totalBytesFmt = totalBytes < 1024 * 1024
    ? `${(totalBytes / 1024).toFixed(1)} KB`
    : `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Data Retention & Cleanup
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage what your database keeps. Rows older than the window will be deleted permanently.
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Retention window selector */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-300">Retention window</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Applied when you click Clear on any category
            </div>
          </div>
          <div className="flex gap-2">
            {RETENTION_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setRetention(o.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  retention === o.value
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-[#181d38] hover:bg-[#22294e] text-slate-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-xs border ${
          message.startsWith('✅')
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : message.startsWith('❌')
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {message}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.key} className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {s.notes || 'All rows'}
                </div>
              </div>
              <HardDrive className="w-4 h-4 text-slate-600" />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Rows</div>
                <div className="text-base font-bold text-white">{s.rows.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Size</div>
                <div className="text-base font-bold text-amber-400">{s.bytesFormatted}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Oldest</div>
                <div className="text-xs font-medium text-slate-300 mt-0.5">{fmtDate(s.oldest)}</div>
              </div>
            </div>

            {s.error ? (
              <div className="text-[11px] text-rose-400 mb-3">Error: {s.error}</div>
            ) : null}

            <button
              onClick={() => {
                setOpenCategory(s);
                setAdminPassword('');
                setConfirmText('');
                setMessage(null);
              }}
              disabled={s.rows === 0}
              className="mt-auto w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {retention === 0
                ? `Delete ALL ${s.rows.toLocaleString()} rows`
                : `Clear older than ${retention}d (${s.rows.toLocaleString()} rows)`}
            </button>
          </div>
        ))}
      </div>

      {/* Total footer */}
      <div className="text-[11px] text-slate-500 text-center">
        Total tracked size: <span className="text-slate-300 font-semibold">{totalBytesFmt}</span>
        {' · '}Stats fetched {stats.length > 0 ? 'live' : 'unavailable'} from server
      </div>

      {/* Clear modal */}
      {openCategory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1224] border border-rose-500/40 rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-base">Clear {openCategory.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {retention === 0 ? (
                    <>Delete <strong className="text-rose-300">ALL {openCategory.rows.toLocaleString()} rows</strong> from{' '}<strong className="text-white">{openCategory.label}</strong>.</>
                  ) : (
                    <>Delete rows older than <strong className="text-rose-300">{retention} days</strong> from{' '}<strong className="text-white">{openCategory.label}</strong>.</>
                  )}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
              retention === 0
                ? 'bg-rose-600/20 border-rose-500/50 text-rose-100'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              ⚠️ <strong>This cannot be undone.</strong> {retention === 0
                ? <>Every single row in this category will be <strong>permanently deleted</strong>. This includes recent activity.</>
                : <>Records will be permanently removed from the database.</>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Admin Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-3 py-2 bg-[#1b1122] border border-rose-500/30 rounded-xl text-white text-xs font-mono outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Type{' '}
                <span className="text-rose-400 font-mono font-bold">
                  {retention === 0 ? 'DELETE ALL' : 'DELETE'}
                </span>{' '}
                to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={retention === 0 ? 'DELETE ALL' : 'DELETE'}
                className="w-full px-3 py-2 bg-[#1b1122] border border-rose-500/30 rounded-xl text-white text-xs font-mono outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOpenCategory(null)}
                disabled={clearing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={
                  clearing ||
                  !adminPassword ||
                  (retention === 0 ? confirmText !== 'DELETE ALL' : confirmText !== 'DELETE')
                }
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold"
              >
                {clearing
                  ? 'Clearing...'
                  : retention === 0
                  ? `Delete ALL ${openCategory.rows.toLocaleString()} rows`
                  : `Delete rows older than ${retention}d`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
