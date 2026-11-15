'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Mail, Send } from 'lucide-react';
import { MagneticWrap } from './MagneticButton';
import { SpotlightCard } from './SpotlightCard';

const DEVELOPER_EMAIL = 'mahmoudnageeb2709@gmail.com';

export function FounderContactCard() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DEVELOPER_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback noop if clipboard unavailable
    }
  };

  return (
    <SpotlightCard
      accentHex="#F0C97A"
      tilt3D={false}
      className="rounded-3xl p-6 sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <motion.div
            aria-hidden="true"
            whileHover={{ rotate: [0, -6, 6, 0], scale: 1.06 }}
            transition={{ duration: 0.45 }}
            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#D4B782]/50 bg-[#0C0F14] shadow-sm"
          >
            <span className="font-display text-base font-extrabold leading-none text-[#F0C97A]">
              MN
            </span>
            <span className="mt-1 h-[2px] w-5 rounded-full bg-[#F0C97A]" />
          </motion.div>

          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-[var(--velvet-gold)]">
              مطور ومنشئ تطبيق النجيب
            </p>
            <h3 className="font-display text-lg font-extrabold text-[var(--velvet-text)] sm:text-xl">
              محمود نجيب · Mahmoud Nageeb
            </h3>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[var(--velvet-muted)] sm:text-sm">
              <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--velvet-gold)]" aria-hidden="true" />
              <span dir="ltr" className="truncate font-mono text-[var(--velvet-text)]/90">
                {DEVELOPER_EMAIL}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            onClick={handleCopyEmail}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--velvet-text)] transition-colors hover:border-[var(--velvet-gold)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--velvet-emerald)]" aria-hidden="true" />
                <span className="text-[var(--velvet-emerald)]">اتنسخ الإيميل</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[var(--velvet-muted)]" aria-hidden="true" />
                <span>نسخ الإيميل</span>
              </>
            )}
          </motion.button>

          <MagneticWrap strength={0.22}>
            <motion.a
              href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent('تواصل بخصوص تطبيق النجيب (AL NAGEEB)')}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#F0C97A] px-5 py-2.5 font-display text-xs font-bold text-[#1A1408] shadow-[0_10px_24px_-12px_rgba(240,201,122,0.75)] transition-colors hover:bg-[#f6d796] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0C97A]"
            >
              <span
                aria-hidden="true"
                className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              />
              <Send className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">تواصل معي</span>
            </motion.a>
          </MagneticWrap>
        </div>
      </div>
    </SpotlightCard>
  );
}
