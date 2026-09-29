"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown, Receipt } from "lucide-react";
import { calcularCostos, type CostosConfig, type Jurisdiccion } from "@/lib/catedra/costos";

interface Props {
  precio: number;
  moneda: "USD" | "ARS";
  provincia: string;
  aptoCredito: boolean;
  /** Parámetros vigentes (los mismos de la calculadora de la Cátedra). */
  config: CostosConfig;
}

/**
 * Costos de escrituración para el COMPRADOR, calculados sobre el precio
 * real de la propiedad con el mismo motor que la calculadora de la
 * Cátedra (lib/catedra/costos.ts): si cambia la ley tarifaria, se
 * actualiza una sola vez desde el panel y cambian las dos.
 *
 * Sin honorarios inmobiliarios: acá se compra directo al dueño. En CABA
 * pregunta si va a ser la vivienda única, porque de eso depende la
 * exención de Sellos.
 */
export default function CostosCompra({ precio, moneda, provincia, aptoCredito, config }: Props) {
  const [open, setOpen] = useState(false);
  const [viviendaUnica, setViviendaUnica] = useState(true);

  const jurisdiccion: Jurisdiccion =
    provincia === "Ciudad Autónoma de Buenos Aires" || provincia === "CABA" ? "CABA" : "PBA";
  const esCABA = jurisdiccion === "CABA";
  const simbolo = moneda === "USD" ? "US$" : "$";
  const fmt = (n: number) =>
    `${simbolo} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

  const r = calcularCostos({
    precio,
    moneda,
    tipoCambio: config.tipoCambio,
    vir: null,
    viviendaUnica: esCABA ? viviendaUnica : false,
    conInmobiliaria: false,
    honorariosComprador: 0,
    honorariosVendedor: 0,
    ivaHonorarios: false,
    honorariosEscribano: config.escribania.honorarios,
    credito: 0,
    jurisdiccion,
  }, config);

  const pct = precio > 0 ? (r.comprador.costos / precio) * 100 : 0;
  const calculadora =
    `/catedra/calculadora?p=${Math.round(precio)}&m=${moneda}&tc=${config.tipoCambio}` +
    `&vu=${viviendaUnica ? 1 : 0}&inmo=0&esc=${config.escribania.honorarios}&cc=0`;

  const opcion = (activa: boolean): React.CSSProperties => ({
    padding: "6px 14px", border: 0, borderRadius: 2, cursor: "pointer",
    fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: activa ? 600 : 500,
    color: activa ? "var(--navy-800)" : "var(--ink-600)",
    background: activa ? "#fff" : "transparent",
    boxShadow: activa ? "0 1px 2px rgba(20,17,11,.08)" : "none",
  });

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
            Además del precio, una compra tiene costos de escrituración. Como comprás directo al
            dueño, no hay honorarios inmobiliarios. Estimación para esta propiedad:
          </p>

          {esCABA && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px", margin: "0 0 12px" }}>
              <span style={{ fontSize: 13, color: "var(--ink-600)" }}>¿Va a ser tu vivienda única?</span>
              <span role="group" aria-label="Vivienda única" style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--fill-100)", borderRadius: 2 }}>
                <button type="button" aria-pressed={viviendaUnica} onClick={() => setViviendaUnica(true)} style={opcion(viviendaUnica)}>Sí</button>
                <button type="button" aria-pressed={!viviendaUnica} onClick={() => setViviendaUnica(false)} style={opcion(!viviendaUnica)}>No</button>
              </span>
            </div>
          )}

          {r.comprador.lineas.map((item) => (
            <div key={item.id} title={item.fuente} style={{
              display: "flex", justifyContent: "space-between", gap: 16,
              padding: "9px 0", borderBottom: "1px solid var(--line-100)",
              fontSize: 14, color: "var(--ink-600)",
            }}>
              <span>
                {item.concepto}
                {item.calculo && (
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{item.calculo}</span>
                )}
              </span>
              {item.etiqueta
                ? <b style={{ color: "var(--success)", whiteSpace: "nowrap", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>{item.etiqueta}</b>
                : <b style={{ color: "var(--navy-800)", whiteSpace: "nowrap" }}>{fmt(item.monto)}</b>}
            </div>
          ))}

          <div style={{
            display: "flex", justifyContent: "space-between", gap: 16,
            padding: "12px 0 4px", fontSize: 15, fontWeight: 700, color: "var(--navy-800)",
          }}>
            <span>Total estimado (~{pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)</span>
            <span style={{ color: "var(--gold-700)" }}>{fmt(r.comprador.costos)}</span>
          </div>

          {esCABA && r.sellos.caso === "exento" && (
            <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "8px 0 0" }}>
              Como vivienda única no paga Sellos: en CABA está exenta hasta $ {new Intl.NumberFormat("es-AR").format(config.sellos.umbral)}.
            </p>
          )}

          {aptoCredito && (
            <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "10px 0 0" }}>
              Si comprás con crédito hipotecario, sumá la escritura de la hipoteca (alrededor del{" "}
              {config.escribania.hipoteca.toLocaleString("es-AR")} % del crédito, más IVA).{" "}
              {esCABA
                ? "Los Sellos de un crédito bancario para vivienda están exentos."
                : "En Provincia, los Sellos del crédito para vivienda única están exentos hasta cierto monto."}
            </p>
          )}

          {esCABA && (
            <Link href={calculadora} style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
              fontSize: 13, fontWeight: 600, color: "var(--navy-800)",
              textDecoration: "underline", textDecorationColor: "var(--gold-500)", textUnderlineOffset: 3,
            }}>
              Ver la cuenta completa, con el detalle de cada impuesto <ArrowRight size={13} strokeWidth={1.8} />
            </Link>
          )}

          <p style={{ fontSize: 12, color: "var(--ink-400)", margin: "12px 0 0", lineHeight: 1.5 }}>
            Valores orientativos del {config.vigencia}: varían según la escribanía y la situación
            impositiva de las partes. No constituye asesoramiento profesional.
          </p>
        </div>
      )}
    </div>
  );
}
