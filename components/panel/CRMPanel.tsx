"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Plus, Search, ChevronDown, ChevronUp, Star, Edit2, ExternalLink,
  MessageSquare, Phone, Mail, Sparkles, Eye, CalendarClock, Building2,
  PlayCircle, PauseCircle, CheckCircle2, MoreHorizontal, ArrowUpDown,
} from "lucide-react";
import { updateInquiryStatus, toggleFavorito, markPropertyInquiriesVisto } from "@/lib/actions/inquiries";
import { setPropertyStatus } from "@/lib/actions/properties";
import type { PropertyWithInquiries, Inquiry, InquiryStatus } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

type PropStatus = "activa" | "pausada" | "vendida";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

const PROP_STATUS: Record<PropStatus, { dot: string; label: string; bg: string; color: string }> = {
  activa:  { dot: "#22c55e", label: "Activa",  bg: "#F0FDF4", color: "#15803D" },
  pausada: { dot: "#f59e0b", label: "Pausada", bg: "#FFFBEB", color: "#B45309" },
  vendida: { dot: "#94a3b8", label: "Vendida", bg: "#F1F5F9", color: "#475569" },
};

const INQ_STATUS: Record<InquiryStatus, { label: string; bg: string; color: string }> = {
  nuevo:      { label: "Nuevo",      bg: "#EFF6FF", color: "#1D4ED8" },
  visto:      { label: "Visto",      bg: "#F1F5F9", color: "#475569" },
  contactado: { label: "Contactado", bg: "#FFFBEB", color: "#B45309" },
  cerrado:    { label: "Cerrado",    bg: "#F0FDF4", color: "#15803D" },
};

function fmtPrecio(precio: number, moneda: string) {
  return `${moneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(precio))}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// ── Inquiry Row ────────────────────────────────────────────────
function InquiryRow({ inq }: { inq: Inquiry }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<InquiryStatus>(inq.status || "nuevo");
  const [fav, setFav] = useState(inq.favorito);
  const [isPending, startTransition] = useTransition();

  const st = INQ_STATUS[status];

  function handleStatus(next: InquiryStatus) {
    setStatus(next);
    startTransition(async () => { await updateInquiryStatus(inq.id, next); });
  }
  function handleFav() {
    setFav(f => !f);
    startTransition(async () => { await toggleFavorito(inq.id, fav); });
  }

  return (
    <div style={{
      background: status === "nuevo" ? "#FAFBFF" : "#fff",
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
        <button onClick={e => { e.stopPropagation(); handleFav(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }} title={fav ? "Quitar favorito" : "Marcar como favorito"}>
          <Star size={16} strokeWidth={1.75} fill={fav ? "#F59E0B" : "none"} color={fav ? "#F59E0B" : "var(--ink-400)"} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--navy-100)", color: "var(--navy-800)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {inq.nombre[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink-900)" }}>{inq.nombre}</span>
            {status === "nuevo" && <span style={{ width: 7, height: 7, borderRadius: 999, background: "#3B82F6", flexShrink: 0 }} />}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inq.mensaje}</p>
        </div>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", flexShrink: 0 }} className="inq-date">{fmtDate(inq.created_at)}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5, padding: "4px 10px", borderRadius: 999, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
        <div style={{ color: "var(--ink-400)", flexShrink: 0 }}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--line-100)", padding: 16, background: "#FAFAFA" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.7, color: "#3b362e", margin: "0 0 16px", background: "#fff", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-100)" }}>{inq.mensaje}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <a href={`mailto:${inq.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--navy-700)", textDecoration: "none" }}><Mail size={14} strokeWidth={1.75} />{inq.email}</a>
            {inq.telefono && <a href={`https://wa.me/${inq.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "#15803D", textDecoration: "none" }}><Phone size={14} strokeWidth={1.75} />{inq.telefono}</a>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", marginRight: 4 }}>Mover a:</span>
            {(["nuevo", "visto", "contactado", "cerrado"] as InquiryStatus[]).filter(s => s !== status).map(s => (
              <button key={s} disabled={isPending} onClick={() => handleStatus(s)} style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, padding: "5px 12px", borderRadius: 999, cursor: "pointer", background: INQ_STATUS[s].bg, color: INQ_STATUS[s].color, border: `1px solid ${INQ_STATUS[s].color}30`, opacity: isPending ? 0.5 : 1 }}>{INQ_STATUS[s].label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Métrica con etiqueta ───────────────────────────────────────
function Metric({ icon, value, label, accent }: { icon: React.ReactNode; value: number | string; label: string; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: accent || "var(--ink-400)", display: "flex" }}>{icon}</span>
      <div style={{ lineHeight: 1.1 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--ink-900)" }}>{value}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", marginLeft: 5 }}>{label}</span>
      </div>
    </div>
  );
}

// ── Quick status menu ──────────────────────────────────────────
function StatusMenu({ current, onChange }: { current: PropStatus; onChange: (s: PropStatus) => void }) {
  const [open, setOpen] = useState(false);
  const cur = PROP_STATUS[current];
  const opciones: { s: PropStatus; label: string; icon: React.ReactNode }[] = [
    { s: "activa", label: "Activar", icon: <PlayCircle size={15} /> },
    { s: "pausada", label: "Pausar", icon: <PauseCircle size={15} /> },
    { s: "vendida", label: "Marcar vendida", icon: <CheckCircle2 size={15} /> },
  ];

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} title="Cambiar estado" style={{
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
        padding: "4px 10px", borderRadius: 999, background: cur.bg, color: cur.color, border: "none",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: cur.dot }} />
        {cur.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: 5, minWidth: 168 }}>
          {opciones.filter(o => o.s !== current).map(o => (
            <button key={o.s} onClick={() => { setOpen(false); onChange(o.s); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left",
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-700)",
              padding: "9px 10px", borderRadius: "var(--radius-sm)", background: "none", border: "none", cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--fill-100, #f3f4f6)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span style={{ color: PROP_STATUS[o.s].color, display: "flex" }}>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property CRM Card ──────────────────────────────────────────
function PropertyCard({ p, searchQuery, onStatus }: { p: PropertyWithInquiries; searchQuery: string; onStatus: (id: string, s: PropStatus) => void }) {
  const [open, setOpen] = useState(p.new_inquiries > 0);
  const [, startTransition] = useTransition();

  const filteredInquiries = useMemo(() => {
    if (!searchQuery) return p.inquiries;
    const q = searchQuery.toLowerCase();
    return p.inquiries.filter(i => i.nombre.toLowerCase().includes(q) || i.email.toLowerCase().includes(q));
  }, [p.inquiries, searchQuery]);

  function handleOpen() {
    if (!open && p.new_inquiries > 0) startTransition(async () => { await markPropertyInquiriesVisto(p.id); });
    setOpen(o => !o);
  }

  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px" }} className="crm-card-head">
        <div style={{ width: 84, height: 64, borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--fill-100)", position: "relative" }}>
          {p.fotos?.[0] ? <Image src={p.fotos[0]} alt={p.titulo} fill className="object-cover" sizes="84px" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏠</div>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-500)" }}>{TIPO_LABEL[p.tipo]}</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--ink-400)" }} />
            <StatusMenu current={p.status as PropStatus} onChange={s => onStatus(p.id, s)} />
            {p.new_inquiries > 0 && (
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11, background: "#3B82F6", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>
                {p.new_inquiries} nuevo{p.new_inquiries > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15.5, color: "var(--ink-900)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)", fontWeight: 700 }}>{fmtPrecio(p.precio, p.moneda)}</span>
            {(p.barrio || p.ciudad) && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>{p.barrio || p.ciudad}</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} className="crm-card-actions">
          <a href={`/panel/propiedades/${p.slug}/editar`} style={{ ...iconBtn, gap: 6, padding: "8px 13px", color: "var(--ink-700)", width: "auto" }}>
            <Edit2 size={14} strokeWidth={1.75} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600 }}>Editar</span>
          </a>
          <a href={buildPropertyUrl(p)} target="_blank" rel="noopener noreferrer" title="Ver publicación" style={{ ...iconBtn, color: "var(--ink-500)" }}><ExternalLink size={15} strokeWidth={1.75} /></a>
        </div>
      </div>

      {/* Métricas + toggle consultas */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderTop: "1px solid var(--line-100)", background: "var(--cream)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <Metric icon={<Eye size={16} strokeWidth={1.75} />} value={p.views ?? 0} label="vistas" accent="var(--navy-600)" />
          <Metric icon={<MessageSquare size={16} strokeWidth={1.75} />} value={p.total_inquiries} label="consultas" accent="#3B82F6" />
          <Metric icon={<CalendarClock size={16} strokeWidth={1.75} />} value={p.week_inquiries} label="esta semana" accent="var(--gold-700)" />
        </div>
        <button onClick={handleOpen} style={{
          display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5,
          padding: "8px 14px", borderRadius: "var(--radius-sm)",
          background: open ? "var(--navy-800)" : "#fff", color: open ? "#fff" : "var(--navy-800)",
          border: `1px solid ${open ? "var(--navy-800)" : "var(--line-200)"}`,
        }}>
          <MessageSquare size={14} strokeWidth={1.75} />
          {open ? "Ocultar" : "Ver"} consultas
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Inquiries */}
      {open && (
        <div style={{ borderTop: "1px solid var(--line-100)", padding: "16px 18px" }}>
          {filteredInquiries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <MessageSquare size={28} strokeWidth={1} color="var(--ink-400)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: 0 }}>
                {p.total_inquiries === 0 ? "Todavía no recibiste consultas para esta propiedad." : "Ninguna consulta coincide con la búsqueda."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...filteredInquiries].sort((a, b) => {
                if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }).map(inq => <InquiryRow key={inq.id} inq={inq} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: "var(--radius-sm)",
  border: "1px solid var(--line-200)", background: "#fff", cursor: "pointer", textDecoration: "none",
  transition: "all var(--dur) var(--ease-out)",
};

// ── Main CRM Panel ─────────────────────────────────────────────
type SortKey = "recientes" | "consultas" | "vistas";

export default function CRMPanel({ properties, showWelcome, ownerName }: {
  properties: PropertyWithInquiries[];
  showWelcome: boolean;
  ownerName?: string | null;
}) {
  const [items, setItems] = useState(properties);
  useEffect(() => setItems(properties), [properties]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | PropStatus>("todas");
  const [sort, setSort] = useState<SortKey>("recientes");
  const [, startTransition] = useTransition();

  const totalNew = items.reduce((acc, p) => acc + p.new_inquiries, 0);
  const totalWeek = items.reduce((acc, p) => acc + p.week_inquiries, 0);
  const totalViews = items.reduce((acc, p) => acc + (p.views ?? 0), 0);
  const activas = items.filter(p => p.status === "activa").length;

  function handleStatus(id: string, s: PropStatus) {
    setItems(prev => prev.map(p => (p.id === id ? { ...p, status: s } : p)));
    startTransition(async () => { await setPropertyStatus(id, s); });
  }

  const counts = {
    todas: items.length,
    activa: items.filter(p => p.status === "activa").length,
    pausada: items.filter(p => p.status === "pausada").length,
    vendida: items.filter(p => p.status === "vendida").length,
  };

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "todas") list = list.filter(p => p.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        (p.barrio || "").toLowerCase().includes(q) ||
        (p.ciudad || "").toLowerCase().includes(q) ||
        (p.direccion || "").toLowerCase().includes(q) ||
        p.inquiries.some(i => i.nombre.toLowerCase().includes(q) || i.email.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "consultas") sorted.sort((a, b) => b.total_inquiries - a.total_inquiries);
    else if (sort === "vistas") sorted.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [items, statusFilter, search, sort]);

  const firstName = ownerName?.trim().split(" ")[0];

  return (
    <div>
      {showWelcome && (
        <div style={{ marginBottom: 24, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-md)", padding: "12px 18px", fontFamily: "var(--font-sans)", fontSize: 14, color: "#15803D" }}>
          🎉 ¡Tu cuenta fue creada exitosamente! Ya podés publicar tu primera propiedad.
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(24px,4vw,30px)", color: "var(--navy-800)", margin: "0 0 3px" }}>
            {firstName ? `Hola, ${firstName}` : "Mi panel"}
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
            {items.length} propiedad{items.length !== 1 ? "es" : ""}
            {totalNew > 0 && <span style={{ color: "#2563EB", fontWeight: 600 }}>{" "}· {totalNew} consulta{totalNew > 1 ? "s" : ""} nueva{totalNew > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <a href="/panel/propiedades/nueva" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, background: "var(--navy-800)", color: "#fff", padding: "11px 20px", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
          <Plus size={16} strokeWidth={2.5} /> Nueva propiedad
        </a>
      </div>

      {/* KPIs */}
      {items.length > 0 && (
        <div className="grid-stats" style={{ marginBottom: 22 }}>
          {[
            { icon: Building2, label: "Activas", value: activas, color: "#22c55e" },
            { icon: Eye, label: "Visitas totales", value: totalViews, color: "var(--navy-600)" },
            { icon: CalendarClock, label: "Consultas (semana)", value: totalWeek, color: "var(--gold-700)" },
            { icon: MessageSquare, label: "Consultas nuevas", value: totalNew, color: "#3B82F6" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "15px 18px", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: `${s.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} strokeWidth={1.9} color={s.color} />
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--navy-800)", margin: "0 0 1px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: 0 }}>{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      {items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 0 }}>
            <Search size={15} strokeWidth={1.75} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar propiedad o interesado…"
              style={{ width: "100%", boxSizing: "border-box", fontFamily: "var(--font-sans)", fontSize: 14, border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "11px 16px 11px 38px", background: "#fff", color: "var(--ink-800)", outline: "none" }} />
          </div>
          {/* Sort */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ArrowUpDown size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", pointerEvents: "none" }} />
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "11px 14px 11px 34px", background: "#fff", cursor: "pointer", outline: "none" }}>
              <option value="recientes">Más recientes</option>
              <option value="consultas">Más consultas</option>
              <option value="vistas">Más vistas</option>
            </select>
          </div>
        </div>
      )}

      {/* Status filter chips */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {([
            ["todas", "Todas"], ["activa", "Activas"], ["pausada", "Pausadas"], ["vendida", "Vendidas"],
          ] as const).map(([key, label]) => {
            const on = statusFilter === key;
            return (
              <button key={key} onClick={() => setStatusFilter(key)} style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
                padding: "8px 15px", borderRadius: 999, cursor: "pointer",
                background: on ? "var(--navy-800)" : "#fff", color: on ? "#fff" : "var(--ink-600)",
                border: `1px solid ${on ? "var(--navy-800)" : "var(--line-200)"}`,
              }}>
                {label} <span style={{ opacity: 0.7 }}>{counts[key]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Property list */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--navy-800)", margin: "0 0 8px" }}>Todavía no publicaste ninguna propiedad</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>Publicá tu primera propiedad gratis y empezá a recibir consultas.</p>
          <a href="/panel/propiedades/nueva" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, background: "var(--navy-800)", color: "#fff", padding: "12px 24px", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
            <Plus size={15} strokeWidth={2.5} /> Publicar propiedad
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--ink-500)", fontFamily: "var(--font-sans)", fontSize: 14, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
          No hay propiedades que coincidan con el filtro.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => <PropertyCard key={p.id} p={p} searchQuery={search} onStatus={handleStatus} />)}
        </div>
      )}

      {/* Ecosistema banner */}
      <div style={{ marginTop: 32, background: "var(--navy-800)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, background: "rgba(185,159,102,.15)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={20} strokeWidth={1.75} color="var(--gold-400)" />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "#fff", margin: "0 0 2px" }}>Ecosistema de servicios</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.60)", margin: 0 }}>Fotografía, escribanía, mudanzas y más, para cada etapa de tu venta.</p>
          </div>
        </div>
        <a href="/#servicios" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--gold-300)", background: "rgba(185,159,102,.12)", border: "1px solid rgba(185,159,102,.35)", borderRadius: "var(--radius-sm)", padding: "9px 18px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Ver servicios →</a>
      </div>
    </div>
  );
}
