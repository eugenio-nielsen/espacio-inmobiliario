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
    descripcion: "Publicidad registral: lo que se pide para verificar el estado de un inmueble o de una persona.",
    items: [
      { id: "inf1", nombre: "Informe 1 · Dominio y gravámenes", modulos: 20 },
      { id: "inf2", nombre: "Informe 2 · Inhibiciones", modulos: 10 },
      { id: "inf3", nombre: "Informe 3 · Índice de titulares de dominio", modulos: 10 },
      { id: "inf4", nombre: "Informe 4 · Inscripción (matrícula)", modulos: 20 },
      { id: "inf4b", nombre: "Informe 4B · Listado titularidad propiedad horizontal", modulos: 10 },
      { id: "inf5", nombre: "Informe 5 · Frecuencia de informes", modulos: 10 },
      { id: "inf6", nombre: "Informe 6 · Inscripción + dominio y gravámenes", modulos: 30 },
      { id: "certdom", nombre: "Certificado de Dominio", modulos: 40, nota: "Bloquea la matrícula: es el que pide el escribano para escriturar." },
      { id: "certinh", nombre: "Certificado de Inhibición", modulos: 10 },
      { id: "boleto", nombre: "Informe Boleto de Compraventa", modulos: 15 },
    ],
  },
  {
    titulo: "Inscripción de documentos",
    items: [
      { id: "minuta", nombre: "Formulario Único de Solicitud de Registración (Minuta)", modulos: 50 },
    ],
  },
  {
    titulo: "Otros servicios",
    items: [
      { id: "casillero", nombre: "Alquiler semestral de casilleros", modulos: 20 },
      { id: "prorroga", nombre: "Prórroga, recursos o peticiones administrativas", modulos: 40 },
      { id: "copia", nombre: "Copia de antecedente registral", modulos: 2 },
    ],
  },
  {
    titulo: "Adicional por trámite urgente",
    descripcion: "Estos importes se suman al arancel común del trámite, no lo reemplazan.",
    urgente: true,
    items: [
      { id: "u-pub", nombre: "Publicidad sobre inmuebles (Informe 1)", modulos: 40 },
      { id: "u-cert", nombre: "Certificación sobre inmuebles", modulos: 50 },
      { id: "u-inh", nombre: "Informe de inhibiciones / anotaciones personales", modulos: 20 },
      { id: "u-ind", nombre: "Informe índice de titulares", modulos: 30 },
      { id: "u-certinh", nombre: "Certificación por inhibición", modulos: 30 },
      { id: "u-expres", nombre: "Trámite Exprés (Publicidad)", modulos: 80 },
      { id: "u-minuta", nombre: "Adicional trámite urgente (por minuta)", modulos: 100 },
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
        const { [id]: _, ...resto } = prev;
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
      <header style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 6 }}>
        <span style={{
          width: 36, height: 36, borderRadius: "var(--radius-sm)", flexShrink: 0,
          background: "rgba(185,159,102,.16)", color: "var(--gold-700)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calculator size={18} strokeWidth={1.9} />
        </span>
        <div>
          <h3 style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20,
            color: "var(--navy-800)", margin: "0 0 3px", letterSpacing: "-.01em",
          }}>
            Calculá cuánto vas a pagar
          </h3>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0, lineHeight: 1.55 }}>
            Elegí los trámites que necesitás y el total se arma solo.
            Valores vigentes desde el {VIGENCIA}, con el módulo a {pesos(VALOR_MODULO)}.
          </p>
        </div>
      </header>

      {GRUPOS.map(g => (
        <div key={g.titulo} style={{ marginTop: 20 }}>
          <p style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12,
            textTransform: "uppercase", letterSpacing: ".07em",
            color: g.urgente ? "#B45309" : "var(--ink-600)", margin: "0 0 4px",
          }}>
            {g.urgente && <Zap size={13} />} {g.titulo}
          </p>
          {g.descripcion && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 10px", lineHeight: 1.5 }}>
              {g.descripcion}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {g.items.map(it => {
              const c = cant[it.id] ?? 0;
              const importe = it.modulos * VALOR_MODULO;
              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                    padding: "9px 11px", borderRadius: "var(--radius-sm)",
                    border: `1px solid ${c ? "var(--gold-300)" : "var(--line-200)"}`,
                    background: c ? "rgba(185,159,102,.07)" : "#fff",
                  }}
                >
                  <div style={{ flex: "1 1 210px", minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: c ? 600 : 500, color: "var(--ink-800)", margin: 0, lineHeight: 1.35 }}>
                      {it.nombre}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: "2px 0 0" }}>
                      {it.modulos} módulos · {pesos(importe)}
                    </p>
                    {it.nota && (
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "3px 0 0", lineHeight: 1.45 }}>
                        {it.nota}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => cambiar(it.id, -1)}
                      disabled={c === 0}
                      aria-label={`Quitar ${it.nombre}`}
                      style={{ ...paso, opacity: c === 0 ? .4 : 1, cursor: c === 0 ? "default" : "pointer" }}
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span style={{
                      minWidth: 26, textAlign: "center", fontFamily: "var(--font-sans)",
                      fontWeight: 700, fontSize: 14, color: c ? "var(--navy-800)" : "var(--ink-400)",
                    }}>
                      {c}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiar(it.id, 1)}
                      aria-label={`Agregar ${it.nombre}`}
                      style={paso}
                    >
                      <Plus size={13} strokeWidth={2.5} />
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
        marginTop: 22, background: "var(--navy-800)", borderRadius: "var(--radius-md)",
        padding: "16px 18px", color: "#fff",
      }}>
        {elegidos.length === 0 ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "rgba(255,255,255,.7)", margin: 0 }}>
            Todavía no elegiste ningún trámite. Sumá los que necesites y acá te aparece el total.
          </p>
        ) : (
          <>
            <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {elegidos.map(e => (
                <li key={e.nombre} style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.78)",
                }}>
                  <span>{e.cantidad > 1 ? `${e.cantidad} × ` : ""}{e.nombre}</span>
                  <span style={{ whiteSpace: "nowrap" }}>{pesos(e.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
              paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.16)",
            }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.7)" }}>
                Total · {modulos} módulos
              </span>
              <strong style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-.01em" }}>
                {pesos(total)}
              </strong>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: 0, lineHeight: 1.5, flex: "1 1 260px" }}>
          Es una estimación con los valores publicados por el Registro. Confirmá el
          importe final en el sitio oficial antes de hacer el trámite.
        </p>
        {elegidos.length > 0 && (
          <button
            type="button"
            onClick={() => setCant({})}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
              padding: "8px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
              background: "#fff", border: "1px solid var(--line-200)", color: "var(--ink-600)",
            }}
          >
            <RotateCcw size={13} /> Empezar de nuevo
          </button>
        )}
      </div>
    </section>
  );
}

const paso: React.CSSProperties = {
  width: 28, height: 28, borderRadius: "var(--radius-xs)",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid var(--line-200)", background: "#fff",
  color: "var(--navy-800)", cursor: "pointer",
};
