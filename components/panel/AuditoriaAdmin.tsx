"use client";

export interface AuditoriaRow {
  id: string;
  created_at: string;
  admin_email: string;
  accion: string;
  objetivo: string | null;
  detalle: Record<string, unknown> | null;
}

const ETIQUETAS: Record<string, string> = {
  "lead.borrar": "Borró un contacto",
  "lead.borrar_y_bloquear": "Borró y bloqueó un contacto",
  "lead.desbloquear": "Desbloqueó un contacto",
  "consulta.borrar": "Borró una consulta",
  "validacion.aprobada": "Aprobó una validación",
  "validacion.rechazada": "Rechazó una validación",
  "foro.ocultar": "Ocultó contenido del foro",
  "foro.restaurar": "Restauró contenido del foro",
  "foro.borrar": "Borró contenido del foro",
  "foro.suspender": "Suspendió un miembro del foro",
  "foro.reactivar": "Reactivó un miembro del foro",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const meta: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" };

/** Bitácora de las acciones sensibles del superadmin (las últimas 200). */
export default function AuditoriaAdmin({ filas }: { filas: AuditoriaRow[] }) {
  return (
    <div>
      <p style={{ ...meta, margin: "0 0 12px" }}>
        Registro de borrados, bloqueos, validaciones y moderación. Se muestran las últimas {filas.length}.
      </p>
      {filas.length === 0 ? (
        <p style={{ ...meta, fontStyle: "italic" }}>
          Todavía no hay acciones registradas (o falta correr la migración <code>add_admin_auditoria_bloqueos.sql</code>).
        </p>
      ) : (
        <div style={{ border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", background: "#fff", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: "var(--fill-100)" }}>
                {["Cuándo", "Acción", "Objetivo", "Detalle"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.id} style={{ borderTop: "1px solid var(--line-100)" }}>
                  <td style={td}>{fmt(f.created_at)}</td>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink-900)" }}>{ETIQUETAS[f.accion] ?? f.accion}</td>
                  <td style={td}>{f.objetivo ?? "—"}</td>
                  <td style={{ ...td, whiteSpace: "normal", wordBreak: "break-word" }}>
                    {f.detalle ? Object.entries(f.detalle).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => `${k}: ${String(v)}`).join(" · ") : "—"}
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

const td: React.CSSProperties = { padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-700)", whiteSpace: "nowrap", verticalAlign: "top" };
