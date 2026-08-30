"use client";

import { useMemo, useState, Fragment } from "react";
import { Search, Mail, Phone, ChevronRight, ExternalLink, ArrowUpDown } from "lucide-react";
import { buildPropertyUrl } from "@/lib/utils/urls";
import type { Property, Inquiry } from "@/lib/types";

export interface FilaUsuario {
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
}

type Orden = "actividad" | "alta" | "propiedades" | "vistas" | "consultas" | "nombre";

const fmt = (n: number) => new Intl.NumberFormat("es-AR").format(n);
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function TablaUsuarios({ usuarios }: { usuarios: FilaUsuario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("actividad");
  const [expandido, setExpandido] = useState<string | null>(null);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const base = !q
      ? usuarios
      : usuarios.filter(u =>
          [u.nombre, u.email, u.telefono].filter(Boolean).join(" ").toLowerCase().includes(q) ||
          u.propiedades.some(p =>
            p.titulo.toLowerCase().includes(q) || (p.barrio || "").toLowerCase().includes(q)
          )
        );

    const copia = [...base];
    switch (orden) {
      case "alta":         return copia.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      case "propiedades":  return copia.sort((a, b) => b.totalProps - a.totalProps);
      case "vistas":       return copia.sort((a, b) => b.totalViews - a.totalViews);
      case "consultas":    return copia.sort((a, b) => b.totalInquiries - a.totalInquiries);
      case "nombre":       return copia.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
      default:             return copia.sort((a, b) => (b.totalProps - a.totalProps) || (b.totalInquiries - a.totalInquiries));
    }
  }, [usuarios, busqueda, orden]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email, propiedad o barrio…"
            style={{
              width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
              padding: "10px 14px 10px 36px", fontSize: 13.5, fontFamily: "var(--font-sans)", outline: "none",
            }}
          />
        </div>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
          padding: "0 12px", background: "#fff",
        }}>
          <ArrowUpDown size={14} color="var(--ink-400)" />
          <select
            value={orden}
            onChange={e => setOrden(e.target.value as Orden)}
            style={{ border: "none", outline: "none", background: "none", fontFamily: "var(--font-sans)", fontSize: 13, padding: "10px 0", cursor: "pointer" }}
          >
            <option value="actividad">Más activos</option>
            <option value="alta">Alta más reciente</option>
            <option value="propiedades">Más propiedades</option>
            <option value="vistas">Más vistas</option>
            <option value="consultas">Más consultas</option>
            <option value="nombre">Nombre (A–Z)</option>
          </select>
        </label>
      </div>

      <div style={{ border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", background: "#fff", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ background: "var(--fill-100)" }}>
              <Th>Usuario</Th>
              <Th>Contacto</Th>
              <Th alineado="center">Alta</Th>
              <Th alineado="center">Props.</Th>
              <Th alineado="center">Vistas</Th>
              <Th alineado="center">Consultas</Th>
            </tr>
          </thead>
          <tbody>
            {filas.map(u => {
              const abierto = expandido === u.id;
              return (
                <Fragment key={u.id}>
                  <tr
                    onClick={() => setExpandido(abierto ? null : u.id)}
                    style={{ borderTop: "1px solid var(--line-100)", cursor: "pointer", background: abierto ? "var(--navy-50)" : "#fff" }}
                  >
                    <Td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <ChevronRight
                          size={14}
                          color="var(--ink-400)"
                          style={{ transform: abierto ? "rotate(90deg)" : "none", transition: "transform .18s", flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{u.nombre || "Sin nombre"}</span>
                      </span>
                    </Td>
                    <Td>
                      <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                        <a href={`mailto:${u.email}`} style={enlace} title={u.email}>
                          <Mail size={12} /> Mail
                        </a>
                        {u.telefono ? (
                          <a
                            href={`https://wa.me/${u.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...enlace, color: "#15803D", borderColor: "#BBF7D0", background: "#F0FDF4" }}
                            title={u.telefono}
                          >
                            <Phone size={12} /> WhatsApp
                          </a>
                        ) : (
                          <span style={{ ...enlace, color: "var(--ink-400)" }}>Sin teléfono</span>
                        )}
                      </span>
                    </Td>
                    <Td alineado="center"><span style={{ color: "var(--ink-500)" }}>{fecha(u.created_at)}</span></Td>
                    <Td alineado="center"><strong>{u.totalProps}</strong></Td>
                    <Td alineado="center">{fmt(u.totalViews)}</Td>
                    <Td alineado="center">
                      <strong>{u.totalInquiries}</strong>
                      {u.nuevos > 0 && (
                        <span style={{
                          marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "2px 6px",
                          borderRadius: 999, background: "#EFF6FF", color: "#1D4ED8",
                        }}>
                          {u.nuevos} nuevas
                        </span>
                      )}
                    </Td>
                  </tr>

                  {abierto && (
                    <tr>
                      <td colSpan={6} style={{ padding: "0 14px 14px", background: "var(--navy-50)" }}>
                        {u.propiedades.length === 0 ? (
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", margin: "10px 0 0" }}>
                            Este usuario todavía no publicó propiedades.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                            {u.propiedades.map(p => (
                              <div key={p.id} style={{
                                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                                background: "#fff", border: "1px solid var(--line-200)",
                                borderRadius: "var(--radius-sm)", padding: "9px 12px",
                              }}>
                                <span style={{ flex: "1 1 220px", minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p.titulo}
                                </span>
                                <span style={dato}>{p.barrio || p.ciudad}</span>
                                <span style={dato}>{p.status}</span>
                                <span style={dato}>{fmt(p.views ?? 0)} vistas</span>
                                <span style={dato}>{p.inquiries.length} consultas</span>
                                <a href={buildPropertyUrl(p)} target="_blank" rel="noopener noreferrer" style={{ ...enlace, flexShrink: 0 }}>
                                  <ExternalLink size={12} /> Ver
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {filas.length === 0 && (
          <p style={{ textAlign: "center", padding: 28, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
            Sin resultados.
          </p>
        )}
      </div>
    </div>
  );
}

function Th({ children, alineado }: { children: React.ReactNode; alineado?: "center" }) {
  return (
    <th style={{
      textAlign: alineado ?? "left", padding: "10px 14px",
      fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
      color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".04em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

function Td({ children, alineado }: { children: React.ReactNode; alineado?: "center" }) {
  return (
    <td style={{
      textAlign: alineado ?? "left", padding: "11px 14px",
      fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-700)",
      whiteSpace: "nowrap",
    }}>
      {children}
    </td>
  );
}

const enlace: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600,
  padding: "4px 9px", borderRadius: "var(--radius-xs)",
  border: "1px solid var(--line-200)", background: "#fff",
  color: "var(--navy-700)", textDecoration: "none", whiteSpace: "nowrap",
};

const dato: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", whiteSpace: "nowrap",
};
