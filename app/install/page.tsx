import React from 'react';
import type { Metadata } from 'next';
import { getPublicSiteSnapshot } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { InstallGuideSection } from '@/components/InstallGuideSection';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'طريقة التثبيت والتحديثات | AL NAGEEB',
  description:
    'خطوات سهلة ومرتبة لتثبيت حزمة APK الرسمية من تطبيق النجيب على موبايلك الأندرويد ومتابعة أحدث التحديثات.',
};

export default async function InstallPage() {
  const [snapshot, session] = await Promise.all([
    getPublicSiteSnapshot(),
    getCurrentSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <main className="flex flex-1 flex-col">
        <InstallGuideSection
          steps={snapshot.installSteps}
          settings={snapshot.settings}
          latestChangelog={snapshot.changelog[0]}
          standalonePage
        />
      </main>
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
