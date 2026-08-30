"use client";

import { useMemo, useState } from "react";
import { Calculator, Minus, Plus, RotateCcw, Zap } from "lucide-react";

/**
 * Calculadora de aranceles del Registro de la Propiedad Inmueble (CABA).
 *
 * Los aranceles se fijan en módulos: el importe es siempre módulos × valor
 * del módulo. Por eso guardamos los módulos y una sola constante con el
 * valor vigente — cuando el Registro lo actualiza, se cambia acá y toda
 * la tabla queda al día.
 *
 * Fuente: dnrpi.jus.gob.ar · vigente desde el 03/08/2026.
 */
const VALOR_MODULO = 300;
const VIGENCIA = "3 de agosto de 2026";

type Item = { id: string; nombre: string; modulos: number; nota?: string };
type Grupo = { titulo: string; descripcion?: string; urgente?: boolean; items: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Informes y certificados",
    descripcion: "para verificar el estado de un inmueble o una persona",
    items: [
      { id: "inf1", nombre: "Informe 1 · Dominio y gravámenes", modulos: 20 },
      { id: "inf2", nombre: "Informe 2 · Inhibiciones", modulos: 10 },
      { id: "inf3", nombre: "Informe 3 · Índice de titulares", modulos: 10 },
      { id: "inf4", nombre: "Informe 4 · Inscripción (matrícula)", modulos: 20 },
      { id: "inf4b", nombre: "Informe 4B · Titularidad propiedad horizontal", modulos: 10 },
      { id: "inf5", nombre: "Informe 5 · Frecuencia de informes", modulos: 10 },
      { id: "inf6", nombre: "Informe 6 · Inscripción + dominio", modulos: 30 },
      { id: "certdom", nombre: "Certificado de Dominio", modulos: 40, nota: "Bloquea la matrícula: es el que pide el escribano para escriturar." },
      { id: "certinh", nombre: "Certificado de Inhibición", modulos: 10 },
      { id: "boleto", nombre: "Informe Boleto de Compraventa", modulos: 15 },
    ],
  },
  {
    titulo: "Inscripción de documentos",
    items: [
      { id: "minuta", nombre: "Formulario Único de Registración (Minuta)", modulos: 50 },
    ],
  },
  {
    titulo: "Otros servicios",
    items: [
      { id: "casillero", nombre: "Alquiler semestral de casilleros", modulos: 20 },
      { id: "prorroga", nombre: "Prórroga, recursos o peticiones", modulos: 40 },
      { id: "copia", nombre: "Copia de antecedente registral", modulos: 2 },
    ],
  },
  {
    titulo: "Adicional por trámite urgente",
    descripcion: "se suman al arancel común, no lo reemplazan",
    urgente: true,
    items: [
      { id: "u-pub", nombre: "Publicidad sobre inmuebles (Informe 1)", modulos: 40 },
      { id: "u-cert", nombre: "Certificación sobre inmuebles", modulos: 50 },
      { id: "u-inh", nombre: "Informe de inhibiciones", modulos: 20 },
      { id: "u-ind", nombre: "Informe índice de titulares", modulos: 30 },
      { id: "u-certinh", nombre: "Certificación por inhibición", modulos: 30 },
      { id: "u-expres", nombre: "Trámite Exprés (Publicidad)", modulos: 80 },
      { id: "u-minuta", nombre: "Adicional urgente (por minuta)", modulos: 100 },
    ],
  },
];

const TODOS = GRUPOS.flatMap(g => g.items);
const pesos = (n: number) => `$${new Intl.NumberFormat("es-AR").format(n)}`;

export default function CalculadoraAranceles() {
  const [cant, setCant] = useState<Record<string, number>>({});

  const cambiar = (id: string, delta: number) =>
    setCant(prev => {
      const nuevo = Math.max(0, Math.min(20, (prev[id] ?? 0) + delta));
      if (nuevo === 0) {
        const { [id]: _quitado, ...resto } = prev;
        return resto;
      }
      return { ...prev, [id]: nuevo };
    });

  const { modulos, total, elegidos } = useMemo(() => {
    let modulos = 0;
    const elegidos: { nombre: string; cantidad: number; subtotal: number }[] = [];
    for (const it of TODOS) {
      const c = cant[it.id] ?? 0;
      if (!c) continue;
      modulos += it.modulos * c;
      elegidos.push({ nombre: it.nombre, cantidad: c, subtotal: it.modulos * c * VALOR_MODULO });
    }
    return { modulos, total: modulos * VALOR_MODULO, elegidos };
  }, [cant]);

  return (
    <section className="calc-aranceles" aria-label="Calculadora de aranceles">
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <Calculator size={16} strokeWidth={1.9} color="var(--gold-700)" style={{ flexShrink: 0 }} />
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17,
          color: "var(--navy-800)", margin: 0, letterSpacing: "-.01em",
        }}>
          Calculá cuánto vas a pagar
        </h3>
      </header>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: "0 0 2px", lineHeight: 1.45 }}>
        Elegí los trámites y el total se arma solo · vigente desde el {VIGENCIA}, módulo a {pesos(VALOR_MODULO)}.
      </p>

      {GRUPOS.map(g => (
        <div key={g.titulo} style={{ marginTop: 13 }}>
          <p style={{
            display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap",
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11,
            textTransform: "uppercase", letterSpacing: ".07em",
            color: g.urgente ? "#B45309" : "var(--ink-600)", margin: "0 0 6px",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              {g.urgente && <Zap size={11} />} {g.titulo}
            </span>
            {g.descripcion && (
              <span style={{ fontWeight: 400, fontSize: 11, textTransform: "none", letterSpacing: 0, color: "var(--ink-400)" }}>
                {g.descripcion}
              </span>
            )}
          </p>

          <div className="calc-grid">
            {g.items.map(it => {
              const c = cant[it.id] ?? 0;
              const importe = it.modulos * VALOR_MODULO;
              return (
                <div
                  key={it.id}
                  title={it.nota}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 8px", borderRadius: "var(--radius-xs)",
                    border: `1px solid ${c ? "var(--gold-300)" : "var(--line-200)"}`,
                    background: c ? "rgba(185,159,102,.07)" : "#fff",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontSize: 12.5,
                      fontWeight: c ? 600 : 500, color: "var(--ink-800)",
                      margin: 0, lineHeight: 1.3,
                    }}>
                      {it.nombre}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-500)", margin: "1px 0 0" }}>
                      {it.modulos} mód · {pesos(importe)}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => cambiar(it.id, -1)}
                      disabled={c === 0}
                      aria-label={`Quitar ${it.nombre}`}
                      style={{ ...paso, opacity: c === 0 ? .4 : 1, cursor: c === 0 ? "default" : "pointer" }}
                    >
                      <Minus size={12} strokeWidth={2.6} />
                    </button>
                    <span style={{
                      minWidth: 18, textAlign: "center", fontFamily: "var(--font-sans)",
                      fontWeight: 700, fontSize: 13, color: c ? "var(--navy-800)" : "var(--ink-400)",
                    }}>
                      {c}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiar(it.id, 1)}
                      aria-label={`Agregar ${it.nombre}`}
                      style={paso}
                    >
                      <Plus size={12} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Total */}
      <div style={{
        marginTop: 15, background: "var(--navy-800)", borderRadius: "var(--radius-sm)",
        padding: "12px 14px", color: "#fff",
      }}>
        {elegidos.length === 0 ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "rgba(255,255,255,.7)", margin: 0 }}>
            Sumá los trámites que necesites y acá te aparece el total.
          </p>
        ) : (
          <>
            <ul className="calc-resumen">
              {elegidos.map(e => (
                <li key={e.nombre} style={{
                  display: "flex", justifyContent: "space-between", gap: 10,
                  fontFamily: "var(--font-sans)", fontSize: 11.5, color: "rgba(255,255,255,.78)",
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.cantidad > 1 ? `${e.cantidad} × ` : ""}{e.nombre}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>{pesos(e.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
              paddingTop: 9, marginTop: 9, borderTop: "1px solid rgba(255,255,255,.16)",
            }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,.7)" }}>
                Total · {modulos} módulos
              </span>
              <strong style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22, letterSpacing: "-.01em" }}>
                {pesos(total)}
              </strong>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: 0, lineHeight: 1.45, flex: "1 1 240px" }}>
          Estimación con los valores publicados por el Registro. Confirmá el importe final en el sitio oficial.
        </p>
        {elegidos.length > 0 && (
          <button
            type="button"
            onClick={() => setCant({})}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              padding: "6px 12px", borderRadius: "var(--radius-xs)", cursor: "pointer",
              background: "#fff", border: "1px solid var(--line-200)", color: "var(--ink-600)",
            }}
          >
            <RotateCcw size={12} /> Limpiar
          </button>
        )}
      </div>
    </section>
  );
}

const paso: React.CSSProperties = {
  width: 24, height: 24, borderRadius: "var(--radius-xs)",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid var(--line-200)", background: "#fff",
  color: "var(--navy-800)", cursor: "pointer",
};
