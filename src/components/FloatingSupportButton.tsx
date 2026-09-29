import React, { useEffect, useState } from 'react';
import { Headphones, X } from 'lucide-react';

interface FloatingSupportButtonProps {
  userEmail: string;
  onOpenSupport: () => void;
}

const DISMISS_KEY = 'pipnex_support_badge_dismissed';

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({
  userEmail,
  onOpenSupport,
}) => {
  const [openCount, setOpenCount] = useState(0);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    // Check if user dismissed the notification recently
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < 12 * 3600000) {
        setNotificationDismissed(true);
      }
    } catch {}

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch(
          `/api/support/tickets?user=${encodeURIComponent(userEmail)}`
        );
        const data = await res.json();
        if (cancelled) return;
        const open = (data.tickets || []).filter(
          (t: any) =>
            t.status === 'OPEN' ||
            t.status === 'IN_PROGRESS' ||
            t.status === 'PENDING'
        );
        setOpenCount(open.length);
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userEmail]);

  const dismissNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const showNotification = openCount > 0 && !notificationDismissed;

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {/* Notification banner */}
      {showNotification && (
        <div className="relative px-3.5 py-2.5 rounded-xl bg-[#1a1008] border border-amber-500/40 shadow-2xl max-w-[240px] animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">💬</span>
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-[11px] font-bold text-amber-200">
                {openCount} open ticket{openCount > 1 ? 's' : ''}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">
                Support team is on it
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="absolute top-2 right-2 p-0.5 text-amber-400/60 hover:text-amber-200 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={onOpenSupport}
        title="Support — chat with us"
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-900/40 hover:scale-110 active:scale-95 transition-transform duration-200 flex items-center justify-center border border-emerald-400/40"
      >
        <Headphones className="w-6 h-6" />
        {openCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 border-2 border-[#07080d] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {openCount > 9 ? '9+' : openCount}
          </span>
        )}
      </button>
    </div>
  );
};
