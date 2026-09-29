"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import Reportar from "@/components/foro/Reportar";
import { borrarComentario, comentar, editarComentario } from "@/lib/actions/foro";

export type ComentarioVista = {
  id: string;
  cuerpo: string;
  /** Ya formateado en el servidor ("hace 3 h"). */
  cuando: string;
  editado: boolean;
  propio: boolean;
  autor: { alias: string; handle: string; equipo: boolean };
};

const MAX = 800;

/**
 * Comentarios debajo de una respuesta: un solo nivel, texto plano y
 * cortos (hasta 800 caracteres). Sirven para pedir una aclaración o
 * sumar un dato; si hace falta más, se escribe otra respuesta.
 */
export default function Comentarios({
  respuestaId,
  comentarios,
  sesion,
  volver,
}: {
  respuestaId: string;
  comentarios: ComentarioVista[];
  sesion: boolean;
  volver: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await comentar(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setTexto("");
      setAbierto(false);
      router.refresh();
    });
  }

  function guardarEdicion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await editarComentario(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEditando(null);
      router.refresh();
    });
  }

  function borrar(id: string) {
    if (!window.confirm("¿Borrar tu comentario?")) return;
    startTransition(async () => {
      const r = await borrarComentario(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {comentarios.length > 0 && (
        <ul className="fo-coms">
          {comentarios.map(c => (
            <li key={c.id} className="fo-com" id={`c-${c.id}`}>
              {editando === c.id ? (
                <form className="fo-com-form" onSubmit={guardarEdicion} style={{ marginTop: 0 }}>
                  <input type="hidden" name="id" value={c.id} />
                  <textarea name="cuerpo" value={textoEdicion} onChange={e => setTextoEdicion(e.target.value)} maxLength={MAX} autoFocus aria-label="Editar el comentario" />
                  <div className="fo-com-form-pie">
                    <button type="submit" className="fo-btn fo-btn-chico" disabled={enviando}>Guardar</button>
                    <button type="button" className="fo-enlace" onClick={() => setEditando(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <span style={{ whiteSpace: "pre-line" }}>{c.cuerpo}</span>
                  <span className="fo-com-pie">
                    — <Link href={`/foro/miembros/${c.autor.handle}`}>{c.autor.alias}</Link>
                    {c.autor.equipo && " · Espacio Inmobiliario"} · {c.cuando}{c.editado && " · editado"}
                    {c.propio && (
                      <>
                        <button type="button" onClick={() => { setEditando(c.id); setTextoEdicion(c.cuerpo); }}>editar</button>
                        <button type="button" onClick={() => borrar(c.id)}>borrar</button>
                      </>
                    )}
                    {sesion && !c.propio && <Reportar tipo="comentario" id={c.id} compacto />}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!sesion ? (
        <p className="fo-com-abrir">
          <Link href={`/foro/unirse?volver=${encodeURIComponent(volver)}`} className="fo-accion">
            <MessageSquare size={13} strokeWidth={1.8} /> Comentar
          </Link>
        </p>
      ) : abierto ? (
        <form className="fo-com-form" onSubmit={enviar}>
          <input type="hidden" name="respuesta_id" value={respuestaId} />
          <textarea
            name="cuerpo"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            maxLength={MAX}
            placeholder="Una aclaración, una pregunta o un dato que suma."
            autoFocus
            aria-label="Tu comentario"
          />
          <div className="fo-com-form-pie">
            <button type="submit" className="fo-btn fo-btn-chico" disabled={enviando || texto.trim().length < 2}>
              {enviando ? "Enviando…" : "Comentar"}
            </button>
            <button type="button" className="fo-enlace" onClick={() => setAbierto(false)}>Cancelar</button>
            <small>{texto.length > MAX * 0.8 ? `${texto.length} / ${MAX}` : ""}</small>
          </div>
        </form>
      ) : (
        <p className="fo-com-abrir">
          <button type="button" className="fo-accion" onClick={() => setAbierto(true)}>
            <MessageSquare size={13} strokeWidth={1.8} /> Comentar
          </button>
        </p>
      )}
      {error && <p className="fo-error" role="alert" style={{ marginTop: 10 }}>{error}</p>}
    </div>
  );
}
