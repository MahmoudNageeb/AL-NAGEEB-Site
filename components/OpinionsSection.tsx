'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  Pin,
  Search,
  ThumbsUp,
} from 'lucide-react';
import { submitOpinionAction, voteHelpfulAction } from '@/app/actions';
import {
  filterAndSortOpinions,
  validateOpinionInput,
  type OpinionItem,
  type OpinionSortOption,
} from '@/lib/reviews-logic';
import type { ActiveSession } from '@/lib/session';
import { MagneticWrap } from './MagneticButton';
import { SpotlightCard } from './SpotlightCard';

interface OpinionsSectionProps {
  initialOpinions: OpinionItem[];
  dbConnected: boolean;
  session?: ActiveSession | null;
  standalonePage?: boolean;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function OpinionsSection({
  initialOpinions,
  dbConnected,
  session = null,
  standalonePage = true,
}: OpinionsSectionProps) {
  const router = useRouter();
  const [opinions, setOpinions] = useState<OpinionItem[]>(initialOpinions);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<OpinionSortOption>('newest');

  const [authorName, setAuthorName] = useState(session?.fullName ?? '');
  const [authorRole, setAuthorRole] = useState('');
  const [comment, setComment] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    authorName?: string;
    authorRole?: string;
    comment?: string;
  }>({});
  const [formBanner, setFormBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isSubmitting, startSubmit] = useTransition();
  const [votingId, setVotingId] = useState<number | null>(null);
  const [burstVoteId, setBurstVoteId] = useState<number | null>(null);

  const visibleOpinions = useMemo(
    () => filterAndSortOpinions(opinions, searchQuery, sortBy),
    [opinions, searchQuery, sortBy],
  );

  const handleOpinionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormBanner(null);

    const check = validateOpinionInput({ authorName, authorRole, comment });
    if (!check.valid) {
      setFieldErrors(check.errors);
      return;
    }

    setFieldErrors({});
    startSubmit(async () => {
      const res = await submitOpinionAction({ authorName, authorRole, comment });
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setFormBanner({ type: 'error', text: res.message });
        return;
      }

      if (res.opinion) {
        setOpinions((prev) => [res.opinion!, ...prev]);
      }
      if (!session) {
        setAuthorName('');
      }
      setAuthorRole('');
      setComment('');
      setFormBanner({ type: 'success', text: res.message });
      router.refresh();
    });
  };

  const handleVoteHelpful = async (opinionId: number) => {
    if (votingId !== null) return;
    setVotingId(opinionId);
    try {
      const res = await voteHelpfulAction(opinionId);
      if (res.ok && typeof res.helpfulCount === 'number') {
        setOpinions((prev) =>
          prev.map((item) =>
            item.id === opinionId
              ? {
                  ...item,
                  helpfulCount: res.helpfulCount!,
                  hasVoted: res.hasVoted,
                }
              : item,
          ),
        );
        if (res.hasVoted) {
          setBurstVoteId(opinionId);
          setTimeout(() => setBurstVoteId((curr) => (curr === opinionId ? null : curr)), 700);
        }
        router.refresh();
      } else if (res.message) {
        setFormBanner({ type: 'error', text: res.message });
      }
    } finally {
      setVotingId(null);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="opinions"
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
              href="/install"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--velvet-gold)] transition-colors hover:underline"
            >
              <span>حمّل التطبيق وثبّته</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
          className="mb-10 flex flex-col gap-3 border-b border-[var(--velvet-border)]/80 pb-8 md:flex-row md:items-end md:justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-6 w-1 rounded-full bg-gradient-to-b from-[#FFF4D2] via-[#F0C97A] to-[#8A6118]"
              />
              <h1 className="font-display text-2xl font-extrabold text-[var(--velvet-text)] sm:text-4xl">
                تجارب الطلاب وآراؤهم في النجيب
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--velvet-muted)] sm:text-base">
              احكيلنا عن تجربتك الفعلية مع التطبيق أو اقرأ تجارب زمايلك — كلامكم وملاحظاتكم هما اللي بيطوّروا التحديثات الجاية.
            </p>
          </div>

          <p className="font-numeric text-xs font-medium text-[var(--velvet-muted)]">
            {dbConnected
              ? `${opinions.length} مشاركة منشورة`
              : 'متصل بالوضع الافتراضي'}
          </p>
        </motion.div>

        {/* 2-Column Layout: Reactive Form + Opinions Feed */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Form Wrapped in Reactive SpotlightCard */}
          <SpotlightCard
            accentHex="#F0C97A"
            tilt3D={false}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT_EXPO }}
            className="rounded-3xl p-6 sm:p-7 lg:col-span-5"
          >
            <div className="mb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <motion.span
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex"
                >
                  <MessageSquarePlus
                    className="h-5 w-5 text-[var(--velvet-gold)]"
                    aria-hidden="true"
                  />
                </motion.span>
                <h2 className="font-display text-lg font-bold text-[var(--velvet-text)]">
                  شاركنا رأيك في التطبيق
                </h2>
              </div>

              {!session && (
                <Link
                  href="/login?next=/opinions"
                  className="text-xs font-semibold text-[var(--velvet-gold)] hover:underline whitespace-nowrap"
                >
                  سجّل دخول
                </Link>
              )}
            </div>

            <form onSubmit={handleOpinionSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="opinion-author-name"
                  className="mb-1.5 block text-xs font-semibold text-[var(--velvet-text)]"
                >
                  اسمك
                </label>
                <input
                  id="opinion-author-name"
                  name="authorName"
                  type="text"
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (fieldErrors.authorName) {
                      setFieldErrors((prev) => ({ ...prev, authorName: undefined }));
                    }
                  }}
                  placeholder="مثال: عبد الرحمن أحمد"
                  maxLength={60}
                  className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm text-[var(--velvet-text)] placeholder:text-[var(--velvet-muted)]/60 transition-colors focus:border-[var(--velvet-gold)] focus:outline-none"
                />
                {fieldErrors.authorName && (
                  <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                    {fieldErrors.authorName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="opinion-author-role"
                  className="mb-1.5 block text-xs font-semibold text-[var(--velvet-text)]"
                >
                  سنتك الدراسية أو كليتك (اختياري)
                </label>
                <input
                  id="opinion-author-role"
                  name="authorRole"
                  type="text"
                  value={authorRole}
                  onChange={(e) => {
                    setAuthorRole(e.target.value);
                    if (fieldErrors.authorRole) {
                      setFieldErrors((prev) => ({ ...prev, authorRole: undefined }));
                    }
                  }}
                  placeholder="مثال: تالتة ثانوي · هندسة القاهرة"
                  maxLength={50}
                  className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm text-[var(--velvet-text)] placeholder:text-[var(--velvet-muted)]/60 transition-colors focus:border-[var(--velvet-gold)] focus:outline-none"
                />
                {fieldErrors.authorRole && (
                  <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                    {fieldErrors.authorRole}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="opinion-comment"
                    className="text-xs font-semibold text-[var(--velvet-text)]"
                  >
                    رأيك وتجربتك
                  </label>
                  <span className="font-numeric text-[11px] text-[var(--velvet-muted)]">
                    {comment.length} / 1000
                  </span>
                </div>
                <textarea
                  id="opinion-comment"
                  name="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (fieldErrors.comment) {
                      setFieldErrors((prev) => ({ ...prev, comment: undefined }));
                    }
                  }}
                  placeholder="إيه أكتر ميزة فرقت معاك في المذاكرة أو التركيز؟ ولو عندك فكرة لتحديث جاي قولنا..."
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--velvet-text)] placeholder:text-[var(--velvet-muted)]/60 transition-colors focus:border-[var(--velvet-gold)] focus:outline-none"
                />
                {fieldErrors.comment && (
                  <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                    {fieldErrors.comment}
                  </p>
                )}
              </div>

              {formBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${
                    formBanner.type === 'success'
                      ? 'border-[var(--velvet-emerald)]/40 bg-[var(--velvet-emerald)]/10 text-[var(--velvet-emerald)]'
                      : 'border-[var(--velvet-rose)]/40 bg-[var(--velvet-rose)]/10 text-[var(--velvet-rose)]'
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formBanner.text}</span>
                </motion.div>
              )}

              <MagneticWrap strength={0.14} className="w-full">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#F0C97A] px-5 py-3 font-display text-sm font-bold text-[#1A1408] shadow-[0_12px_26px_-12px_rgba(240,201,122,0.7)] transition-colors duration-150 hover:bg-[#f5d593] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0C97A]"
                >
                  <span
                    aria-hidden="true"
                    className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                  />
                  {isSubmitting && (
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  <span className="relative z-10">
                    {isSubmitting ? 'جاري النشر...' : 'انشر رأيك دلوقتي'}
                  </span>
                </motion.button>
              </MagneticWrap>
            </form>
          </SpotlightCard>

          {/* Opinions Feed */}
          <div className="space-y-4 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] p-2.5"
            >
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--velvet-muted)]"
                  aria-hidden="true"
                />
                <label htmlFor="opinions-search" className="sr-only">
                  دور في آراء الطلاب
                </label>
                <input
                  id="opinions-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="دوّر جوا آراء الطلاب..."
                  className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] py-1.5 pl-3 pr-9 text-xs text-[var(--velvet-text)] placeholder:text-[var(--velvet-muted)]/60 transition-colors focus:border-[var(--velvet-gold)] focus:outline-none"
                />
              </div>

              {/* Animated Segmented Sort Control */}
              <div
                role="tablist"
                aria-label="ترتيب الآراء"
                className="flex items-center gap-1 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] p-1"
              >
                {[
                  { id: 'newest' as OpinionSortOption, label: 'الأحدث' },
                  { id: 'helpful' as OpinionSortOption, label: 'الأكتر تفاعلاً' },
                ].map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSortBy(opt.id)}
                      className={`relative rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                        active
                          ? 'text-[#1A1408]'
                          : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="opinions-sort-pill"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-[#F0C97A]"
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {visibleOpinions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="lux-card flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
              >
                <MessageSquareText
                  className="mb-3 h-8 w-8 text-[var(--velvet-gold)]/70"
                  aria-hidden="true"
                />
                <h3 className="font-display text-base font-bold text-[var(--velvet-text)]">
                  {opinions.length === 0
                    ? 'لسه مفيش آراء منشورة'
                    : 'ملقيناش آراء مطابقة للي كتبته'}
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-[var(--velvet-muted)]">
                  {opinions.length === 0
                    ? 'خليك أول واحد يكتب رأيه الحقيقي وتجربته مع تطبيق النجيب.'
                    : 'جرّب كلمات بحث تانية عشان تشوف باقي المشاركات.'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {visibleOpinions.map((item, idx) => {
                    const formattedDate = new Intl.DateTimeFormat('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(item.createdAt));
                    const isBursting = burstVoteId === item.id;

                    return (
                      <SpotlightCard
                        layout
                        key={item.id}
                        accentHex={item.isFeatured ? '#F0C97A' : '#7AD7F0'}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(idx * 0.04, 0.22),
                          ease: EASE_OUT_EXPO,
                        }}
                        className={`rounded-2xl p-5 ${
                          item.isFeatured
                            ? 'border-[var(--velvet-gold)]/60 shadow-[0_14px_34px_-20px_rgba(240,201,122,0.45)]'
                            : 'hover:border-[var(--velvet-gold)]/40'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-base font-bold text-[var(--velvet-text)]">
                                {item.authorName}
                              </h3>
                              {item.authorRole && (
                                <span className="text-xs text-[var(--velvet-muted)]">
                                  · {item.authorRole}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--velvet-muted)]">
                              <span>إصدار {item.appVersion}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>{formattedDate}</span>
                            </p>
                          </div>

                          {item.isFeatured && (
                            <motion.span
                              animate={{ y: [0, -2, 0] }}
                              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--velvet-gold)]/40 bg-[var(--velvet-gold)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--velvet-gold)]"
                            >
                              <Pin className="h-3 w-3" aria-hidden="true" />
                              <span>رأي مثبّت</span>
                            </motion.span>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--velvet-text)]/90">
                          {item.comment}
                        </p>

                        <div className="mt-4 flex items-center justify-end border-t border-[var(--velvet-border)]/70 pt-3">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleVoteHelpful(item.id)}
                            disabled={votingId === item.id}
                            aria-pressed={Boolean(item.hasVoted)}
                            className={`relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                              item.hasVoted
                                ? 'border-[var(--velvet-gold)] bg-[var(--velvet-gold)]/15 text-[var(--velvet-gold)]'
                                : 'border-[var(--velvet-border)] bg-[var(--velvet-bg)] text-[var(--velvet-muted)] hover:border-[var(--velvet-gold)]/50 hover:text-[var(--velvet-text)]'
                            }`}
                          >
                            {isBursting && (
                              <motion.span
                                aria-hidden="true"
                                initial={{ scale: 0.85, opacity: 0.85 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                                className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#F0C97A]"
                              />
                            )}
                            <motion.span
                              animate={
                                isBursting
                                  ? { rotate: [0, -18, 12, 0], scale: [1, 1.3, 1] }
                                  : { scale: 1 }
                              }
                              transition={{ duration: 0.4 }}
                              className="inline-flex"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.span>
                            <span>مفيد</span>
                            <motion.span
                              key={item.helpfulCount}
                              initial={{ scale: 1.25, color: '#F0C97A' }}
                              animate={{ scale: 1, color: 'inherit' }}
                              transition={{ duration: 0.25 }}
                              className="font-numeric"
                            >
                              ({item.helpfulCount})
                            </motion.span>
                          </motion.button>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

