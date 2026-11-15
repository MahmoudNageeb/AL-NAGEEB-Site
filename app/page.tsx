import React from 'react';
import { cookies } from 'next/headers';
import { getPublicSiteSnapshot } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { LandingExperience } from '@/components/LandingExperience';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const voterToken = cookieStore.get('al_nageeb_voter')?.value ?? null;

  const [snapshot, session] = await Promise.all([
    getPublicSiteSnapshot({ voterToken, sortBy: 'newest' }),
    getCurrentSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <LandingExperience
        settings={snapshot.settings}
        capabilities={snapshot.capabilities}
        installStepsCount={snapshot.installSteps.length}
        opinionsCount={snapshot.opinions.length}
      />
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
