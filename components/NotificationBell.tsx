'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  findUnseenNotifications,
  type BroadcastNotificationItem,
} from '@/lib/notifications-logic';

const TOKEN_STORAGE_KEY = 'al_nageeb_push_token';
const ENABLED_STORAGE_KEY = 'al_nageeb_notifications_enabled';
const SEEN_IDS_STORAGE_KEY = 'al_nageeb_seen_notif_ids';
const TOASTED_IDS_STORAGE_KEY = 'al_nageeb_toasted_notif_ids';

function getOrCreateSubscriberToken(): string {
  try {
    const existing = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (existing && existing.length >= 16) return existing;
    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `sub-ephemeral-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function readIdList(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : [];
  } catch {
    return [];
  }
}

function writeIdList(key: string, ids: number[]) {
  try {
    const unique = Array.from(new Set(ids)).slice(-100);
    window.localStorage.setItem(key, JSON.stringify(unique));
  } catch {
    // Ignore storage quota errors
  }
}

const readSeenIds = () => readIdList(SEEN_IDS_STORAGE_KEY);
const writeSeenIds = (ids: number[]) => writeIdList(SEEN_IDS_STORAGE_KEY, ids);
const readToastedIds = () => readIdList(TOASTED_IDS_STORAGE_KEY);
const writeToastedIds = (ids: number[]) => writeIdList(TOASTED_IDS_STORAGE_KEY, ids);

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function formatArabicTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [feed, setFeed] = useState<BroadcastNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<BroadcastNotificationItem | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const enabledRef = useRef(false);
  const hasBootstrappedRef = useRef(false);

  const triggerLiveAlert = useCallback((item: BroadcastNotificationItem) => {
    setActiveToast(item);

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      try {
        const notif = new window.Notification(item.title, {
          body: item.body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          dir: 'rtl',
          lang: 'ar',
          tag: `al-nageeb-${item.id}`,
        });
        notif.onclick = () => {
          window.focus();
          if (item.targetUrl) {
            window.location.assign(item.targetUrl);
          }
          notif.close();
        };
      } catch {
        // Browsers inside restricted frames may block direct Notification constructor
      }
    }
  }, []);

  const syncFeed = useCallback(
    async (announceNew: boolean) => {
      try {
        const token = getOrCreateSubscriberToken();
        const res = await fetch(
          `/api/notifications/feed?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          enabled?: boolean;
          notifications?: BroadcastNotificationItem[];
        };

        const list = Array.isArray(data.notifications) ? data.notifications : [];
        setFeed(list);

        const localFlag = window.localStorage.getItem(ENABLED_STORAGE_KEY) === '1';
        const isSubEnabled = Boolean(data.enabled) || localFlag;
        enabledRef.current = isSubEnabled;
        setEnabled(isSubEnabled);

        const seenIds = readSeenIds();
        const unseen = findUnseenNotifications(list, seenIds);
        setUnreadCount(unseen.length);

        const toastedIds = readToastedIds();
        const untrustedToPop = findUnseenNotifications(list, toastedIds);

        if (announceNew && isSubEnabled && untrustedToPop.length > 0) {
          const newest = untrustedToPop[untrustedToPop.length - 1];
          writeToastedIds([...toastedIds, ...untrustedToPop.map((u) => u.id)]);
          triggerLiveAlert(newest);
        } else if (!hasBootstrappedRef.current) {
          hasBootstrappedRef.current = true;
          if (list.length > 0 && toastedIds.length === 0) {
            writeToastedIds(list.map((n) => n.id));
          }
        }
      } catch {
        // Ignore silent background polling failure
      }
    },
    [triggerLiveAlert],
  );

  useEffect(() => {
    try {
      enabledRef.current = window.localStorage.getItem(ENABLED_STORAGE_KEY) === '1';
    } catch {
      // Ignore
    }

    const timer = window.setTimeout(() => {
      void syncFeed(false);
    }, 0);

    const interval = window.setInterval(() => {
      if (enabledRef.current) {
        void syncFeed(true);
      }
    }, 20000);

    const onFocus = () => {
      if (enabledRef.current) {
        void syncFeed(true);
      }
    };

    const onSwMessage = (event: MessageEvent) => {
      const msg = event.data as
        | { type?: string; payload?: { id?: number | null; title?: string; body?: string; url?: string; createdAt?: string } }
        | undefined;
      if (msg?.type === 'AL_NAGEEB_PUSH_RECEIVED' && msg.payload) {
        const pushId = typeof msg.payload.id === 'number' ? msg.payload.id : null;
        if (pushId !== null) {
          writeToastedIds([...readToastedIds(), pushId]);
          setActiveToast({
            id: pushId,
            title: msg.payload.title || 'إشعار جديد من النجيب',
            body: msg.payload.body || '',
            targetUrl: msg.payload.url || '/',
            recipientCount: 0,
            pushSentCount: 0,
            createdAt: msg.payload.createdAt || new Date().toISOString(),
          });
        }
        void syncFeed(false);
      }
    };

    window.addEventListener('focus', onFocus);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, [syncFeed]);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleEnableNotifications = async () => {
    setBusy(true);
    setStatusMessage(null);

    try {
      let browserPermission: NotificationPermission = 'default';
      if (typeof window !== 'undefined' && 'Notification' in window) {
        browserPermission = window.Notification.permission;
        if (browserPermission === 'default') {
          try {
            browserPermission = await window.Notification.requestPermission();
          } catch {
            browserPermission = 'denied';
          }
        }
      }

      const subscriberToken = getOrCreateSubscriberToken();
      let pushSubJson: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null =
        null;

      if (
        browserPermission === 'granted' &&
        'serviceWorker' in navigator &&
        'PushManager' in window
      ) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          const readyReg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((resolve) =>
              window.setTimeout(() => resolve(registration), 3500),
            ),
          ]);

          const existingSub = await readyReg.pushManager.getSubscription();
          if (existingSub) {
            pushSubJson = existingSub.toJSON() as {
              endpoint?: string;
              keys?: { p256dh?: string; auth?: string };
            };
          } else {
            const keyRes = await fetch('/api/notifications/vapid-public-key');
            if (keyRes.ok) {
              const { publicKey } = (await keyRes.json()) as { publicKey?: string };
              if (publicKey) {
                const sub = await readyReg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(publicKey),
                });
                pushSubJson = sub.toJSON() as {
                  endpoint?: string;
                  keys?: { p256dh?: string; auth?: string };
                };
              }
            }
          }
        } catch {
          // Some browsers/preview frames disallow PushManager; subscriber token still persists live notifications
        }
      }

      const subRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberToken,
          subscription: pushSubJson,
        }),
      });

      const subData = (await subRes.json()) as { ok?: boolean; message?: string };
      if (!subRes.ok || !subData.ok) {
        setStatusMessage(subData.message || 'حصلت مشكلة وإحنا بنفعّل الإشعارات.');
        setBusy(false);
        return;
      }

      window.localStorage.setItem(ENABLED_STORAGE_KEY, '1');
      // Mark current feed IDs as seen/toasted so old broadcasts don't pop up unexpectedly
      writeSeenIds([...readSeenIds(), ...feed.map((n) => n.id)]);
      writeToastedIds([...readToastedIds(), ...feed.map((n) => n.id)]);
      enabledRef.current = true;
      setEnabled(true);
      setUnreadCount(0);

      if (browserPermission === 'granted' && pushSubJson) {
        setStatusMessage('تم تفعيل الإشعارات الفورية (Web Push)! أي تحديث جديد هيوصلك فوراً.');
      } else if (browserPermission === 'granted') {
        setStatusMessage('تم تفعيل الإشعارات! أي خبر أو تحديث جديد هيوصلك فوراً.');
      } else {
        setStatusMessage(
          'تم تفعيل الإشعارات داخل الموقع! (ولتنبيهات المتصفح الخارجية، اسمح بالإشعارات من إعدادات الموقع جنب الرابط).',
        );
      }
    } catch {
      setStatusMessage('تعذر تفعيل الإشعارات دلوقتي، جرّب تاني بعد ثواني.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisableNotifications = async () => {
    setBusy(true);
    setStatusMessage(null);

    try {
      const token = getOrCreateSubscriberToken();
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration('/sw.js');
          const sub = await reg?.pushManager.getSubscription();
          await sub?.unsubscribe();
        } catch {
          // Ignore PushManager errors on disable
        }
      }

      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberToken: token }),
      });

      window.localStorage.setItem(ENABLED_STORAGE_KEY, '0');
      enabledRef.current = false;
      setEnabled(false);
      setStatusMessage('تم إيقاف الإشعارات على جهازك.');
    } catch {
      setStatusMessage('تعذر إيقاف الإشعارات حالياً.');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkAllSeen = () => {
    writeSeenIds([...readSeenIds(), ...feed.map((n) => n.id)]);
    setUnreadCount(0);
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      void syncFeed(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          aria-label={
            enabled
              ? 'إشعارات الموقع مفعلة — افتح سجل الإشعارات'
              : 'تفعيل إشعارات الموقع'
          }
          className={`relative inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)] ${
            enabled
              ? 'border-[var(--velvet-emerald)]/45 bg-[var(--velvet-emerald)]/10 text-[var(--velvet-emerald)] hover:border-[var(--velvet-emerald)]'
              : 'border-[var(--velvet-border)] bg-[var(--velvet-surface)] text-[var(--velvet-text)] hover:border-[var(--velvet-gold)]'
          }`}
        >
          {enabled ? (
            <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Bell className="h-4 w-4 shrink-0 text-[var(--velvet-gold)]" aria-hidden="true" />
          )}
          <span className="hidden lg:inline whitespace-nowrap">
            {enabled ? 'الإشعارات مفعلة' : 'فعّل الإشعارات'}
          </span>

          {unreadCount > 0 && (
            <span
              dir="ltr"
              className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-md bg-[var(--velvet-gold)] px-1 font-numeric text-[10px] font-extrabold text-[#1A1408]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label="مركز إشعارات الموقع"
              className="fixed inset-x-4 top-[104px] z-50 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 sm:w-[360px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--velvet-border)] pb-3">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-[var(--velvet-gold)]" aria-hidden="true" />
                  <h3 className="font-display text-sm font-bold text-[var(--velvet-text)]">
                    إشعارات تطبيق النجيب
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق نافذة الإشعارات"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--velvet-border)] text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Subscription Toggle Card */}
              <div className="mt-3 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)]/80 p-3.5">
                {enabled ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--velvet-emerald)]">
                        الإشعارات شغالة على جهازك
                      </p>
                      <p className="text-[11px] text-[var(--velvet-muted)]">
                        هيوصلك أي إشعار أو تحديث جديد مباشرة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisableNotifications}
                      disabled={busy}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--velvet-rose)]/40 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5" />
                      )}
                      <span>إيقاف</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs leading-relaxed text-[var(--velvet-muted)]">
                      فعّل الإشعارات عشان يوصلك تنبيه أول ما ينزل إصدار جديد أو رسالة من مطور التطبيق.
                    </p>
                    <button
                      type="button"
                      onClick={handleEnableNotifications}
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2 font-display text-xs font-bold text-[#1A1408] transition-colors hover:bg-[#f5d593] disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BellRing className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>تفعيل الإشعارات الآن</span>
                    </button>
                  </div>
                )}

                {statusMessage && (
                  <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--velvet-gold)]">
                    {statusMessage}
                  </p>
                )}
              </div>

              {/* Recent Broadcasts Feed */}
              <div className="mt-3.5">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--velvet-muted)]">
                    آخر الإشعارات المرسلة
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllSeen}
                      className="inline-flex items-center gap-1 font-semibold text-[var(--velvet-gold)] hover:underline"
                    >
                      <CheckCheck className="h-3 w-3" aria-hidden="true" />
                      <span>تمييز كمقروء</span>
                    </button>
                  )}
                </div>

                {feed.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--velvet-border)] py-5 text-center text-xs text-[var(--velvet-muted)]">
                    مفيش إشعارات مرسلة لسه.
                  </p>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto pl-1">
                    {feed.map((item) => (
                      <Link
                        key={item.id}
                        href={item.targetUrl || '/'}
                        onClick={() => {
                          writeSeenIds([...readSeenIds(), item.id]);
                          setUnreadCount(0);
                          setOpen(false);
                        }}
                        className="block rounded-xl border border-[var(--velvet-border)]/80 bg-[var(--velvet-bg)]/60 p-3 transition-colors hover:border-[var(--velvet-gold)]/55"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-xs font-bold text-[var(--velvet-text)]">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-[var(--velvet-muted)]">
                            {formatArabicTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--velvet-muted)]">
                          {item.body}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Foreground Broadcast Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-[var(--velvet-gold)]/60 bg-[var(--velvet-surface)] p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:right-auto"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--velvet-gold)]/45 bg-[var(--velvet-gold)]/15 text-[var(--velvet-gold)]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-bold text-[var(--velvet-gold)]">
                  إشعار جديد من تطبيق النجيب
                </p>
                <p className="font-display text-sm font-bold text-[var(--velvet-text)]">
                  {activeToast.title}
                </p>
                <p className="text-xs leading-relaxed text-[var(--velvet-muted)]">
                  {activeToast.body}
                </p>
                {activeToast.targetUrl && (
                  <Link
                    href={activeToast.targetUrl}
                    onClick={() => setActiveToast(null)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[var(--velvet-gold)] hover:underline"
                  >
                    <span>افتح التفاصيل</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                aria-label="إغلاق التنبيه"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--velvet-border)] text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
