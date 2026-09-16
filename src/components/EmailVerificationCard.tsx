import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Lock,
  Sparkles,
  KeyRound
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { verifyEmailCodeAsync, resendVerificationCodeAsync } from '../lib/authService';

interface EmailVerificationCardProps {
  email: string;
  onSuccess: (user: UserProfile) => void;
  onBackToRegister: () => void;
  initialMessage?: string;
}

export const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  email,
  onSuccess,
  onBackToRegister,
  initialMessage
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialMessage || `A 6-digit verification code has been sent to ${email}`
  );
  const [cooldown, setCooldown] = useState<number>(60);
  const [isExpired, setIsExpired] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first empty input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#a855f7', '#3b82f6']
      });
    } catch {
      // safe fallback
    }
  };

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage(null);
    const cleaned = value.replace(/\D/g, ''); // only numeric digits

    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If single digit typed
    const newDigits = [...digits];
    newDigits[index] = cleaned[cleaned.length - 1]; // take last entered digit
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && cleaned.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerify(fullCode);
    }
  };

  // Handle backspace and navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste of 6-digit code
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasted) return;

    const slice = pasted.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    slice.forEach((digit, i) => {
      if (i < 6) newDigits[i] = digit;
    });

    setDigits(newDigits);

    const nextIndex = Math.min(slice.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (slice.length === 6) {
      handleVerify(slice.join(''));
    }
  };

  // Verification request to backend
  const handleVerify = async (codeToVerify?: string) => {
    const rawCode = codeToVerify || digits.join('');
    if (rawCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const verifiedProfile = await verifyEmailCodeAsync(email, rawCode);
      setIsVerifying(false);
      triggerConfetti();
      onSuccess(verifiedProfile);
    } catch (err: any) {
      setIsVerifying(false);
      if (err.expired) {
        setIsExpired(true);
        setErrorMessage('This verification code has expired. Please click "Resend Code" to get a fresh code.');
      } else if (err.attemptsExceeded) {
        setErrorMessage('Too many incorrect attempts. Please request a new verification code.');
      } else {
        setErrorMessage(err.message || 'Invalid verification code. Please check your email and try again.');
      }
    }
  };

  // Resend code request to backend
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await resendVerificationCodeAsync(email);
      setIsResending(false);
      setCooldown(60);
      setIsExpired(false);
      setDigits(['', '', '', '', '', '']);
      setSuccessMessage(result.message || 'A new 6-digit verification code has been sent to your email.');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setIsResending(false);
      if (err.waitSeconds) {
        setCooldown(err.waitSeconds);
      }
      setErrorMessage(err.message || 'Failed to resend code. Please wait a moment and try again.');
    }
  };

  return (
    <div id="email-verification-step" className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 mb-2 shadow-inner">
          <KeyRound className="w-7 h-7 animate-pulse text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Verify Your Email
        </h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          We have sent a secure 6-digit verification code to:
        </p>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-300 text-sm font-medium">
          <Mail className="w-3.5 h-3.5 text-indigo-400" />
          <span className="truncate max-w-[220px]">{email}</span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && !errorMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* 6-Digit OTP Input Fields */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300 text-center uppercase tracking-wider">
          Enter 6-Digit Code
        </label>

        <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={`otp-digit-${idx}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isVerifying}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl bg-slate-900/90 border transition-all duration-200 outline-none text-white
                ${
                  digit
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }
                ${isVerifying ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs pt-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Codes expire in 10 minutes</span>
        </div>
      </div>

      {/* Submit Action Button */}
      <button
        type="button"
        id="btn-verify-otp"
        onClick={() => handleVerify()}
        disabled={isVerifying || digits.join('').length !== 6}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg
          ${
            digits.join('').length === 6 && !isVerifying
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 cursor-pointer hover:shadow-indigo-500/40 active:scale-[0.99]'
              : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
          }
        `}
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
            <span>Verifying Code...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Verify & Proceed to Dashboard</span>
          </>
        )}
      </button>

      {/* Resend & Back actions */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center gap-3 text-xs">
        <div className="flex items-center justify-between w-full">
          <span className="text-slate-400">Didn't receive the email?</span>
          
          <button
            type="button"
            id="btn-resend-otp"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className={`font-semibold flex items-center gap-1.5 transition-colors
              ${
                cooldown > 0 || isResending
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-indigo-400 hover:text-indigo-300 cursor-pointer underline underline-offset-4'
              }
            `}
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          id="btn-back-to-register"
          onClick={onBackToRegister}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer pt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wrong email? Back to registration</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50 flex items-center gap-2 text-[11px] text-slate-400">
        <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>End-to-end encrypted 6-digit OTP verification powered by PipNex Auth.</span>
      </div>
    </div>
  );
};
