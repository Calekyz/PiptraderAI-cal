export function isDevelopmentMode(): boolean {
  try {
    const env = (import.meta as any)?.env || {};
    if (env.DEV) return true;
    if (env.MODE === 'development') return true;
  } catch {
    // ignore
  }

  if (typeof window === 'undefined') return false;

  try {
    const host = window.location.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}
