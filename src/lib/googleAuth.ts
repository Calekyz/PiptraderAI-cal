import { UserProfile } from '../types';
import { loginWithGoogleAsync } from './authService';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2?: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

// Decode standard Google JWT credential token if provided
export function parseGoogleJwt(token: string): {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
} | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Failed to parse Google JWT payload:', err);
    return null;
  }
}

// Trigger Google OAuth 2.0 flow
export async function triggerGoogleOAuth(options?: {
  onSuccess?: (user: UserProfile) => void;
  onError?: (err: Error) => void;
  clientId?: string;
}): Promise<boolean> {
  const clientId = options?.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && clientId) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            try {
              // Fetch user profile from Google UserInfo endpoint
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const googleUser = await userInfoRes.json();
              if (googleUser?.email) {
                const profile = await loginWithGoogleAsync({
                  email: googleUser.email,
                  firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'Google',
                  lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || 'User',
                  avatarUrl: googleUser.picture
                });
                if (options?.onSuccess) options.onSuccess(profile);
                return;
              }
            } catch (fetchErr: any) {
              console.warn('Failed to fetch Google UserInfo:', fetchErr);
            }
          }
        }
      });

      client.requestAccessToken();
      return true;
    } catch (err: any) {
      console.warn('GSI Token Client error:', err);
    }
  }

  return false;
}
