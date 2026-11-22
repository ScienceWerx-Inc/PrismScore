'use client';

import React, { useEffect, useRef } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from 'framer-motion';

/** Fade + rise when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  ...rest
}: { delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when visible. */
export function CountUp({
  to,
  duration = 1.6,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}

/** Progress bar that fills when visible. */
export function AnimatedBar({
  value,
  className,
  delay = 0,
}: {
  value: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

/**
 * Scroll reveal for the whole page: observes section containers and grid/list
 * children and fades them in with a stagger. Render once per page.
 */
export function ScrollFX() {
  useEffect(() => {
    const targets: HTMLElement[] = [];
    document
      .querySelectorAll<HTMLElement>('main section:not(:first-child) > div')
      .forEach((el) => {
        const kids = el.querySelectorAll<HTMLElement>(':scope > .grid > *, :scope > .space-y-4 > *');
        if (kids.length) {
          Array.from(el.children).forEach((c) => {
            if (!c.classList.contains('grid') && !c.classList.contains('space-y-4'))
              targets.push(c as HTMLElement);
          });
          kids.forEach((k, i) => {
            k.style.setProperty('--fx-delay', `${i * 110}ms`);
            targets.push(k);
          });
        } else {
          targets.push(el);
        }
      });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('fx-in');
            e.target.classList.remove('fx-hidden');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    targets.forEach((t) => {
      t.classList.add('fx-hidden');
      io.observe(t);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
