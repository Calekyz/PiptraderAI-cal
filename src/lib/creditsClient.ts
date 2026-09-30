// ─── Credits client helper ────────────────────────────────────
// - getUserEmail(): reads logged-in user's email from localStorage
// - checkInsufficientCredits(res): if HTTP 402, dispatches a global toast event

export function getUserEmail(): string {
  if (typeof window === 'undefined') return '';
  const keys = ['pipnex_user', 'user', 'currentUser', 'pipnexUser', 'authUser'];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.email) return String(parsed.email);
    } catch {
      const raw = localStorage.getItem(k);
      if (raw && raw.includes('@')) return raw;
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
