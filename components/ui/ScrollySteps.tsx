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
  dark?: boolean; // para sección con fondo oscuro
}

export default function ScrollySteps({ steps, eyebrow, heading, subheading, dark = false }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers = triggerRefs.current.map((el, i) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStep(i); },
        { threshold: 0.5 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const ink = dark ? "rgba(255,255,255,.65)" : "var(--ink-500)";
  const heading_c = dark ? "#fff" : "var(--navy-800)";
  const eyebrow_c = dark ? "es-eyebrow es-eyebrow-light" : "es-eyebrow";

  return (
    <>
      {/* ── Desktop scrollytelling ───────────────────────── */}
      <div
        ref={containerRef}
        className="scrolly-outer"
        style={{ position: "relative", height: `${steps.length * 100}vh` }}
      >
        {/* Invisible scroll triggers — one per step, evenly distributed */}
        {steps.map((_, i) => (
          <div
            key={i}
            ref={el => { triggerRefs.current[i] = el; }}
            style={{
              position: "absolute",
              top: `${(i / steps.length) * 100}%`,
              height: `${100 / steps.length}%`,
              width: 1,
              pointerEvents: "none",
              left: "50%",
            }}
          />
        ))}

        {/* Sticky viewport — both panels stick together */}
        <div style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
        }}
          className="scrolly-sticky"
        >
          {/* ── Left panel ──────────────────────────────── */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 clamp(28px,5vw,72px)",
          }}>
            <div className={eyebrow_c} style={{ marginBottom: 14 }}>{eyebrow}</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(22px,3vw,36px)", letterSpacing: "-.02em",
              color: heading_c, margin: "0 0 16px", lineHeight: 1.18,
            }}>
              {heading}
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(13px,1.4vw,15px)",
              color: ink, lineHeight: 1.7, margin: "0 0 44px", maxWidth: 340,
            }}>
              {subheading}
            </p>

            {/* Step indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {steps.map((step, i) => (
                <div key={step.num} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "12px 0 12px 20px",
                  borderLeft: `3px solid ${i === activeStep ? "var(--gold-500)" : dark ? "rgba(255,255,255,.12)" : "var(--line-200)"}`,
                  transition: "border-color 0.45s ease",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: i === activeStep ? 26 : 16,
                    color: i === activeStep ? heading_c : ink,
                    transition: "all 0.4s ease",
                    minWidth: 32, lineHeight: 1,
                  }}>
                    {step.num}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-sans)", fontWeight: i === activeStep ? 700 : 500,
                    fontSize: i === activeStep ? 14.5 : 13,
                    color: i === activeStep ? heading_c : ink,
                    transition: "all 0.4s ease",
                  }}>
                    {step.titulo}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel — crossfade cards ───────────── */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "0 clamp(20px,4vw,60px) 0 0",
            position: "relative",
          }}>
            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  position: "absolute",
                  inset: "0 clamp(20px,4vw,60px) 0 0",
                  display: "flex", alignItems: "center",
                  opacity: i === activeStep ? 1 : 0,
                  transform: i === activeStep
                    ? "translateY(0) scale(1)"
                    : i < activeStep
                      ? "translateY(-28px) scale(.97)"
                      : "translateY(28px) scale(.97)",
                  transition: "opacity 0.55s cubic-bezier(.4,0,.2,1), transform 0.55s cubic-bezier(.4,0,.2,1)",
                  pointerEvents: i === activeStep ? "auto" : "none",
                }}
              >
                <div style={{
                  background: "var(--navy-800)",
                  borderRadius: "var(--radius-lg)",
                  padding: "clamp(32px,4vw,52px)",
                  width: "100%",
                  boxShadow: "0 24px 64px rgba(14,44,80,.22)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Número decorativo */}
                  <span style={{
                    position: "absolute", bottom: -8, right: 24,
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: 120, lineHeight: 1,
                    color: "rgba(255,255,255,.04)",
                    userSelect: "none",
                  }}>
                    {step.num}
                  </span>

                  {/* Ícono */}
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
                  }}>
                    {step.titulo}
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "clamp(14px,1.5vw,16px)",
                    color: "rgba(255,255,255,.70)", lineHeight: 1.75, margin: 0,
                  }}>
                    {step.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile fallback — cards apiladas ────────────────── */}
      <div className="scrolly-mobile" style={{ padding: "48px 20px", display: "none" }}>
        <div className={eyebrow_c} style={{ marginBottom: 10 }}>{eyebrow}</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "clamp(22px,6vw,30px)", letterSpacing: "-.02em",
          color: heading_c, margin: "0 0 10px",
        }}>
          {heading}
        </h2>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 14,
          color: ink, lineHeight: 1.65, margin: "0 0 32px",
        }}>
          {subheading}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map(step => (
            <div key={step.num} style={{
              background: "var(--navy-800)",
              borderRadius: "var(--radius-lg)",
              padding: "28px 24px",
            }}>
              <div style={{
                width: 48, height: 48,
                background: "rgba(185,159,102,.18)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <span style={{ color: "var(--gold-400)" }}>{step.icon}</span>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--gold-500)", margin: "0 0 6px" }}>
                {step.num}
              </p>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "#fff", margin: "0 0 10px" }}>
                {step.titulo}
              </h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "rgba(255,255,255,.68)", lineHeight: 1.65, margin: 0 }}>
                {step.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
