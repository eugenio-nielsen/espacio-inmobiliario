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
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStep(i); },
        { threshold: 0.55 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 0,
      maxWidth: "var(--container)",
      margin: "0 auto",
    }}
      className="scrolly-grid"
    >
      {/* ── Left sticky panel ─────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 clamp(24px,4vw,64px)",
      }}>
        <div className="es-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "clamp(22px,3.5vw,36px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 14px", lineHeight: 1.2,
        }}>
          {heading}
        </h2>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "clamp(13px,1.5vw,15px)",
          color: "var(--ink-500)", lineHeight: 1.65, margin: "0 0 40px",
          maxWidth: 340,
        }}>
          {subheading}
        </p>

        {/* Step indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 0",
              borderLeft: `3px solid ${i === activeStep ? "var(--gold-500)" : "var(--line-200)"}`,
              paddingLeft: 20,
              transition: "border-color 0.4s ease",
            }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: i === activeStep ? 28 : 18,
                color: i === activeStep ? "var(--navy-800)" : "var(--ink-300)",
                lineHeight: 1,
                transition: "all 0.4s ease",
                minWidth: 36,
              }}>
                {step.num}
              </span>
              <span style={{
                fontFamily: "var(--font-sans)", fontWeight: 600,
                fontSize: i === activeStep ? 15 : 13,
                color: i === activeStep ? "var(--navy-800)" : "var(--ink-400)",
                transition: "all 0.4s ease",
              }}>
                {step.titulo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right scrolling steps ──────────────────────────── */}
      <div style={{ padding: "15vh 0" }}>
        {steps.map((step, i) => (
          <div
            key={step.num}
            ref={el => { stepRefs.current[i] = el; }}
            style={{
              minHeight: "70vh",
              display: "flex",
              alignItems: "center",
              padding: "0 clamp(16px,3vw,48px)",
            }}
          >
            <div style={{
              background: i === activeStep ? "var(--navy-800)" : "#fff",
              border: `1px solid ${i === activeStep ? "var(--navy-800)" : "var(--line-200)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "clamp(28px,4vw,44px)",
              width: "100%",
              boxShadow: i === activeStep ? "0 20px 60px rgba(14,44,80,.18)" : "var(--shadow-xs)",
              transform: i === activeStep ? "scale(1.02)" : "scale(1)",
              transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Número decorativo de fondo */}
              <span style={{
                position: "absolute", top: 16, right: 24,
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: 80, lineHeight: 1,
                color: i === activeStep ? "rgba(255,255,255,.06)" : "var(--navy-50)",
                userSelect: "none", transition: "color 0.5s ease",
              }}>
                {step.num}
              </span>

              {/* Ícono */}
              <div style={{
                width: 52, height: 52,
                background: i === activeStep ? "rgba(185,159,102,.2)" : "var(--navy-50)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 22,
                transition: "background 0.5s ease",
              }}>
                <span style={{ color: i === activeStep ? "var(--gold-400)" : "var(--navy-600)", transition: "color 0.5s ease" }}>
                  {step.icon}
                </span>
              </div>

              <h3 style={{
                fontFamily: "var(--font-sans)", fontWeight: 700,
                fontSize: "clamp(17px,2vw,21px)",
                color: i === activeStep ? "#fff" : "var(--navy-800)",
                margin: "0 0 12px",
                transition: "color 0.5s ease",
              }}>
                {step.titulo}
              </h3>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: "clamp(13.5px,1.5vw,15.5px)",
                color: i === activeStep ? "rgba(255,255,255,.72)" : "var(--ink-500)",
                lineHeight: 1.7, margin: 0,
                transition: "color 0.5s ease",
              }}>
                {step.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
