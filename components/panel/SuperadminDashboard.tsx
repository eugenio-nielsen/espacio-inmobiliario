"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Users, Building2, MessageSquare, Eye, Search, ExternalLink, Phone, Mail, Calculator } from "lucide-react";
import type { Property, Inquiry } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

export interface EstimacionRow {
  id: string;
  created_at: string;
  barrio: string | null;
  input: Record<string, unknown> | null;
  resultado: Record<string, unknown> | null;
  lead_nombre: string | null;
  lead_email: string | null;
  lead_telefono: string | null;
}

export interface OwnerData {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  created_at: string;
  propiedades: (Property & { inquiries: Inquiry[] })[];
  totalProps: number;
  totalViews: number;
  totalInquiries: number;
  nuevos: number;
  semana: number;
}

const INQ_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  nuevo:      { label: "Nuevo",      bg: "#EFF6FF", color: "#1D4ED8" },
  visto:      { label: "Visto",      bg: "#F1F5F9", color: "#475569" },
  contactado: { label: "Contactado", bg: "#FFFBEB", color: "#B45309" },
  cerrado:    { label: "Cerrado",    bg: "#F0FDF4", color: "#15803D" },
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
const fmtPrecio = (p: number, m: string) => `${m === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(p))}`;

export default function SuperadminDashboard({ owners, totals, estimaciones }: {
  owners: OwnerData[];
  totals: { usuarios: number; propiedades: number; consultas: number; vistas: number };
  estimaciones: EstimacionRow[];
}) {
  const [tab, setTab] = useState<"usuarios" | "estimador">("usuarios");

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([["usuarios", `Usuarios (${owners.length})`, Users], ["estimador", `Estimador (${estimaciones.length})`, Calculator]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
            padding: "9px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: tab === k ? "var(--navy-800)" : "#fff",
            color: tab === k ? "#fff" : "var(--ink-600)",
            border: `1px solid ${tab === k ? "var(--navy-800)" : "var(--line-200)"}`,
          }}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "usuarios"
        ? <UsuariosTab owners={owners} totals={totals} />
        : <EstimadorTab estimaciones={estimaciones} />}
    </div>
  );
}

function UsuariosTab({ owners, totals }: {
  owners: OwnerData[];
  totals: { usuarios: number; propiedades: number; consultas: number; vistas: number };
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return owners;
    const q = search.toLowerCase();
    return owners.filter(o =>
      o.nombre?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.propiedades.some(p => p.titulo.toLowerCase().includes(q) || (p.barrio || "").toLowerCase().includes(q))
    );
  }, [search, owners]);

  return (
    <div>
      {/* Stats globales */}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        {[
          { icon: Users, label: "Usuarios", value: totals.usuarios, color: "var(--navy-600)" },
          { icon: Building2, label: "Propiedades", value: totals.propiedades, color: "#22c55e" },
          { icon: Eye, label: "Visitas totales", value: totals.vistas, color: "var(--gold-700)" },
          { icon: MessageSquare, label: "Consultas", value: totals.consultas, color: "#3B82F6" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <Icon size={15} color={s.color} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>{s.label}</span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por dueño, email, propiedad o barrio…"
          style={{ width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)", padding: "11px 14px 11px 36px", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none" }}
        />
      </div>

      {/* Lista de dueños */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(owner => <OwnerCard key={owner.id} owner={owner} />)}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: 32, fontFamily: "var(--font-sans)", color: "var(--ink-500)" }}>Sin resultados.</p>
        )}
      </div>
    </div>
  );
}

// ── Tab Estimador ──────────────────────────────────────────────
const ESTADO_LABEL: Record<string, string> = {
  a_reciclar: "A reciclar", bueno: "Bueno", muy_bueno: "Muy bueno", a_estrenar: "A estrenar",
};
const CAT_LABEL: Record<string, string> = { regular: "Regular", estandar: "Estándar", premium: "Premium" };

function EstimadorTab({ estimaciones }: { estimaciones: EstimacionRow[] }) {
  const [search, setSearch] = useState("");

  const conLead = estimaciones.filter(e => e.lead_nombre || e.lead_email);

  const filtered = useMemo(() => {
    if (!search) return estimaciones;
    const q = search.toLowerCase();
    return estimaciones.filter(e =>
      (e.lead_nombre || "").toLowerCase().includes(q) ||
      (e.lead_email || "").toLowerCase().includes(q) ||
      (e.barrio || "").toLowerCase().includes(q)
    );
  }, [search, estimaciones]);

  return (
    <div>
      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        {[
          { icon: Calculator, label: "Estimaciones", value: estimaciones.length, color: "var(--navy-600)" },
          { icon: Mail, label: "Con contacto (leads)", value: conLead.length, color: "#22c55e" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <Icon size={15} color={s.color} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>{s.label}</span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o barrio…"
          style={{ width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)", padding: "11px 14px 11px 36px", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(e => <EstimacionCard key={e.id} e={e} />)}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: 32, fontFamily: "var(--font-sans)", color: "var(--ink-500)" }}>
            {estimaciones.length === 0 ? "Todavía nadie usó el estimador con sus datos de contacto." : "Sin resultados."}
          </p>
        )}
      </div>
    </div>
  );
}

function EstimacionCard({ e }: { e: EstimacionRow }) {
  const [open, setOpen] = useState(false);
  const r = (e.resultado || {}) as Record<string, number>;
  const i = (e.input || {}) as Record<string, unknown>;
  const num = (k: string) => (typeof i[k] === "number" ? (i[k] as number) : undefined);
  const bool = (k: string) => i[k] === true;

  const detalles: [string, string][] = [
    ["M² cubiertos", String(num("m2Cubiertos") ?? "—")],
    ["M² balcón", String(num("m2Semicubierto") ?? 0)],
    ["M² patio/terraza", String(num("m2Descubiertos") ?? 0)],
    ["Ambientes", String(num("ambientes") ?? "—")],
    ["Dormitorios", String(num("dormitorios") ?? "—")],
    ["Baños", String(num("banos") ?? "—")],
    ["Antigüedad", num("antiguedad") != null ? `${num("antiguedad")} años` : "—"],
    ["Piso", String(num("piso") ?? "—")],
    ["Estado", ESTADO_LABEL[String(i.estado)] || "—"],
    ["Categoría", CAT_LABEL[String(i.categoria)] || "—"],
    ["Cochera", bool("cochera") ? "Sí" : "No"],
    ["Baulera", bool("baulera") ? "Sí" : "No"],
    ["Vecinos especiales", bool("vecinosEspeciales") ? "Sí" : "No"],
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-900)" }}>
              {e.lead_nombre || "Sin contacto"}
            </span>
            {e.barrio && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>· {e.barrio}</span>}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.lead_email || "—"} · {fmtDate(e.created_at)}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--gold-700)", margin: 0 }}>
            {r.estimado ? `US$ ${new Intl.NumberFormat("es-AR").format(r.estimado)}` : "—"}
          </p>
          {r.rangoMin && r.rangoMax ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: 0 }}>
              {new Intl.NumberFormat("es-AR").format(r.rangoMin)} – {new Intl.NumberFormat("es-AR").format(r.rangoMax)}
            </p>
          ) : null}
        </div>
        {open ? <ChevronUp size={18} color="var(--ink-400)" /> : <ChevronDown size={18} color="var(--ink-400)" />}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--line-100)", padding: 16, background: "var(--cream)" }}>
          {(e.lead_email || e.lead_telefono) && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
              {e.lead_email && <a href={`mailto:${e.lead_email}`} style={contactLink}><Mail size={13} /> {e.lead_email}</a>}
              {e.lead_telefono && <a href={`https://wa.me/${e.lead_telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={contactLink}><Phone size={13} /> {e.lead_telefono}</a>}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 10 }}>
            {detalles.map(([k, v]) => (
              <div key={k}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: 0 }}>{k}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-800)", margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
          {r.confianza ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: "12px 0 0" }}>
              Valor/m²: <strong>US$ {r.precioM2Resultante ? new Intl.NumberFormat("es-AR").format(r.precioM2Resultante) : "—"}</strong> · Confianza: <strong>{String(r.confianza)}</strong>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function OwnerCard({ owner }: { owner: OwnerData }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      {/* Header del dueño */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
        background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 999, background: "var(--navy-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
          {owner.nombre?.[0]?.toUpperCase() || "U"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-900)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {owner.nombre || "Sin nombre"}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {owner.email} · alta {fmtDate(owner.created_at)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }} className="superadmin-owner-stats">
          <Stat n={owner.totalProps} l="props" />
          <Stat n={owner.totalViews} l="vistas" />
          <Stat n={owner.totalInquiries} l="consultas" highlight={owner.nuevos > 0 ? owner.nuevos : undefined} />
        </div>
        {open ? <ChevronUp size={18} color="var(--ink-400)" /> : <ChevronDown size={18} color="var(--ink-400)" />}
      </button>

      {/* Detalle */}
      {open && (
        <div style={{ borderTop: "1px solid var(--line-100)", padding: 16, background: "var(--fill-50, #FAFAF8)" }}>
          {/* contacto */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <a href={`mailto:${owner.email}`} style={contactLink}><Mail size={13} /> {owner.email}</a>
            {owner.telefono && <a href={`https://wa.me/${owner.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={contactLink}><Phone size={13} /> {owner.telefono}</a>}
          </div>

          {owner.propiedades.length === 0 ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-400)", margin: 0 }}>Este usuario no publicó propiedades.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {owner.propiedades.map(p => <PropertyBlock key={p.id} p={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PropertyBlock({ p }: { p: Property & { inquiries: Inquiry[] } }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink-900)" }}>{p.titulo}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--gold-700)", fontWeight: 600 }}>{fmtPrecio(p.precio, p.moneda)}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)" }}>{p.barrio || p.ciudad}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)" }}>
          <Eye size={12} /> {p.views ?? 0}
        </span>
        <a href={buildPropertyUrl(p)} target="_blank" rel="noopener noreferrer" title="Ver publicación" style={{ marginLeft: "auto", color: "var(--ink-400)", display: "flex" }}>
          <ExternalLink size={14} />
        </a>
      </div>

      {p.inquiries.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-400)", margin: 0 }}>Sin consultas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {p.inquiries.map(inq => {
            const st = INQ_STATUS[inq.status] || INQ_STATUS.nuevo;
            return (
              <div key={inq.id} style={{ background: "var(--cream)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink-900)" }}>{inq.nombre}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", marginLeft: "auto" }}>{fmtDate(inq.created_at)}</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: inq.mensaje ? 5 : 0 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)" }}>{inq.email}</span>
                  {inq.telefono && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)" }}>{inq.telefono}</span>}
                </div>
                {inq.mensaje && (
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>"{inq.mensaje}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ n, l, highlight }: { n: number; l: string; highlight?: number }) {
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "var(--navy-800)", margin: 0, lineHeight: 1 }}>{n}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--ink-400)", margin: "2px 0 0" }}>{l}</p>
      {highlight ? (
        <span style={{ position: "absolute", top: -8, right: -10, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 9.5, background: "#3B82F6", color: "#fff", padding: "1px 5px", borderRadius: 999 }}>+{highlight}</span>
      ) : null}
    </div>
  );
}

const contactLink: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--navy-700)", textDecoration: "none",
};
