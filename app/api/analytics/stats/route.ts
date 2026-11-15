import { NextRequest, NextResponse } from 'next/server';
import { getSiteTrafficStatsInDb } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get('days');
  const stats = await getSiteTrafficStatsInDb(daysParam);
  return NextResponse.json(stats);
}
