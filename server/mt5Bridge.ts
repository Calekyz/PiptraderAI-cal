import 'dotenv/config';
// ============================================================
// MT5 BRIDGE CLIENT — token-authenticated
// Env is read at CALL TIME (not module load) — dotenv config
// runs after this module is imported.
// ============================================================

function getBridgeConfig(): { url: string; token: string } {
  return {
    url: process.env.MT5_BRIDGE_URL || 'https://mt5-bridge-l5vp.onrender.com',
    token: process.env.MT5_BRIDGE_TOKEN || '',
  };
}

interface BridgeResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

async function bridgeCall<T = any>(path: string, init: RequestInit = {}): Promise<BridgeResult<T>> {
  const { url, token } = getBridgeConfig();
  if (!token) {
    return { ok: false, status: 503, data: null, error: 'MT5_BRIDGE_TOKEN not configured' };
  }
  try {
    const res = await fetch(`${url}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Bridge-Token': token,
        ...(init.headers || {}),
      },
    });
    const data: any = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: null, error: err?.message || 'bridge_call_failed' };
  }
}

export function isMt5BridgeConfigured(): boolean {
  return Boolean(getBridgeConfig().token);
}

export function getMt5BridgeUrl(): string {
  return getBridgeConfig().url;
}

export const bridgeLink = (email: string) =>
  bridgeCall('/bridge/link', { method: 'POST', body: JSON.stringify({ email }) });

export const bridgeUserStats = (email: string) =>
  bridgeCall(`/bridge/user-stats?email=${encodeURIComponent(email)}`);

export const bridgePushSignal = (payload: {
  email: string;
  action: 'open' | 'close' | 'modify';
  symbol: string;
  side?: 'buy' | 'sell';
  volume?: number;
  sl?: number;
  tp?: number;
  ticket?: number;
  comment?: string;
}) => bridgeCall('/bridge/push-signal', { method: 'POST', body: JSON.stringify(payload) });

export const bridgeSignals = (email: string) =>
  bridgeCall(`/bridge/signals?email=${encodeURIComponent(email)}`);

export const bridgeAllUsers = () => bridgeCall('/bridge/users');
