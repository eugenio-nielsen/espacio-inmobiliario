"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { Plus, Search, ChevronDown, ChevronUp, Star, Edit2, ExternalLink, MessageSquare, Phone, Mail, Sparkles } from "lucide-react";
import { updateInquiryStatus, toggleFavorito, markPropertyInquiriesVisto } from "@/lib/actions/inquiries";
import { deleteProperty } from "@/lib/actions/properties";
import type { PropertyWithInquiries, Inquiry, InquiryStatus } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

const PROP_STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  activa:  { dot: "#22c55e", label: "Activa" },
  pausada: { dot: "#f59e0b", label: "Pausada" },
  vendida: { dot: "#94a3b8", label: "Vendida" },
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
      border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      transition: "box-shadow var(--dur) var(--ease-out)",
    }}>
      {/* Row summary */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Star */}
        <button
          onClick={e => { e.stopPropagation(); handleFav(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
          title={fav ? "Quitar favorito" : "Marcar como favorito"}
        >
          <Star size={16} strokeWidth={1.75}
            fill={fav ? "#F59E0B" : "none"}
            color={fav ? "#F59E0B" : "var(--ink-400)"}
          />
        </button>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: "var(--navy-100)",
          color: "var(--navy-800)", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>
          {inq.nombre[0].toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink-900)" }}>
              {inq.nombre}
            </span>
            {status === "nuevo" && (
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#3B82F6", flexShrink: 0 }} />
            )}
          </div>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)",
            margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {inq.mensaje}
          </p>
        </div>

        {/* Date */}
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", flexShrink: 0 }}>
          {fmtDate(inq.created_at)}
        </span>

        {/* Status badge */}
        <span style={{
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
          padding: "4px 10px", borderRadius: 999,
          background: st.bg, color: st.color, flexShrink: 0,
        }}>
          {st.label}
        </span>

        {/* Expand */}
        <div style={{ color: "var(--ink-400)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--line-100)", padding: "16px", background: "#FAFAFA" }}>
          {/* Full message */}
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.7,
            color: "var(--ink-700, #3b362e)", margin: "0 0 16px",
            background: "#fff", padding: "12px 14px",
            borderRadius: "var(--radius-sm)", border: "1px solid var(--line-100)",
          }}>
            {inq.mensaje}
          </p>

          {/* Contact info */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <a href={`mailto:${inq.email}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--navy-700)", textDecoration: "none" }}>
              <Mail size={14} strokeWidth={1.75} />
              {inq.email}
            </a>
            {inq.telefono && (
              <a
                href={`https://wa.me/${inq.telefono.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "#15803D", textDecoration: "none" }}>
                <Phone size={14} strokeWidth={1.75} />
                {inq.telefono}
              </a>
            )}
          </div>

          {/* Status actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", marginRight: 4 }}>
              Mover a:
            </span>
            {(["nuevo", "visto", "contactado", "cerrado"] as InquiryStatus[])
              .filter(s => s !== status)
              .map(s => (
                <button
                  key={s}
                  disabled={isPending}
                  onClick={() => handleStatus(s)}
                  style={{
                    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
                    padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                    background: INQ_STATUS[s].bg, color: INQ_STATUS[s].color,
                    border: `1px solid ${INQ_STATUS[s].color}30`,
                    transition: "opacity var(--dur) var(--ease-out)",
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  {INQ_STATUS[s].label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Property CRM Card ──────────────────────────────────────────
function PropertyCard({ p, searchQuery }: { p: PropertyWithInquiries; searchQuery: string }) {
  const [open, setOpen] = useState(p.new_inquiries > 0);
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const propSt = PROP_STATUS_STYLE[p.status];

  // Filter inquiries by search query (name)
  const filteredInquiries = useMemo(() => {
    if (!searchQuery) return p.inquiries;
    const q = searchQuery.toLowerCase();
    return p.inquiries.filter(i =>
      i.nombre.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q)
    );
  }, [p.inquiries, searchQuery]);

  // When expanding, mark all 'nuevo' as 'visto'
  function handleOpen() {
    if (!open && p.new_inquiries > 0) {
      startTransition(async () => { await markPropertyInquiriesVisto(p.id); });
    }
    setOpen(o => !o);
  }

  const weekBar = Math.min(100, p.week_inquiries > 0 ? (p.week_inquiries / Math.max(p.total_inquiries, 1)) * 100 : 0);

  return (
    <div style={{
      background: "#fff", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--line-200)", overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* Property row */}
      <div className="crm-property-row">
        {/* Thumbnail */}
        <div style={{
          width: 72, height: 56, borderRadius: "var(--radius-sm)",
          overflow: "hidden", flexShrink: 0, background: "var(--fill-100)",
          position: "relative",
        }}>
          {p.fotos?.[0] ? (
            <Image src={p.fotos[0]} alt={p.titulo} fill className="object-cover" sizes="72px" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏠</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-500)" }}>
              {TIPO_LABEL[p.tipo]}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--ink-400)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 11.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: propSt.dot }} />
              <span style={{ color: "var(--ink-600)" }}>{propSt.label}</span>
            </span>
            {p.new_inquiries > 0 && (
              <span style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11,
                background: "#3B82F6", color: "#fff",
                padding: "2px 7px", borderRadius: 999,
              }}>
                {p.new_inquiries} nuevo{p.new_inquiries > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
            color: "var(--ink-900)", margin: "0 0 2px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {p.titulo}
          </p>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--gold-700)", fontWeight: 600 }}>
            {fmtPrecio(p.precio, p.moneda)}
          </span>
          {(p.barrio || p.ciudad) && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", marginLeft: 8 }}>
              {p.barrio || p.ciudad}
            </span>
          )}
        </div>

        {/* Weekly stats */}
        <div className="crm-week-stats">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22, color: p.week_inquiries > 0 ? "var(--gold-700)" : "var(--ink-400)" }}>
              {p.week_inquiries}
            </span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-500)" }}>
              / {p.total_inquiries}
            </span>
          </div>
          <div style={{ width: 64, height: 4, background: "var(--line-100)", borderRadius: 999, margin: "4px auto" }}>
            <div style={{ width: `${weekBar}%`, height: "100%", borderRadius: 999, background: p.week_inquiries > 0 ? "var(--gold-500)" : "var(--line-200)", transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--ink-400)" }}>esta semana</span>

          {/* Vistas totales */}
          {p.views != null && (
            <div style={{
              marginTop: 6,
              fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {p.views} vista{p.views !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <a href={`/panel/propiedades/${p.slug}/editar`}
            style={{ ...iconBtn, gap: 6, padding: "7px 12px", color: "var(--ink-600)", width: "auto" }}>
            <Edit2 size={14} strokeWidth={1.75} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 500 }}>Editar</span>
          </a>
          <a href={buildPropertyUrl(p)} target="_blank" rel="noopener noreferrer"
            title="Ver publicación"
            style={{ ...iconBtn, color: "var(--ink-500)" }}>
            <ExternalLink size={15} strokeWidth={1.75} />
          </a>
          <button
            onClick={handleOpen}
            style={{
              ...iconBtn,
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", width: "auto",
              background: open ? "var(--navy-50)" : "transparent",
              color: open ? "var(--navy-800)" : "var(--ink-600)",
              borderColor: open ? "var(--navy-100)" : "var(--line-200)",
            }}
          >
            <MessageSquare size={14} strokeWidth={1.75} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 500 }}>
              Consultas{p.total_inquiries > 0 ? ` (${p.total_inquiries})` : ""}
            </span>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Inquiries panel */}
      {open && (
        <div style={{ borderTop: "1px solid var(--line-100)", background: "var(--cream)", padding: "16px 20px" }}>
          {filteredInquiries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <MessageSquare size={28} strokeWidth={1} color="var(--ink-400)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: 0 }}>
                {p.total_inquiries === 0
                  ? "Todavía no recibiste consultas para esta propiedad."
                  : "Ninguna consulta coincide con la búsqueda."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Favoritas primero, luego por fecha */}
              {[...filteredInquiries]
                .sort((a, b) => {
                  if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map(inq => <InquiryRow key={inq.id} inq={inq} />)
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: "var(--radius-sm)",
  border: "1px solid var(--line-200)", background: "transparent",
  cursor: "pointer", textDecoration: "none",
  transition: "all var(--dur) var(--ease-out)",
};

// ── Main CRM Panel ─────────────────────────────────────────────
export default function CRMPanel({
  properties,
  showWelcome,
}: {
  properties: PropertyWithInquiries[];
  showWelcome: boolean;
}) {
  const [search, setSearch] = useState("");

  const totalNew = properties.reduce((acc, p) => acc + p.new_inquiries, 0);
  const totalWeek = properties.reduce((acc, p) => acc + p.week_inquiries, 0);
  const totalViews = properties.reduce((acc, p) => acc + (p.views ?? 0), 0);

  // Filter properties: match title/barrio/ciudad OR has matching inquiries
  const filtered = useMemo(() => {
    if (!search) return properties;
    const q = search.toLowerCase();
    return properties.filter(p => {
      const matchesProp =
        p.titulo.toLowerCase().includes(q) ||
        (p.barrio || "").toLowerCase().includes(q) ||
        (p.ciudad || "").toLowerCase().includes(q) ||
        (p.direccion || "").toLowerCase().includes(q);
      const matchesInquiry = p.inquiries.some(
        i => i.nombre.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
      );
      return matchesProp || matchesInquiry;
    });
  }, [properties, search]);

  return (
    <div>
      {showWelcome && (
        <div style={{
          marginBottom: 24, background: "#F0FDF4", border: "1px solid #BBF7D0",
          borderRadius: "var(--radius-md)", padding: "12px 18px",
          fontFamily: "var(--font-sans)", fontSize: 14, color: "#15803D",
        }}>
          🎉 ¡Tu cuenta fue creada exitosamente! Ya podés publicar tu primera propiedad.
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--navy-800)", margin: "0 0 2px" }}>
            Mi panel
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: 0 }}>
            {properties.length} propiedad{properties.length !== 1 ? "es" : ""}
            {totalNew > 0 && (
              <span style={{ color: "#2563EB", fontWeight: 600 }}>
                {" "}· {totalNew} consulta{totalNew > 1 ? "s" : ""} nueva{totalNew > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <a
          href="/panel/propiedades/nueva"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
            background: "var(--navy-800)", color: "#fff",
            padding: "10px 18px", borderRadius: "var(--radius-sm)",
            textDecoration: "none", transition: "background var(--dur) var(--ease-out)",
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Nueva propiedad
        </a>
      </div>

      {/* Stats strip */}
      {properties.length > 0 && (
        <div className="grid-stats">
          {[
            { label: "Propiedades activas", value: properties.filter(p => p.status === "activa").length, color: "#22c55e" },
            { label: "Visitas totales", value: totalViews, color: "var(--navy-600)" },
            { label: "Consultas esta semana", value: totalWeek, color: "var(--gold-700)" },
            { label: "Consultas nuevas", value: totalNew, color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid var(--line-200)",
              borderRadius: "var(--radius-md)", padding: "14px 18px",
              boxShadow: "var(--shadow-xs)",
            }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26, color: s.color, margin: "0 0 2px" }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {properties.length > 0 && (
        <div style={{
          position: "relative", marginBottom: 16,
        }}>
          <Search size={15} strokeWidth={1.75} style={{
            position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
            color: "var(--ink-400)", pointerEvents: "none",
          }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre del interesado o dirección de la propiedad..."
            style={{
              width: "100%", boxSizing: "border-box",
              fontFamily: "var(--font-sans)", fontSize: 14,
              border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)",
              padding: "11px 16px 11px 38px",
              background: "#fff", color: "var(--ink-800)", outline: "none",
            }}
          />
        </div>
      )}

      {/* Property list */}
      {properties.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px", background: "#fff",
          borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--navy-800)", margin: "0 0 8px" }}>
            Todavía no publicaste ninguna propiedad
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>
            Publicá tu primera propiedad gratis y empezá a recibir consultas.
          </p>
          <a href="/panel/propiedades/nueva" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            background: "var(--navy-800)", color: "#fff",
            padding: "12px 24px", borderRadius: "var(--radius-sm)", textDecoration: "none",
          }}>
            <Plus size={15} strokeWidth={2.5} /> Publicar propiedad
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--ink-500)", fontFamily: "var(--font-sans)", fontSize: 14 }}>
          No encontramos resultados para "{search}".
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => (
            <PropertyCard key={p.id} p={p} searchQuery={search} />
          ))}
        </div>
      )}

      {/* ── Banner ecosistema de servicios ────────────────────── */}
      <div style={{
        marginTop: 32,
        background: "var(--navy-800)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40, height: 40,
            background: "rgba(185,159,102,.15)",
            borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={20} strokeWidth={1.75} color="var(--gold-400)" />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "#fff", margin: "0 0 2px" }}>
              Ecosistema de servicios
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.60)", margin: 0 }}>
              Fotografía, escribanía, mudanzas y más — para cada etapa de tu venta.
            </p>
          </div>
        </div>
        <a
          href="/#servicios"
          style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
            color: "var(--gold-300)",
            background: "rgba(185,159,102,.12)",
            border: "1px solid rgba(185,159,102,.35)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 18px",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Ver servicios →
        </a>
      </div>
    </div>
  );
}
