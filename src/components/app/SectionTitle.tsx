import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  /** Large top label, e.g. "2026" or greeting */
  topLabel?: string;
  /** Main title — rendered in gradient orange */
  title: string;
  /** Small subtitle below */
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Sticky section title that fades + slides up on scroll.
 * Matches the Design System reference screenshots.
 */
export const SectionTitle = ({ topLabel, title, subtitle, className, children }: SectionTitleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 = fully visible, 1 = fully hidden

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // ratio 1 = fully visible → progress 0
        // ratio 0 = fully hidden → progress 1
        setProgress(1 - entry.intersectionRatio);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('px-4 pt-4 pb-3', className)}>
      <div
        style={{
          opacity: 1 - progress,
          transform: `translateY(${-progress * 16}px)`,
          transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
        }}
      >
        {topLabel && (
          <span className="block font-display text-[2rem] font-black leading-none text-foreground">
            {topLabel}
          </span>
        )}
        <span className="block font-display text-[2rem] font-black leading-none text-gradient-primary">
          {title}
        </span>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
};
