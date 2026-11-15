import React from 'react';
import type { Metadata } from 'next';
import { getPublicSiteSnapshot } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { FeaturesExperience } from '@/components/FeaturesExperience';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'مميزات التطبيق | AL NAGEEB',
  description:
    'استعرض كل أنظمة ومميزات تطبيق النجيب للأندرويد: مؤقت التطبيقات، المكتبة الدراسية الهرمية، السبورة الذكية، ومخطط الأسبوع.',
};

export default async function FeaturesPage() {
  const [snapshot, session] = await Promise.all([
    getPublicSiteSnapshot(),
    getCurrentSession(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <FeaturesExperience
        settings={snapshot.settings}
        capabilities={snapshot.capabilities}
      />
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
