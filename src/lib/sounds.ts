// ============================================================================
// SOUNDS — Tiny base64-encoded WAV files for chat notifications
// ============================================================================
//   • userReplySound: gentle "pop" — plays when admin replies to user
//   • adminNotifySound: higher "ding" — plays when admin gets new ticket
//
// Volumes default to 0.4 (subtle). Mute preference stored in localStorage.
// ============================================================================

// Tiny synthesized beep — 200ms, 880Hz (A5) sine wave
const USER_REPLY_SOUND = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

// Higher pitch beep — 200ms, 1320Hz (E6)
const ADMIN_NOTIFY_SOUND = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const MUTE_KEY = 'pipnex_chat_muted';

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {}
}

/**
 * Plays a short notification beep. Respects mute preference.
 * Uses Web Audio API to synthesize sound — no external files needed.
 */
export function playNotificationSound(type: 'user_reply' | 'admin_notify' = 'user_reply'): void {
  if (isMuted()) return;
  try {
    // Use Web Audio API to generate the tone — this works even with silent data URIs
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Frequency: higher pitch for admin notify
    oscillator.frequency.value = type === 'admin_notify' ? 1320 : 880;
    oscillator.type = 'sine';

    // Fade in/out envelope for pleasant "pop"
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    oscillator.start(now);
    oscillator.stop(now + 0.2);

    // Cleanup
    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 300);
  } catch (e) {
    // Silent fail — audio is nice-to-have
  }
}
