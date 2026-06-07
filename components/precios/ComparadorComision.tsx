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
        {/* Tradicional — secundario, apagado */}
        <div style={{ background: "var(--cream)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "16px 18px", textAlign: "center", opacity: 0.9 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 2px" }}>Inmobiliaria tradicional</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: "0 0 8px" }}>comisión del 4%</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)", color: "#B91C1C", margin: 0, lineHeight: 1 }}>{fmtUSD(comision)}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#B91C1C", margin: "8px 0 0" }}>sube con el valor ↑</p>
        </div>

        {/* Nuestro — destacado y dominante */}
        <div className="comparador-destacado" style={{
          background: "var(--navy-800)", border: "1.5px solid var(--gold-400)",
          borderRadius: "var(--radius-md)", padding: "26px 22px", textAlign: "center",
          position: "relative", boxShadow: "0 18px 44px rgba(14,44,80,.28)",
        }}>
          <span style={{
            position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
            fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            background: "var(--gold-500)", color: "var(--navy-900)", padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap",
          }}>
            Lo nuestro
          </span>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "rgba(255,255,255,.7)", margin: "4px 0 2px" }}>Con nosotros</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(255,255,255,.5)", margin: "0 0 10px" }}>sin importar el valor</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px,6vw,40px)", color: "#fff", margin: 0, lineHeight: 1 }}>
            Precio <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>fijo</span>
          </p>
          <p style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--gold-300)", fontWeight: 600, margin: "12px 0 0" }}>
            <Check size={14} strokeWidth={3} /> no cambia nunca
          </p>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", textAlign: "center", margin: "20px 0 0" }}>
        * La comisión del 4% es un valor de referencia del mercado. El precio fijo lo conversamos según tu caso.
      </p>
    </div>
  );
}
