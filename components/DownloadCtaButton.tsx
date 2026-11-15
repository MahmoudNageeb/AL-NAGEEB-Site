'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download } from 'lucide-react';
import { MagneticWrap } from './MagneticButton';

interface DownloadCtaButtonProps {
  version?: string;
  fileSizeLabel?: string;
  variant?: 'hero' | 'compact';
  className?: string;
}

export function DownloadCtaButton({
  version = '2.7',
  fileSizeLabel = '38.4 MB',
  variant = 'hero',
  className = '',
}: DownloadCtaButtonProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownload = () => {
    setStatusMessage(
      `بيجهز دلوقتي تنزيل AL-NAGEEB-v${version}.apk (${fileSizeLabel})`,
    );

    const link = document.createElement('a');
    link.href = '/api/download';
    link.download = `AL-NAGEEB-v${version}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex flex-col items-start gap-2.5 ${className}`}>
      <MagneticWrap strength={0.2}>
        <motion.button
          type="button"
          onClick={handleDownload}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className={`group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[#F0C97A] font-display font-bold text-[#1A1408] shadow-[0_14px_34px_-12px_rgba(240,201,122,0.75)] transition-colors duration-150 hover:bg-[#f6d796] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0C97A] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--velvet-bg)] ${
            variant === 'hero' ? 'px-6 py-3.5 text-sm sm:text-base' : 'px-5 py-3 text-sm'
          }`}
        >
          {/* Specular diagonal shimmer sweep */}
          <span
            aria-hidden="true"
            className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />
          <motion.span
            className="relative z-10 inline-flex"
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Download className="h-5 w-5" aria-hidden="true" />
          </motion.span>
          <span className="relative z-10">حمّل التطبيق (APK v{version})</span>
        </motion.button>
      </MagneticWrap>

      {statusMessage && (
        <motion.p
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--velvet-emerald)]"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{statusMessage}</span>
        </motion.p>
      )}
    </div>
  );
}
