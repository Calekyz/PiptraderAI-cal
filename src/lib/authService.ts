import { UserProfile, TrialStatusResponse, PlanTier } from '../types';

export interface RegisteredAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  referralCode?: string;
  createdAt: string;
  plan: PlanTier;
  isVerified: boolean;
  authProvider: 'email' | 'google';
  mt5Connected?: boolean;
}

export interface PasswordValidationResult {
  isStrong: boolean;
  score: number;
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  feedback: string[];
}

const SESSION_STORAGE_KEY = 'pipnex_active_session_v1';
const LAST_EMAIL_STORAGE_KEY = 'pipnex_last_email_v1';

// ------------------- Session & email helpers -------------------
export function getLastUsedEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastUsedEmail(email: string): void {
  try {
    localStorage.setItem(LAST_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    // ignore
  }
}

// ------------------- Password strength -------------------
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const checks = { minLength, hasUpper, hasLower, hasNumber, hasSpecial };

  let score = 0;
  if (minLength) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  const feedback: string[] = [];
  if (!minLength) feedback.push('At least 8 characters required');
  if (!hasUpper) feedback.push('Add an uppercase letter (A-Z)');
  if (!hasLower) feedback.push('Add a lowercase letter (a-z)');
  if (!hasNumber) feedback.push('Add at least one number (0-9)');
  if (!hasSpecial) feedback.push('Add a special character (!@#$%^&*)');

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Very Weak';
  if (score <= 1) strengthLabel = 'Very Weak';
  else if (score === 2) strengthLabel = 'Weak';
  else if (score === 3 || score === 4) strengthLabel = 'Medium';
  else if (score === 5 && password.length >= 10) strengthLabel = 'Very Strong';
  else if (score === 5) strengthLabel = 'Strong';

  const isStrong = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return { isStrong, score, strengthLabel, checks, feedback };
}

// ------------------- API-based registration -------------------
export interface AuthRegisterResult {
  requireVerification: boolean;
  email: string;
  message: string;
  user?: UserProfile;
}

export async function registerUserAsync(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  referralCode?: string;
}): Promise<AuthRegisterResult> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isStrong) {
    throw new Error(
      `Password is not strong enough. It must be at least 8 characters long and contain uppercase (A-Z), lowercase (a-z), a number (0-9), and a special character.`
    );
  }

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      countryCode: data.countryCode,
      password: data.password,
      referralCode: data.referralCode
    })
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok || !resData.success) {
    const errorMsg = resData.error || 'Failed to create account in database.';
    const err = new Error(errorMsg);
    (err as any).requireVerification = resData.requireVerification || false;
    (err as any).email = resData.email || normalizedEmail;
    throw err;
  }

  setLastUsedEmail(normalizedEmail);

  return {
    requireVerification: resData.requireVerification !== false,
    email: resData.email || normalizedEmail,
    message: resData.message || 'Verification code sent to your email.'
  };
}

// ------------------- Email verification -------------------
export async function verifyEmailCodeAsync(email: string, code: string): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const res = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, code: cleanCode })
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok || !resData.success) {
    const err = new Error(resData.error || 'Invalid verification code. Please check your email and try again.');
    (err as any).expired = resData.expired || false;
    (err as any).attemptsExceeded = resData.attemptsExceeded || false;
    throw err;
  }

  const profile: UserProfile = {
    id: resData.user.id,
    firstName: resData.user.firstName,
    lastName: resData.user.lastName,
    email: resData.user.email,
    countryCode: resData.user.countryCode || '+254',
    phone: resData.user.phone || '',
    isVerified: true,
    authProvider: 'email',
    plan: (resData.user.plan as PlanTier) || 'Pending',
    mt5Connected: resData.user.mt5Connected || false,
    createdAt: resData.user.createdAt
  };

  saveActiveSession(profile);
  setLastUsedEmail(profile.email);
  return profile;
}

export async function resendVerificationCodeAsync(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await fetch('/api/auth/resend-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail })
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok || !resData.success) {
    const err = new Error(resData.error || 'Failed to resend verification code. Please try again.');
    (err as any).waitSeconds = resData.waitSeconds;
    throw err;
  }

  return {
    success: true,
    message: resData.message || 'A new verification code has been sent to your email.'
  };
}

// ------------------- Login -------------------
export async function loginUserAsync(email: string, password: string): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password })
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok || !resData.success) {
    const err = new Error(resData.error || 'Invalid email or password');
    (err as any).requireVerification = resData.requireVerification || false;
    (err as any).email = resData.email || normalizedEmail;
    throw err;
  }

  const profile: UserProfile = {
    id: resData.user.id,
    firstName: resData.user.firstName,
    lastName: resData.user.lastName,
    email: resData.user.email,
    countryCode: resData.user.countryCode,
    phone: resData.user.phone,
    isVerified: resData.user.isVerified !== false,
    authProvider: 'email',
    plan: (resData.user.plan as PlanTier) || 'Pending',
    mt5Connected: resData.user.mt5Connected || false,
    createdAt: resData.user.createdAt
  };

  saveActiveSession(profile);
  setLastUsedEmail(profile.email);
  return profile;
}

// ------------------- Profile update -------------------
export async function updateUserProfileAsync(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const current = getActiveSession();
  if (!current?.email) return null;

  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: current.email, ...updates })
  });

  const resData = await res.json().catch(() => ({}));
  if (res.ok && resData.success && resData.user) {
    const updatedProfile: UserProfile = {
      ...current,
      ...updates,
      firstName: resData.user.firstName || current.firstName,
      lastName: resData.user.lastName || current.lastName,
      phone: resData.user.phone !== undefined ? resData.user.phone : current.phone,
      plan: (resData.user.plan as PlanTier) || current.plan,
      mt5Connected: resData.user.mt5Connected !== undefined ? resData.user.mt5Connected : current.mt5Connected
    };
    saveActiveSession(updatedProfile);
    return updatedProfile;
  }

  throw new Error(resData.error || 'Failed to update profile');
}

// ------------------- Fetch fresh user from server -------------------
export async function fetchFreshUserAsync(email: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/user/me?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.user) return null;
    return {
      id: data.user.id,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email,
      countryCode: data.user.countryCode || '+254',
      phone: data.user.phone || '',
      referralCode: data.user.referralCode,
      isVerified: data.user.isVerified,
      authProvider: data.user.authProvider || 'email',
      avatarUrl: data.user.avatarUrl,
      plan: (data.user.plan as PlanTier) || 'Pending',
      mt5Connected: Boolean(data.user.mt5Connected),
      createdAt: data.user.createdAt
    };
  } catch (err) {
    console.warn('[authService] fetchFreshUserAsync failed:', err);
    return null;
  }
}

// ------------------- Active session management -------------------
export function saveActiveSession(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save active session:', err);
  }
}

export function getActiveSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile | null;
      if (parsed) return parsed;
    }
    return null;
  } catch (err) {
    console.error('Failed to read active session:', err);
    return null;
  }
}

export function logoutUser(): void {
  saveActiveSession(null);
}

// ------------------- Feature access -------------------
export async function fetchTrialStatusAsync(email?: string): Promise<TrialStatusResponse | null> {
  try {
    const session = getActiveSession();
    const targetEmail = email || session?.email;
    const url = targetEmail ? `/api/user/trial-status?email=${encodeURIComponent(targetEmail)}` : '/api/user/trial-status';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data as TrialStatusResponse;
      }
    }
  } catch (e) {
    console.warn('Could not fetch trial status from server:', e);
  }

  return {
    isTrialActive: false,
    isEarlyAccessUser: false,
    isUnlocked: false,
    trialStatus: 'NOT_ELIGIBLE',
    plan: 'Pending',
    totalDurationHours: 0,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    totalSecondsRemaining: 0,
    serverTimeUtc: new Date().toISOString(),
    formattedRemainingTime: 'Pending admin approval'
  };
}

export async function verifyFeatureAccessAsync(featureName: string, email?: string): Promise<{
  isAllowed: boolean;
  reason: string;
  requiresUpgrade: boolean;
  trialStatus: string;
}> {
  try {
    const session = getActiveSession();
    const targetEmail = email || session?.email;
    const res = await fetch('/api/access/verify-feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, featureName })
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    return {
      isAllowed: false,
      reason: 'Could not connect to access verification service',
      requiresUpgrade: true,
      trialStatus: 'NOT_ELIGIBLE'
    };
  }
}
