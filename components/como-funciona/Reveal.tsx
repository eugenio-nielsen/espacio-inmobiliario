"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** ms de retardo para escalonar entradas. */
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "li" | "header";
}

/**
 * Revelado al hacer scroll, con la cadencia lenta de la página
 * /como-funciona (ver .cf-reveal en globals.css). Se distingue de FadeIn
 * por el easing expo y la duración larga: acá el movimiento acompaña,
 * no llama la atención.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  style,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error — ref polimórfico según la etiqueta elegida
      ref={ref}
      className={`cf-reveal${visible ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </Tag>
  );
}
