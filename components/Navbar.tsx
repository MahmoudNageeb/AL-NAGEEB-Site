'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Menu, X } from 'lucide-react';
import type { ActiveSession } from '@/lib/session';
import { MagneticWrap } from './MagneticButton';
import { NotificationBell } from './NotificationBell';
import { ThemeToggleButton } from './ThemeProvider';

interface NavbarProps {
  version?: string;
  session?: ActiveSession | null;
}

export function Navbar({ version = '2.7', session = null }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accountItem =
    session?.role === 'admin'
      ? { href: '/admin', label: 'لوحة الأدمن', active: pathname.startsWith('/admin') }
      : session
        ? { href: '/login', label: 'حسابي', active: pathname === '/login' }
        : { href: '/login', label: 'دخول', active: pathname === '/login' };

  const navItems = [
    { href: '/', label: 'الرئيسية', active: pathname === '/' },
    { href: '/features', label: 'المميزات', active: pathname === '/features' },
    { href: '/install', label: 'التثبيت', active: pathname === '/install' },
    { href: '/opinions', label: 'الآراء', active: pathname === '/opinions' },
    { href: '/guide', label: 'الدليل', active: pathname === '/guide' },
    accountItem,
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--velvet-border)] bg-[var(--velvet-bg)]/88 backdrop-blur-md">
      {/* Top Calligraphic Salawat Ribbon */}
      <div className="relative overflow-hidden border-b border-[var(--velvet-gold)]/20 bg-gradient-to-l from-[var(--velvet-bg-deep)] via-[var(--velvet-surface)] to-[var(--velvet-bg-deep)]">
        {/* Centered Ambient Golden Backlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_100%_at_50%_50%,rgba(240,201,122,0.14),transparent_72%)] dark:bg-[radial-gradient(ellipse_55%_100%_at_50%_50%,rgba(240,201,122,0.18),transparent_72%)]"
        />
        {/* Gentle Specular Shimmer */}
        <span
          aria-hidden="true"
          className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-[#F0C97A]/15 to-transparent"
        />

        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-1.5 sm:gap-5 sm:px-6"
        >
          {/* Right Ornamental Hairline */}
          <span
            aria-hidden="true"
            className="hidden items-center gap-2 sm:flex"
          >
            <span className="h-[1px] w-12 bg-gradient-to-l from-[var(--velvet-gold)]/70 to-transparent md:w-24" />
            <span className="text-[10px] text-[var(--velvet-gold)]/85">✦</span>
          </span>

          <p className="font-calligraphy bg-gradient-to-l from-[#7A530E] via-[#A8761F] to-[#7A530E] bg-clip-text text-center text-[13px] font-bold tracking-wide text-transparent drop-shadow-[0_1px_12px_rgba(240,201,122,0.22)] dark:from-[#E5B85C] dark:via-[#FFF4D2] dark:to-[#E5B85C] sm:text-[15px] md:text-base">
            اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ ﷺ
          </p>

          {/* Left Ornamental Hairline */}
          <span
            aria-hidden="true"
            className="hidden items-center gap-2 sm:flex"
          >
            <span className="text-[10px] text-[var(--velvet-gold)]/85">✦</span>
            <span className="h-[1px] w-12 bg-gradient-to-r from-[var(--velvet-gold)]/70 to-transparent md:w-24" />
          </span>
        </motion.div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:gap-6 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)]"
        >
          <motion.span
            aria-hidden="true"
            whileHover={{ rotate: [0, -6, 6, 0], scale: 1.07 }}
            transition={{ duration: 0.4 }}
            className="flex h-9 w-9 flex-col items-center justify-center rounded-xl border border-[#D4B782]/45 bg-[#0C0F14] shadow-sm"
          >
            <span className="font-display text-base font-extrabold leading-none text-[#D4B782]">
              N
            </span>
            <span className="mt-0.5 h-[2px] w-4 rounded-full bg-[#D4B782]" />
          </motion.span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[var(--velvet-text)] transition-colors group-hover:text-[var(--velvet-gold)]">
            AL NAGEEB
          </span>
        </Link>

        {/* Zone 2: Clean Single-Line Navigation with Spring Active Indicator */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-5 text-sm font-medium text-[var(--velvet-muted)] lg:gap-7"
        >
          {navItems.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[var(--velvet-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)] rounded-sm ${
                item.active ? 'font-bold text-[var(--velvet-gold)]' : ''
              }`}
            >
              <span>{item.label}</span>
              {item.active && (
                <motion.span
                  layoutId="nav-active-underline"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-[var(--velvet-gold)]"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Notification Bell + Theme Toggle + Magnetic Shimmer Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NotificationBell />
          <ThemeToggleButton className="hidden sm:inline-flex" />

          <div className="hidden sm:inline-block">
            <MagneticWrap strength={0.18}>
              <motion.a
                href="/api/download"
                download={`AL-NAGEEB-v${version}.apk`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#F0C97A] px-4 py-2 text-xs font-bold text-[#1A1408] shadow-[0_8px_20px_-10px_rgba(240,201,122,0.75)] transition-colors duration-150 hover:bg-[#f5d593] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)]"
              >
                <span
                  aria-hidden="true"
                  className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-9 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                />
                <Download className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                <span dir="ltr" className="relative z-10 font-numeric">
                  v{version}
                </span>
                <span className="relative z-10">حمّل</span>
              </motion.a>
            </MagneticWrap>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'اقفل القائمة' : 'افتح القائمة'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] text-[var(--velvet-text)] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            aria-label="قائمة الموبايل"
            className="overflow-hidden border-t border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-4 md:hidden"
          >
            <div className="flex flex-col gap-1.5 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    item.active
                      ? 'bg-[var(--velvet-surface-high)] text-[var(--velvet-gold)]'
                      : 'text-[var(--velvet-text)] hover:bg-[var(--velvet-surface)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-[var(--velvet-border)]/70 pt-2">
                <ThemeToggleButton className="flex-1 justify-center py-2.5" />
                <a
                  href="/api/download"
                  download={`AL-NAGEEB-v${version}.apk`}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2.5 text-sm font-bold text-[#1A1408]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>حمّل v{version}</span>
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

