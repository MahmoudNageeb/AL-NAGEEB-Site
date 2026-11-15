import { NextRequest, NextResponse } from 'next/server';
import {
  isDatabaseConfigured,
  isSubscriberEnabledInDb,
  listBroadcastNotificationsInDb,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ enabled: false, notifications: [] });
  }

  try {
    const token = req.nextUrl.searchParams.get('token')?.trim() || '';
    const [enabled, notifications] = await Promise.all([
      token.length >= 16 ? isSubscriberEnabledInDb(token) : Promise.resolve(false),
      listBroadcastNotificationsInDb(15),
    ]);

    return NextResponse.json({
      enabled,
      notifications,
    });
  } catch (err) {
    console.error('Fetch notification feed error:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json({ enabled: false, notifications: [] });
  }
}
