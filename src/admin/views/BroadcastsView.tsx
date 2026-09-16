import React, { useState, useEffect } from 'react';
import {
  Radio,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Bell,
  Sparkles,
  Users,
  Info
} from 'lucide-react';
import { AdminBroadcast } from '../types';
import { AdminApi } from '../api';

export const BroadcastsView: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'>('INFO');
  const [targetSegment, setTargetSegment] = useState<'ALL' | 'FREE_TRIAL' | 'PRO' | 'ELITE' | 'PLATINUM'>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getBroadcasts();
      setBroadcasts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await AdminApi.createBroadcast({
        title,
        message,
        urgency,
        targetSegment
      });

      setSuccessMsg('Broadcast announcement dispatched to all connected traders.');
      setTitle('');
      setMessage('');
      fetchBroadcasts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      await AdminApi.deleteBroadcast(id);
      fetchBroadcasts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-purple-400" />
          Broadcast Announcements & System Alerts
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Push real-time pop-up notifications, market news flashes, and scheduled maintenance notices to user screens.
        </p>
      </div>

      {/* Grid: Composer & Active Broadcasts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-400" />
            Create New Broadcast Announcement
          </h2>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateBroadcast} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Headline / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled NFP Trading Session or Server Upgrade"
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                >
                  <option value="INFO">INFO (Blue)</option>
                  <option value="WARNING">WARNING (Amber)</option>
                  <option value="CRITICAL">CRITICAL (Red)</option>
                  <option value="SUCCESS">SUCCESS (Green)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Audience Segment</label>
                <select
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                >
                  <option value="ALL">All Traders</option>
                  <option value="FREE_TRIAL">Free Trial Members</option>
                  <option value="PRO">Pro Tier</option>
                  <option value="ELITE">Elite Institutional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message Content</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide detailed information regarding the update..."
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
            </button>
          </form>
        </div>

        {/* Active Broadcasts (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-amber-400" />
              Live Broadcasts on Platform
            </h2>

            <div className="space-y-3">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading broadcasts...</div>
              ) : broadcasts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-[#232847] rounded-xl">
                  No active broadcasts. Send an announcement above to display it to traders.
                </div>
              ) : (
                broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-[#14182e] border border-[#232847] rounded-xl space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.urgency === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : b.urgency === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : b.urgency === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {b.urgency}
                        </span>
                        <h3 className="font-bold text-xs text-white">{b.title}</h3>
                      </div>

                      <button
                        onClick={() => handleDeleteBroadcast(b.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                        title="Delete Broadcast"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{b.message}</p>

                    <div className="pt-2 border-t border-[#1e233d] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Audience: {b.targetSegment}</span>
                      <span>{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
