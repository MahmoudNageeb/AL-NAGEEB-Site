import { NextResponse } from 'next/server';
import { generateVAPIDKeys } from 'web-push';
import { getOrCreateVapidKeysInDb, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
    const publicKey = envPub || generateVAPIDKeys().publicKey;
    return NextResponse.json({ publicKey });
  }

  try {
    const { publicKey } = await getOrCreateVapidKeysInDb();
    return NextResponse.json({ publicKey });
  } catch (err) {
    console.error('Failed to get VAPID public key:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json(
      { error: 'تعذر تجهيز مفتاح الإشعارات.' },
      { status: 500 },
    );
  }
}
