"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarClock, Check, MessageCircle, Phone, X, CalendarCheck2, CalendarX2,
} from "lucide-react";
import { responderVisita } from "@/lib/actions/visitas";
import { formatearVisita, formatearVisitaCorta } from "@/lib/utils/agenda";
import EditorDisponibilidad from "@/components/panel/EditorDisponibilidad";
import type { PropertyWithInquiries, Visita, VisitaStatus } from "@/lib/types";

const ESTADO: Record<VisitaStatus, { label: string; bg: string; color: string; borde: string }> = {
  pendiente:  { label: "A confirmar", bg: "#EFF6FF", color: "#1D4ED8", borde: "#BFDBFE" },
  confirmada: { label: "Confirmada",  bg: "#F0FDF4", color: "#15803D", borde: "#BBF7D0" },
  rechazada:  { label: "Rechazada",   bg: "#FEF2F2", color: "#B91C1C", borde: "#FECACA" },
  cancelada:  { label: "Cancelada",   bg: "#F1F5F9", color: "#475569", borde: "#E2E8F0" },
  realizada:  { label: "Realizada",   bg: "#F1F5F9", color: "#475569", borde: "#E2E8F0" },
};

export default function SeccionVisitas({
  properties,
  visitas,
}: {
  properties: PropertyWithInquiries[];
  visitas: Visita[];
}) {
  const [filtro, setFiltro] = useState<"proximas" | "pendientes" | "todas">("proximas");

  const titulos = useMemo(
    () => Object.fromEntries(properties.map(p => [p.id, p.titulo])),
    [properties]
  );

  const visibles = useMemo(() => {
    const ahora = Date.now();
    if (filtro === "pendientes") return visitas.filter(v => v.status === "pendiente");
    if (filtro === "proximas") {
      return visitas.filter(
        v => new Date(v.inicio).getTime() >= ahora &&
             (v.status === "pendiente" || v.status === "confirmada")
      );
    }
    return visitas;
  }, [visitas, filtro]);

  const pendientes = visitas.filter(v => v.status === "pendiente").length;

  const filtros: [typeof filtro, string][] = [
    ["proximas",   "Próximas"],
    ["pendientes", `A confirmar${pendientes ? ` (${pendientes})` : ""}`],
    ["todas",      `Todas (${visitas.length})`],
  ];

  return (
    <div>
      {/* Disponibilidad por propiedad */}
      <p style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11,
        textTransform: "uppercase", letterSpacing: ".07em",
        color: "var(--ink-600)", margin: "0 0 8px",
      }}>
        Cuándo podés mostrar
      </p>

      {properties.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 18px" }}>
          Cuando publiques una propiedad vas a poder cargar tus horarios de visita.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
          {properties.filter(p => p.status === "activa").map(p => (
            <div key={p.id}>
              <p style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
                color: "var(--ink-800)", margin: "0 0 6px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {p.titulo}
              </p>
              <EditorDisponibilidad propertyId={p.id} inicial={p.visitas_config} />
            </div>
          ))}
        </div>
      )}

      {/* Pedidos recibidos */}
      <p style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11,
        textTransform: "uppercase", letterSpacing: ".07em",
        color: "var(--ink-600)", margin: "0 0 8px",
      }}>
        Visitas pedidas
      </p>

      {visitas.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Todavía no te pidieron ninguna visita.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {filtros.map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                style={{
                  fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
                  padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${filtro === valor ? "var(--navy-800)" : "var(--line-200)"}`,
                  background: filtro === valor ? "var(--navy-800)" : "#fff",
                  color: filtro === valor ? "#fff" : "var(--ink-600)",
                }}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
              No hay visitas en este filtro.
            </p>
          ) : (
            <div className="agenda-visitas-lista">
              {visibles.map(v => (
                <TarjetaVisita key={v.id} v={v} titulo={titulos[v.property_id] ?? "Tu propiedad"} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TarjetaVisita({ v, titulo }: { v: Visita; titulo: string }) {
  const [status, setStatus] = useState<VisitaStatus>(v.status);
  const [nota, setNota] = useState("");
  const [mostrarNota, setMostrarNota] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const e = ESTADO[status];
  const pasada = new Date(v.inicio).getTime() < Date.now();
  const wa = v.telefono.replace(/\D/g, "");

  function responder(nuevo: VisitaStatus) {
    const previo = status;
    setStatus(nuevo);
    setError(null);
    startTransition(async () => {
      const r = await responderVisita(v.id, nuevo, nota);
      if (r?.error) {
        setStatus(previo);
        setError(r.error);
      } else {
        setMostrarNota(false);
        setNota("");
      }
    });
  }

  const saludo = `Hola ${v.nombre}, te escribo por la visita a "${titulo}" del ${formatearVisitaCorta(v.inicio)}.`;

  return (
    <div style={{
      border: `1px solid ${e.borde}`, borderRadius: "var(--radius-sm)",
      background: "#fff", padding: "12px 13px",
      opacity: pendiente ? 0.65 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5,
            color: "var(--navy-800)", margin: 0,
          }}>
            <CalendarClock size={13.5} color="var(--gold-700)" style={{ flexShrink: 0 }} />
            {formatearVisita(v.inicio)}
          </p>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)",
            margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {titulo} · {v.duracion} min
          </p>
        </div>

        <span style={{
          flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700,
          padding: "3px 8px", borderRadius: 999,
          background: e.bg, color: e.color, border: `1px solid ${e.borde}`,
        }}>
          {e.label}
        </span>
      </div>

      {/* Interesado */}
      <div style={{
        borderTop: "1px solid var(--line-100)", paddingTop: 8, marginBottom: 8,
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink-800)", margin: 0 }}>
          {v.nombre}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: "1px 0 0" }}>
          {v.telefono} · {v.email}
        </p>
        {v.mensaje && (
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)",
            margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.45,
          }}>
            &ldquo;{v.mensaje}&rdquo;
          </p>
        )}
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "0 0 8px" }}>
          {error}
        </p>
      )}

      {/* Nota opcional al responder */}
      {mostrarNota && (
        <textarea
          value={nota}
          onChange={ev => setNota(ev.target.value)}
          rows={2}
          placeholder="Mensaje para el interesado (opcional)"
          style={{
            width: "100%", boxSizing: "border-box", resize: "none",
            border: "1px solid var(--line-200)", borderRadius: "var(--radius-xs)",
            padding: "7px 9px", fontFamily: "var(--font-sans)", fontSize: 12.5,
            color: "var(--ink-800)", marginBottom: 8,
          }}
        />
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {status === "pendiente" && (
          <>
            <button type="button" onClick={() => responder("confirmada")} disabled={pendiente}
              style={{ ...accion, background: "#F0FDF4", borderColor: "#BBF7D0", color: "#15803D" }}>
              <Check size={12.5} /> Confirmar
            </button>
            <button type="button" onClick={() => responder("rechazada")} disabled={pendiente}
              style={{ ...accion, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
              <X size={12.5} /> No puedo
            </button>
            {!mostrarNota && (
              <button type="button" onClick={() => setMostrarNota(true)} style={accion}>
                <MessageCircle size={12.5} /> Agregar mensaje
              </button>
            )}
          </>
        )}

        {status === "confirmada" && pasada && (
          <button type="button" onClick={() => responder("realizada")} disabled={pendiente} style={accion}>
            <CalendarCheck2 size={12.5} /> Marcar como realizada
          </button>
        )}

        {status === "confirmada" && !pasada && (
          <button type="button" onClick={() => responder("cancelada")} disabled={pendiente}
            style={{ ...accion, color: "var(--danger)" }}>
            <CalendarX2 size={12.5} /> Cancelar
          </button>
        )}

        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(saludo)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ ...accion, borderColor: "#BBF7D0", color: "#15803D", background: "#F0FDF4", textDecoration: "none" }}
        >
          <Phone size={12.5} /> WhatsApp
        </a>
      </div>
    </div>
  );
}

const accion: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
  padding: "6px 10px", borderRadius: "var(--radius-xs)", cursor: "pointer",
  background: "#fff", border: "1px solid var(--line-200)", color: "var(--ink-600)",
};
