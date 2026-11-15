'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { AppCapability, AppReleaseMeta } from '@/lib/study-app-data';
import { DownloadCtaButton } from './DownloadCtaButton';
import { SpotlightCard } from './SpotlightCard';

interface FeaturesExperienceProps {
  settings: AppReleaseMeta;
  capabilities: AppCapability[];
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function FeaturesExperience({
  settings,
  capabilities,
}: FeaturesExperienceProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    capabilities[0]?.id ?? '',
  );

  const filteredCapabilities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return capabilities;
    return capabilities.filter(
      (cap) =>
        cap.title.toLowerCase().includes(q) ||
        cap.subtitle.toLowerCase().includes(q) ||
        cap.description.toLowerCase().includes(q) ||
        cap.highlights.some((h) => h.toLowerCase().includes(q)),
    );
  }, [capabilities, query]);

  const selected =
    filteredCapabilities.find((cap) => cap.id === selectedId) ??
    filteredCapabilities[0] ??
    capabilities[0] ??
    null;

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6">
        {/* Top Navigation Back */}
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
            href="/install"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--velvet-gold)] transition-colors hover:underline"
          >
            <span>جاهز للتثبيت؟ شوف الخطوات</span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* Page Header + Raycast-Inspired Quick Search */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-6 border-b border-[var(--velvet-border)]/80 pb-10 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--velvet-gold)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                إصدار{' '}
                <span dir="ltr" className="inline-block font-numeric">
                  v{settings.version}
                </span>{' '}
                · {capabilities.length} أنظمة متكاملة
              </span>
            </div>
            <h1
              className="font-display font-extrabold leading-tight text-[var(--velvet-text)]"
              style={{ fontSize: 'clamp(1.9rem, 3.3vw, 2.85rem)' }}
            >
              كل أدوات المذاكرة اللي محتاجها في مكان واحد
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
              كل ميزة جوا النجيب معمولة عشان تشتغل مع التانية بهدوء — تذاكر من المكتبة، تلخّص على السبورة، وتتابع التزامك من غير أي تشتيت.
            </p>
          </div>

          {/* Raycast-style Command Filter Input */}
          <div className="w-full max-w-sm shrink-0">
            <label htmlFor="features-quick-search" className="sr-only">
              ابحث في مميزات التطبيق
            </label>
            <div className="relative flex items-center rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)]/90 shadow-sm transition-colors focus-within:border-[var(--velvet-gold)]">
              <Search
                className="pointer-events-none mr-3.5 h-4 w-4 shrink-0 text-[var(--velvet-gold)]"
                aria-hidden="true"
              />
              <input
                id="features-quick-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="دوّر بسرعة في المميزات (سبورة، PDF، بومودورو...)"
                className="w-full bg-transparent px-3 py-3 text-xs text-[var(--velvet-text)] placeholder:text-[var(--velvet-muted)]/65 focus:outline-none sm:text-sm"
              />
              <AnimatePresence>
                {query.trim().length > 0 && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery('')}
                    aria-label="امسح البحث"
                    className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--velvet-muted)] transition-colors hover:bg-[var(--velvet-surface-high)] hover:text-[var(--velvet-text)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* Interactive Focus Stage with Rotating Border Beam */}
        {selected && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
            aria-label="معاينة الميزة المختارة"
            className="pt-10"
          >
            <div className="relative overflow-hidden rounded-[2rem] p-[1.5px]">
              <div
                aria-hidden="true"
                className="animate-beam-spin pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_265deg,#F0C97A_315deg,#7AD7F0_345deg,transparent_360deg)] opacity-55"
              />

              <div className="relative rounded-[calc(2rem-1.5px)] bg-[var(--velvet-bg)]">
                <div className="lux-card relative overflow-hidden rounded-[calc(2rem-1.5px)] p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
                  {/* Selector Tabs */}
                  <div
                    role="tablist"
                    aria-label="اختار نظام للتفاصيل"
                    className="flex flex-col gap-2 lg:col-span-5"
                  >
                    {capabilities.map((cap) => {
                      const isSelected = cap.id === selected.id;
                      const isMatched =
                        !query.trim() ||
                        filteredCapabilities.some((item) => item.id === cap.id);

                      return (
                        <motion.button
                          key={cap.dbId ?? cap.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setSelectedId(cap.id)}
                          whileHover={{ x: -3 }}
                          whileTap={{ scale: 0.985 }}
                          className={`relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right transition-all ${
                            isSelected
                              ? 'border-[var(--velvet-gold)]/75 text-[var(--velvet-text)]'
                              : 'border-[var(--velvet-border)] bg-[var(--velvet-bg)]/60 text-[var(--velvet-muted)] hover:border-[var(--velvet-gold)]/40 hover:text-[var(--velvet-text)]'
                          } ${isMatched ? 'opacity-100' : 'opacity-45'}`}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="features-active-rail"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-2xl bg-[var(--velvet-surface-high)]/85 shadow-sm"
                            >
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-2.5 right-1 w-[3px] rounded-full"
                                style={{ backgroundColor: cap.accentHex }}
                              />
                            </motion.span>
                          )}
                          <span className="relative z-10 pr-2 font-display text-sm font-bold">
                            {cap.title}
                          </span>
                          <span
                            dir="ltr"
                            className="relative z-10 shrink-0 font-numeric text-xs font-bold"
                            style={{ color: cap.accentHex }}
                          >
                            {cap.index}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Animated Detail View */}
                  <div className="rounded-2xl border border-[var(--velvet-border)]/80 bg-[var(--velvet-bg)]/75 p-6 sm:p-7 lg:col-span-7">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                        className="space-y-5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className="text-xs font-bold"
                              style={{ color: selected.accentHex }}
                            >
                              <span dir="ltr" className="inline-block font-numeric">
                                {selected.index}
                              </span>{' '}
                              · {selected.subtitle}
                            </p>
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: selected.accentHex,
                                boxShadow: `0 0 12px ${selected.accentHex}`,
                              }}
                            />
                          </div>
                          <h2 className="font-display text-2xl font-extrabold text-[var(--velvet-text)]">
                            {selected.title}
                          </h2>
                        </div>

                        <p className="text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
                          {selected.description}
                        </p>

                        {selected.highlights.length > 0 && (
                          <ul className="space-y-3 border-t border-[var(--velvet-border)]/80 pt-5">
                            {selected.highlights.map((bullet, bIdx) => (
                              <motion.li
                                key={bullet}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.25,
                                  delay: 0.04 + bIdx * 0.04,
                                  ease: EASE_OUT_EXPO,
                                }}
                                className="flex items-start gap-3 text-sm font-medium text-[var(--velvet-text)]"
                              >
                                <Check
                                  className="mt-0.5 h-4 w-4 shrink-0"
                                  style={{ color: selected.accentHex }}
                                  aria-hidden="true"
                                />
                                <span>{bullet}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* 3D-Tilt Bento Overview with Live Filtered Grid */}
        <section aria-label="كروت كل المميزات" className="pt-14">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-[var(--velvet-gold)]" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-[var(--velvet-text)] sm:text-2xl">
                نظرة سريعة على باقي الأنظمة
              </h2>
            </div>

            {query.trim() && (
              <span className="font-numeric text-xs font-semibold text-[var(--velvet-gold)]">
                {filteredCapabilities.length} نتيجة مطابقة
              </span>
            )}
          </div>

          {filteredCapabilities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lux-card flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center"
            >
              <Search
                className="mb-3 h-7 w-7 text-[var(--velvet-gold)]/70"
                aria-hidden="true"
              />
              <h3 className="font-display text-base font-bold text-[var(--velvet-text)]">
                ملقيناش ميزة بالاسم ده
              </h3>
              <p className="mt-1.5 text-sm text-[var(--velvet-muted)]">
                جرّب كلمة تانية زي &quot;سبورة&quot; أو &quot;مؤقت&quot; أو اعرض كل المميزات.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 rounded-xl border border-[var(--velvet-gold)]/60 bg-[var(--velvet-gold)]/15 px-4 py-2 text-xs font-bold text-[var(--velvet-gold)] transition-colors hover:bg-[var(--velvet-gold)]/25"
              >
                اعرض كل المميزات
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredCapabilities.map((cap, idx) => {
                  const isActiveCard = selected?.id === cap.id;
                  return (
                    <SpotlightCard
                      layout
                      key={cap.dbId ?? cap.id}
                      accentHex={cap.accentHex}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{
                        duration: 0.36,
                        delay: Math.min(idx * 0.05, 0.25),
                        ease: EASE_OUT_EXPO,
                      }}
                      onClick={() => setSelectedId(cap.id)}
                      className={`cursor-pointer rounded-3xl p-6 sm:p-7 ${
                        cap.spanWide && !query.trim() ? 'md:col-span-2' : 'md:col-span-1'
                      } ${
                        isActiveCard
                          ? 'border-[var(--velvet-gold)]/60 shadow-[0_18px_40px_-22px_rgba(240,201,122,0.4)]'
                          : 'hover:border-[var(--velvet-gold)]/45'
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-4">
                            <span
                              dir="ltr"
                              className="font-numeric text-sm font-bold"
                              style={{ color: cap.accentHex }}
                            >
                              {cap.index}
                            </span>
                            <span className="text-xs font-medium text-[var(--velvet-muted)]">
                              {cap.subtitle}
                            </span>
                          </div>

                          <div
                            aria-hidden="true"
                            className={`mt-3 h-[2px] origin-right rounded-full transition-all duration-300 ${
                              isActiveCard ? 'w-20' : 'w-10 group-hover:w-20'
                            }`}
                            style={{ backgroundColor: cap.accentHex }}
                          />

                          <h3 className="mt-3 font-display text-xl font-bold text-[var(--velvet-text)]">
                            {cap.title}
                          </h3>

                          <p className="mt-2.5 text-sm leading-relaxed text-[var(--velvet-muted)]">
                            {cap.description}
                          </p>
                        </div>

                        {cap.highlights.length > 0 && (
                          <ul className="mt-5 space-y-2 border-t border-[var(--velvet-border)]/70 pt-4">
                            {cap.highlights.map((bullet) => (
                              <li
                                key={bullet}
                                className="flex items-start gap-2.5 text-xs font-medium text-[var(--velvet-text)]/90"
                              >
                                <Check
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                  style={{ color: cap.accentHex }}
                                  aria-hidden="true"
                                />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </SpotlightCard>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Bottom Quiet Conversion Strip */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="pt-14"
        >
          <SpotlightCard
            accentHex="#F0C97A"
            tilt3D={false}
            className="rounded-3xl p-7 sm:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-bold text-[var(--velvet-text)]">
                  عاجبك النظام؟ جربه دلوقتي على موبايلك
                </h2>
                <p className="text-sm text-[var(--velvet-muted)]">
                  مجاني بالكامل ومن غير أي حساب — حملّه وابدأ ترتّب مذاكرتك في دقيقتين.
                </p>
              </div>
              <DownloadCtaButton
                version={settings.version}
                fileSizeLabel={settings.fileSizeLabel}
                variant="compact"
              />
            </div>
          </SpotlightCard>
        </motion.section>
      </main>
    </MotionConfig>
  );
}

