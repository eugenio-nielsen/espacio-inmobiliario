"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Editor, { SelectorFotos, useBorrador, useFotos } from "@/components/foro/Editor";
import { editarRespuesta, responder } from "@/lib/actions/foro";

/**
 * Responder un tema, o editar una respuesta propia (con `inicial`).
 * Tras publicar, la página se refresca y la respuesta aparece en su lugar.
 */
export default function FormRespuesta({
  temaId,
  inicial,
  alTerminar,
}: {
  temaId: string;
  inicial?: { id: string; cuerpo: string; fotos: string[] };
  alTerminar?: () => void;
}) {
  const router = useRouter();
  const editando = !!inicial;
  const [cuerpo, setCuerpo] = useState(inicial?.cuerpo ?? "");
  const fotos = useFotos(inicial?.fotos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<React.ReactNode>(null);
  const [enviando, startTransition] = useTransition();

  const borrarBorrador = useBorrador(
    editando ? null : `foro-borrador-resp:${temaId}`,
    { cuerpo },
    b => { if (b.cuerpo) setCuerpo(b.cuerpo); }
  );

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    const fd = new FormData(e.currentTarget);
    fotos.adjuntar(fd);
    startTransition(async () => {
      const r = editando ? await editarRespuesta(fd) : await responder(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      borrarBorrador();
      if (editando) {
        alTerminar?.();
        router.refresh();
        return;
      }
      setCuerpo("");
      fotos.vaciar();
      setAviso(<><strong>Listo, tu respuesta ya está publicada.</strong> Te avisamos por email si alguien la comenta.</>);
      router.refresh();
    });
  }

  return (
    <form className="fo-form" onSubmit={enviar} style={{ gap: 14 }}>
      <input type="hidden" name={editando ? "id" : "tema_id"} value={editando ? inicial!.id : temaId} />
      <Editor
        etiqueta={editando ? "Editar la respuesta" : "Tu respuesta"}
        valor={cuerpo}
        onCambio={setCuerpo}
        filas={editando ? 6 : 7}
        autoFocus={editando}
        placeholder="Compartí lo que sabés o viviste. Si citás un dato, contá de dónde sale."
        pie={<SelectorFotos fotos={fotos} />}
      />
      {error && <p className="fo-error" role="alert">{error}</p>}
      {aviso && <p className="fo-ok" role="status">{aviso}</p>}
      <div className="fo-form-pie">
        <button type="submit" className="fo-btn" disabled={enviando || fotos.preparando || cuerpo.trim().length < 2}>
          {enviando ? "Enviando…" : editando ? "Guardar cambios" : "Publicar respuesta"}
          {!enviando && <ArrowRight size={15} strokeWidth={1.8} />}
        </button>
        {editando && <button type="button" className="fo-enlace" onClick={alTerminar}>Cancelar</button>}
      </div>
    </form>
  );
}
