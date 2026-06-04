"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  duration?: number;     // ms
  prefix?: string;
  suffix?: string;
  separator?: boolean;   // separador de miles
}

export default function Counter({ to, duration = 1600, prefix = "", suffix = "", separator = true }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(eased * to));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  const display = separator ? value.toLocaleString("es-AR") : String(value);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
