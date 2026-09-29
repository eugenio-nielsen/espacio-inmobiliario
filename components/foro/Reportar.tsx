"use client";

import { useRef, useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportar } from "@/lib/actions/foro";
import { MOTIVOS_REPORTE } from "@/lib/foro/types";

/**
 * Reportar un tema, respuesta o comentario. Abre un diálogo con el
 * motivo; con tres reportes de personas distintas el contenido se oculta
 * solo hasta que el superadmin lo revise.
 */
export default function Reportar({
  tipo,
  id,
  compacto,
}: {
  tipo: "tema" | "respuesta" | "comentario";
  id: string;
  /** Versión de texto chico, para los comentarios. */
  compacto?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await reportar(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setHecho(true);
    });
  }

  const que = tipo === "tema" ? "el tema" : tipo === "respuesta" ? "la respuesta" : "el comentario";

  return (
    <>
      {compacto ? (
        <button type="button" onClick={() => dialogo.current?.showModal()} disabled={hecho}>
          {hecho ? "Reportado" : "Reportar"}
        </button>
      ) : (
        <button type="button" className="fo-accion fo-accion-peligro" onClick={() => dialogo.current?.showModal()} disabled={hecho}>
          <Flag size={13} strokeWidth={1.8} /> {hecho ? "Reportado" : "Reportar"}
        </button>
      )}

      <dialog ref={dialogo} className="fo-dialogo" onClick={e => { if (e.target === dialogo.current) dialogo.current?.close(); }}>
        {hecho ? (
          <form method="dialog">
            <h2>Gracias por avisar</h2>
            <p className="fo-papel-sub">Lo vamos a revisar. Si no cumple las normas, lo sacamos de la Tertulia.</p>
            <div className="fo-form-pie"><button className="fo-btn fo-btn-chico">Cerrar</button></div>
          </form>
        ) : (
          <form onSubmit={enviar}>
            <input type="hidden" name="tipo" value={tipo} />
            <input type="hidden" name="id" value={id} />
            <h2>Reportar {que}</h2>
            <div className="fo-motivos" role="radiogroup" aria-label="Motivo">
              {MOTIVOS_REPORTE.map((m, i) => (
                <label key={m.valor}>
                  <input type="radio" name="motivo" value={m.valor} required defaultChecked={i === 0} />
                  {m.label}
                </label>
              ))}
            </div>
            <label className="fo-campo">
              <span>Detalle (opcional)</span>
              <textarea name="detalle" maxLength={500} placeholder="Contanos qué viste, si hace falta." />
            </label>
            {error && <p className="fo-error" role="alert">{error}</p>}
            <div className="fo-form-pie">
              <button type="submit" className="fo-btn fo-btn-chico" disabled={enviando}>{enviando ? "Enviando…" : "Enviar reporte"}</button>
              <button type="button" className="fo-enlace" onClick={() => dialogo.current?.close()}>Cancelar</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
