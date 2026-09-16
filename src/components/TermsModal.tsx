import React, { useState } from 'react';
import { X, Shield, FileText, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="terms-privacy-modal"
        className="w-full max-w-xl bg-[#0d0e17] border border-[#24283b] rounded-3xl p-6 shadow-2xl text-white relative max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2233]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {activeTab === 'terms' ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                {activeTab === 'terms' ? 'PipNex Terms of Service' : 'PipNex Privacy Policy'}
              </h3>
              <p className="text-xs text-gray-400">Forex Bot & Algorithmic Trading Compliance v2.8</p>
            </div>
          </div>
          <button
            id="close-terms-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#161926] text-gray-400 hover:text-white hover:bg-[#22273a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 pt-4 pb-2">
          <button
            id="tab-terms-btn"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'terms'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-inner'
                : 'bg-[#141724] text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            Terms of Service
          </button>
          <button
            id="tab-privacy-btn"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'privacy'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-inner'
                : 'bg-[#141724] text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs leading-relaxed text-gray-300 py-3 custom-scrollbar">
          {activeTab === 'terms' ? (
            <>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>High Risk Warning:</strong> Foreign Exchange (Forex) and CFD trading with automated algorithms carries a high level of risk and may not be suitable for all investors.
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">1. Acceptance of Terms</h4>
                <p>
                  By creating an account on PipNex ("The Platform"), you agree to abide by these Terms of Service, security protocols, and operational guidelines governing algorithmic forex signal generation and execution.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">2. Automated Bot Execution</h4>
                <p>
                  PipNex provides proprietary machine-learning trading bots (e.g. Scalper AI v4.2, Neural Trend Hunter). Users retain sole discretion over risk parameters, lot sizes, stop-loss limits, and MT4/MT5 bridge integrations.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">3. Referral Program & Verification</h4>
                <p>
                  Verified referral codes (e.g. PIU7501) entitle participants to spread discounts, fee rebates, and trial liquidity credits subject to account verification.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">4. Device & Anti-Fraud Protection</h4>
                <p>
                  To protect user balances and avoid unauthorized bot triggers, PipNex enforces 256-bit encrypted device fingerprinting and IP location checks.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-semibold text-white text-sm mb-1">1. Information We Collect</h4>
                <p>
                  We collect your contact details (First Name, Last Name, Email, Country Code, Phone Number) and cryptographic authentication credentials via Google Auth or email login.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">2. Security of Bot API Keys</h4>
                <p>
                  Your broker API credentials and trading tokens are encrypted using AES-256-GCM hardware security modules. We never hold custody of broker withdrawal rights.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-1">3. Data Retention & Privacy</h4>
                <p>
                  We do not sell personal data to third parties. Diagnostic trade logs are stored strictly for algorithmic refinement and performance auditing.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1f2233] flex justify-end">
          <button
            id="acknowledge-terms-btn"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
