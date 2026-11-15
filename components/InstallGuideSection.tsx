'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type {
  AppReleaseMeta,
  ChangelogEntry,
  InstallStep,
} from '@/lib/study-app-data';
import { DownloadCtaButton } from './DownloadCtaButton';
import { PlayProtectGuide } from './PlayProtectGuide';
import { SpotlightCard } from './SpotlightCard';

interface InstallGuideSectionProps {
  steps: InstallStep[];
  settings: AppReleaseMeta;
  latestChangelog?: ChangelogEntry;
  standalonePage?: boolean;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function InstallGuideSection({
  steps,
  settings,
  latestChangelog,
  standalonePage = true,
}: InstallGuideSectionProps) {
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);

  const toggleStep = (order: number) => {
    setCompletedOrders((prev) =>
      prev.includes(order)
        ? prev.filter((item) => item !== order)
        : [...prev, order],
    );
  };

  const progressPct =
    steps.length > 0
      ? Math.round((completedOrders.length / steps.length) * 100)
      : 0;
  const allCompleted =
    steps.length > 0 && completedOrders.length === steps.length;

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="install"
        className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${
          standalonePage ? 'flex-1 pb-20 pt-10' : 'pt-20'
        }`}
      >
        {standalonePage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="mb-8 flex flex-wrap items-center justify-between gap-4"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--velvet-muted)] transition-colors hover:text-[var(--velvet-gold)]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>الرجوع للرئيسية</span>
            </Link>

            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--velvet-gold)] transition-colors hover:underline"
            >
              <span>شوف تفاصيل الأذونات التقنية</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        {/* Header + Dynamic Progress Meter */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
          className="mb-8 flex flex-col gap-5 border-b border-[var(--velvet-border)]/80 pb-8 md:flex-row md:items-end md:justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-6 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
              />
              <h1 className="font-display text-2xl font-extrabold text-[var(--velvet-text)] sm:text-4xl">
                ازاي تثبّت النجيب على موبايلك الأندرويد
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
              خطوات واضحة وسريعة عشان تنزّل حزمة الـ APK الرسمية وتشغّل التطبيق في أقل من دقيقتين — واضغط على أي خطوة لما تخلصها عشان تتابع تقدمك.
            </p>
          </div>

          <div className="min-w-[230px] rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--velvet-muted)]">تقدمك في التثبيت</span>
              <span
                dir="ltr"
                className={`font-numeric font-bold transition-colors ${
                  allCompleted
                    ? 'text-[var(--velvet-emerald)]'
                    : 'text-[var(--velvet-gold)]'
                }`}
              >
                {completedOrders.length} / {steps.length}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--velvet-surface-high)]">
              <motion.div
                className={`h-full rounded-full ${
                  allCompleted
                    ? 'bg-gradient-to-l from-[#72D99B] via-[#F0C97A] to-[#72D99B]'
                    : 'bg-gradient-to-l from-[#FFF4D2] to-[#F0C97A]'
                }`}
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Celebratory Completion Banner */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
              role="status"
              aria-live="polite"
              className="mb-7 relative overflow-hidden rounded-2xl border border-[var(--velvet-emerald)]/60 bg-[var(--velvet-emerald)]/12 px-5 py-4 shadow-[0_12px_32px_-16px_rgba(114,217,155,0.55)]"
            >
              <span
                aria-hidden="true"
                className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ rotate: -25, scale: 0.6 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 16 }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--velvet-emerald)]/20 text-[var(--velvet-emerald)]"
                  >
                    <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                  </motion.span>
                  <div>
                    <p className="font-display text-sm font-extrabold text-[var(--velvet-text)] sm:text-base">
                      تمام! كل الخطوات خلصت — مستنيينك جوا التطبيق
                    </p>
                    <p className="text-xs text-[var(--velvet-muted)]">
                      التطبيق جاهز على موبايلك دلوقتي. شاركنا تجربتك في صفحة الآراء لما تبدأ مذاكرة!
                    </p>
                  </div>
                </div>
                <Link
                  href="/opinions"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--velvet-emerald)] px-4 py-2 font-display text-xs font-bold text-[#08150D] transition-transform hover:scale-[1.03]"
                >
                  <span>اكتب رأيك</span>
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connected Progress Timeline Beam + Steps Grid */}
        <div className="relative">
          {/* Desktop Connected Animated Timeline Track */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-8 hidden h-[3px] overflow-hidden rounded-full bg-[var(--velvet-border)]/50 lg:block"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-[#72D99B] via-[#F0C97A] to-[#7AD7F0]"
              style={{ transformOrigin: 'right center' }}
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 190, damping: 24 }}
            />
          </div>

          <div className="relative z-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => {
              const isDone = completedOrders.includes(step.stepOrder);
              return (
                <SpotlightCard
                  key={step.id ?? `${step.stepOrder}-${step.title}`}
                  accentHex={isDone ? '#72D99B' : '#F0C97A'}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.38,
                    delay: Math.min(idx * 0.07, 0.28),
                    ease: EASE_OUT_EXPO,
                  }}
                  className={`rounded-3xl p-6 transition-all duration-200 ${
                    isDone
                      ? 'border-[var(--velvet-emerald)]/70 shadow-[0_18px_40px_-24px_rgba(114,217,155,0.5)]'
                      : 'hover:border-[var(--velvet-gold)]/50'
                  }`}
                >
                  <div className="flex h-full flex-col justify-between gap-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <motion.span
                          dir="ltr"
                          animate={isDone ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                          transition={{ duration: 0.35 }}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border font-numeric text-base font-bold transition-colors ${
                            isDone
                              ? 'border-[var(--velvet-emerald)]/60 bg-[var(--velvet-emerald)]/15 text-[var(--velvet-emerald)]'
                              : 'border-[var(--velvet-border)] bg-[var(--velvet-bg)] text-[var(--velvet-gold)]'
                          }`}
                        >
                          {String(step.stepOrder).padStart(2, '0')}
                        </motion.span>

                        <motion.button
                          type="button"
                          onClick={() => toggleStep(step.stepOrder)}
                          aria-pressed={isDone}
                          whileTap={{ scale: 0.92 }}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                            isDone
                              ? 'border-[var(--velvet-emerald)]/60 bg-[var(--velvet-emerald)]/15 text-[var(--velvet-emerald)]'
                              : 'border-[var(--velvet-border)] bg-[var(--velvet-bg)] text-[var(--velvet-muted)] hover:border-[var(--velvet-gold)] hover:text-[var(--velvet-text)]'
                          }`}
                        >
                          <motion.span
                            key={isDone ? 'done-icon' : 'todo-icon'}
                            initial={{ scale: 0.5, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            className="inline-flex"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </motion.span>
                          <span>{isDone ? 'تمت' : 'علّم كـ تمام'}</span>
                        </motion.button>
                      </div>

                      <h2 className="mt-4 font-display text-lg font-bold text-[var(--velvet-text)]">
                        {step.title}
                      </h2>
                      <p className="mt-2.5 text-sm leading-relaxed text-[var(--velvet-muted)]">
                        {step.detail}
                      </p>
                    </div>

                    {step.tip && (
                      <p className="border-t border-[var(--velvet-border)]/70 pt-3.5 text-xs leading-relaxed text-[var(--velvet-emerald)]">
                        {step.tip}
                      </p>
                    )}
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* Visual Step-by-Step Google Play Protect Guide (4 Screenshots + Security Reminder) */}
        <PlayProtectGuide />

        {/* Latest Changelog + Direct Package Card */}
        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <SpotlightCard
            accentHex="#F0C97A"
            tilt3D={false}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
            className="rounded-3xl p-6 sm:p-7 lg:col-span-5"
          >
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[var(--velvet-gold)]">
                  مواصفات النسخة الرسمية
                </p>
                <h2 className="font-display text-xl font-bold text-[var(--velvet-text)]">
                  جاهز للتنزيل المباشر على موبايلك
                </h2>
                <dl className="grid grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <dt className="text-[var(--velvet-muted)]">الإصدار</dt>
                    <dd
                      dir="ltr"
                      className="mt-0.5 text-right font-numeric text-sm font-bold text-[var(--velvet-text)]"
                    >
                      v{settings.version} ({settings.versionCode})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--velvet-muted)]">حجم الملف</dt>
                    <dd
                      dir="ltr"
                      className="mt-0.5 text-right font-numeric text-sm font-bold text-[var(--velvet-text)]"
                    >
                      {settings.fileSizeLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--velvet-muted)]">النظام المطلوب</dt>
                    <dd
                      dir="ltr"
                      className="mt-0.5 text-right font-numeric text-sm font-bold text-[var(--velvet-text)]"
                    >
                      {settings.minAndroid}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--velvet-muted)]">معرف الحزمة</dt>
                    <dd
                      dir="ltr"
                      className="mt-0.5 truncate text-right font-mono text-xs font-semibold text-[var(--velvet-text)]"
                    >
                      {settings.packageName}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--velvet-border)]/70 pt-5">
                <DownloadCtaButton
                  version={settings.version}
                  fileSizeLabel={settings.fileSizeLabel}
                  variant="compact"
                />
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--velvet-muted)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--velvet-emerald)]" aria-hidden="true" />
                  <span>من غير إعلانات أو تتبع</span>
                </span>
              </div>
            </div>
          </SpotlightCard>

          {latestChangelog && (
            <SpotlightCard
              accentHex="#7AD7F0"
              tilt3D={false}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.42, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="rounded-3xl p-6 sm:p-7 lg:col-span-7"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[var(--velvet-gold)]">
                      إيه الجديد في{' '}
                      <span dir="ltr" className="inline-block font-numeric">
                        {latestChangelog.version}
                      </span>{' '}
                      · {latestChangelog.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[var(--velvet-muted)]">
                      <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>سجل التحديثات</span>
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold text-[var(--velvet-text)]">
                    {latestChangelog.headline}
                  </h2>

                  <ul className="mt-4 space-y-2.5">
                    {latestChangelog.changes.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--velvet-text)]/90"
                      >
                        <Check
                          className="mt-1 h-4 w-4 shrink-0 text-[var(--velvet-emerald)]"
                          aria-hidden="true"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-[var(--velvet-border)]/70 pt-4">
                  <Link
                    href="/guide"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[var(--velvet-gold)] hover:underline"
                  >
                    <span>شوف سجل الإصدارات السابقة والدليل الكامل</span>
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

