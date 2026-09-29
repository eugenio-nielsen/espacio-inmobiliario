"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Link2, Pencil, Share2, Trash2 } from "lucide-react";
import Reportar from "@/components/foro/Reportar";
import FormRespuesta from "@/components/foro/FormRespuesta";
import { borrarRespuesta, borrarTema, marcarSolucion } from "@/lib/actions/foro";

/** Compartir: el menú del teléfono si existe; si no, copia el enlace. */
export function Compartir({ titulo, hash, etiqueta = "Compartir" }: { titulo: string; hash?: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = `${window.location.origin}${window.location.pathname}${hash ? `#${hash}` : ""}`;
    if (!hash && navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        // cancelado: se copia igual
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {}
  }

  const Icono = hash ? Link2 : Share2;
  return (
    <button type="button" className="fo-accion" onClick={compartir}>
      <Icono size={13} strokeWidth={1.8} /> {copiado ? "Enlace copiado" : etiqueta}
    </button>
  );
}

/** Acciones bajo el planteo del tema. */
export function AccionesTema({
  id,
  titulo,
  propio,
  borrable,
  sesion,
}: {
  id: string;
  titulo: string;
  propio: boolean;
  borrable: boolean;
  sesion: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [borrando, startTransition] = useTransition();

  function borrar() {
    if (!window.confirm("¿Borrar el tema? No se puede deshacer.")) return;
    startTransition(async () => {
      const r = await borrarTema(id);
      if (!r.ok) setError(r.error);
      else router.push(r.url);
    });
  }

  return (
    <>
      <div className="fo-acciones">
        <Compartir titulo={titulo} />
        {propio && (
          <Link href={`/foro/editar/${id}`} className="fo-accion"><Pencil size={13} strokeWidth={1.8} /> Editar</Link>
        )}
        {propio && borrable && (
          <button type="button" className="fo-accion fo-accion-peligro" onClick={borrar} disabled={borrando}>
            <Trash2 size={13} strokeWidth={1.8} /> {borrando ? "Borrando…" : "Borrar"}
          </button>
        )}
        {sesion && !propio && <Reportar tipo="tema" id={id} />}
      </div>
      {error && <p className="fo-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </>
  );
}

/**
 * El cuerpo de una respuesta con sus acciones. El texto llega ya
 * renderizado desde el servidor (children); al editar, se reemplaza por
 * el editor con el Markdown original.
 */
export function BloqueRespuesta({
  id,
  temaId,
  cuerpo,
  fotos,
  propio,
  borrable,
  sesion,
  esAutorTema,
  esSolucion,
  children,
}: {
  id: string;
  temaId: string;
  cuerpo: string;
  fotos: string[];
  propio: boolean;
  borrable: boolean;
  sesion: boolean;
  esAutorTema: boolean;
  esSolucion: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, startTransition] = useTransition();

  function solucion() {
    setError(null);
    startTransition(async () => {
      const r = await marcarSolucion(temaId, esSolucion ? null : id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function borrar() {
    if (!window.confirm("¿Borrar tu respuesta? No se puede deshacer.")) return;
    startTransition(async () => {
      const r = await borrarRespuesta(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  if (editando) {
    return (
      <FormRespuesta
        temaId={temaId}
        inicial={{ id, cuerpo, fotos }}
        alTerminar={() => setEditando(false)}
      />
    );
  }

  return (
    <>
      {children}
      <div className="fo-acciones">
        {esAutorTema && (
          <button type="button" className="fo-accion fo-accion-oro" onClick={solucion} disabled={ocupado}>
            <CircleCheck size={14} strokeWidth={1.8} />
            {esSolucion ? "Quitar como solución" : "Me resolvió la duda"}
          </button>
        )}
        <Compartir titulo="" hash={`r-${id}`} etiqueta="Enlace" />
        {propio && (
          <button type="button" className="fo-accion" onClick={() => setEditando(true)}>
            <Pencil size={13} strokeWidth={1.8} /> Editar
          </button>
        )}
        {propio && borrable && (
          <button type="button" className="fo-accion fo-accion-peligro" onClick={borrar} disabled={ocupado}>
            <Trash2 size={13} strokeWidth={1.8} /> Borrar
          </button>
        )}
        {sesion && !propio && <Reportar tipo="respuesta" id={id} />}
      </div>
      {error && <p className="fo-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </>
  );
}
