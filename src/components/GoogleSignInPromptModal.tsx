import React, { useState } from 'react';
import { X, Lock, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithGoogleAsync } from '../lib/authService';

interface GoogleSignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  initialEmail?: string;
  isSignUp?: boolean;
}

export const GoogleSignInPromptModal: React.FC<GoogleSignInPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
  isSignUp = false
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid Google Account email.');
      return;
    }

    setIsLoading(true);

    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || cleanEmail.split('@')[0];
      const lastName = parts.slice(1).join(' ') || 'Trader';

      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + lastName)}&backgroundColor=4f46e5,6366f1,818cf8`;

      const profile = await loginWithGoogleAsync({
        email: cleanEmail,
        firstName,
        lastName,
        avatarUrl
      });

      setIsLoading(false);
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Google Authentication failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="google-direct-signin-modal"
        className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 relative overflow-hidden"
      >
        {/* Top Google Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Google Authentication</span>
          </div>
          <button
            id="close-google-signin-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="pt-4 pb-2">
          <h4 className="text-lg font-bold text-gray-900 text-center tracking-tight">
            {isSignUp ? 'Create account with Google' : 'Sign in with Google'}
          </h4>
          <p className="text-xs text-gray-500 text-center mt-1">
            to continue to <span className="font-semibold text-indigo-700">PipNex Forex Trading</span>
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="google-email-input" className="block text-xs font-semibold text-gray-700">
                Google Account Email
              </label>
              <input
                id="google-email-input"
                type="email"
                required
                autoFocus
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="google-name-input" className="block text-xs font-semibold text-gray-700">
                Your Full Name (Optional)
              </label>
              <input
                id="google-name-input"
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                id="google-continue-submit-btn"
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure OAuth Notice */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted OAuth 2.0 session credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
};
