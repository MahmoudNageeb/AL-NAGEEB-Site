import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  getPublicSiteSnapshot,
  getPushSubscriberStatsInDb,
  getSiteTrafficStatsInDb,
  listBroadcastNotificationsInDb,
  listUsersInDb,
} from '@/lib/db';
import { requireAdminSession } from '@/lib/session';
import { AdminDashboard } from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'لوحة تحكم الأدمن | AL NAGEEB',
  description: 'إدارة إصدار تطبيق AL NAGEEB ورابط التحميل والمميزات وآراء المستخدمين.',
};

export default async function AdminPage() {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect('/login?next=/admin');
  }

  const [snapshot, users, pushStats, broadcasts, trafficStats] = await Promise.all([
    getPublicSiteSnapshot({ includeHiddenCapabilities: true }),
    listUsersInDb(),
    getPushSubscriberStatsInDb(),
    listBroadcastNotificationsInDb(30),
    getSiteTrafficStatsInDb(),
  ]);

  return (
    <AdminDashboard
      admin={admin}
      initialSettings={snapshot.settings}
      initialCapabilities={snapshot.capabilities}
      initialInstallSteps={snapshot.installSteps}
      initialChangelog={snapshot.changelog}
      initialOpinions={snapshot.opinions}
      initialUsers={users}
      initialPushStats={pushStats}
      initialBroadcasts={broadcasts}
      initialTrafficStats={trafficStats}
    />
  );
}
