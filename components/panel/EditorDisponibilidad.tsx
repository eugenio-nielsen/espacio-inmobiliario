"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { guardarDisponibilidad } from "@/lib/actions/visitas";
import { DIAS_SEMANA, leerConfig } from "@/lib/utils/agenda";
import type { Franja, VisitasConfig } from "@/lib/types";

const DURACIONES = [30, 45, 60];

/** Franja que se propone al agregar una nueva: un sábado a la mañana. */
const FRANJA_NUEVA: Franja = { dia: 6, desde: "10:00", hasta: "13:00" };

const campo: React.CSSProperties = {
  border: "1px solid var(--line-200)", borderRadius: "var(--radius-xs)",
  padding: "6px 8px", fontFamily: "var(--font-sans)", fontSize: 13,
  color: "var(--ink-800)", background: "#fff",
};

export default function EditorDisponibilidad({
  propertyId,
  inicial,
}: {
  propertyId: string;
  inicial: unknown;
}) {
  const base = leerConfig(inicial);
  const [activa, setActiva] = useState(base.activa);
  const [duracion, setDuracion] = useState(base.duracion);
  const [franjas, setFranjas] = useState<Franja[]>(
    base.franjas.length ? base.franjas : [FRANJA_NUEVA]
  );
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function cambiar(i: number, cambios: Partial<Franja>) {
    setFranjas(f => f.map((x, j) => (j === i ? { ...x, ...cambios } : x)));
    setGuardado(false);
  }

  function guardar() {
    setError(null);
    const config: VisitasConfig = { activa, duracion, franjas };
    startTransition(async () => {
      const r = await guardarDisponibilidad(propertyId, config);
      if (r?.error) setError(r.error);
      else {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2600);
      }
    });
  }

  const invalidas = franjas.filter(f => f.desde >= f.hasta).length;

  return (
    <div style={{
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
      padding: "13px 14px", background: "var(--cream)",
    }}>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", marginBottom: activa ? 13 : 0 }}>
        <input
          type="checkbox"
          checked={activa}
          onChange={e => { setActiva(e.target.checked); setGuardado(false); }}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--navy-800)", flexShrink: 0 }}
        />
        <span>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--ink-900)",
          }}>
            <CalendarClock size={14} color="var(--gold-700)" /> Recibir visitas por agenda
          </span>
          <span style={{
            display: "block", fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--ink-500)", marginTop: 2, lineHeight: 1.45,
          }}>
            El interesado elige un horario de los que marques y vos confirmás.
          </span>
        </span>
      </label>

      {activa && (
        <>
          {/* Duración */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)" }}>
              Cada visita dura
            </span>
            {DURACIONES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => { setDuracion(d); setGuardado(false); }}
                style={{
                  fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
                  padding: "5px 11px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${duracion === d ? "var(--navy-800)" : "var(--line-200)"}`,
                  background: duracion === d ? "var(--navy-800)" : "#fff",
                  color: duracion === d ? "#fff" : "var(--ink-600)",
                }}
              >
                {d} min
              </button>
            ))}
          </div>

          {/* Franjas */}
          {franjas.map((f, i) => (
            <div key={i} className="agenda-franja">
              <select
                value={f.dia}
                onChange={e => cambiar(i, { dia: Number(e.target.value) })}
                style={{ ...campo, flex: "1 1 110px" }}
              >
                {DIAS_SEMANA.map((nombre, d) => (
                  <option key={d} value={d}>{nombre}</option>
                ))}
              </select>

              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>de</span>
              <input
                type="time" value={f.desde} step={900}
                onChange={e => cambiar(i, { desde: e.target.value })}
                style={{ ...campo, width: 104 }}
              />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>a</span>
              <input
                type="time" value={f.hasta} step={900}
                onChange={e => cambiar(i, { hasta: e.target.value })}
                style={{ ...campo, width: 104 }}
              />

              {franjas.length > 1 && (
                <button
                  type="button"
                  onClick={() => { setFranjas(fs => fs.filter((_, j) => j !== i)); setGuardado(false); }}
                  aria-label="Quitar franja"
                  style={{
                    marginLeft: "auto", width: 28, height: 28, borderRadius: "var(--radius-xs)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--line-200)", background: "#fff",
                    color: "var(--danger)", cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => { setFranjas(f => [...f, FRANJA_NUEVA]); setGuardado(false); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
              padding: "6px 11px", borderRadius: "var(--radius-xs)", cursor: "pointer",
              background: "#fff", border: "1px dashed var(--line-200)", color: "var(--ink-600)",
              marginBottom: 11,
            }}
          >
            <Plus size={13} /> Agregar otro día
          </button>

          {invalidas > 0 && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--danger)", margin: "0 0 9px" }}>
              Revisá los horarios: el "hasta" tiene que ser posterior al "de".
            </p>
          )}
        </>
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--danger)", margin: "0 0 9px" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={guardar}
          disabled={pendiente || invalidas > 0}
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
            padding: "8px 15px", borderRadius: "var(--radius-xs)",
            border: "none", background: "var(--navy-800)", color: "#fff",
            cursor: pendiente || invalidas > 0 ? "not-allowed" : "pointer",
            opacity: pendiente || invalidas > 0 ? 0.6 : 1,
          }}
        >
          {pendiente ? "Guardando…" : "Guardar disponibilidad"}
        </button>

        {guardado && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--success)",
          }}>
            <Check size={14} /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
