'use client';

import React, { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from 'motion/react';

interface SpotlightCardProps extends HTMLMotionProps<'article'> {
  children: React.ReactNode;
  accentHex?: string;
  interactive?: boolean;
  tilt3D?: boolean;
  className?: string;
}

export function SpotlightCard({
  children,
  accentHex,
  interactive = true,
  tilt3D = true,
  className = '',
  onMouseMove,
  onMouseLeave,
  ...rest
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const mouseX = useMotionValue(-400);
  const mouseY = useMotionValue(-400);

  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  const rotateX = useSpring(useTransform(normY, [-0.5, 0.5], [4.5, -4.5]), {
    stiffness: 240,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(normX, [-0.5, 0.5], [-4.5, 4.5]), {
    stiffness: 240,
    damping: 22,
  });

  const glowColor = accentHex
    ? `${accentHex}29`
    : 'rgba(240, 201, 122, 0.17)';

  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 70%)`;
  const rimHighlight = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, ${accentHex ?? '#F0C97A'}55, transparent 70%)`;

  const handlePointerMove = (e: React.MouseEvent<HTMLElement>) => {
    if (interactive && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      mouseX.set(px);
      mouseY.set(py);
      if (tilt3D && rect.width > 0 && rect.height > 0) {
        normX.set(px / rect.width - 0.5);
        normY.set(py / rect.height - 0.5);
      }
    }
    onMouseMove?.(e);
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLElement>) => {
    normX.set(0);
    normY.set(0);
    onMouseLeave?.(e);
  };

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      whileHover={interactive ? { y: -4 } : undefined}
      style={
        interactive && tilt3D
          ? {
              transformPerspective: 1100,
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`lux-card group relative overflow-hidden ${className}`}
      {...rest}
    >
      {interactive && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: spotlightBg }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] p-[1px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: rimHighlight,
              WebkitMask:
                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        </>
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.article>
  );
}
