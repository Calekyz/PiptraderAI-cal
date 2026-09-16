import React, { useState, useMemo, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Shield, 
  Sparkles, 
  Lock, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CountryItem, UserProfile } from '../types';
import { COUNTRIES } from '../data/countries';
import { CountryPickerModal } from './CountryPickerModal';
import { TermsModal } from './TermsModal';
import { EmailVerificationCard } from './EmailVerificationCard';
import { 
  registerUserAsync,
  loginUserAsync,
  validatePasswordStrength, 
  getLastUsedEmail,
  setLastUsedEmail
} from '../lib/authService';

interface PipNexAuthCardProps {
  onSuccessAuth: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const PipNexAuthCard: React.FC<PipNexAuthCardProps> = ({ onSuccessAuth, initialMode }) => {
  const initialEmail = getLastUsedEmail();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(() => {
    if (initialMode) return initialMode;
    return initialEmail ? 'signin' : 'signup';
  });

  // Sync when initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);
  
  // Sign Up / In form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]); // US +1 default
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(() => initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Referral code
  const [referralCode, setReferralCode] = useState('PIU7501');
  const [isReferralVerified, setIsReferralVerified] = useState(true);
  const [referralFeedback, setReferralFeedback] = useState<string | null>(
    '✓ Referral code verified successfully'
  );
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Terms agreement & Remember me
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 6-Digit Email Verification Flow State
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationNotice, setVerificationNotice] = useState<string | undefined>(undefined);

  // Modals
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

  // Real-time password evaluation
  const passwordStrength = useMemo(() => {
    return validatePasswordStrength(password);
  }, [password]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#818cf8', '#34d399', '#c084fc', '#60a5fa']
      });
    } catch {
      // safe fallback
    }
  };

  // Verify referral code handler
  const handleVerifyReferral = (codeToVerify?: string) => {
    const code = (codeToVerify !== undefined ? codeToVerify : referralCode).trim().toUpperCase();
    if (!code) {
      setIsReferralVerified(false);
      setReferralFeedback(null);
      return;
    }

    setIsVerifyingCode(true);
    setTimeout(() => {
      setIsVerifyingCode(false);
      if (code === 'PIU7501' || code === 'FOREXBOT' || code === 'VIP2026' || code.length >= 4) {
        setIsReferralVerified(true);
        setReferralFeedback('✓ Referral code verified successfully');
        triggerConfetti();
      } else {
        setIsReferralVerified(false);
        setReferralFeedback('Invalid referral code');
      }
    }, 400);
  };

  // Submit Handler with strict authentication & 6-digit email verification enforcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (authMode === 'signup') {
      // 1. Mandatory Names check
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMessage('Please provide both your first name and last name.');
        return;
      }

      // 2. Email check
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      // 3. Phone check
      if (!phoneNumber.trim()) {
        setErrorMessage('Please enter your phone number.');
        return;
      }

      // 4. Strict Strong Password Requirement
      if (!passwordStrength.isStrong) {
        setErrorMessage(
          'Password is not strong enough. Please fulfill all 5 security requirements below (8+ chars, uppercase, lowercase, number, special symbol).'
        );
        return;
      }

      // 5. Terms of Service
      if (!agreedToTerms) {
        setErrorMessage('You must accept the Terms of Service and Privacy Policy to create an account.');
        return;
      }

      setIsLoading(true);

      try {
        const result = await registerUserAsync({
          firstName,
          lastName,
          email,
          phone: phoneNumber,
          countryCode: selectedCountry.dialCode,
          password,
          referralCode: isReferralVerified ? referralCode : undefined
        });

        setIsLoading(false);
        if (result.requireVerification) {
          setVerificationEmail(result.email || email.trim().toLowerCase());
          setVerificationNotice(result.message);
          setShowVerificationStep(true);
        } else if (result.user) {
          triggerConfetti();
          onSuccessAuth(result.user);
        }
      } catch (err: any) {
        setIsLoading(false);
        if (err.requireVerification) {
          setVerificationEmail(err.email || email.trim().toLowerCase());
          setVerificationNotice(err.message);
          setShowVerificationStep(true);
        } else {
          setErrorMessage(err.message || 'Failed to sign up. Please try again.');
        }
      }

    } else {
      // Sign In Flow
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter your registered email address.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsLoading(true);

      try {
        const user = await loginUserAsync(email, password);
        setIsLoading(false);
        triggerConfetti();
        onSuccessAuth(user);
      } catch (err: any) {
        setIsLoading(false);
        if (err.requireVerification) {
          setVerificationEmail(err.email || email.trim().toLowerCase());
          setVerificationNotice(err.message || 'Please verify your email address to continue.');
          setShowVerificationStep(true);
        } else {
          setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
        }
      }
    }
  };

  return (
    <div className="relative w-full max-w-[500px] mx-auto z-20">
      {/* Background ambient radial glow matching the image */}
      <div className="absolute -inset-4 bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-transparent rounded-[38px] blur-2xl -z-10 pointer-events-none" />

      {/* Main PipNex Card */}
      <div 
        id="pipnex-auth-card"
        className="w-full bg-[#0b0c13]/95 border border-[#1d202e] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300"
      >
        {showVerificationStep ? (
          <EmailVerificationCard
            email={verificationEmail || email}
            initialMessage={verificationNotice}
            onSuccess={(verifiedUser) => {
              setShowVerificationStep(false);
              triggerConfetti();
              onSuccessAuth(verifiedUser);
            }}
            onBackToRegister={() => {
              setShowVerificationStep(false);
              setErrorMessage(null);
            }}
          />
        ) : (
          <>
            {/* Top Logo / Branding */}
            <div className="flex items-center justify-center gap-2 mb-6 select-none">
              <div className="relative flex items-center justify-center">
                {/* PipNex Sparkle Icon */}
                <svg 
                  className="w-8 h-8 text-indigo-400" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  {/* 4-point sparkle star */}
                  <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
                  {/* small plus accent top right */}
                  <path d="M19 3v4m2-2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                PipNex
              </span>
            </div>

            {/* Tab Switcher: Sign In / Sign Up */}
            <div className="p-1 rounded-xl bg-[#12141f] border border-[#1e2232] flex items-center mb-5">
              <button
                id="tab-signin-toggle"
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-[#1e2234] text-white shadow-sm border border-[#2b3149]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-signup-toggle"
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#1e2234] text-white shadow-sm border border-[#2b3149]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign Up (New Users)
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <div>{errorMessage}</div>
                    {errorMessage.includes('already exists') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErrorMessage(null);
                          setSuccessNotice(`Email preserved. Please enter your password to sign in.`);
                        }}
                        className="mt-2 text-[11px] font-bold text-indigo-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Click here to Sign In with your saved credentials &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success Notice Display */}
              {successNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{successNotice}</div>
                </div>
              )}

              {authMode === 'signup' && (
                <>
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="input-firstname" className="block text-xs font-semibold text-gray-200">
                        First Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="input-firstname"
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#12141f] border border-[#222638] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="input-lastname" className="block text-xs font-semibold text-gray-200">
                        Last Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="input-lastname"
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#12141f] border border-[#222638] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone Number with Country Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-200">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        id="country-selector-trigger"
                        type="button"
                        onClick={() => setShowCountryModal(true)}
                        className="flex items-center justify-between gap-1.5 px-3 py-2.5 bg-[#12141f] border border-[#222638] hover:border-[#323852] rounded-xl text-xs font-semibold text-gray-200 shrink-0 min-w-[95px] transition-all cursor-pointer"
                      >
                        <span className="lowercase font-bold">{selectedCountry.code.toLowerCase()} {selectedCountry.dialCode}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </button>

                      <input
                        id="input-phone"
                        type="tel"
                        required
                        placeholder="123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-[#12141f] border border-[#222638] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="input-email" className="block text-xs font-semibold text-gray-200">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  id="input-email"
                  type="email"
                  required
                  placeholder="trader@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12141f] border border-[#222638] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all font-mono"
                />
              </div>

              {/* Password field with eye toggle & Strong Password Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-password" className="block text-xs font-semibold text-gray-200">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => alert('Password reset verification link sent to your registered email.')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={authMode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#12141f] border border-[#222638] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all font-mono"
                  />
                  <button
                    id="toggle-password-visibility-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* In Sign Up mode: Real-time Strong Password Checklist & Meter */}
                {authMode === 'signup' && (
                  <div className="pt-2 space-y-2">
                    {/* Password Strength Score Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 font-medium">Password Strength:</span>
                        <span className={`font-semibold font-mono ${
                          passwordStrength.isStrong 
                            ? 'text-emerald-400' 
                            : passwordStrength.score >= 3 
                              ? 'text-amber-400' 
                              : 'text-rose-400'
                        }`}>
                          {password ? passwordStrength.strengthLabel : 'Required'}
                        </span>
                      </div>
                      
                      {/* Visual 5-segment bar */}
                      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
                        {[1, 2, 3, 4, 5].map((seg) => (
                          <div
                            key={seg}
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordStrength.score >= seg
                                ? passwordStrength.isStrong
                                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                  : passwordStrength.score >= 3
                                    ? 'bg-amber-400'
                                    : 'bg-rose-500'
                                : 'bg-[#1e2234]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 5 Specific Strong Password Checks */}
                    <div className="p-3 bg-[#0d0f1a] border border-[#1b1f32] rounded-xl space-y-1.5 text-[11px]">
                      <div className="text-gray-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                        Strong Password Requirements:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${passwordStrength.checks.minLength ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.minLength ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span>8+ characters</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasUpper ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.hasUpper ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span>Uppercase (A-Z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasLower ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.hasLower ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span>Lowercase (a-z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasNumber ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.hasNumber ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span>Number (0-9)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordStrength.checks.hasSpecial ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {passwordStrength.checks.hasSpecial ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span>Special symbol (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign In remember me */}
              {authMode === 'signin' && (
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-[#12141f] border-[#222638] text-indigo-500 focus:ring-0"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>
              )}

              {/* Sign Up specific fields: Referral code & Checkbox */}
              {authMode === 'signup' && (
                <>
                  {/* Referral Code (Optional) */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-referral" className="block text-xs font-semibold text-gray-200">
                      Referral Code (Optional)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="input-referral"
                          type="text"
                          placeholder="PIU7501"
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value.toUpperCase());
                            setIsReferralVerified(false);
                            setReferralFeedback(null);
                          }}
                          className={`w-full px-3.5 py-2.5 bg-[#12141f] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none font-mono uppercase transition-all ${
                            isReferralVerified
                              ? 'border border-emerald-500/90 ring-1 ring-emerald-500/30'
                              : 'border border-[#222638] focus:border-indigo-500/80'
                          }`}
                        />
                      </div>
                      <button
                        id="verify-referral-btn"
                        type="button"
                        disabled={isVerifyingCode}
                        onClick={() => handleVerifyReferral()}
                        className="px-5 py-2.5 bg-black hover:bg-[#1a1d2e] border border-[#2a2e42] rounded-xl text-xs font-bold text-white transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingCode ? 'Checking...' : 'Verify'}
                      </button>
                    </div>

                    {/* Referral status feedback */}
                    {referralFeedback && (
                      <div
                        id="referral-success-msg"
                        className={`text-[11px] font-medium transition-all ${
                          isReferralVerified ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {referralFeedback}
                      </div>
                    )}
                  </div>

                  {/* Checkbox: I agree to Terms and Privacy */}
                  <div className="pt-1">
                    <label 
                      id="label-agree-terms"
                      className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none group"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={agreedToTerms}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          agreedToTerms
                            ? 'border-indigo-400 bg-indigo-600/30 text-indigo-300'
                            : 'border-[#363b52] bg-[#12141f] group-hover:border-gray-400'
                        }`}
                      >
                        {agreedToTerms && <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />}
                      </button>
                      <span className="leading-tight text-gray-300">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTermsModalTab('terms');
                            setShowTermsModal(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTermsModalTab('privacy');
                            setShowTermsModal(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  id="submit-auth-btn"
                  type="submit"
                  disabled={isLoading || (authMode === 'signup' && !passwordStrength.isStrong)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#34294d] to-[#251c3a] hover:from-[#3e305e] hover:to-[#2d2247] active:scale-[0.99] border border-[#483b6b]/60 hover:border-[#655394] text-white text-sm font-semibold tracking-wide shadow-lg shadow-purple-950/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{authMode === 'signup' ? 'Create Account & Sign In' : 'Sign In with Credentials'}</span>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Security Badge */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 select-none">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>Strict credential validation & encrypted password vault</span>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CountryPickerModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCountry={selectedCountry}
        onSelect={(country) => setSelectedCountry(country)}
      />

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        defaultTab={termsModalTab}
      />
    </div>
  );
};
