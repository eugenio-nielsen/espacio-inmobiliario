"use client";

import { useEffect, useRef, useState } from "react";

export interface Step {
  num: string;
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
}

interface Props {
  steps: Step[];
  eyebrow: string;
  heading: string;
  subheading: string;
}

export default function ScrollySteps({ steps, eyebrow, heading, subheading }: Props) {
  const [active, setActive] = useState(0);
  const outerRef = useRef<HTMLDivElement>(null);

  // Calcula el paso activo según cuánto se avanzó dentro del contenedor.
  useEffect(() => {
    function onScroll() {
      const el = outerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      // dividir el progreso en N tramos iguales
      const idx = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      setActive(idx);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [steps.length]);

  return (
    <>
      {/* ════ DESKTOP ════ */}
      {/* El contenedor mide N pantallas de alto y "conduce" el scroll. */}
      <div
        ref={outerRef}
        className="ss-desktop"
        style={{ height: `${steps.length * 100}vh`, position: "relative" }}
      >
        {/* Esto se pega al viewport y ocupa exactamente una pantalla. */}
        <div className="ss-pin">
          {/* IZQUIERDA: título + índice de pasos (siempre visible) */}
          <div className="ss-left">
            <div className="es-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(22px,3vw,38px)", letterSpacing: "-.02em",
              color: "var(--navy-800)", margin: "0 0 16px", lineHeight: 1.16,
            }}>
              {heading}
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(13px,1.4vw,15px)",
              color: "var(--ink-500)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 360,
            }}>
              {subheading}
            </p>

            <div>
              {steps.map((step, i) => {
                const on = i === active;
                return (
                  <div key={step.num} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "13px 0 13px 20px",
                    borderLeft: `3px solid ${on ? "var(--gold-500)" : "var(--line-200)"}`,
                    transition: "border-color .4s ease",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display)", fontWeight: 800,
                      fontSize: on ? 26 : 17, lineHeight: 1, minWidth: 34,
                      color: on ? "var(--navy-800)" : "var(--ink-300)",
                      transition: "all .4s ease",
                    }}>{step.num}</span>
                    <span style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: on ? 700 : 500, fontSize: on ? 15 : 13.5,
                      color: on ? "var(--navy-800)" : "var(--ink-400)",
                      transition: "all .4s ease",
                    }}>{step.titulo}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DERECHA: una card por vez, con crossfade */}
          <div className="ss-right">
            {steps.map((step, i) => {
              const on = i === active;
              return (
                <div key={step.num} className="ss-card-slot" style={{
                  opacity: on ? 1 : 0,
                  transform: on ? "translateY(0)" : i < active ? "translateY(-24px)" : "translateY(24px)",
                  transition: "opacity .5s cubic-bezier(.4,0,.2,1), transform .5s cubic-bezier(.4,0,.2,1)",
                  pointerEvents: on ? "auto" : "none",
                }}>
                  <div className="ss-card">
                    <span style={{
                      position: "absolute", bottom: -14, right: 18,
                      fontFamily: "var(--font-display)", fontWeight: 800,
                      fontSize: 130, lineHeight: 1, color: "rgba(255,255,255,.05)",
                      userSelect: "none", pointerEvents: "none",
                    }}>{step.num}</span>

                    <div style={{
                      width: 56, height: 56, background: "rgba(185,159,102,.18)",
                      borderRadius: "var(--radius-md)", display: "flex",
                      alignItems: "center", justifyContent: "center", marginBottom: 24,
                    }}>
                      <span style={{ color: "var(--gold-400)" }}>{step.icon}</span>
                    </div>

                    <h3 style={{
                      fontFamily: "var(--font-sans)", fontWeight: 700,
                      fontSize: "clamp(18px,2vw,24px)", color: "#fff", margin: "0 0 14px",
                    }}>{step.titulo}</h3>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontSize: "clamp(14px,1.5vw,16px)",
                      color: "rgba(255,255,255,.72)", lineHeight: 1.75, margin: 0,
                    }}>{step.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════ MOBILE ════ */}
      <div className="ss-mobile">
        <div className="es-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "clamp(22px,6vw,30px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 10px",
        }}>{heading}</h2>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 14,
          color: "var(--ink-500)", lineHeight: 1.65, margin: "0 0 28px",
        }}>{subheading}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map(step => (
            <div key={step.num} className="ss-card">
              <div style={{
                width: 48, height: 48, background: "rgba(185,159,102,.18)",
                borderRadius: "var(--radius-md)", display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <span style={{ color: "var(--gold-400)" }}>{step.icon}</span>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, color: "var(--gold-500)", margin: "0 0 6px" }}>{step.num}</p>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "#fff", margin: "0 0 10px" }}>{step.titulo}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "rgba(255,255,255,.68)", lineHeight: 1.65, margin: 0 }}>{step.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
