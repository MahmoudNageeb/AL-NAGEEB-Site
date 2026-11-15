'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  HardDrive,
  Layers,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import heroVelvetImg from '@/src/assets/images/hero_academic_velvet_1794609936930.jpg';
import type { AppCapability, AppReleaseMeta } from '@/lib/study-app-data';
import { DownloadCtaButton } from './DownloadCtaButton';
import { MagneticWrap } from './MagneticButton';
import { SpotlightCard } from './SpotlightCard';

interface LandingExperienceProps {
  settings: AppReleaseMeta;
  capabilities: AppCapability[];
  installStepsCount: number;
  opinionsCount: number;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function LandingExperience({
  settings,
  capabilities,
  installStepsCount,
  opinionsCount,
}: LandingExperienceProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const heroTabs = capabilities.slice(0, 3);
  const [activeTabId, setActiveTabId] = useState<string>(heroTabs[0]?.id ?? '');

  const activeCap =
    heroTabs.find((c) => c.id === activeTabId) ?? heroTabs[0] ?? null;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const showcaseY = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 18]);

  const marqueeItems =
    capabilities.length > 0
      ? capabilities.map((c) => ({ title: c.title, index: c.index, color: c.accentHex }))
      : [
          { title: 'مؤقت التطبيقات الذكي', index: '01', color: '#F0C97A' },
          { title: 'المكتبة الدراسية الهرمية', index: '02', color: '#7AD7F0' },
          { title: 'السبورة متعددة الطبقات', index: '03', color: '#C7A4FF' },
        ];

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative z-10 flex-1">
        {/* Hero Section — Kinetic Parallax Showcase + Border Beam + Interactive Switcher */}
        <section
          ref={heroRef}
          id="download"
          className="relative overflow-hidden border-b border-[var(--velvet-border)]"
        >
          {/* Ambient Parallax Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#141B27] via-[#080B11] to-[#05070B] opacity-20 dark:opacity-100"
          >
            <Image
              src={heroVelvetImg}
              alt=""
              fill
              priority
              sizes="100vw"
              referrerPolicy="no-referrer"
              className="object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--velvet-bg)]/75 via-[var(--velvet-bg)]/88 to-[var(--velvet-bg)]" />
          </div>

          <div
            aria-hidden="true"
            className="studio-grid-bg pointer-events-none absolute inset-0 opacity-35"
          />

          {/* Kinetic Floating Ambient Aura Spheres */}
          <motion.div
            aria-hidden="true"
            animate={{
              scale: [1, 1.12, 1],
              x: [0, -24, 0],
              y: [0, 16, 0],
              opacity: [0.22, 0.36, 0.22],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute -top-28 right-[14%] h-[380px] w-[380px] rounded-full bg-[#F0C97A]/20 blur-[110px]"
          />
          <motion.div
            aria-hidden="true"
            animate={{
              scale: [1.06, 0.94, 1.06],
              x: [0, 26, 0],
              y: [0, -18, 0],
              opacity: [0.16, 0.26, 0.16],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute -bottom-24 left-[8%] h-[340px] w-[340px] rounded-full bg-[#7AD7F0]/16 blur-[110px]"
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              {/* Editorial Headline & Magnetic CTAs */}
              <motion.div
                style={{ y: copyY }}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.085 },
                  },
                }}
                className="space-y-6 lg:col-span-6"
              >
                {settings.announcementText && (
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.42, ease: EASE_OUT_EXPO },
                      },
                    }}
                    className="flex items-center gap-2 border-b border-[var(--velvet-gold)]/30 pb-2 text-xs font-semibold text-[var(--velvet-gold)]"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{settings.announcementText}</span>
                  </motion.p>
                )}

                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.42, ease: EASE_OUT_EXPO },
                    },
                  }}
                  className="text-xs font-semibold text-[var(--velvet-gold)] sm:text-sm"
                >
                  <span>
                    إصدار{' '}
                    <span dir="ltr" className="inline-block font-numeric">
                      v{settings.version}
                    </span>
                  </span>
                  <span className="mx-2 text-[var(--velvet-muted)]" aria-hidden="true">
                    ·
                  </span>
                  <span dir="ltr" className="inline-block font-numeric">
                    {settings.minAndroid}
                  </span>
                  <span className="mx-2 text-[var(--velvet-muted)]" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    حجم{' '}
                    <span dir="ltr" className="inline-block font-numeric">
                      {settings.fileSizeLabel}
                    </span>
                  </span>
                  <span className="mx-2 text-[var(--velvet-muted)]" aria-hidden="true">
                    ·
                  </span>
                  <span>شغّال من غير نت</span>
                </motion.p>

                <motion.h1
                  variants={{
                    hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                      transition: { duration: 0.56, ease: EASE_OUT_EXPO },
                    },
                  }}
                  className="font-display font-extrabold leading-[1.22] tracking-tight text-[var(--velvet-text)]"
                  style={{ fontSize: 'clamp(2.15rem, 3.8vw, 3.35rem)' }}
                >
                  {settings.heroTitle}
                </motion.h1>

                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: EASE_OUT_EXPO },
                    },
                  }}
                  className="max-w-xl text-base leading-relaxed text-[var(--velvet-muted)] sm:text-lg"
                >
                  {settings.heroSubtitle}
                </motion.p>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.48, ease: EASE_OUT_EXPO },
                    },
                  }}
                  className="flex flex-wrap items-center gap-3.5 pt-2"
                >
                  <DownloadCtaButton
                    version={settings.version}
                    fileSizeLabel={settings.fileSizeLabel}
                    variant="hero"
                  />

                  <MagneticWrap strength={0.16}>
                    <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href="/install"
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)]/85 px-5 py-3.5 font-display text-sm font-bold text-[var(--velvet-text)] transition-colors duration-150 hover:border-[var(--velvet-gold)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)]"
                      >
                        <span>شوف طريقة التثبيت</span>
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </motion.div>
                  </MagneticWrap>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.55 },
                    },
                  }}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-[var(--velvet-muted)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[var(--velvet-emerald)]" aria-hidden="true" />
                    <span>بياناتك على جهازك بس — مفيش تتبع</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-[var(--velvet-sky)]" aria-hidden="true" />
                    <span dir="ltr" className="font-mono text-[11px]">
                      {settings.packageName}
                    </span>
                  </span>
                </motion.div>
              </motion.div>

              {/* Kinetic Velvet Architectural Showcase with Rotating Border Beam */}
              <motion.div
                style={{ y: showcaseY }}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.14, ease: EASE_OUT_EXPO }}
                className="relative lg:col-span-6"
              >
                {/* Rotating Border Beam Wrapper */}
                <div className="relative overflow-hidden rounded-[2rem] p-[1.5px]">
                  <div
                    aria-hidden="true"
                    className="animate-beam-spin pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_255deg,#F0C97A_310deg,#7AD7F0_345deg,transparent_360deg)] opacity-75"
                  />

                  <div className="relative rounded-[calc(2rem-1.5px)] bg-[var(--velvet-bg)]">
                    <div className="lux-card relative overflow-hidden rounded-[calc(2rem-1.5px)] p-3.5 sm:p-4">
                    {/* Artwork Panel */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.35rem] border border-[var(--velvet-border)] bg-[#0C0F14]">
                      <motion.div
                        animate={{ scale: [1, 1.045, 1] }}
                        transition={{
                          duration: 16,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="relative h-full w-full"
                      >
                        <Image
                          src={heroVelvetImg}
                          alt="بيئة تطبيق النجيب الدراسية الهادئة"
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          referrerPolicy="no-referrer"
                          className="object-cover opacity-85"
                        />
                      </motion.div>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-[#080B11]/35 to-transparent"
                      />
                      <div className="absolute inset-x-5 bottom-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-[#F0C97A]">
                            تصميم هادي يفتح نفسك للمذاكرة
                          </p>
                          <p className="mt-0.5 font-display text-base font-bold text-[#F6F3EC] sm:text-lg">
                            كل أدواتك في شاشة واحدة منظمة
                          </p>
                        </div>
                        <span
                          dir="ltr"
                          className="font-numeric text-xs font-bold text-[#FFF4D2]"
                        >
                          APK v{settings.version} · {settings.fileSizeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Kinetic Switcher */}
                    {heroTabs.length > 0 && activeCap && (
                      <div className="mt-3.5 space-y-3">
                        <div
                          role="tablist"
                          aria-label="نظرة سريعة على الأنظمة"
                          className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)]/85 p-1"
                        >
                          {heroTabs.map((cap) => {
                            const isActive = cap.id === activeCap.id;
                            return (
                              <button
                                key={cap.dbId ?? cap.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTabId(cap.id)}
                                className={`relative rounded-xl px-2.5 py-2 text-center text-xs font-bold transition-colors whitespace-nowrap truncate ${
                                  isActive
                                    ? 'text-[#1A1408]'
                                    : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                                }`}
                              >
                                {isActive && (
                                  <motion.span
                                    layoutId="hero-cap-tab"
                                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                    className="absolute inset-0 rounded-xl bg-[#F0C97A] shadow-sm"
                                  />
                                )}
                                <span className="relative z-10">
                                  {cap.title.split(' ').slice(0, 2).join(' ')}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-2xl border border-[var(--velvet-border)]/80 bg-[var(--velvet-bg)]/75 p-4">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeCap.id}
                              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-display text-sm font-bold text-[var(--velvet-text)]">
                                  {activeCap.title}
                                </p>
                                <span
                                  dir="ltr"
                                  className="font-numeric text-xs font-bold"
                                  style={{ color: activeCap.accentHex }}
                                >
                                  {activeCap.index}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--velvet-muted)]">
                                {activeCap.description}
                              </p>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Release Specs Strip with Spring Hover Micro-Lift */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          aria-label="مواصفات الإصدار الحالي"
          className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6"
        >
          <div className="lux-card grid grid-cols-2 gap-6 rounded-3xl p-6 sm:grid-cols-4 sm:p-7">
            {[
              {
                icon: Layers,
                iconColor: 'text-[var(--velvet-gold)]',
                label: 'الإصدار الحالي',
                value: `v${settings.version}`,
                dir: 'ltr' as const,
                testId: 'live-app-version',
                sizeClass: 'text-2xl sm:text-3xl font-numeric',
              },
              {
                icon: HardDrive,
                iconColor: 'text-[var(--velvet-sky)]',
                label: 'حجم ملف الـ APK',
                value: settings.fileSizeLabel,
                dir: 'ltr' as const,
                testId: 'live-app-size',
                sizeClass: 'text-2xl sm:text-3xl font-numeric',
              },
              {
                icon: Smartphone,
                iconColor: 'text-[var(--velvet-emerald)]',
                label: 'نظام التشغيل',
                value: settings.minAndroid,
                dir: 'ltr' as const,
                sizeClass: 'text-xl sm:text-2xl font-numeric',
              },
              {
                icon: ShieldCheck,
                iconColor: 'text-[var(--velvet-gold)]',
                label: 'الخصوصية',
                value: 'مجاني · بدون نت',
                dir: 'rtl' as const,
                sizeClass: 'text-base sm:text-lg font-display',
              },
            ].map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -2 }}
                  transition={{
                    duration: 0.32,
                    delay: idx * 0.06,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--velvet-muted)]">
                    <Icon className={`h-4 w-4 ${spec.iconColor}`} aria-hidden="true" />
                    <span>{spec.label}</span>
                  </div>
                  <p
                    dir={spec.dir}
                    data-testid={spec.testId}
                    className={`font-bold text-[var(--velvet-text)] ${
                      spec.dir === 'ltr' ? 'text-right' : ''
                    } ${spec.sizeClass}`}
                  >
                    {spec.value}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Kinetic Capabilities Marquee Band */}
        <section
          aria-label="شريط مميزات التطبيق المتحرك"
          className="marquee-wrapper relative mx-auto mt-14 max-w-6xl overflow-hidden px-4 sm:px-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[var(--velvet-border)]/80 bg-[var(--velvet-surface)]/55 py-3">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--velvet-bg)] to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--velvet-bg)] to-transparent"
            />

            <div className="animate-marquee-rtl items-center">
              {[0, 1].map((dupIdx) => (
                <div
                  key={dupIdx}
                  aria-hidden={dupIdx === 1}
                  className="flex shrink-0 items-center gap-8 pl-8"
                >
                  {marqueeItems.map((item) => (
                    <Link
                      key={`${dupIdx}-${item.index}`}
                      href="/features"
                      tabIndex={dupIdx === 1 ? -1 : undefined}
                      className="inline-flex items-center gap-2.5 text-xs font-semibold text-[var(--velvet-muted)] transition-colors hover:text-[var(--velvet-text)] whitespace-nowrap"
                    >
                      <span
                        dir="ltr"
                        className="font-numeric text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        {item.index}
                      </span>
                      <span>{item.title}</span>
                      <span className="mr-4 text-[var(--velvet-border)]" aria-hidden="true">
                        ✦
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3D-Tilt Interactive Exploration Portals */}
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
                />
                <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)] sm:text-3xl">
                  استكشف كل جزء لوحده براحتك
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
                قسّمنالك الموقع لصفحات هادية ومترتبة عشان توصل للي محتاجه بسرعة ومن غير زحمة.
              </p>
            </div>

            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--velvet-gold)] transition-colors hover:underline whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>افتح الدليل الكامل والأذونات</span>
            </Link>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                href: '/features',
                index: '01',
                title: 'مميزات النجيب',
                desc: `اتعرّف على ${capabilities.length} أنظمة متكاملة جوا التطبيق — من المكتبة الهرمية والسبورة الذكية لدرع التركيز.`,
                cta: 'استعراض المميزات',
                hex: '#F0C97A',
                colorClass: 'text-[var(--velvet-gold)]',
                borderHover: 'hover:border-[var(--velvet-gold)]/55',
                icon: Compass,
              },
              {
                href: '/install',
                index: '02',
                title: 'طريقة التثبيت والتحديثات',
                desc: `مشيّ خطوة بخطوة في ${installStepsCount} خطوات بسيطة لتثبيت حزمة الـ APK وشوف إيه الجديد في الإصدار ده.`,
                cta: 'افتح خطوات التثبيت',
                hex: '#7AD7F0',
                colorClass: 'text-[var(--velvet-sky)]',
                borderHover: 'hover:border-[var(--velvet-sky)]/55',
                icon: Smartphone,
              },
              {
                href: '/opinions',
                index: '03',
                title: 'آراء الطلاب وتجاربهم',
                desc:
                  opinionsCount > 0
                    ? `اقرأ ${opinionsCount} تجربة حقيقية من طلاب استخدموا التطبيق، أو شاركنا رأيك واقتراحك.`
                    : 'شاركنا تجربتك الحقيقية مع التطبيق واكتب أي اقتراح تحب تشوفه في التحديثات الجاية.',
                cta: 'شوف الآراء أو ضيف رأيك',
                hex: '#72D99B',
                colorClass: 'text-[var(--velvet-emerald)]',
                borderHover: 'hover:border-[var(--velvet-emerald)]/55',
                icon: MessageSquareText,
              },
            ].map((portal, idx) => {
              const Icon = portal.icon;
              return (
                <SpotlightCard
                  key={portal.href}
                  accentHex={portal.hex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.42,
                    delay: idx * 0.08,
                    ease: EASE_OUT_EXPO,
                  }}
                  className={`rounded-3xl p-7 ${portal.borderHover}`}
                >
                  <Link href={portal.href} className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          dir="ltr"
                          className={`font-numeric text-sm font-bold ${portal.colorClass}`}
                        >
                          {portal.index}
                        </span>
                        <motion.span
                          className="inline-flex"
                          whileHover={{ rotate: 12, scale: 1.15 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                        >
                          <Icon className={`h-5 w-5 ${portal.colorClass}`} aria-hidden="true" />
                        </motion.span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-[var(--velvet-text)]">
                        {portal.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--velvet-muted)]">
                        {portal.desc}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-2 text-sm font-bold ${portal.colorClass}`}>
                      <span>{portal.cta}</span>
                      <ArrowLeft
                        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </SpotlightCard>
              );
            })}
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}
