"use client";

import { useState, useMemo } from "react";
import TablaUsuarios from "@/components/panel/TablaUsuarios";
import ValidacionesAdmin, { type Pendiente } from "@/components/panel/ValidacionesAdmin";
import { ChevronDown, ChevronUp, Users, Building2, MessageSquare, Eye, Search, Phone, Mail, Calculator, Sliders, FileText, ShieldCheck, MessagesSquare, GraduationCap, ClipboardList } from "lucide-react";
import type { Property, Inquiry } from "@/lib/types";
import EstimadorAdmin from "@/components/panel/EstimadorAdmin";
import BlogAdmin from "@/components/panel/BlogAdmin";
import ForoAdmin from "@/components/panel/ForoAdmin";
import AuditoriaAdmin, { type AuditoriaRow } from "@/components/panel/AuditoriaAdmin";
import ConsultasAdmin, { type ConsultaRow, type BloqueadoRow } from "@/components/panel/ConsultasAdmin";
import CatedraAdmin from "@/components/panel/CatedraAdmin";
import type { CostosConfig } from "@/lib/catedra/costos";
import type { ProfesionalAdmin } from "@/lib/catedra/rubros";
import type { MiembroAdmin, ReporteAdmin, TemaAdmin } from "@/lib/foro/data";
import type { EstimadorConfig, FactorAplicado } from "@/lib/estimador/types";
import { datosDeclarados } from "@/lib/estimador/declarado";
import type { Post } from "@/lib/blog/types";

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

type HubTab = "usuarios" | "consultas" | "auditoria" | "validaciones" | "estimaciones" | "config" | "blog" | "foro" | "catedra";
const TABS: HubTab[] = ["usuarios", "consultas", "auditoria", "validaciones", "estimaciones", "config", "blog", "foro", "catedra"];

export default function SuperadminDashboard({ owners, consultas, bloqueados, auditoria, totals, estimaciones, precios, config, posts, validaciones, foro, catedra, tabInicial }: {
  owners: OwnerData[];
  consultas: ConsultaRow[];
  bloqueados: BloqueadoRow[];
  auditoria: AuditoriaRow[];
  totals: { usuarios: number; propiedades: number; consultas: number; vistas: number };
  estimaciones: EstimacionRow[];
  precios: { barrio: string; precio: number }[];
  config: EstimadorConfig;
  posts: Post[];
  validaciones: Pendiente[];
  foro: { reportes: ReporteAdmin[]; temas: TemaAdmin[]; miembros: MiembroAdmin[] };
  catedra: { config: CostosConfig; profesionales: ProfesionalAdmin[] };
  /** ?tab= de la URL: los emails del foro llevan directo a su pestaña. */
  tabInicial?: string;
}) {
  const validacionesEnEspera = validaciones.filter(v => v.estado === "pendiente").length;
  const [tab, setTab] = useState<HubTab>(TABS.includes(tabInicial as HubTab) ? (tabInicial as HubTab) : "usuarios");
  const postulaciones = catedra.profesionales.filter(p => p.estado === "postulado").length;
  const foroPendiente = foro.reportes.length + foro.miembros.filter(m => m.verificacion_estado === "pendiente").length;

  const tabs: [HubTab, string, typeof Users][] = [
    ["usuarios", `Usuarios (${owners.length})`, Users],
    ["consultas", `Consultas (${consultas.length})`, MessageSquare],
    ["auditoria", "Auditoría", ClipboardList],
    ["validaciones", `Validaciones${validacionesEnEspera ? ` (${validacionesEnEspera})` : ""}`, ShieldCheck],
    ["estimaciones", `Estimaciones (${estimaciones.length})`, Calculator],
    ["config", "Config Estimador", Sliders],
    ["blog", `Blog (${posts.length})`, FileText],
    ["foro", `Foro${foroPendiente ? ` (${foroPendiente})` : ""}`, MessagesSquare],
    ["catedra", `Cátedra${postulaciones ? ` (${postulaciones})` : ""}`, GraduationCap],
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(([k, l, Icon]) => (
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

      {tab === "usuarios" && <UsuariosTab owners={owners} totals={totals} />}
      {tab === "consultas" && <ConsultasAdmin consultas={consultas} bloqueados={bloqueados} />}
      {tab === "auditoria" && <AuditoriaAdmin filas={auditoria} />}
      {tab === "validaciones" && <ValidacionesAdmin pendientes={validaciones} />}
      {tab === "estimaciones" && <EstimadorTab estimaciones={estimaciones} />}
      {tab === "config" && <EstimadorAdmin initialPrecios={precios} initialConfig={config} />}
      {tab === "blog" && <BlogAdmin initialPosts={posts} />}
      {tab === "foro" && <ForoAdmin reportes={foro.reportes} temas={foro.temas} miembros={foro.miembros} />}
      {tab === "catedra" && <CatedraAdmin config={catedra.config} profesionales={catedra.profesionales} />}
    </div>
  );
}

function UsuariosTab({ owners, totals }: {
  owners: OwnerData[];
  totals: { usuarios: number; propiedades: number; consultas: number; vistas: number };
}) {
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

      <TablaUsuarios usuarios={owners} />
    </div>
  );
}

// ── Tab Estimador ──────────────────────────────────────────────

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
  const grupos = datosDeclarados(e.input);
  const extra = (e.resultado || {}) as { faltantes?: string[]; advertencias?: string[]; topesAplicados?: { label: string; antes: number; despues: number }[]; puntaje?: number; precioActualizado?: string; ubicacion?: { lat: number; lng: number; barrioDetectado?: string; zona?: { nombre: string; coef: number } } };
  const positivos = ((e.resultado || {}) as { factoresPositivos?: FactorAplicado[] }).factoresPositivos ?? [];
  const negativos = ((e.resultado || {}) as { factoresNegativos?: FactorAplicado[] }).factoresNegativos ?? [];
  const usd = (n: unknown) => (typeof n === "number" ? `US$ ${new Intl.NumberFormat("es-AR").format(n)}` : "—");
  const pct = (coef: number) => {
    const v = (coef - 1) * 100;
    return `${v > 0 ? "+" : "−"}${Math.abs(v).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
  };

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
          {/* Todo lo que completó en el formulario, agrupado como en el tasador */}
          <div style={{ display: "grid", gap: 16 }}>
            {grupos.map(g => (
              <div key={g.titulo}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-700)", margin: "0 0 8px" }}>{g.titulo}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10 }}>
                  {g.filas.map(([k, v]) => (
                    <div key={k}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: 0 }}>{k}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: v === "No informó" ? "var(--ink-400)" : "var(--ink-800)", margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cómo se llegó al número */}
          {r.estimado ? (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed var(--line-200)" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-700)", margin: "0 0 8px" }}>Cómo se calculó</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10, marginBottom: 12 }}>
                {([
                  ["Referencia del barrio", `${usd(r.precioM2Referencia)}/m²`],
                  ["Valor base", usd(r.valorBase)],
                  ["Índice de ajuste", `${r.indiceAjuste ?? "—"} (${(r.ajustePct ?? 0) > 0 ? "+" : ""}${r.ajustePct ?? 0}%)`],
                  ["Valor estimado", usd(r.estimado)],
                  ["Rango", `${usd(r.rangoMin)} – ${usd(r.rangoMax)}`],
                  ["Valor por m²", `${usd(r.precioM2Resultante)}/m²`],
                  ["Confianza", `${String(r.confianza ?? "—")}${extra.puntaje != null ? ` (${extra.puntaje}/100)` : ""}`],
                  ...(extra.ubicacion ? [["Ubicación", extra.ubicacion.zona ? `Zona ${extra.ubicacion.zona.nombre} (${pct(extra.ubicacion.zona.coef)})` : "Ubicada, sin zona cargada"] as [string, string]] : []),
                  ...(extra.precioActualizado ? [["Precio del barrio actualizado", new Date(extra.precioActualizado).toLocaleDateString("es-AR")] as [string, string]] : []),
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: 0 }}>{k}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-800)", margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
              {extra.ubicacion && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 8px" }}>
                  <a href={`https://www.openstreetmap.org/?mlat=${extra.ubicacion.lat}&mlon=${extra.ubicacion.lng}#map=17/${extra.ubicacion.lat}/${extra.ubicacion.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy-700)" }}>Ver la dirección en el mapa</a>
                </p>
              )}
              {extra.advertencias && extra.advertencias.length > 0 && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#92400E", margin: "0 0 8px" }}><b>Datos incoherentes:</b> {extra.advertencias.join(" ")}</p>
              )}
              {extra.faltantes && extra.faltantes.length > 0 && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 8px" }}><b>No respondió:</b> {extra.faltantes.join(", ")}</p>
              )}
              {extra.topesAplicados && extra.topesAplicados.length > 0 && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 8px" }}><b>Topes aplicados:</b> {extra.topesAplicados.map(t => `${t.label} (${pct(t.antes)} → ${pct(t.despues)})`).join("; ")}</p>
              )}
              {(positivos.length > 0 || negativos.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 14 }}>
                  {([["Lo que sumó", positivos, "#15803D"], ["Lo que restó", negativos, "#B91C1C"]] as [string, FactorAplicado[], string][]).map(([t, lista, color]) => (
                    <div key={t}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-400)", margin: "0 0 4px" }}>{t}</p>
                      {lista.length ? lista.map(f => (
                        <p key={f.label} style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-700)", margin: "0 0 2px", display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span>{f.label} <span style={{ color: "var(--ink-400)" }}>· {f.detalle}</span></span>
                          <b style={{ color }}>{pct(f.coef)}</b>
                        </p>
                      )) : <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-400)", margin: 0 }}>Ninguno</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

const contactLink: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--navy-700)", textDecoration: "none",
};
