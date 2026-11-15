'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  normalizePublicPath,
  shouldCountSessionHit,
} from '@/lib/analytics-logic';

const VISITOR_TOKEN_KEY = 'al_nageeb_visitor_token_v1';
const LAST_HIT_PREFIX = 'al_nageeb_visit_ts_v1:';
const HIT_COOLDOWN_MS = 20_000;

function getOrCreateVisitorToken(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_TOKEN_KEY);
    if (existing && /^[a-zA-Z0-9_-]{12,120}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `vis_${crypto.randomUUID().replace(/-/g, '')}`
        : `vis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(VISITOR_TOKEN_KEY, generated);
    return generated;
  } catch {
    return `vis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  }
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackablePath = normalizePublicPath(pathname);
    if (!trackablePath) return;

    const timer = window.setTimeout(() => {
      const now = Date.now();
      const sessionKey = `${LAST_HIT_PREFIX}${trackablePath}`;
      let lastHitMs: number | null = null;
      try {
        const raw = window.sessionStorage.getItem(sessionKey);
        if (raw) {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) lastHitMs = parsed;
        }
      } catch {
        // Ignore sessionStorage restrictions
      }

      if (!shouldCountSessionHit(lastHitMs, now, HIT_COOLDOWN_MS)) {
        return;
      }

      try {
        window.sessionStorage.setItem(sessionKey, String(now));
      } catch {
        // Ignore sessionStorage restrictions
      }

      const visitorToken = getOrCreateVisitorToken();
      void fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorToken, path: trackablePath }),
        keepalive: true,
      }).catch(() => {
        // Never disrupt visitor experience
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
