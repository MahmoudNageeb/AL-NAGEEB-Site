'use client';

import React, { useEffect } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
} from 'motion/react';

export function MotionChrome() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 26,
    restDelta: 0.001,
  });

  const cursorX = useMotionValue(-600);
  const cursorY = useMotionValue(-600);
  const smoothX = useSpring(cursorX, { stiffness: 120, damping: 24 });
  const smoothY = useSpring(cursorY, { stiffness: 120, damping: 24 });

  const ambientGlow = useMotionTemplate`radial-gradient(560px circle at ${smoothX}px ${smoothY}px, rgba(240, 201, 122, 0.055), transparent 70%)`;

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Global Scroll Progress Beam */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: smoothProgress, transformOrigin: 'right center' }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2.5px] bg-gradient-to-l from-[#FFF4D2] via-[#F0C97A] to-[#7AD7F0]"
      />

      {/* Ambient Atmospheric Cursor Field */}
      <motion.div
        aria-hidden="true"
        style={{ background: ambientGlow }}
        className="pointer-events-none fixed inset-0 z-0 hidden md:block"
      />
    </>
  );
}
