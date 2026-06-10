"use client";

import { useState } from "react";
import { ChevronDown, Receipt } from "lucide-react";

interface Props {
  precio: number;
  moneda: "USD" | "ARS";
  provincia: string;
  aptoCredito: boolean;
}

/**
 * Costos estimados de escrituración para el COMPRADOR, calculados
 * sobre el precio real de la propiedad. Valores orientativos 2026.
 */
export default function CostosCompra({ precio, moneda, provincia, aptoCredito }: Props) {
  const [open, setOpen] = useState(false);

  const esCABA = provincia === "Ciudad Autónoma de Buenos Aires" || provincia === "CABA";
  const simbolo = moneda === "USD" ? "US$" : "$";
  const fmt = (n: number) =>
    `${simbolo} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

  // Alícuotas orientativas (comprador). Sellos: CABA 3,5% repartido mitad
  // y mitad; PBA 2% repartido. Vivienda única tiene exenciones por monto.
  const items: { label: string; pct: number; nota?: string }[] = [
    { label: "Escribano (honorarios + gastos)", pct: 0.02 },
    {
      label: `Impuesto de sellos (${esCABA ? "CABA" : "Pcia. Bs. As."}, mitad del comprador)`,
      pct: esCABA ? 0.0175 : 0.01,
      nota: "Vivienda única y permanente tiene exención hasta cierto monto.",
    },
    { label: "Inscripción y certificados", pct: 0.003 },
  ];

  const total = items.reduce((acc, i) => acc + i.pct, 0);

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-md)", marginBottom: 32, overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--navy-800)",
          textAlign: "left",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Receipt size={18} strokeWidth={1.75} color="var(--gold-600)" />
          ¿Cuánto cuesta comprar esta propiedad?
        </span>
        <ChevronDown size={18} strokeWidth={2} style={{
          transition: "transform .2s ease", transform: open ? "rotate(180deg)" : "none", flexShrink: 0,
        }} />
      </button>

      {open && (
        <div style={{ padding: "0 20px 18px", fontFamily: "var(--font-sans)" }}>
          <p style={{ fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 14px" }}>
            Además del precio, una compra tiene costos de escrituración. Estimación
            para esta propiedad:
          </p>

          {items.map((item) => (
            <div key={item.label} style={{
              display: "flex", justifyContent: "space-between", gap: 16,
              padding: "9px 0", borderBottom: "1px solid var(--line-100)",
              fontSize: 14, color: "var(--ink-600)",
            }}>
              <span>
                {item.label}
                <span style={{ color: "var(--ink-400)", fontSize: 12.5 }}> · {(item.pct * 100).toLocaleString("es-AR")}%</span>
                {item.nota && (
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{item.nota}</span>
                )}
              </span>
              <b style={{ color: "var(--navy-800)", whiteSpace: "nowrap" }}>{fmt(precio * item.pct)}</b>
            </div>
          ))}

          <div style={{
            display: "flex", justifyContent: "space-between", gap: 16,
            padding: "12px 0 4px", fontSize: 15, fontWeight: 700, color: "var(--navy-800)",
          }}>
            <span>Total estimado (~{(total * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)</span>
            <span style={{ color: "var(--gold-700)" }}>{fmt(precio * total)}</span>
          </div>

          {aptoCredito && (
            <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "10px 0 0" }}>
              💡 Si comprás con crédito hipotecario, sumá ~1% ({fmt(precio * 0.01)}) por
              gastos de constitución de la hipoteca.
            </p>
          )}

          <p style={{ fontSize: 12, color: "var(--ink-400)", margin: "12px 0 0", lineHeight: 1.5 }}>
            Valores orientativos a junio de 2026 — varían según escribanía y situación
            impositiva de las partes. No constituye asesoramiento profesional.{" "}
            <a href="/blog" style={{ color: "var(--gold-700)" }}>Leé más en nuestras guías</a>.
          </p>
        </div>
      )}
    </div>
  );
}
