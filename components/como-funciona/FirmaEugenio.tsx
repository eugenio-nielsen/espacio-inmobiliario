"use client";

import { useEffect, useRef, useState } from "react";
import SelloEN from "@/components/SelloEN";

/**
 * El sello y la firma de Eugenio Nielsen.
 *
 * La firma se dibuja sola al entrar en pantalla. El truco para que el
 * trazo calce exacto es `pathLength={1400}`: normaliza el largo real de
 * la curva a 1400 unidades, que es el mismo valor del stroke-dasharray
 * en globals.css. Sin eso habría que medir el path a mano y el dibujo
 * terminaría antes o después de tiempo.
 */
export default function FirmaEugenio() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      {/* Sello compartido con el footer: la misma pieza en los dos
          lugares es lo que la vuelve reconocible (components/SelloEN.tsx) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 34 }}>
        <SelloEN size={168} tono="claro" />
      </div>

      {/* ── Nombre + firma dibujada ──────────────────────────── */}
      <h2 style={{
        fontFamily: "var(--font-display)", fontWeight: 600,
        fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.05,
        letterSpacing: "-.03em", color: "var(--navy-800)", margin: "0 0 4px",
      }}>
        Eugenio Nielsen
      </h2>

      <div className={`cf-firma${visible ? " is-in" : ""}`} style={{ margin: "0 auto", maxWidth: 380 }}>
        <svg viewBox="0 0 520 84" width="100%" height="62" aria-hidden="true" style={{ overflow: "visible" }}>
          <path
            pathLength={1400}
            d="M12 60 C 78 26, 168 18, 246 34 C 300 45, 348 58, 396 49 C 436 41, 454 24, 441 14 C 430 5, 412 15, 419 31 C 427 49, 460 54, 508 39"
            fill="none"
            stroke="var(--gold-500)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p style={{
        fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
        letterSpacing: ".28em", textTransform: "uppercase",
        color: "var(--gold-700)", margin: "-8px 0 0",
      }}>
        Fundador · Espacio Inmobiliario
      </p>
    </div>
  );
}
