import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  CreditCard,
  LifeBuoy,
  Lock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AdminSettings } from '../types';
import { AdminApi } from '../api';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    platformName: 'PipNex AI',
    supportEmail: 'support@pipnexai.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultStarterCredits: 500,
    defaultProCredits: 2000,
    defaultEliteCredits: 10000,
    starterPriceUsd: 49,
    proPriceUsd: 99,
    elitePriceUsd: 199,
    autoCloseResolvedTicketsDays: 7,
    securityEnforceMfa: true,
    sessionTimeoutMinutes: 120
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await AdminApi.getSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const updated = await AdminApi.updateSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Platform Configuration & Governance
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune credit engine multipliers, tier pricing, ticket automation, and platform security rules.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Platform configuration successfully saved and persisted to database.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Compliance Guarantee */}
        <div className="p-4 bg-[#12162b] border border-[#232a52] rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">Strict Non-Custodial SaaS Guarantee</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PipNex AI is an algorithmic intelligence software subscription. No custodial withdrawal engine is present in this system.
            </p>
          </div>
        </div>

        {/* Section 1: General Platform */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e233d] pb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            General Platform Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Official Support Desk Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3 bg-[#14182e] rounded-xl border border-[#232847] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNewRegistrations}
                onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                className="rounded border-[#262b49] bg-[#161a30] text-purple-600 focus:ring-purple-500/20"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Allow New User Registrations</span>
                <span className="text-[10px] text-slate-400">Accept registrations from new traders</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#14182e] rounded-xl border border-[#232847] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-[#262b49] bg-[#161a30] text-purple-600 focus:ring-purple-500/20"
              />
              <div>
                <span className="text-xs font-semibold text-amber-400 block">Maintenance Mode</span>
                <span className="text-[10px] text-slate-400">Display maintenance screen to non-admin users</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: AI Credit Allotments */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e233d] pb-3">
            <Coins className="w-4 h-4 text-amber-400" />
            Monthly AI Credits by Subscription Tier
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Starter Tier Monthly Credits</label>
              <input
                type="number"
                value={settings.defaultStarterCredits}
                onChange={(e) => setSettings({ ...settings, defaultStarterCredits: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pro Tier Monthly Credits</label>
              <input
                type="number"
                value={settings.defaultProCredits}
                onChange={(e) => setSettings({ ...settings, defaultProCredits: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Elite Tier Monthly Credits</label>
              <input
                type="number"
                value={settings.defaultEliteCredits}
                onChange={(e) => setSettings({ ...settings, defaultEliteCredits: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Subscription Pricing */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e233d] pb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Subscription Tier Pricing (USD)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Starter Plan Price ($)</label>
              <input
                type="number"
                value={settings.starterPriceUsd}
                onChange={(e) => setSettings({ ...settings, starterPriceUsd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pro Plan Price ($)</label>
              <input
                type="number"
                value={settings.proPriceUsd}
                onChange={(e) => setSettings({ ...settings, proPriceUsd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Elite Plan Price ($)</label>
              <input
                type="number"
                value={settings.elitePriceUsd}
                onChange={(e) => setSettings({ ...settings, elitePriceUsd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Support & Security */}
        <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e233d] pb-3">
            <Lock className="w-4 h-4 text-cyan-400" />
            Support Automation & Security
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Auto-Close Resolved Tickets (Days)</label>
              <input
                type="number"
                value={settings.autoCloseResolvedTicketsDays}
                onChange={(e) => setSettings({ ...settings, autoCloseResolvedTicketsDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Admin Inactivity Session Timeout (Minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
