import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Crown, 
  ShieldCheck, 
  Calendar, 
  Award, 
  Save, 
  Sparkles,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenUpgrade?: (tier?: 'Pro' | 'Platinum' | 'Ultimate') => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onOpenUpgrade
}) => {
  const [firstName, setFirstName] = useState(user.firstName || 'Davis');
  const [lastName, setLastName] = useState(user.lastName || 'Johnson');
  const [email, setEmail] = useState(user.email || 'davisjohnson591@gmail.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const initials = `${firstName[0] || 'D'}${lastName[0] || 'J'}`.toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      firstName,
      lastName,
      email
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0c0d18] text-white border border-[#232742] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1b1e33] flex items-center justify-between bg-[#0f1122]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#f3f0ff] dark:bg-[#1f1a3a] border border-[#d8b4fe] dark:border-[#7c3aed] flex items-center justify-center text-[#7c3aed] font-bold text-sm">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">My Profile</h3>
              <p className="text-xs text-gray-400">Manage account information &amp; trading preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#171a2e] hover:bg-[#222744] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">First Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#131526] border border-[#242947] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-medium"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Last Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#131526] border border-[#242947] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-medium"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131526] border border-[#242947] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-medium font-mono"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Membership Badge Card */}
          <div className="p-4 rounded-2xl bg-[#111322] border border-[#20253f] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Current Membership</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                    {user.plan || 'Trial'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Renews automatically</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpgrade?.('Platinum');
              }}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
            >
              Upgrade
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Profile changes saved successfully!</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#16192e] hover:bg-[#202442] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
