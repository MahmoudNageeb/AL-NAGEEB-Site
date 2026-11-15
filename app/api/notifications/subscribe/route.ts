import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, upsertPushSubscriberInDb } from '@/lib/db';
import { normalizeSubscriptionInput } from '@/lib/notifications-logic';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'قاعدة البيانات غير متصلة حالياً.' },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as {
      subscriberToken?: unknown;
      subscription?: {
        endpoint?: unknown;
        keys?: { p256dh?: unknown; auth?: unknown } | null;
      } | null;
    };

    const normalized = normalizeSubscriptionInput({
      subscriberToken: body.subscriberToken,
      endpoint: body.subscription?.endpoint,
      keys: body.subscription?.keys ?? null,
    });

    if (!normalized.valid || !normalized.subscriberToken) {
      return NextResponse.json(
        { ok: false, message: normalized.error || 'بيانات الاشتراك غير صالحة.' },
        { status: 400 },
      );
    }

    const userAgent = req.headers.get('user-agent') || '';
    const stats = await upsertPushSubscriberInDb({
      subscriberToken: normalized.subscriberToken,
      endpoint: normalized.endpoint,
      p256dh: normalized.p256dh,
      auth: normalized.auth,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: 'تم تفعيل الإشعارات على جهازك بنجاح.',
      enabledCount: stats.enabledCount,
      webPushDeviceCount: stats.webPushDeviceCount,
    });
  } catch (err) {
    console.error('Subscribe notification error:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json(
      { ok: false, message: 'تعذر حفظ اشتراك الإشعارات.' },
      { status: 500 },
    );
  }
}
