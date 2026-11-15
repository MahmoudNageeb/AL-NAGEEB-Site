'use client';

import React, { useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
  ShieldCheck,
  X,
  ZoomIn,
} from 'lucide-react';
import step1Img from '@/public/assets/aistudio/Screenshot_20261108_190908_com_android_vending_MainActivity_edit_1524954844162071_0a3a842a.jpg';
import step2Img from '@/public/assets/aistudio/Screenshot_20261108_190915_com_android_vending_MainActivity_edit_1525218369577178_8c4e7838.jpg';
import step3Img from '@/public/assets/aistudio/Screenshot_20261108_190920_com_android_vending_MainActivity_edit_1525102058035452_06e0f7d0.jpg';
import step4Img from '@/public/assets/aistudio/Screenshot_20261108_190938_com_android_vending_MainActivity_edit_1525136378332522_3536f64f.jpg';
import { SpotlightCard } from './SpotlightCard';

interface PlayProtectStep {
  order: string;
  title: string;
  description: string;
  image: StaticImageData;
  alt: string;
  accentHex: string;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PLAY_PROTECT_STEPS: PlayProtectStep[] = [
  {
    order: '01',
    title: 'افتح متجر Google Play واضغط على صورتك فوق',
    description: 'اضغط على الدائرة بتاعة حسابك في الزاوية زي ما السهم بيشاور.',
    image: step1Img,
    alt: 'الخطوة 1: الضغط على صورة الحساب في أعلى متجر Google Play',
    accentHex: '#7AD7F0',
  },
  {
    order: '02',
    title: 'اختار Play Protect من القائمة',
    description: 'انزل تحت في القائمة واضغط على Play Protect (أو الحماية من Play).',
    image: step2Img,
    alt: 'الخطوة 2: اختيار Play Protect من أسفل قائمة الحساب',
    accentHex: '#F0C97A',
  },
  {
    order: '03',
    title: 'اضغط على علامة الترس فوق',
    description: 'افتح الإعدادات من أيقونة الترس الموجودة في الزاوية على اليمين.',
    image: step3Img,
    alt: 'الخطوة 3: الضغط على علامة الترس في أعلى صفحة Play Protect',
    accentHex: '#C7A4FF',
  },
  {
    order: '04',
    title: 'اقفل الزرارين دول مؤقتاً',
    description:
      'وقّف الوضعين دول مؤقتاً عشان التطبيق يتثبت معاك — وبعد ما ينزل ارجع شغّلهم تاني.',
    image: step4Img,
    alt: 'الخطوة 4: إيقاف تفعيل الوضعين في إعدادات Play Protect مؤقتاً',
    accentHex: '#72D99B',
  },
];

export function PlayProtectGuide() {
  const [zoomedStep, setZoomedStep] = useState<PlayProtectStep | null>(null);
  const [reEnabledConfirmed, setReEnabledConfirmed] = useState(false);

  return (
    <section
      id="play-protect-guide"
      aria-label="شرح إيقاف Google Play Protect مؤقتاً بالصور"
      className="mt-14 scroll-mt-32 space-y-8"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.46, ease: EASE_OUT_EXPO }}
        className="flex flex-col gap-4 border-t border-[var(--velvet-border)]/80 pt-12 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--velvet-gold)]">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span>حل تحذير التثبيت في ثواني (بالصور)</span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--velvet-text)] sm:text-3xl">
            لو ظهرلك تحذير Play Protect وقت التثبيت
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
            امشي مع الأسهم في الـ 4 صور بالترتيب، اقفل الوضعين مؤقتاً لحد ما التطبيق ينزل،{' '}
            <strong className="text-[var(--velvet-text)]">وبعد التثبيت ارجع فعّلهم تاني.</strong>
          </p>
        </div>

        <span className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--velvet-muted)] md:self-auto whitespace-nowrap">
          <Eye className="h-3.5 w-3.5 text-[var(--velvet-gold)]" aria-hidden="true" />
          <span>اضغط على أي صورة للتكبير</span>
        </span>
      </motion.div>

      {/* 4 Annotated Screenshot Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {PLAY_PROTECT_STEPS.map((step, idx) => (
          <SpotlightCard
            key={step.order}
            accentHex={step.accentHex}
            tilt3D={false}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.4,
              delay: Math.min(idx * 0.08, 0.25),
              ease: EASE_OUT_EXPO,
            }}
            className="rounded-3xl p-4 sm:p-5 hover:border-[var(--velvet-gold)]/50"
          >
            <div className="space-y-4">
              {/* Screenshot Thumbnail */}
              <button
                type="button"
                onClick={() => setZoomedStep(step)}
                aria-label={`تكبير ${step.alt}`}
                className="group/img relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--velvet-border)] bg-[#0C0F14] text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)]"
              >
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-contain transition-transform duration-500 group-hover/img:scale-[1.02]"
                />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm transition-transform group-hover/img:scale-105">
                  <ZoomIn className="h-3.5 w-3.5 text-[#F0C97A]" aria-hidden="true" />
                  <span>كبّر الصورة</span>
                </span>
              </button>

              {/* Simple Explanation Directly Underneath Image */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center gap-2.5">
                  <span
                    dir="ltr"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--velvet-border)] bg-[var(--velvet-bg)] font-numeric text-xs font-bold"
                    style={{ color: step.accentHex }}
                  >
                    {step.order}
                  </span>
                  <h3 className="font-display text-base font-bold text-[var(--velvet-text)] sm:text-lg">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--velvet-muted)]">
                  {step.description}
                </p>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Important Reminder Banner: Re-Enable Protection After Installing */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 transition-colors duration-300 ${
          reEnabledConfirmed
            ? 'border-[var(--velvet-emerald)]/65 bg-[var(--velvet-emerald)]/10 shadow-[0_18px_40px_-24px_rgba(114,217,155,0.45)]'
            : 'border-[var(--velvet-gold)]/60 bg-[var(--velvet-gold)]/10 shadow-[0_18px_40px_-24px_rgba(240,201,122,0.4)]'
        }`}
      >
        <span
          aria-hidden="true"
          className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                reEnabledConfirmed
                  ? 'border-[var(--velvet-emerald)]/50 bg-[var(--velvet-emerald)]/15 text-[var(--velvet-emerald)]'
                  : 'border-[var(--velvet-gold)]/50 bg-[var(--velvet-gold)]/15 text-[var(--velvet-gold)]'
              }`}
            >
              {reEnabledConfirmed ? (
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              )}
            </motion.div>

            <div className="space-y-1.5">
              <p
                className={`text-xs font-bold ${
                  reEnabledConfirmed
                    ? 'text-[var(--velvet-emerald)]'
                    : 'text-[var(--velvet-gold)]'
                }`}
              >
                {reEnabledConfirmed
                  ? 'عاش! حماية موبايلك رجعت شغّالة تاني بالكامل'
                  : 'تنبيه مهم بعد التثبيت'}
              </p>
              <h3 className="font-display text-lg font-extrabold text-[var(--velvet-text)] sm:text-xl">
                متنساش ترجّع تشغّل الوضعين تاني بعد ما التطبيق ينزل
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)]">
                بعد ما تثبّت تطبيق النجيب، افتح نفس الصفحة في الصورة رقم 4 وشغّل الزرارين من تاني عشان يفضل موبايلك محمي طول الوقت.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setReEnabledConfirmed((prev) => !prev)}
            aria-pressed={reEnabledConfirmed}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-5 py-3 font-display text-xs font-bold transition-colors whitespace-nowrap sm:text-sm ${
              reEnabledConfirmed
                ? 'border-[var(--velvet-emerald)] bg-[var(--velvet-emerald)] text-[#08150D]'
                : 'border-[var(--velvet-gold)] bg-[var(--velvet-bg)] text-[var(--velvet-text)] hover:bg-[var(--velvet-gold)] hover:text-[#1A1408]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>
              {reEnabledConfirmed
                ? 'تمام، رجّعت تفعيل الحماية'
                : 'تم التثبيت ورجّعتهم تاني'}
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Lightbox Image Modal */}
      <AnimatePresence>
        {zoomedStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={zoomedStep.title}
            onClick={() => setZoomedStep(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="lux-card relative w-full max-w-4xl overflow-hidden rounded-3xl p-4 sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    dir="ltr"
                    className="font-numeric text-sm font-bold"
                    style={{ color: zoomedStep.accentHex }}
                  >
                    {zoomedStep.order}
                  </span>
                  <h4 className="font-display text-base font-bold text-[var(--velvet-text)] sm:text-lg">
                    {zoomedStep.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedStep(null)}
                  aria-label="إغلاق الصورة المكبرة"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] text-[var(--velvet-text)] transition-colors hover:border-[var(--velvet-gold)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--velvet-border)] bg-[#0C0F14]">
                <Image
                  src={zoomedStep.image}
                  alt={zoomedStep.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 896px"
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[var(--velvet-muted)] sm:text-sm">
                {zoomedStep.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
