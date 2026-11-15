import { NextRequest, NextResponse } from 'next/server';
import {
  isPrefetchRequestHeaders,
  normalizeVisitPayload,
} from '@/lib/analytics-logic';
import { recordSiteVisitInDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (isPrefetchRequestHeaders(request.headers)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: { visitorToken?: unknown; path?: unknown } = {};
  try {
    body = (await request.json()) as { visitorToken?: unknown; path?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const normalized = normalizeVisitPayload(body);
  if (!normalized.ok) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await recordSiteVisitInDb(normalized.visitorToken, normalized.path);
  } catch {
    // Keep public navigation silent even if DB temporarily fails
  }

  return NextResponse.json({ ok: true });
}
