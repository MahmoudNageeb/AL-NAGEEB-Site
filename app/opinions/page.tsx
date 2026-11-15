import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getPublicSiteSnapshot } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { OpinionsSection } from '@/components/OpinionsSection';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'آراء الطلاب وتجاربهم | AL NAGEEB',
  description:
    'اقرأ تجارب الطلاب مع تطبيق النجيب وشارك برأيك واقتراحاتك للتحديثات الجاية.',
};

export default async function OpinionsPage() {
  const cookieStore = await cookies();
  const voterToken = cookieStore.get('al_nageeb_voter')?.value ?? null;

  const [snapshot, session] = await Promise.all([
    getPublicSiteSnapshot({ voterToken, sortBy: 'newest' }),
    getCurrentSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <main className="flex flex-1 flex-col">
        <OpinionsSection
          initialOpinions={snapshot.opinions}
          dbConnected={snapshot.dbConnected}
          session={session}
          standalonePage
        />
      </main>
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
