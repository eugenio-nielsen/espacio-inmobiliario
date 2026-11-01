"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, ChevronRight, Mail, Phone, Search, Trash2 } from "lucide-react";
import { borrarConsultaAdmin, borrarContactoLead, desbloquearContacto } from "@/lib/actions/inquiries-admin";

export interface BloqueadoRow {
  id: string;
  created_at: string;
  email: string | null;
  telefono: string | null;
  nombre: string | null;
}

export interface ConsultaRow {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  status: string;
  propiedad: string;
  propietario: string;
}

interface Contacto {
  clave: string;
  nombre: string;
  email: string;
  telefono: string | null;
  consultas: ConsultaRow[];
  publicaciones: number;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
const digitos = (t?: string | null) => (t || "").replace(/\D/g, "");

const caja: React.CSSProperties = { background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)" };
const meta: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" };
const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5,
  fontWeight: 600, padding: "3px 9px", borderRadius: "var(--radius-xs)",
  border: "1px solid var(--line-200)", background: "#fff", color: "var(--navy-700)",
};

/**
 * Bandeja del superadmin con TODAS las consultas que reciben las
 * publicaciones, agrupadas por contacto. Sirve para ver qué le escriben
 * a cada propietario y para sacar de una vez a un lead falso: borrar un
 * contacto elimina sus consultas en todas las publicaciones.
 */
export default function ConsultasAdmin({ consultas, bloqueados }: { consultas: ConsultaRow[]; bloqueados: BloqueadoRow[] }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [borradas, setBorradas] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [desbloqueados, setDesbloqueados] = useState<Set<string>>(new Set());

  const vivas = useMemo(() => consultas.filter(c => !borradas.has(c.id)), [consultas, borradas]);

  // Dos consultas son del mismo contacto si comparten email o teléfono
  const contactos = useMemo(() => {
    const lista: Contacto[] = [];
    for (const c of vivas) {
      const mail = c.email.trim().toLowerCase();
      const tel = digitos(c.telefono);
      const existente = lista.find(
        x => x.email.toLowerCase() === mail || (tel.length >= 8 && digitos(x.telefono) === tel)
      );
      if (existente) {
        existente.consultas.push(c);
        if (!existente.telefono && c.telefono) existente.telefono = c.telefono;
      } else {
        lista.push({ clave: c.id, nombre: c.nombre, email: c.email, telefono: c.telefono, consultas: [c], publicaciones: 0 });
      }
    }
    for (const x of lista) x.publicaciones = new Set(x.consultas.map(c => c.propiedad)).size;
    // Quien escribió en más publicaciones primero: es el patrón del lead falso
    return lista.sort((a, b) => b.publicaciones - a.publicaciones || b.consultas.length - a.consultas.length);
  }, [vivas]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return contactos;
    return contactos.filter(x =>
      [x.nombre, x.email, x.telefono, ...x.consultas.flatMap(c => [c.propiedad, c.propietario, c.mensaje])]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [contactos, busqueda]);

  function quitar(ids: string[]) {
    setBorradas(prev => new Set([...prev, ...ids]));
  }

  function borrarContacto(x: Contacto, bloquear: boolean) {
    const ok = window.confirm(
      `¿Borrar a ${x.nombre} (${x.email}${x.telefono ? ` · ${x.telefono}` : ""})?\n\n` +
      `Se eliminan sus ${x.consultas.length} consultas en ${x.publicaciones} publicaciones. No se puede deshacer.` +
      (bloquear ? "\n\nAdemás se bloquea: si vuelve a consultar, el mensaje se descarta." : "")
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const r = await borrarContactoLead(x.email, x.telefono, { bloquear, nombre: x.nombre });
      if (!r.ok) { setError(r.error); return; }
      quitar(x.consultas.map(c => c.id));
      setAviso(`Se borraron ${r.borradas} consultas de ${x.nombre}${bloquear ? " y quedó bloqueado" : ""}.`);
      router.refresh();
    });
  }

  function desbloquear(b: BloqueadoRow) {
    if (!window.confirm(`¿Desbloquear a ${b.nombre || b.email || b.telefono}?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await desbloquearContacto(b.id);
      if (!r.ok) { setError(r.error); return; }
      setDesbloqueados(prev => new Set([...prev, b.id]));
      setAviso("Contacto desbloqueado.");
      router.refresh();
    });
  }

  const bloqueadosVivos = bloqueados.filter(b => !desbloqueados.has(b.id));

  function borrarUna(c: ConsultaRow) {
    if (!window.confirm(`¿Borrar la consulta de ${c.nombre} en "${c.propiedad}"?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await borrarConsultaAdmin(c.id);
      if (!r.ok) { setError(r.error); return; }
      quitar([c.id]);
      setAviso("Consulta borrada.");
      router.refresh();
    });
  }

  return (
    <div>
      <p style={{ ...meta, margin: "0 0 12px" }}>
        Todas las consultas que reciben las publicaciones, agrupadas por contacto (mismo email o teléfono).
        Borrar un contacto elimina sus consultas en todas las publicaciones.
      </p>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono, propiedad, propietario o mensaje…"
          style={{
            width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
            padding: "10px 14px 10px 36px", fontSize: 13.5, fontFamily: "var(--font-sans)", outline: "none",
          }}
        />
      </div>

      {error && <p style={{ ...meta, color: "var(--danger)", margin: "0 0 10px" }}>{error}</p>}
      {aviso && !error && <p style={{ ...meta, color: "var(--success)", margin: "0 0 10px" }}>{aviso}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map(x => {
          const open = abierto === x.clave;
          return (
            <div key={x.clave} style={caja}>
              <div
                onClick={() => setAbierto(open ? null : x.clave)}
                style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "11px 14px", cursor: "pointer" }}
              >
                <ChevronRight
                  size={14}
                  color="var(--ink-400)"
                  style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s", flexShrink: 0 }}
                />
                <span style={{ flex: "1 1 200px", minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>
                  {x.nombre}
                </span>
                <span style={chip}><Mail size={12} /> {x.email}</span>
                {x.telefono && <span style={chip}><Phone size={12} /> {x.telefono}</span>}
                <span style={meta}>
                  {x.consultas.length} {x.consultas.length === 1 ? "consulta" : "consultas"} · {x.publicaciones} {x.publicaciones === 1 ? "publicación" : "publicaciones"}
                </span>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={e => { e.stopPropagation(); borrarContacto(x, false); }}
                  style={{ ...chip, cursor: "pointer", color: "var(--danger)", borderColor: "var(--danger-line)", opacity: pendiente ? .5 : 1 }}
                >
                  <Trash2 size={12} /> Borrar contacto
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={e => { e.stopPropagation(); borrarContacto(x, true); }}
                  style={{ ...chip, cursor: "pointer", color: "#fff", background: "var(--danger)", borderColor: "var(--danger)", opacity: pendiente ? .5 : 1 }}
                >
                  <Ban size={12} /> Borrar y bloquear
                </button>
              </div>

              {open && (
                <div style={{ borderTop: "1px solid var(--line-100)", background: "var(--navy-50)", padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {x.consultas
                    .slice()
                    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                    .map(c => (
                      <div key={c.id} style={{ ...caja, padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                          <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-900)" }}>{c.propiedad}</strong>
                          <span style={meta}>de {c.propietario}</span>
                          <span style={meta}>{fmt(c.created_at)}</span>
                          <span style={meta}>{c.status}</span>
                          <button
                            type="button"
                            disabled={pendiente}
                            onClick={() => borrarUna(c)}
                            style={{ ...chip, marginLeft: "auto", cursor: "pointer", color: "var(--danger)", borderColor: "var(--danger-line)" }}
                          >
                            <Trash2 size={12} /> Borrar
                          </button>
                        </div>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-700)", margin: 0, whiteSpace: "pre-wrap" }}>
                          {c.mensaje}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <p style={{ ...meta, textAlign: "center", padding: 28, margin: 0 }}>Sin consultas.</p>
        )}
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--navy-800)", margin: "26px 0 4px" }}>
        Contactos bloqueados ({bloqueadosVivos.length})
      </h3>
      <p style={{ ...meta, margin: "0 0 10px" }}>Si escriben de nuevo, la consulta se descarta sin avisarles ni notificar al propietario.</p>
      {bloqueadosVivos.length === 0 ? (
        <p style={{ ...meta, fontStyle: "italic" }}>No hay contactos bloqueados.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bloqueadosVivos.map(b => (
            <div key={b.id} style={{ ...caja, padding: "9px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-900)" }}>{b.nombre || "Sin nombre"}</strong>
              {b.email && <span style={chip}><Mail size={12} /> {b.email}</span>}
              {b.telefono && <span style={chip}><Phone size={12} /> {b.telefono}</span>}
              <span style={meta}>{fmt(b.created_at)}</span>
              <button type="button" disabled={pendiente} onClick={() => desbloquear(b)} style={{ ...chip, marginLeft: "auto", cursor: "pointer" }}>
                Desbloquear
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
