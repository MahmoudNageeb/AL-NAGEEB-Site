import React from 'react';
import Link from 'next/link';
import { APP_RELEASE_META, type AppReleaseMeta } from '@/lib/study-app-data';
import type { ActiveSession } from '@/lib/session';
import { ThemeToggleButton } from './ThemeProvider';
import { FounderContactCard } from './FounderContactCard';

interface FooterProps {
  settings?: AppReleaseMeta;
  session?: ActiveSession | null;
}

export function Footer({
  settings = APP_RELEASE_META,
  session = null,
}: FooterProps) {
  return (
    <footer className="mt-24 border-t border-[var(--velvet-border)] bg-[var(--velvet-bg-deep)]">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
        {/* Mahmoud Nageeb Founder & Developer Card */}
        <FounderContactCard />

        {/* Quiet Site Navigation & Legal Bar */}
        <div className="flex flex-col gap-6 border-t border-[var(--velvet-border)]/80 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 flex-col items-center justify-center rounded-lg border border-[#D4B782]/40 bg-[#0C0F14]"
              >
                <span className="font-display text-sm font-extrabold leading-none text-[#D4B782]">
                  N
                </span>
                <span className="mt-0.5 h-[2px] w-3.5 rounded-full bg-[#D4B782]" />
              </span>
              <span className="font-display text-base font-bold text-[var(--velvet-text)]">
                {settings.name} · النجيب
              </span>
            </div>
            <p className="text-sm text-[var(--velvet-muted)]">
              {settings.arabicName} · {settings.licenseNote}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--velvet-muted)]">
            <Link
              href="/"
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              الرئيسية
            </Link>
            <Link
              href="/features"
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              المميزات
            </Link>
            <Link
              href="/install"
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              طريقة التثبيت
            </Link>
            <Link
              href="/opinions"
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              آراء الطلاب
            </Link>
            <Link
              href="/guide"
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              الدليل الشامل
            </Link>
            <Link
              href={session?.role === 'admin' ? '/admin' : '/login'}
              className="transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
            >
              {session?.role === 'admin' ? 'لوحة الأدمن' : 'تسجيل الدخول'}
            </Link>
            <ThemeToggleButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
