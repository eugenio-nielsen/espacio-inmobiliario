"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, EyeOff, Flag, Pin, Search, Trash2, UserX } from "lucide-react";
import {
  cerrarReporte, fijarTema, moderarContenido, resolverVerificacion, suspenderMiembro,
} from "@/lib/actions/foro-admin";
import type { MiembroAdmin, ReporteAdmin, TemaAdmin } from "@/lib/foro/data";
import { MOTIVOS_REPORTE, etiquetaRol } from "@/lib/foro/types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
const motivo = (m: string) => MOTIVOS_REPORTE.find(x => x.valor === m)?.label ?? m;

const caja: React.CSSProperties = { background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "16px 18px" };
const titulo: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--navy-800)", margin: "28px 0 12px" };
const meta: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" };
const vacio: React.CSSProperties = { ...meta, fontStyle: "italic", padding: "8px 0" };

function Boton({ onClick, children, peligro, disabled }: { onClick: () => void; children: React.ReactNode; peligro?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
        fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        color: peligro ? "var(--danger)" : "var(--navy-800)",
        background: "#fff", border: `1px solid ${peligro ? "var(--danger-line)" : "var(--line-200)"}`,
        borderRadius: "var(--radius-sm)", opacity: disabled ? .5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Chip({ children, tono = "gris" }: { children: React.ReactNode; tono?: "gris" | "oro" | "rojo" | "verde" }) {
  const c = {
    gris: ["var(--fill-100)", "var(--ink-600)"],
    oro: ["var(--gold-100)", "var(--gold-700)"],
    rojo: ["var(--danger-bg)", "var(--danger)"],
    verde: ["var(--success-bg)", "var(--success)"],
  }[tono];
  return (
    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: c[0], color: c[1] }}>
      {children}
    </span>
  );
}

/**
 * Moderación de la Tertulia en el superadmin: reportes abiertos, pedidos
 * del distintivo de profesional, los últimos temas y los miembros.
 */
export default function ForoAdmin({
  reportes,
  temas,
  miembros,
}: {
  reportes: ReporteAdmin[];
  temas: TemaAdmin[];
  miembros: MiembroAdmin[];
}) {
  const router = useRouter();
  const [ocupado, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  function hacer(fn: () => Promise<{ ok: boolean; error?: string }>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Error");
      router.refresh();
    });
  }

  const pedidos = miembros.filter(m => m.verificacion_estado === "pendiente");
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return miembros;
    return miembros.filter(m => m.alias.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [busca, miembros]);

  return (
    <div>
      <div className="grid-stats" style={{ marginBottom: 8 }}>
        {[
          ["Reportes abiertos", reportes.length],
          ["Pedidos de verificación", pedidos.length],
          ["Temas (últimos 100)", temas.length],
          ["Miembros", miembros.length],
        ].map(([l, v]) => (
          <div key={l} style={caja}>
            <span style={meta}>{l}</span>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24, color: "var(--navy-800)", margin: "4px 0 0" }}>{v}</p>
          </div>
        ))}
      </div>

      {error && <p className="fo-error" style={{ marginTop: 12 }}>{error}</p>}

      {/* ── Reportes ── */}
      <h3 style={titulo}>Reportes abiertos</h3>
      {reportes.length === 0 ? <p style={vacio}>No hay reportes pendientes.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {reportes.map(r => (
            <div key={r.id} style={caja}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Chip tono="rojo"><Flag size={10} style={{ verticalAlign: "-1px" }} /> {motivo(r.motivo)}</Chip>
                <Chip>{r.tipo}</Chip>
                {r.estadoObjetivo === "oculto" && <Chip tono="oro">oculto</Chip>}
                <span style={meta}>{fmt(r.created_at)} · reportó {r.reportante ?? "—"} · autor {r.autor ?? "—"}</span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-700)", margin: "0 0 6px", whiteSpace: "pre-line", maxHeight: 120, overflow: "auto" }}>
                {r.texto.slice(0, 600)}
              </p>
              {r.detalle && <p style={{ ...meta, fontStyle: "italic", margin: "0 0 8px" }}>«{r.detalle}»</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.url && <Link href={r.url} target="_blank" style={{ ...meta, alignSelf: "center", color: "var(--navy-800)", fontWeight: 600 }}>Ver en el foro ↗</Link>}
                {r.estadoObjetivo === "publicado" && (
                  <Boton disabled={ocupado} onClick={() => hacer(() => moderarContenido(r.tipo, r.objetivo_id, "ocultar"))}><EyeOff size={13} /> Ocultar</Boton>
                )}
                {r.estadoObjetivo === "oculto" && (
                  <Boton disabled={ocupado} onClick={() => hacer(() => moderarContenido(r.tipo, r.objetivo_id, "restaurar"))}>Restaurar</Boton>
                )}
                {r.estadoObjetivo && (
                  <Boton peligro disabled={ocupado} onClick={() => hacer(() => moderarContenido(r.tipo, r.objetivo_id, "borrar"), "¿Borrar el contenido definitivamente?")}><Trash2 size={13} /> Borrar</Boton>
                )}
                <Boton disabled={ocupado} onClick={() => hacer(() => cerrarReporte(r.id, "descartado"))}>Descartar reporte</Boton>
                {r.autorId && (
                  <Boton peligro disabled={ocupado} onClick={() => hacer(() => suspenderMiembro(r.autorId!, true), `¿Suspender a ${r.autor}?`)}><UserX size={13} /> Suspender autor</Boton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Verificación profesional ── */}
      <h3 style={titulo}>Pedidos de «Profesional verificado»</h3>
      {pedidos.length === 0 ? <p style={vacio}>No hay pedidos pendientes.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {pedidos.map(m => (
            <div key={m.id} style={{ ...caja, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <strong style={{ fontFamily: "var(--font-sans)", color: "var(--navy-800)" }}>{m.alias}</strong>
                <span style={{ ...meta, marginLeft: 8 }}>{m.email}</span>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, margin: "4px 0 0", color: "var(--ink-700)" }}>Matrícula: <strong>{m.matricula}</strong></p>
                <p style={{ ...meta, margin: "2px 0 0" }}>Verificala en el padrón del colegio antes de aprobar.</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Boton disabled={ocupado} onClick={() => hacer(() => resolverVerificacion(m.id, true))}><BadgeCheck size={13} /> Aprobar</Boton>
                <Boton peligro disabled={ocupado} onClick={() => hacer(() => resolverVerificacion(m.id, false))}>Rechazar</Boton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Temas ── */}
      <h3 style={titulo}>Últimos temas</h3>
      {temas.length === 0 ? <p style={vacio}>Todavía no hay temas.</p> : (
        <div style={{ ...caja, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 13.5 }}>
            <tbody>
              {temas.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--line-100)" }}>
                  <td style={{ padding: "10px 14px", minWidth: 260 }}>
                    <Link href={`/foro/${t.categoria}/${t.slug}`} target="_blank" style={{ color: "var(--navy-800)", fontWeight: 600, textDecoration: "none" }}>{t.titulo}</Link>
                    <div style={meta}>{t.categoria} · {t.autor?.alias ?? "—"} · {fmt(t.created_at)} · {t.respuestas} resp. · {t.votos} votos</div>
                  </td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                    {t.estado !== "publicado" && <Chip tono={t.estado === "oculto" ? "rojo" : "oro"}>{t.estado}</Chip>}{" "}
                    {t.fijado && <Chip tono="oro">fijado</Chip>}
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", textAlign: "right" }}>
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <Boton disabled={ocupado} onClick={() => hacer(() => fijarTema(t.id, !t.fijado))}><Pin size={13} /> {t.fijado ? "Desfijar" : "Fijar"}</Boton>
                      {t.estado === "oculto"
                        ? <Boton disabled={ocupado} onClick={() => hacer(() => moderarContenido("tema", t.id, "restaurar"))}>Restaurar</Boton>
                        : <Boton disabled={ocupado} onClick={() => hacer(() => moderarContenido("tema", t.id, "ocultar"))}><EyeOff size={13} /> Ocultar</Boton>}
                      <Boton peligro disabled={ocupado} onClick={() => hacer(() => moderarContenido("tema", t.id, "borrar"), "¿Borrar el tema con todas sus respuestas?")}><Trash2 size={13} /></Boton>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Miembros ── */}
      <h3 style={titulo}>Miembros</h3>
      <label style={{ position: "relative", display: "block", maxWidth: 360, marginBottom: 12 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "var(--ink-400)" }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nombre o email"
          style={{ width: "100%", padding: "9px 12px 9px 34px", fontFamily: "var(--font-sans)", fontSize: 14, border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)" }}
        />
      </label>
      {filtrados.length === 0 ? <p style={vacio}>Sin miembros.</p> : (
        <div style={{ ...caja, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 13.5 }}>
            <tbody>
              {filtrados.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--line-100)" }}>
                  <td style={{ padding: "10px 14px", minWidth: 220 }}>
                    <Link href={`/foro/miembros/${m.handle}`} target="_blank" style={{ color: "var(--navy-800)", fontWeight: 600, textDecoration: "none" }}>{m.alias}</Link>
                    <div style={meta}>{m.email ?? "—"} · desde {fmt(m.created_at)}</div>
                  </td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                      {m.equipo && <Chip tono="oro">equipo</Chip>}
                      {etiquetaRol(m.rol) && <Chip>{etiquetaRol(m.rol)}</Chip>}
                      {m.verificado && <Chip tono="verde">verificado</Chip>}
                      {!m.email_verificado_at && <Chip tono="oro">email sin confirmar</Chip>}
                      {m.suspendido && <Chip tono="rojo">suspendido</Chip>}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", textAlign: "right" }}>
                    {!m.equipo && (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <Boton disabled={ocupado} onClick={() => hacer(() => resolverVerificacion(m.id, !m.verificado))}>
                          <BadgeCheck size={13} /> {m.verificado ? "Quitar verificado" : "Verificar"}
                        </Boton>
                        <Boton peligro={!m.suspendido} disabled={ocupado} onClick={() => hacer(() => suspenderMiembro(m.id, !m.suspendido), m.suspendido ? undefined : `¿Suspender a ${m.alias}?`)}>
                          <UserX size={13} /> {m.suspendido ? "Reactivar" : "Suspender"}
                        </Boton>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
