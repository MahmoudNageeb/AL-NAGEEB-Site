import React from 'react';
import type { Metadata } from 'next';
import { getPublicSiteSnapshot } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { GuideExperience } from '@/components/GuideExperience';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'الدليل الشامل والأذونات | AL NAGEEB',
  description:
    'اتعرّف بالتفصيل على كل أنظمة تطبيق النجيب، أذونات الأندرويد المطلوبة، وسجل التحديثات والأسئلة الشائعة.',
};

export default async function GuidePage() {
  const [snapshot, session] = await Promise.all([
    getPublicSiteSnapshot(),
    getCurrentSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <GuideExperience
        settings={snapshot.settings}
        capabilities={snapshot.capabilities}
        changelog={snapshot.changelog}
      />
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
