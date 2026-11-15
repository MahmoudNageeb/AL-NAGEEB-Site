import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  getAuthorizedOwnerEmail,
  getPublicSiteSnapshot,
  hasAnyAdminInDb,
} from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
import { AuthPortal } from '@/components/AuthPortal';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | AL NAGEEB',
  description: 'سجّل دخولك بحساب الإدارة أو اعمل حساب مستخدم في موقع النجيب.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const [session, snapshot, hasAdmin] = await Promise.all([
    getCurrentSession(),
    getPublicSiteSnapshot(),
    hasAnyAdminInDb().catch(() => false),
  ]);

  if (session?.role === 'admin' && params.next) {
    redirect(params.next.startsWith('/') ? params.next : '/admin');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--velvet-bg)]">
      <Navbar version={snapshot.settings.version} session={session} />
      <AuthPortal
        hasAdmin={hasAdmin}
        authorizedOwnerEmail={getAuthorizedOwnerEmail()}
        session={session}
        nextPath={params.next}
        dbConnected={snapshot.dbConnected}
      />
      <Footer settings={snapshot.settings} session={session} />
    </div>
  );
}
