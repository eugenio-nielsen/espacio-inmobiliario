"use client";

import { useState } from "react";

const MIN = 50000;
const MAX = 1000000;
const RATE = 0.04; // 4% — comisión tradicional habitual (orientativo)

const fmtUSD = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export default function ComparadorComision() {
  const [valor, setValor] = useState(180000);
  const comision = valor * RATE;

  // ancho relativo de las barras (la tradicional crece, la nuestra queda fija/chica)
  const pct = (valor - MIN) / (MAX - MIN);          // 0..1
  const barTradicional = 18 + pct * 82;              // 18%..100%
  const barFija = 16;                                // siempre chica

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-lg)", padding: "clamp(24px,4vw,40px)",
      boxShadow: "var(--shadow-sm)", maxWidth: 720, margin: "0 auto",
    }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 6px" }}>
          Valor de tu propiedad
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(30px,6vw,44px)", color: "var(--navy-800)", margin: 0, lineHeight: 1 }}>
          {fmtUSD(valor)}
        </p>
      </div>

      <input
        type="range" min={MIN} max={MAX} step={10000} value={valor}
        onChange={e => setValor(Number(e.target.value))}
        className="comparador-range"
        aria-label="Valor de la propiedad"
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "6px 0 28px" }}>
        <span>{fmtUSD(MIN)}</span>
        <span>{fmtUSD(MAX)}</span>
      </div>

      {/* Comparación */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Tradicional */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-600)" }}>Inmobiliaria tradicional <span style={{ color: "var(--ink-400)" }}>(4%)</span></span>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "#B91C1C" }}>{fmtUSD(comision)}</span>
          </div>
          <div style={{ height: 14, background: "var(--line-100)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${barTradicional}%`, height: "100%", background: "linear-gradient(90deg,#ef4444,#b91c1c)", borderRadius: 999, transition: "width .25s ease" }} />
          </div>
        </div>

        {/* Nuestro */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-600)" }}>Con Espacio Inmobiliario</span>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "#15803D" }}>Precio fijo</span>
          </div>
          <div style={{ height: 14, background: "var(--line-100)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${barFija}%`, height: "100%", background: "linear-gradient(90deg,var(--gold-400),var(--gold-600))", borderRadius: 999, transition: "width .25s ease" }} />
          </div>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.6, textAlign: "center", margin: "26px 0 0" }}>
        Cuanto más vale tu propiedad, <strong style={{ color: "#B91C1C" }}>más te cobra</strong> una inmobiliaria tradicional.
        Con nosotros pagás <strong style={{ color: "var(--navy-800)" }}>un precio fijo</strong>, sin importar el valor de la venta.
      </p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", textAlign: "center", margin: "10px 0 0" }}>
        * La comisión del 4% es un valor de referencia del mercado. El precio fijo lo conversamos según tu caso.
      </p>
    </div>
  );
}
