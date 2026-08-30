"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Mail, Phone, ChevronDown, Star, Search, Check, Pencil, X, CalendarClock,
} from "lucide-react";
import {
  updateInquiryStatus, toggleFavorito, actualizarProximaAccion,
} from "@/lib/actions/inquiries";
import type { PropertyWithInquiries, Inquiry, InquiryStatus } from "@/lib/types";

const ESTADOS: { valor: InquiryStatus; label: string; bg: string; color: string }[] = [
  { valor: "nuevo",      label: "Nuevo",      bg: "#EFF6FF", color: "#1D4ED8" },
  { valor: "visto",      label: "Visto",      bg: "#F5F3FF", color: "#6D28D9" },
  { valor: "contactado", label: "Contactado", bg: "#FFFBEB", color: "#B45309" },
  { valor: "cerrado",    label: "Cerrado",    bg: "#F1F5F9", color: "#475569" },
];

type ConsultaConPropiedad = Inquiry & { propiedadTitulo: string };

/** Hoy en formato AAAA-MM-DD, para comparar contra proxima_accion_fecha. */
function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** "2026-09-05" → "5 sep" */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(a, m - 1, d)));
}

export default function SeccionConsultas({ properties }: { properties: PropertyWithInquiries[] }) {
  const [filtro, setFiltro] = useState<"todas" | "prioritarios" | InquiryStatus>("todas");
  const [busqueda, setBusqueda] = useState("");

  const consultas: ConsultaConPropiedad[] = useMemo(() => {
    const todas = properties.flatMap(p =>
      p.inquiries.map(i => ({ ...i, propiedadTitulo: p.titulo }))
    );
    return todas.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [properties]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return consultas.filter(c => {
      if (filtro === "prioritarios" && !c.favorito) return false;
      if (filtro !== "todas" && filtro !== "prioritarios" && c.status !== filtro) return false;
      if (!q) return true;
      return [c.nombre, c.email, c.telefono, c.propiedadTitulo, c.proxima_accion]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [consultas, filtro, busqueda]);

  const contar = (e: InquiryStatus) => consultas.filter(c => c.status === e).length;
  const prioritarios = consultas.filter(c => c.favorito).length;

  if (!consultas.length) {
    return (
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", textAlign: "center", padding: "20px 0", margin: 0 }}>
        Todavía no recibiste consultas. Cuando alguien te escriba desde una publicación, va a aparecer acá.
      </p>
    );
  }

  return (
    <div>
      {/* Buscador + filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 170 }}>
          <Search size={15} color="var(--ink-400)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, mail o propiedad…"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
              padding: "8px 12px 8px 32px", fontFamily: "var(--font-sans)", fontSize: 13,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <Chip activo={filtro === "todas"} onClick={() => setFiltro("todas")} label={`Todas (${consultas.length})`} />
        <Chip
          activo={filtro === "prioritarios"}
          onClick={() => setFiltro("prioritarios")}
          label={`★ Prioritarios (${prioritarios})`}
        />
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
          No hay consultas que coincidan.
        </p>
      ) : (
        <div className="crm-tabla-wrap">
          <table className="crm-tabla">
            <thead>
              <tr>
                <th style={{ width: 32 }} aria-label="Prioritario" />
                <th>Contacto</th>
                <th className="crm-col-prop">Propiedad</th>
                <th className="crm-col-fecha">Recibida</th>
                <th style={{ width: 128 }}>Estado</th>
                <th>Próxima acción</th>
                <th style={{ width: 96 }}>Contactar</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(c => <Fila key={c.id} c={c} />)}
            </tbody>
          </table>
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
  const [favorito, setFavorito] = useState(c.favorito);
  const [accion, setAccion] = useState(c.proxima_accion ?? "");
  const [fecha, setFecha] = useState(c.proxima_accion_fecha ?? "");
  const [editando, setEditando] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const cfg = ESTADOS.find(e => e.valor === estado) ?? ESTADOS[0];

  function cambiarEstado(nuevo: InquiryStatus) {
    const previo = estado;
    setEstado(nuevo);
    startTransition(async () => {
      const r = await updateInquiryStatus(c.id, nuevo);
      if (!r?.ok) setEstado(previo);
    });
  }

  function marcar() {
    const previo = favorito;
    setFavorito(!previo);
    startTransition(async () => {
      const r = await toggleFavorito(c.id, previo);
      if (!r?.ok) setFavorito(previo);
    });
  }

  function guardarAccion() {
    const previoTexto = c.proxima_accion ?? "";
    const previaFecha = c.proxima_accion_fecha ?? "";
    setEditando(false);
    setError(null);
    startTransition(async () => {
      const r = await actualizarProximaAccion(c.id, accion, fecha || null);
      if (r?.error) {
        // Volvemos a lo que había: mostrar algo que no se guardó es peor que no mostrarlo
        setAccion(previoTexto);
        setFecha(previaFecha);
        setError(r.error);
      }
    });
  }

  const fechaRecibida = new Date(c.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const wa = c.telefono ? c.telefono.replace(/\D/g, "") : null;
  const saludo = `Hola ${c.nombre.split(" ")[0]}, te escribo por tu consulta sobre "${c.propiedadTitulo}" en Espacio Inmobiliario.`;
  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(`Tu consulta sobre ${c.propiedadTitulo}`)}&body=${encodeURIComponent(saludo)}`;
  const whatsapp = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(saludo)}` : null;

  // Una acción con fecha pasada o de hoy está vencida: se marca en rojo
  const vencida = !!(c.proxima_accion && fecha && fecha <= hoyISO());

  return (
    <>
      <tr
        className={estado === "nuevo" ? "crm-fila crm-fila-nueva" : "crm-fila"}
        style={{ opacity: pendiente ? 0.6 : 1 }}
      >
        {/* Prioritario */}
        <td>
          <button
            type="button"
            onClick={marcar}
            aria-label={favorito ? "Quitar de prioritarios" : "Marcar como prioritario"}
            title={favorito ? "Quitar de prioritarios" : "Marcar como prioritario"}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 3,
              color: favorito ? "var(--gold-500)" : "var(--ink-400)", lineHeight: 0,
            }}
          >
            <Star size={16} fill={favorito ? "var(--gold-500)" : "none"} strokeWidth={2} />
          </button>
        </td>

        {/* Contacto */}
        <td>
          <button
            type="button"
            onClick={() => setAbierta(a => !a)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              textAlign: "left", font: "inherit", color: "inherit",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700, color: "var(--ink-900)" }}>
              {c.nombre}
              <ChevronDown
                size={12}
                style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--ink-400)" }}
              />
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-500)" }}>
              {c.telefono || c.email}
            </span>
          </button>
        </td>

        {/* Propiedad */}
        <td className="crm-col-prop">
          <span className="crm-truncar" title={c.propiedadTitulo}>{c.propiedadTitulo}</span>
        </td>

        {/* Recibida */}
        <td className="crm-col-fecha" style={{ color: "var(--ink-500)", whiteSpace: "nowrap" }}>
          {fechaRecibida}
        </td>

        {/* Estado */}
        <td>
          <select
            value={estado}
            disabled={pendiente}
            onChange={e => cambiarEstado(e.target.value as InquiryStatus)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
              padding: "5px 8px", borderRadius: 999, cursor: "pointer", maxWidth: "100%",
              border: `1px solid ${cfg.color}33`, background: cfg.bg, color: cfg.color,
            }}
          >
            {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.label}</option>)}
          </select>
        </td>

        {/* Próxima acción */}
        <td>
          {editando ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
              <input
                autoFocus
                value={accion}
                onChange={e => setAccion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") guardarAccion(); if (e.key === "Escape") setEditando(false); }}
                placeholder="Llamar, mandar plano…"
                style={{
                  flex: "1 1 110px", minWidth: 90, boxSizing: "border-box",
                  border: "1px solid var(--line-200)", borderRadius: "var(--radius-xs)",
                  padding: "5px 7px", fontFamily: "var(--font-sans)", fontSize: 12,
                }}
              />
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                style={{
                  border: "1px solid var(--line-200)", borderRadius: "var(--radius-xs)",
                  padding: "5px 6px", fontFamily: "var(--font-sans)", fontSize: 11.5,
                }}
              />
              <button type="button" onClick={guardarAccion} aria-label="Guardar" style={iconoBtn}>
                <Check size={13} color="var(--success)" />
              </button>
              <button
                type="button"
                onClick={() => { setAccion(c.proxima_accion ?? ""); setFecha(c.proxima_accion_fecha ?? ""); setEditando(false); }}
                aria-label="Cancelar"
                style={iconoBtn}
              >
                <X size={13} color="var(--ink-400)" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setError(null); setEditando(true); }}
              title={error ?? undefined}
              style={{
                background: "none", border: "none", padding: "2px 0", cursor: "pointer",
                textAlign: "left", font: "inherit", width: "100%",
                color: error ? "var(--danger)" : accion ? "var(--ink-800)" : "var(--ink-400)",
              }}
            >
              {accion ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span className="crm-truncar" style={{ maxWidth: 150 }}>{accion}</span>
                  {fecha && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
                      background: vencida ? "#FEF2F2" : "var(--fill-100)",
                      color: vencida ? "#B91C1C" : "var(--ink-600)",
                      border: `1px solid ${vencida ? "#FECACA" : "var(--line-200)"}`,
                      whiteSpace: "nowrap",
                    }}>
                      <CalendarClock size={10} /> {fechaCorta(fecha)}
                    </span>
                  )}
                </span>
              ) : error ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5 }}>
                  No se pudo guardar
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Pencil size={11} /> Agregar
                </span>
              )}
            </button>
          )}
        </td>

        {/* Contactar */}
        <td>
          <div style={{ display: "flex", gap: 4 }}>
            <a href={mailto} title="Responder por mail" aria-label="Responder por mail" style={iconoBtn}>
              <Mail size={13} color="var(--ink-600)" />
            </a>
            {whatsapp ? (
              <a
                href={whatsapp} target="_blank" rel="noopener noreferrer"
                title="Responder por WhatsApp" aria-label="Responder por WhatsApp"
                style={{ ...iconoBtn, borderColor: "#BBF7D0", background: "#F0FDF4" }}
              >
                <Phone size={13} color="#15803D" />
              </a>
            ) : (
              <span title="Esta consulta no dejó teléfono" style={{ ...iconoBtn, opacity: 0.45, cursor: "default" }}>
                <Phone size={13} color="var(--ink-400)" />
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Mensaje completo */}
      {abierta && (
        <tr className="crm-fila-mensaje">
          <td />
          <td colSpan={6}>
            <div style={{
              padding: "10px 12px", background: "var(--fill-100)",
              borderRadius: "var(--radius-xs)", fontSize: 12.5,
              color: "var(--ink-700)", lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>
              {c.mensaje}
              <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-500)" }}>
                {c.email}{c.telefono ? ` · ${c.telefono}` : " · sin teléfono"}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const iconoBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: "var(--radius-xs)",
  border: "1px solid var(--line-200)", background: "#fff",
  cursor: "pointer", textDecoration: "none", flexShrink: 0,
};
