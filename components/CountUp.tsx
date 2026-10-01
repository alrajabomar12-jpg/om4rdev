"use client";

import { useEffect, useRef } from "react";
import { formatCompact } from "@/lib/format";

/**
 * Renders the final value on the server (so no-JS, crawlers and reduced-motion users see it),
 * then counts up once when scrolled into view. The text is written to the DOM directly so the
 * animation doesn't re-render React 60 times a second.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = formatCompact(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        el.textContent = formatCompact(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = formatCompact(value);
    };
  }, [value]);

  return (
    <span ref={ref}>{formatCompact(value)}</span>
  );
}
