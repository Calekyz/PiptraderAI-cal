import React, { useState, useEffect } from 'react';
import { Youtube, Save, Trash2, CheckCircle2, AlertCircle, Video, ExternalLink } from 'lucide-react';

interface TutorialMeta {
  id: string;
  category: string;
  label: string;
}

const TUTORIALS: TutorialMeta[] = [
  { id: 'intro',              category: 'Getting Started',  label: 'Introduction' },
  { id: 'signup',             category: 'Getting Started',  label: 'Sign Up' },
  { id: 'signin',             category: 'Getting Started',  label: 'Sign In' },
  { id: 'sotd',               category: 'Signal Of The Day', label: 'Signal of the Day' },
  { id: 'newsiq',             category: 'News IQ',           label: 'News IQ' },
  { id: 'referral',           category: 'Refer & Earn',      label: 'Refer & Earn' },
  { id: 'upload-chart',       category: 'Upload Chart',      label: 'Upload Chart' },
  { id: 'mtf-intel',          category: 'Upload Charts',     label: 'Multi-Timeframe Intelligence' },
  { id: 'subscribe',          category: 'How to Subscribe',  label: 'How to Subscribe' },
  { id: 'mt5',                category: 'MT5 Connection',    label: 'MT5 Connection' },
  { id: 'pulse-sig',          category: 'Pulse Signals',     label: 'Pulse Signals' },
  { id: 'strategy-builder',   category: 'Build Bot',         label: 'Build Bot' },
  { id: 'ai-trading',         category: 'AI Trading',        label: 'AI Trading' },
  { id: 'auto-trading',       category: 'Auto Trading',      label: 'Auto Trading' },
];

interface Api {
  getTutorialVideos: () => Promise<Record<string, string>>;
  saveTutorialVideo: (id: string, url: string) => Promise<Record<string, string>>;
}

export const TutorialVideosView: React.FC<{ api: Api }> = ({ api }) => {
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getTutorialVideos();
      setVideos(data || {});
      setDrafts(data || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const showFlash = (id: string, ok: boolean, msg: string) => {
    setFlash({ id, ok, msg });
    setTimeout(() => setFlash(null), 2500);
  };

  const handleSave = async (id: string) => {
    const url = (drafts[id] || '').trim();
    setSavingId(id);
    try {
      const updated = await api.saveTutorialVideo(id, url);
      setVideos(updated || {});
      setDrafts(updated || {});
      showFlash(id, true, url ? 'Video saved' : 'Video removed');
    } catch (err: any) {
      showFlash(id, false, err?.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setDrafts((prev) => ({ ...prev, [id]: '' }));
    await handleSave(id);
  };

  const isDirty = (id: string) => (drafts[id] || '').trim() !== (videos[id] || '').trim();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-[#1e233d] bg-[#0c0f1e] p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Tutorial Videos</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Paste a YouTube URL for each tutorial. It will appear instantly in the user's
              <strong className="text-slate-200"> How to Use </strong> page. Leave blank to show a
              &quot;Video coming soon&quot; placeholder.
            </p>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              Accepted formats: <span className="text-purple-300">youtube.com/watch?v=ID</span> · <span className="text-purple-300">youtu.be/ID</span> · <span className="text-purple-300">raw 11-char ID</span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-[#1e233d] bg-[#0c0f1e] overflow-hidden">
        <div className="divide-y divide-[#181c30]">
          {TUTORIALS.map((tut) => {
            const saved = videos[tut.id] || '';
            const draft = drafts[tut.id] ?? '';
            const dirty = isDirty(tut.id);
            const saving = savingId === tut.id;
            const fl = flash && flash.id === tut.id ? flash : null;

            return (
              <div key={tut.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Left: label */}
                <div className="sm:w-56 shrink-0">
                  <div className="text-xs font-bold text-white">{tut.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">{tut.category}</div>
                </div>

                {/* Middle: input */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <Video className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [tut.id]: e.target.value }))}
                      placeholder="https://youtu.be/..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0d1a] border border-[#222848] focus:border-purple-500/60 text-xs text-white placeholder-slate-600 outline-none transition-colors font-mono"
                      disabled={loading}
                    />
                  </div>

                  {saved && !dirty && (
                    <a
                      href={saved}
                      target="_blank"
                      rel="noreferrer"
                      title="Open current video"
                      className="p-2 rounded-lg bg-[#141830] hover:bg-[#1c2240] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {fl && (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${fl.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fl.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {fl.msg}
                    </span>
                  )}

                  <button
                    onClick={() => handleSave(tut.id)}
                    disabled={saving || !dirty}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      dirty && !saving
                        ? 'bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white hover:shadow-md hover:shadow-purple-500/40'
                        : 'bg-[#141830] text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3 h-3" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>

                  {saved && (
                    <button
                      onClick={() => handleRemove(tut.id)}
                      disabled={saving}
                      title="Remove video"
                      className="p-2 rounded-lg bg-[#1c0f14] hover:bg-[#2b1216] border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 text-center pt-2">
        Changes appear immediately on the user side — no redeploy needed.
      </div>
    </div>
  );
};
