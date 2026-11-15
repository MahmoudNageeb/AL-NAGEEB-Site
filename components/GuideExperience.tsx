'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Shield } from 'lucide-react';
import guideArchImg from '@/src/assets/images/guide_focus_architecture_1794609936442.jpg';
import {
  ANDROID_PERMISSIONS,
  GUIDE_FAQS,
  GUIDE_WORKFLOW_STEPS,
  type AppCapability,
  type AppReleaseMeta,
  type ChangelogEntry,
} from '@/lib/study-app-data';
import { DownloadCtaButton } from './DownloadCtaButton';
import { SpotlightCard } from './SpotlightCard';

interface GuideExperienceProps {
  settings: AppReleaseMeta;
  capabilities: AppCapability[];
  changelog: ChangelogEntry[];
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function GuideExperience({
  settings,
  capabilities,
  changelog,
}: GuideExperienceProps) {
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>(
    capabilities[0]?.id ?? 'focus-os',
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const selectedCapability =
    capabilities.find((c) => c.id === selectedCapabilityId) ?? capabilities[0];

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        {/* Breadcrumb Back Link */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--velvet-muted)] transition-colors hover:text-[var(--velvet-gold)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>الرجوع للرئيسية</span>
          </Link>
        </motion.div>

        {/* Editorial Guide Header with Rotating Border Beam */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="relative overflow-hidden rounded-[2rem] p-[1.5px]"
        >
          <div
            aria-hidden="true"
            className="animate-beam-spin pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_255deg,#F0C97A_310deg,#7AD7F0_345deg,transparent_360deg)] opacity-60"
          />

          <div className="relative rounded-[calc(2rem-1.5px)] bg-[var(--velvet-bg)]">
            <div className="lux-card relative overflow-hidden rounded-[calc(2rem-1.5px)]">
            <div className="grid items-stretch lg:grid-cols-12">
              <div className="flex flex-col justify-center space-y-5 p-6 sm:p-10 lg:col-span-7">
                <p className="text-xs font-semibold text-[var(--velvet-gold)]">
                  دليل الاستخدام الكامل · إصدار{' '}
                  <span dir="ltr" className="inline-block font-numeric">
                    v{settings.version}
                  </span>{' '}
                  ·{' '}
                  <span dir="ltr" className="inline-block font-numeric">
                    {settings.fileSizeLabel}
                  </span>
                </p>
                <h1
                  className="font-display font-extrabold leading-tight text-[var(--velvet-text)]"
                  style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)' }}
                >
                  ازاي تستخدم تطبيق {settings.name} من أول التثبيت لحد روتينك اليومي
                </h1>
                <p className="text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
                  النجيب بيحل مشكلة تشتتك بين تطبيقات النوتس، ملفات الـ PDF الضايعة، مؤقتات البومودورو المنفصلة، وتطبيقات السوشيال — كلهم اتجمعوا في نظام واحد شغّال على موبايلك بالكامل من غير نت.
                </p>
                <div className="pt-1">
                  <DownloadCtaButton
                    version={settings.version}
                    fileSizeLabel={settings.fileSizeLabel}
                    variant="compact"
                  />
                </div>
              </div>

              <div className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-[#141B27] to-[#080B11] lg:col-span-5">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative h-full w-full min-h-[240px]"
                >
                  <Image
                    src={guideArchImg}
                    alt="بيئة مذاكرة هادئة بتصميم النجيب"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </motion.div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                />
                <div className="absolute inset-x-6 bottom-5 text-xs font-medium text-[#F6F3EC]">
                  ترتيب المواد · مؤقت المذاكرة · قفل التطبيقات المشتتة
                </div>
              </div>
            </div>
            </div>
          </div>
        </motion.section>

        {/* Workflow Steps 01 -> 04 */}
        <section className="pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
            className="mb-8 flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
            />
            <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
              خطوات يومك مع التطبيق
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDE_WORKFLOW_STEPS.map((item, idx) => (
              <SpotlightCard
                key={item.step}
                accentHex="#F0C97A"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.36,
                  delay: Math.min(idx * 0.06, 0.24),
                  ease: EASE_OUT_EXPO,
                }}
                className="rounded-2xl p-6"
              >
                <span
                  dir="ltr"
                  className="inline-block font-numeric text-lg font-bold text-[var(--velvet-gold)]"
                >
                  {item.step}
                </span>
                <h3 className="mt-2 font-display text-base font-bold text-[var(--velvet-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--velvet-muted)]">
                  {item.detail}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Interactive Detailed Module Explorer */}
        {selectedCapability && (
          <section className="pt-20">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
              className="mb-8 flex items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
              />
              <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
                شرح مفصل لكل نظام جوا التطبيق
              </h2>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div
                className="flex flex-col gap-2 lg:col-span-4"
                role="tablist"
                aria-label="أنظمة تطبيق النجيب"
              >
                {capabilities.map((cap) => {
                  const active = cap.id === selectedCapability.id;
                  return (
                    <motion.button
                      key={cap.dbId ?? cap.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSelectedCapabilityId(cap.id)}
                      className={`relative flex items-center justify-between rounded-2xl border px-4 py-3.5 text-right transition-colors ${
                        active
                          ? 'border-[var(--velvet-gold)] text-[var(--velvet-text)]'
                          : 'border-[var(--velvet-border)] bg-[var(--velvet-surface)] text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="guide-cap-active"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-2xl bg-[var(--velvet-surface-high)]"
                        />
                      )}
                      <span className="relative z-10 font-display text-sm font-bold">
                        {cap.title}
                      </span>
                      <span
                        dir="ltr"
                        className="relative z-10 font-numeric text-xs font-bold"
                        style={{ color: cap.accentHex }}
                      >
                        {cap.index}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="lux-card rounded-3xl p-6 sm:p-8 lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCapability.id}
                    initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
                    transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <p
                        className="text-xs font-bold"
                        style={{ color: selectedCapability.accentHex }}
                      >
                        <span dir="ltr" className="inline-block font-numeric">
                          {selectedCapability.index}
                        </span>{' '}
                        · {selectedCapability.subtitle}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
                        {selectedCapability.title}
                      </h3>
                    </div>

                    <p className="text-base leading-relaxed text-[var(--velvet-muted)]">
                      {selectedCapability.description}
                    </p>

                    <ul className="space-y-3 border-t border-[var(--velvet-border)] pt-5">
                      {selectedCapability.highlights.map((h, idx) => (
                        <motion.li
                          key={h}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.24,
                            delay: 0.04 + idx * 0.04,
                            ease: EASE_OUT_EXPO,
                          }}
                          className="flex items-start gap-3 text-sm font-medium text-[var(--velvet-text)]"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: selectedCapability.accentHex }}
                            aria-hidden="true"
                          />
                          <span>{h}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* System Requirements & Android Permissions Table */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="pt-20"
        >
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
              />
              <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
                متطلبات التشغيل وأذونات الأندرويد
              </h2>
            </div>
            <p className="text-sm text-[var(--velvet-muted)]">
              أقل نظام تشغيل مطلوب:{' '}
              <span dir="ltr" className="inline-block font-numeric">
                {settings.minAndroid}
              </span>{' '}
              (API {settings.minSdk}) · هدف التوافق: API {settings.targetSdk}. كل الأذونات دي بتشتغل محلياً على موبايلك وبس.
            </p>
          </div>

          <div className="lux-card overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-[var(--velvet-border)] bg-[var(--velvet-surface-high)]/60 text-xs font-bold text-[var(--velvet-text)]">
                    <th className="px-5 py-4">الإذن</th>
                    <th className="px-5 py-4">الميزة المرتبطة بيه</th>
                    <th className="px-5 py-4">بنحتاجه ليه وإيه الضمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--velvet-border)]/70">
                  {ANDROID_PERMISSIONS.map((perm) => (
                    <tr
                      key={perm.permission}
                      className="align-top transition-colors hover:bg-[var(--velvet-surface-high)]/35"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-display font-bold text-[var(--velvet-text)]">
                          <Shield
                            className="h-4 w-4 shrink-0 text-[var(--velvet-gold)]"
                            aria-hidden="true"
                          />
                          <span>{perm.arabicTitle}</span>
                        </div>
                        <p className="mt-1 font-numeric text-[11px] text-[var(--velvet-muted)]">
                          {perm.permission}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[var(--velvet-text)] whitespace-nowrap">
                        {perm.requiredFor}
                      </td>
                      <td className="px-5 py-4 leading-relaxed text-[var(--velvet-muted)]">
                        {perm.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Dynamic Changelog */}
        <section className="pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
            className="mb-8 flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
            />
            <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
              سجل الإصدارات والتحديثات
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {changelog.map((entry, idx) => (
              <SpotlightCard
                key={entry.id ?? entry.version}
                accentHex="#7AD7F0"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.38,
                  delay: Math.min(idx * 0.06, 0.24),
                  ease: EASE_OUT_EXPO,
                }}
                className="rounded-3xl p-6"
              >
                <div className="flex items-center justify-between">
                  <span
                    dir="ltr"
                    className="font-numeric text-base font-bold text-[var(--velvet-gold)]"
                  >
                    {entry.version}
                  </span>
                  <span className="text-xs text-[var(--velvet-muted)]">
                    {entry.date}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[var(--velvet-text)]">
                  {entry.headline}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-[var(--velvet-muted)]">
                  {entry.changes.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Check
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--velvet-emerald)]"
                        aria-hidden="true"
                      />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Animated FAQ Accordion with Smooth Height Reveal */}
        <section className="pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
            className="mb-8 flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
            />
            <h2 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
              أسئلة بتدور في بالك
            </h2>
          </motion.div>

          <div className="space-y-3">
            {GUIDE_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className={`lux-card overflow-hidden rounded-2xl transition-colors ${
                    isOpen ? 'border-[var(--velvet-gold)]/55' : ''
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-right font-display text-base font-bold text-[var(--velvet-text)] transition-colors hover:text-[var(--velvet-gold)]"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[var(--velvet-gold)] transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--velvet-border)]/70 px-6 pb-5 pt-3 text-sm leading-relaxed text-[var(--velvet-muted)]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}

