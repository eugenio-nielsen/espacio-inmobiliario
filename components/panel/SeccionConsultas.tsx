"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, Phone, MessageSquare, ChevronDown } from "lucide-react";
import { updateInquiryStatus } from "@/lib/actions/inquiries";
import type { PropertyWithInquiries, Inquiry, InquiryStatus } from "@/lib/types";

const ESTADOS: { valor: InquiryStatus; label: string; bg: string; color: string }[] = [
  { valor: "nuevo",      label: "Nuevo",      bg: "#EFF6FF", color: "#1D4ED8" },
  { valor: "visto",      label: "Visto",      bg: "#F5F3FF", color: "#6D28D9" },
  { valor: "contactado", label: "Contactado", bg: "#FFFBEB", color: "#B45309" },
  { valor: "cerrado",    label: "Cerrado",    bg: "#F1F5F9", color: "#475569" },
];

type ConsultaConPropiedad = Inquiry & { propiedadTitulo: string };

export default function SeccionConsultas({ properties }: { properties: PropertyWithInquiries[] }) {
  const [filtro, setFiltro] = useState<"todas" | InquiryStatus>("todas");

  const consultas: ConsultaConPropiedad[] = useMemo(() => {
    const todas = properties.flatMap(p =>
      p.inquiries.map(i => ({ ...i, propiedadTitulo: p.titulo }))
    );
    return todas.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [properties]);

  const visibles = filtro === "todas" ? consultas : consultas.filter(c => c.status === filtro);
  const contar = (e: InquiryStatus) => consultas.filter(c => c.status === e).length;

  if (!consultas.length) {
    return (
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", textAlign: "center", padding: "20px 0", margin: 0 }}>
        Todavía no recibiste consultas. Cuando alguien te escriba desde una publicación, va a aparecer acá.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Chip activo={filtro === "todas"} onClick={() => setFiltro("todas")} label={`Todas (${consultas.length})`} />
        {ESTADOS.map(e => (
          <Chip
            key={e.valor}
            activo={filtro === e.valor}
            onClick={() => setFiltro(e.valor)}
            label={`${e.label} (${contar(e.valor)})`}
          />
        ))}
      </div>

      {!visibles.length ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", textAlign: "center", padding: "16px 0", margin: 0 }}>
          No hay consultas en este estado.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visibles.map(c => <Fila key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function Chip({ activo, onClick, label }: { activo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
        padding: "7px 13px", borderRadius: 999, cursor: "pointer",
        border: `1px solid ${activo ? "var(--navy-800)" : "var(--line-200)"}`,
        background: activo ? "var(--navy-800)" : "#fff",
        color: activo ? "#fff" : "var(--ink-600)",
      }}
    >
      {label}
    </button>
  );
}

function Fila({ c }: { c: ConsultaConPropiedad }) {
  const [estado, setEstado] = useState<InquiryStatus>(c.status);
  const [abierta, setAbierta] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const cfg = ESTADOS.find(e => e.valor === estado) ?? ESTADOS[0];

  function cambiar(nuevo: InquiryStatus) {
    const previo = estado;
    setEstado(nuevo);
    startTransition(async () => {
      const r = await updateInquiryStatus(c.id, nuevo);
      if (!r?.ok) setEstado(previo);
    });
  }

  const fecha = new Date(c.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const wa = c.telefono ? c.telefono.replace(/\D/g, "") : null;

  const saludo = `Hola ${c.nombre.split(" ")[0]}, te escribo por tu consulta sobre "${c.propiedadTitulo}" en Espacio Inmobiliario.`;
  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(`Tu consulta sobre ${c.propiedadTitulo}`)}&body=${encodeURIComponent(saludo)}`;
  const whatsapp = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(saludo)}` : null;

  return (
    <div style={{
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
      background: estado === "nuevo" ? "#FAFCFF" : "#fff", padding: "12px 13px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", margin: "0 0 2px" }}>
            {c.nombre}
          </p>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {fecha} · {c.propiedadTitulo}
          </p>
        </div>

        <select
          value={estado}
          disabled={pendiente}
          onChange={e => cambiar(e.target.value as InquiryStatus)}
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700,
            padding: "6px 10px", borderRadius: 999, cursor: "pointer",
            border: `1px solid ${cfg.color}33`, background: cfg.bg, color: cfg.color,
          }}
        >
          {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.label}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
        <a href={mailto} style={accion}>
          <Mail size={12.5} /> Responder por mail
        </a>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...accion, borderColor: "#BBF7D0", color: "#15803D", background: "#F0FDF4" }}>
            <Phone size={12.5} /> WhatsApp
          </a>
        ) : (
          <span style={{ ...accion, color: "var(--ink-400)", cursor: "default" }} title="Esta consulta no dejó teléfono">
            <Phone size={12.5} /> Sin teléfono
          </span>
        )}
        <button type="button" onClick={() => setAbierta(a => !a)} style={{ ...accion, cursor: "pointer" }}>
          <MessageSquare size={12.5} /> {abierta ? "Ocultar" : "Ver mensaje"}
          <ChevronDown size={12} style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>
      </div>

      {abierta && (
        <div style={{
          marginTop: 10, padding: "10px 12px", background: "var(--fill-100)",
          borderRadius: "var(--radius-xs)", fontFamily: "var(--font-sans)",
          fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6, whiteSpace: "pre-wrap",
        }}>
          {c.mensaje}
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-500)" }}>
            {c.email}{c.telefono ? ` · ${c.telefono}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

const accion: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
  padding: "6px 11px", borderRadius: "var(--radius-xs)",
  border: "1px solid var(--line-200)", background: "#fff",
  color: "var(--ink-700)", textDecoration: "none",
};
