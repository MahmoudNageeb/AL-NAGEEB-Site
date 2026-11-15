'use client';

import React from 'react';
import { motion, MotionConfig } from 'motion/react';

export function PageTransition({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-1 flex-col ${className}`}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
