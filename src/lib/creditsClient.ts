// ─── Credits client helper ────────────────────────────────────
// - getUserEmail(): reads logged-in user's email from localStorage
// - checkInsufficientCredits(res): if HTTP 402, dispatches a global toast event

export function getUserEmail(): string {
  if (typeof window === 'undefined') return '';

  // ── AUTHORITATIVE: the auth service session key wins ──
  try {
    const sessionRaw = localStorage.getItem('pipnex_active_session_v1');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && typeof parsed === 'object' && parsed.email) {
        return String(parsed.email).toLowerCase().trim();
      }
    }
  } catch {}

  // ── Fallback to legacy keys only if session is missing ──
  const fallbackKeys = ['pipnexUser', 'authUser', 'currentUser', 'pipnex_user', 'user'];
  for (const k of fallbackKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.email) {
        return String(parsed.email).toLowerCase().trim();
      }
    } catch {
      const raw = localStorage.getItem(k);
      if (raw && raw.includes('@')) return raw.toLowerCase().trim();
    }
  }
  return '';
}

/**
 * Check a fetch response for insufficient credits (HTTP 402).
 * Dispatches a global event so the app can show a toast.
 * Returns true if the caller should bail out.
 */
export async function handleCreditError(res: Response): Promise<boolean> {
  if (res.status !== 402) return false;
  try {
    const data = await res.clone().json();
    window.dispatchEvent(
      new CustomEvent('pipnex:insufficient-credits', {
        detail: { balance: data?.balance ?? 0, message: data?.message || 'Insufficient credits.' },
      })
    );
  } catch {
    window.dispatchEvent(
      new CustomEvent('pipnex:insufficient-credits', { detail: { balance: 0, message: 'Insufficient credits.' } })
    );
  }
  return true;
}
