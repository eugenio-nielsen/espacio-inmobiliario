"use client";

import { useEffect, useRef, useState } from "react";

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
      {/* ── Sello: anillo de texto que gira sin parar ────────── */}
      <div style={{ position: "relative", width: 168, height: 168, margin: "0 auto 34px" }}>
        <svg viewBox="0 0 200 200" width="168" height="168" aria-hidden="true">
          <defs>
            <path
              id="cf-sello-arco"
              d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
              fill="none"
            />
          </defs>
          <g className="cf-seal">
            <text
              fill="var(--gold-600)"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "3.4px",
                textTransform: "uppercase",
              }}
            >
              <textPath href="#cf-sello-arco" startOffset="0">
                Espacio Inmobiliario · Eugenio Nielsen · Buenos Aires ·
              </textPath>
            </text>
          </g>
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--gold-400)" strokeWidth="1" opacity=".55" />
          <circle cx="100" cy="100" r="54" fill="none" stroke="var(--gold-500)" strokeWidth="1" opacity=".3" />
        </svg>

        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 42,
            letterSpacing: ".02em", color: "var(--navy-800)", lineHeight: 1,
          }}>
            EN
          </span>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: 8, fontWeight: 500,
            letterSpacing: ".3em", textTransform: "uppercase", color: "var(--gold-700)",
          }}>
            Responsable
          </span>
        </div>
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
