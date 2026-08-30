"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Eye, ShieldCheck, X } from "lucide-react";
import { resolverValidacion, verDocumentos } from "@/lib/actions/validaciones";
import EstadoValidacionChip from "@/components/panel/EstadoValidacionChip";
import type { EstadoValidacion } from "@/lib/types";

export type PendienteIdentidad = {
  tipo: "identidad";
  id: string;
  titulo: string;      // nombre de la persona
  subtitulo: string;   // email
  detalle: string;     // tipo de documento
  estado: EstadoValidacion;
  enviada_at: string | null;
  archivos: string[];
};

export type PendienteDominio = {
  tipo: "dominio";
  id: string;
  titulo: string;      // título de la propiedad
  subtitulo: string;   // dueño
  detalle: string;
  estado: EstadoValidacion;
  enviada_at: string | null;
  archivos: string[];
};

export type Pendiente = PendienteIdentidad | PendienteDominio;

export default function ValidacionesAdmin({ pendientes }: { pendientes: Pendiente[] }) {
  const [filtro, setFiltro] = useState<"pendientes" | "todas">("pendientes");

  const visibles = filtro === "pendientes"
    ? pendientes.filter(p => p.estado === "pendiente")
    : pendientes;

  const enEspera = pendientes.filter(p => p.estado === "pendiente").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {([["pendientes", `Esperando revisión (${enEspera})`], ["todas", `Todas (${pendientes.length})`]] as const).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFiltro(v)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
              padding: "7px 13px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${filtro === v ? "var(--navy-800)" : "var(--line-200)"}`,
              background: filtro === v ? "var(--navy-800)" : "#fff",
              color: filtro === v ? "#fff" : "var(--ink-600)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {!visibles.length ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", padding: "16px 0", margin: 0 }}>
          {filtro === "pendientes" ? "No hay nada esperando revisión." : "Todavía no se envió ninguna validación."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visibles.map(p => <Tarjeta key={`${p.tipo}-${p.id}`} p={p} />)}
        </div>
      )}
    </div>
  );
}

function Tarjeta({ p }: { p: Pendiente }) {
  const [estado, setEstado] = useState<EstadoValidacion>(p.estado);
  const [urls, setUrls] = useState<Record<string, string> | null>(null);
  const [motivo, setMotivo] = useState("");
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function abrirDocumentos() {
    setError(null);
    startTransition(async () => {
      const r = await verDocumentos(p.archivos);
      if (r?.error) setError(r.error);
      else if (r?.urls) setUrls(r.urls);
    });
  }

  function resolver(decision: "aprobada" | "rechazada") {
    setError(null);
    startTransition(async () => {
      const r = await resolverValidacion(p.tipo, p.id, decision, motivo);
      if (r?.error) setError(r.error);
      else { setEstado(decision); setRechazando(false); setMotivo(""); }
    });
  }

  const enviada = p.enviada_at
    ? new Date(p.enviada_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div style={{
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
      background: "#fff", padding: "13px 14px", opacity: pendiente ? 0.65 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
        <span style={{
          width: 30, height: 30, borderRadius: "var(--radius-xs)", flexShrink: 0,
          background: p.tipo === "identidad" ? "var(--navy-50)" : "var(--gold-50)",
          color: p.tipo === "identidad" ? "var(--navy-700)" : "var(--gold-700)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={15} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", margin: 0 }}>
            {p.titulo}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: "2px 0 0" }}>
            {p.tipo === "identidad" ? "Identidad" : "Dominio"} · {p.subtitulo} · {p.detalle} · {enviada}
          </p>
        </div>

        <EstadoValidacionChip estado={estado} />
      </div>

      {/* Documentos: URL firmada de 5 minutos, no queda expuesta */}
      {urls ? (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 9 }}>
          {Object.entries(urls).map(([ruta, url], i) => (
            <a
              key={ruta} href={url} target="_blank" rel="noopener noreferrer"
              style={{ ...accion, borderColor: "var(--navy-100)", background: "var(--navy-50)", color: "var(--navy-800)" }}
            >
              <ExternalLink size={12} /> Documento {i + 1}
            </a>
          ))}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", alignSelf: "center" }}>
            Los enlaces vencen en 5 minutos
          </span>
        </div>
      ) : (
        <button type="button" onClick={abrirDocumentos} disabled={pendiente} style={{ ...accion, marginBottom: 9 }}>
          <Eye size={12.5} /> Ver documentos ({p.archivos.length})
        </button>
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "0 0 9px" }}>
          {error}
        </p>
      )}

      {rechazando && (
        <textarea
          autoFocus
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={2}
          placeholder="Motivo del rechazo — la persona lo recibe por mail"
          style={{
            width: "100%", boxSizing: "border-box", resize: "none",
            border: "1px solid var(--line-200)", borderRadius: "var(--radius-xs)",
            padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: 12.5,
            marginBottom: 8,
          }}
        />
      )}

      {estado === "pendiente" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button" onClick={() => resolver("aprobada")} disabled={pendiente}
            style={{ ...accion, background: "#F0FDF4", borderColor: "#BBF7D0", color: "#15803D" }}
          >
            <Check size={12.5} /> Aprobar
          </button>
          {rechazando ? (
            <>
              <button
                type="button" onClick={() => resolver("rechazada")} disabled={pendiente}
                style={{ ...accion, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}
              >
                Confirmar rechazo
              </button>
              <button type="button" onClick={() => { setRechazando(false); setMotivo(""); }} style={accion}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button" onClick={() => setRechazando(true)}
              style={{ ...accion, color: "var(--danger)" }}
            >
              <X size={12.5} /> Rechazar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const accion: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
  padding: "6px 11px", borderRadius: "var(--radius-xs)", cursor: "pointer",
  background: "#fff", border: "1px solid var(--line-200)",
  color: "var(--ink-600)", textDecoration: "none",
};
