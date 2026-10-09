// ============================================================================
// BRIDGE TO BOT PLATFORM (app.piptraderai.com / mt5-bridge)
// ----------------------------------------------------------------------------
// Main platform (this app) → bot API. Zero changes to the bot platform.
// Auth: on user "connect", we call /v1/auth/login on the bot platform,
//       receive a JWT, and store it per-user in the KV table.
// ============================================================================

import { kvGet, kvSet, kvDelete } from './db';

const BOT_API = process.env.BOT_API_URL || 'https://mt5-bridge-l5vp.onrender.com';

export interface BotSession {
  botJwt: string;
  botEmail: string;
  botUserId: number;
  botRole: string;
  connectedAt: number;
  expiresAt: number;   // we refresh before the bot's real 7d expiry
}

function sessionKey(userEmail: string): string {
  return `bridge:user:${userEmail.trim().toLowerCase()}`;
}

/** Log into the bot platform and persist the JWT for this user. */
export async function bridgeConnect(
  userEmail: string,
  botEmail: string,
  botPassword: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BOT_API}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: botEmail, password: botPassword }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.token) {
      return { ok: false, error: data?.error || `Login failed (HTTP ${res.status})` };
    }

    const session: BotSession = {
      botJwt: data.token,
      botEmail: data?.user?.email || botEmail,
      botUserId: Number(data?.user?.id || 0),
      botRole: data?.user?.role || 'user',
      connectedAt: Date.now(),
      // Refresh after 6 days — bot JWT expires at 7d
      expiresAt: Date.now() + 6 * 24 * 3600 * 1000,
    };
    await kvSet(sessionKey(userEmail), session);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Bridge connect failed' };
  }
}

/** Fetch the stored bot session for this user, if fresh. */
export async function getBridgeSession(userEmail: string): Promise<BotSession | null> {
  if (!userEmail) return null;
  const s = await kvGet<BotSession>(sessionKey(userEmail));
  if (!s || !s.botJwt) return null;
  if (s.expiresAt && s.expiresAt < Date.now()) {
    await kvDelete(sessionKey(userEmail));
    return null;
  }
  return s;
}

/** Delete the stored bot session. */
export async function bridgeDisconnect(userEmail: string): Promise<void> {
  await kvDelete(sessionKey(userEmail));
}

/** Proxy a request to the bot API with the user's stored JWT. */
export async function bridgeFetch(
  userEmail: string,
  path: string,
  method: string = 'GET',
  body?: any
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const session = await getBridgeSession(userEmail);
  if (!session) {
    return { ok: false, status: 401, data: null, error: 'not_connected' };
  }
  try {
    const res = await fetch(`${BOT_API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.botJwt}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data: any = await res.json().catch(() => ({}));

    // If bot says our token is invalid/expired, drop the stored session
    if (res.status === 401) {
      await kvDelete(sessionKey(userEmail));
      return { ok: false, status: 401, data: null, error: 'session_expired' };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: null, error: err?.message || 'bridge fetch failed' };
  }
}

export function isBridgeConfigured(): boolean {
  return Boolean(BOT_API);
}

export function getBotApiUrl(): string {
  return BOT_API;
}
