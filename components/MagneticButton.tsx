'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface MagneticWrapProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MagneticWrap({
  children,
  strength = 0.24,
  className = '',
}: MagneticWrapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 280, damping: 20, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 280, damping: 20, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    rawX.set(offsetX * strength);
    rawY.set(offsetY * strength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const hasDisplayClass = /(^|\s)(hidden|block|flex|grid|inline|inline-flex|inline-grid)(\s|$)/.test(
    className,
  );

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${hasDisplayClass ? '' : 'inline-block '}${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
