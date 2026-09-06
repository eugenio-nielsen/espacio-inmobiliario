"use client";

import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  /** Desfasa el barrido de luz para que las tarjetas no brillen a la vez. */
  sheenDelay?: number;
  /** Variante para las secciones claras (crema). */
  tono?: "oscuro" | "claro";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tarjeta con vida propia: sigue al puntero con un spotlight y una
 * inclinación 3D leve, y ademas lleva un barrido de luz permanente.
 *
 * El barrido no es decoración redundante: en touch no existe :hover,
 * asi que sin el la tarjeta quedaria completamente quieta en movil,
 * que es justo donde se pidió que no lo estuviera.
 *
 * El puntero se lee con rAF para no escribir estilos en cada evento.
 */
export default function TarjetaViva({
  children,
  sheenDelay = 0,
  tono = "oscuro",
  className = "",
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    // Los dispositivos táctiles emiten pointermove al arrastrar el
    // carrusel; inclinar la tarjeta ahí se siente como un error.
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const r = el.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.setProperty("--rx", `${(-(y / r.height - 0.5) * 4.5).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x / r.width - 0.5) * 5.5).toFixed(2)}deg`);
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`cf-card${tono === "claro" ? " cf-card-light" : ""}${className ? ` ${className}` : ""}`}
      style={{ ["--sheen" as string]: `${sheenDelay}ms`, ...style }}
    >
      {children}
    </div>
  );
}
