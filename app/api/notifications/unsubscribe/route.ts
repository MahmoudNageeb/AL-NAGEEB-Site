import { NextRequest, NextResponse } from 'next/server';
import { disablePushSubscriberInDb, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = (await req.json()) as { subscriberToken?: unknown };
    const token =
      typeof body.subscriberToken === 'string' ? body.subscriberToken.trim() : '';

    if (token.length < 16 || token.length > 128) {
      return NextResponse.json(
        { ok: false, message: 'معرّف المشترك غير صالح.' },
        { status: 400 },
      );
    }

    await disablePushSubscriberInDb(token);
    return NextResponse.json({
      ok: true,
      message: 'تم إيقاف الإشعارات على هذا المتصفح.',
    });
  } catch (err) {
    console.error('Unsubscribe notification error:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json(
      { ok: false, message: 'تعذر إيقاف الإشعارات حالياً.' },
      { status: 500 },
    );
  }
}
