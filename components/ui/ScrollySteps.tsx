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
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const el = containerRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, -top / scrollable));
      setActiveStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [steps.length]);

  return (
    <>
      {/* ── Desktop ──────────────────────────────────────────── */}
      <div ref={containerRef} className="scrolly-outer"
        style={{ position: "relative", height: `${steps.length * 100}vh` }}>

        {/* Sticky wrapper — cubre exactamente 100vh */}
        <div style={{
          position: "sticky", top: 0,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "100%",   /* fuerza a las columnas a tomar todo el alto */
          overflow: "hidden",
        }}>

          {/* ── Columna izquierda ────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "0 clamp(28px,5vw,72px)",
            overflow: "hidden",
          }}>
            <div className="es-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(22px,3vw,36px)", letterSpacing: "-.02em",
              color: "var(--navy-800)", margin: "0 0 16px", lineHeight: 1.18,
            }}>
              {heading}
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(13px,1.4vw,15px)",
              color: "var(--ink-500)", lineHeight: 1.7,
              margin: "0 0 44px", maxWidth: 340,
            }}>
              {subheading}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {steps.map((step, i) => (
                <div key={step.num} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "12px 0 12px 20px",
                  borderLeft: `3px solid ${i === activeStep ? "var(--gold-500)" : "var(--line-200)"}`,
                  transition: "border-color 0.4s ease",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: i === activeStep ? 26 : 16,
                    color: i === activeStep ? "var(--navy-800)" : "var(--ink-300)",
                    transition: "all 0.4s ease", minWidth: 32, lineHeight: 1,
                  }}>{step.num}</span>
                  <span style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: i === activeStep ? 700 : 500,
                    fontSize: i === activeStep ? 14.5 : 13,
                    color: i === activeStep ? "var(--navy-800)" : "var(--ink-400)",
                    transition: "all 0.4s ease",
                  }}>{step.titulo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha — cards superpuestas ─────────── */}
          <div style={{
            position: "relative",   /* containing block para absolutos */
            overflow: "hidden",
          }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{
                /* ocupa TODO el espacio de la columna */
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center",
                padding: "40px clamp(20px,4vw,56px)",
                /* crossfade + slide */
                opacity: i === activeStep ? 1 : 0,
                transform: i === activeStep
                  ? "translateY(0)"
                  : i < activeStep ? "translateY(-20px)" : "translateY(20px)",
                transition: "opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)",
                pointerEvents: i === activeStep ? "auto" : "none",
              }}>
                {/* Tarjeta navy */}
                <div style={{
                  background: "var(--navy-800)",
                  borderRadius: "var(--radius-lg)",
                  padding: "clamp(32px,4vw,52px)",
                  width: "100%",
                  boxShadow: "0 24px 64px rgba(14,44,80,.22)",
                  position: "relative", overflow: "hidden",
                }}>
                  <span style={{
                    position: "absolute", bottom: -12, right: 20,
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: 120, lineHeight: 1,
                    color: "rgba(255,255,255,.04)", userSelect: "none",
                  }}>{step.num}</span>

                  <div style={{
                    width: 56, height: 56,
                    background: "rgba(185,159,102,.18)",
                    borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24,
                  }}>
                    <span style={{ color: "var(--gold-400)" }}>{step.icon}</span>
                  </div>

                  <h3 style={{
                    fontFamily: "var(--font-sans)", fontWeight: 700,
                    fontSize: "clamp(18px,2vw,24px)",
                    color: "#fff", margin: "0 0 14px",
                  }}>{step.titulo}</h3>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "clamp(14px,1.5vw,16px)",
                    color: "rgba(255,255,255,.70)", lineHeight: 1.75, margin: 0,
                  }}>{step.descripcion}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Mobile: cards apiladas ───────────────────────────── */}
      <div className="scrolly-mobile" style={{ padding: "48px 20px" }}>
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
            <div key={step.num} style={{
              background: "var(--navy-800)", borderRadius: "var(--radius-lg)", padding: "28px 24px",
            }}>
              <div style={{
                width: 48, height: 48, background: "rgba(185,159,102,.18)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
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
