export function isDevelopmentMode(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    if (import.meta.env.MODE === 'development') return true;
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
