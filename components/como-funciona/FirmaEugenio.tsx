"use client";

import { useEffect, useRef, useState } from "react";
import SelloEN from "@/components/SelloEN";
import FirmaTrazo from "@/components/FirmaTrazo";

/**
 * El sello y la firma de Eugenio Nielsen.
 *
 * La firma se dibuja sola al entrar en pantalla: acá se decide cuándo
 * (.is-in); el trazo en sí vive en components/FirmaTrazo.tsx porque
 * también firma el documento de Respaldo en la home.
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
        <FirmaTrazo />
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
