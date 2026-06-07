"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const MIN = 50000;
const MAX = 1000000;
const RATE = 0.04; // 4% — comisión tradicional habitual (orientativo)

const fmtUSD = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export default function ComparadorComision() {
  const [valor, setValor] = useState(180000);
  const comision = valor * RATE;

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-lg)", padding: "clamp(24px,4vw,40px)",
      boxShadow: "var(--shadow-sm)", maxWidth: 760, margin: "0 auto",
    }}>
      {/* ── Foco: PRECIO FIJO ─────────────────────────────────── */}
      <div style={{
        background: "var(--navy-800)", borderRadius: "var(--radius-lg)",
        padding: "clamp(24px,4vw,36px)", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(185,159,102,.18), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
            color: "var(--gold-300)", background: "rgba(185,159,102,.15)", padding: "6px 12px", borderRadius: 999,
          }}>
            Con Espacio Inmobiliario
          </span>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(36px,8vw,60px)", color: "#fff", margin: 0, lineHeight: 1 }}>
            Precio <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>fijo</span>
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(13.5px,2vw,15px)", color: "rgba(255,255,255,.72)", margin: "12px auto 0", maxWidth: 420, lineHeight: 1.55 }}>
            Pagás lo mismo por vender, sin importar cuánto valga tu propiedad.
          </p>
        </div>
      </div>

      {/* ── Comparación con el esquema tradicional ────────────── */}
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-500)", textAlign: "center", margin: "26px 0 14px" }}>
        Compará con una inmobiliaria tradicional
      </p>

      {/* slider secundario */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)" }}>Valor de tu propiedad:</span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "var(--navy-800)" }}>{fmtUSD(valor)}</span>
      </div>
      <input
        type="range" min={MIN} max={MAX} step={10000} value={valor}
        onChange={e => setValor(Number(e.target.value))}
        className="comparador-range"
        aria-label="Valor de la propiedad"
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "6px 0 22px" }}>
        <span>{fmtUSD(MIN)}</span>
        <span>{fmtUSD(MAX)}</span>
      </div>

      {/* dos lados */}
      <div className="comparador-cols">
        {/* Tradicional */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "18px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: "0 0 2px" }}>Inmobiliaria tradicional</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "0 0 8px" }}>comisión del 4%</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,5vw,32px)", color: "#B91C1C", margin: 0, lineHeight: 1 }}>{fmtUSD(comision)}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "#B91C1C", margin: "8px 0 0" }}>sube con el valor ↑</p>
        </div>

        {/* Nuestro (destacado) */}
        <div style={{ background: "rgba(185,159,102,.10)", border: "1.5px solid var(--gold-400)", borderRadius: "var(--radius-md)", padding: "18px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-600)", margin: "0 0 2px" }}>Con nosotros</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "0 0 8px" }}>siempre igual</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,5vw,32px)", color: "var(--gold-700)", margin: 0, lineHeight: 1 }}>Precio fijo</p>
          <p style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "#15803D", fontWeight: 600, margin: "8px 0 0" }}>
            <Check size={13} strokeWidth={3} /> no cambia
          </p>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", textAlign: "center", margin: "20px 0 0" }}>
        * La comisión del 4% es un valor de referencia del mercado. El precio fijo lo conversamos según tu caso.
      </p>
    </div>
  );
}
