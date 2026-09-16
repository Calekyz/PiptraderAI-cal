import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { AdminApi } from './api';
import { AdminUser } from './types';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToApp: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToApp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await AdminApi.login(username, password);
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-purple-500/30 selection:text-purple-200">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-[#0f1222] border border-[#232742] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide uppercase">
            <Shield className="w-3.5 h-3.5" />
            PipNex Security Gateway
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-[#161a30] px-2 py-0.5 rounded border border-[#232847]">
            v2.4.0
          </span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                PipNex AI Admin Panel
              </h1>
              <p className="text-xs text-slate-400">
                Authorized administrator credentials required
              </p>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="admin-username-input"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#161a30] border border-[#262b49] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                id="admin-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#161a30] border border-[#262b49] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#262b49] bg-[#161a30] text-purple-600 focus:ring-purple-500/20"
              />
              Remember admin session
            </label>
            <span className="text-slate-500 text-[11px]">Role: Super Admin</span>
          </div>

          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate into Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-5 border-t border-[#1e233d] text-center">
          <button
            type="button"
            onClick={onBackToApp}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Return to PipNex Trader Portal
          </button>
        </div>
      </div>
    </div>
  );
};
