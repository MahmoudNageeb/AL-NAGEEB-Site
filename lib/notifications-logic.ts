export interface BroadcastNotificationItem {
  id: number;
  title: string;
  body: string;
  targetUrl: string;
  recipientCount: number;
  pushSentCount: number;
  createdAt: string;
}

export interface BroadcastValidationResult {
  valid: boolean;
  sanitized?: {
    title: string;
    body: string;
    targetUrl: string;
  };
  errors: {
    title?: string;
    body?: string;
    targetUrl?: string;
  };
}

export interface SubscriptionPayloadInput {
  subscriberToken?: unknown;
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  } | null;
}

export function sanitizeTargetUrl(raw: unknown): { valid: boolean; value: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { valid: true, value: '/' };
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { valid: true, value: trimmed };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { valid: true, value: parsed.toString() };
    }
    return { valid: false, value: '/' };
  } catch {
    return { valid: false, value: '/' };
  }
}

export function validateBroadcastNotificationInput(input: {
  title: unknown;
  body: unknown;
  targetUrl?: unknown;
}): BroadcastValidationResult {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  const urlCheck = sanitizeTargetUrl(input.targetUrl);

  const errors: BroadcastValidationResult['errors'] = {};

  if (title.length < 2) {
    errors.title = 'عنوان الإشعار لازم يكون حرفين على الأقل.';
  } else if (title.length > 120) {
    errors.title = 'عنوان الإشعار طويل جداً (الحد الأقصى 120 حرف).';
  }

  if (body.length < 3) {
    errors.body = 'نص الإشعار لازم يكون 3 حروف على الأقل.';
  } else if (body.length > 500) {
    errors.body = 'نص الإشعار طويل جداً (الحد الأقصى 500 حرف).';
  }

  if (!urlCheck.valid) {
    errors.targetUrl = 'الرابط المستهدف لازم يبدأ بـ / أو https://';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    sanitized: {
      title,
      body,
      targetUrl: urlCheck.value,
    },
    errors: {},
  };
}

export function normalizeSubscriptionInput(payload: SubscriptionPayloadInput): {
  valid: boolean;
  subscriberToken?: string;
  endpoint?: string | null;
  p256dh?: string | null;
  auth?: string | null;
  error?: string;
} {
  const token =
    typeof payload.subscriberToken === 'string' ? payload.subscriberToken.trim() : '';

  if (token.length < 16 || token.length > 128) {
    return { valid: false, error: 'معرّف المشترك غير صالح.' };
  }

  const endpoint =
    typeof payload.endpoint === 'string' && payload.endpoint.trim().startsWith('https://')
      ? payload.endpoint.trim()
      : null;

  const p256dh =
    endpoint &&
    payload.keys &&
    typeof payload.keys.p256dh === 'string' &&
    payload.keys.p256dh.trim().length > 10
      ? payload.keys.p256dh.trim()
      : null;

  const auth =
    endpoint &&
    payload.keys &&
    typeof payload.keys.auth === 'string' &&
    payload.keys.auth.trim().length > 6
      ? payload.keys.auth.trim()
      : null;

  return {
    valid: true,
    subscriberToken: token,
    endpoint: endpoint && p256dh && auth ? endpoint : null,
    p256dh: endpoint && p256dh && auth ? p256dh : null,
    auth: endpoint && p256dh && auth ? auth : null,
  };
}

export function findUnseenNotifications(
  feed: BroadcastNotificationItem[],
  seenIds: Iterable<number>,
): BroadcastNotificationItem[] {
  const seen = new Set(seenIds);
  return [...feed]
    .filter((item) => !seen.has(item.id))
    .sort((a, b) => a.id - b.id);
}
