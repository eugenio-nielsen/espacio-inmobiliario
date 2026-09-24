"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marca con .is-in el momento en que un bloque entra en pantalla, y nada
 * más: no mueve ni funde el contenedor (para eso están FadeIn y Reveal).
 * La coreografía la decide el CSS del bloque, que anima a sus hijos a
 * partir de esa clase. Lo usan Secuencia e Índice.
 */
export default function Escena({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [enEscena, setEnEscena] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setEnEscena(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className}${enEscena ? " is-in" : ""}`} style={style}>
      {children}
    </div>
  );
}
