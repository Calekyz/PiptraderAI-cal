// Google OAuth trigger — fallback implementation
// Real Firebase popup flow lives in firebase.ts.
// This file provides a working no-op that satisfies the build.

export interface GoogleOAuthResult {
  success: boolean;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  error?: string;
  cancelled?: boolean;
}

export async function triggerGoogleOAuth(_options?: {
  onSuccess?: (user: any) => void;
  onError?: (err: string) => void;
}): Promise<boolean> {
  console.warn('[googleAuth] Google OAuth triggered but not fully configured.');
  return false;
}

export async function signInWithGoogle(): Promise<GoogleOAuthResult> {
  return {
    success: false,
    error: 'Google Sign-In is not configured. Please use email login.',
  };
}

export async function signOutGoogle(): Promise<void> {
  // no-op
}

export default {
  triggerGoogleOAuth,
  signInWithGoogle,
  signOutGoogle,
};
