"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Editor, { SelectorFotos, useBorrador, useFotos } from "@/components/foro/Editor";
import Turnstile from "@/components/foro/Turnstile";
import { crearTema, editarTema } from "@/lib/actions/foro";

type CategoriaOpcion = { slug: string; nombre: string; descripcion: string };

/**
 * Abrir un tema (o editarlo). Tres cosas y nada más: en qué categoría,
 * la duda en una frase y el detalle. Las fotos son opcionales.
 */
export default function FormTema({
  categorias,
  categoriaInicial,
  inicial,
}: {
  categorias: CategoriaOpcion[];
  categoriaInicial?: string;
  inicial?: { id: string; categoria: string; titulo: string; cuerpo: string; fotos: string[] };
}) {
  const router = useRouter();
  const editando = !!inicial;
  const [categoria, setCategoria] = useState(inicial?.categoria ?? categoriaInicial ?? "");
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(inicial?.cuerpo ?? "");
  const fotos = useFotos(inicial?.fotos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [reinicio, setReinicio] = useState(0);
  const [enviando, startTransition] = useTransition();

  const borrarBorrador = useBorrador(
    editando ? null : "foro-borrador-tema",
    { categoria, titulo, cuerpo },
    b => {
      if (b.titulo) setTitulo(b.titulo);
      if (b.cuerpo) setCuerpo(b.cuerpo);
      if (b.categoria && !categoriaInicial) setCategoria(b.categoria);
    }
  );

  const elegida = categorias.find(c => c.slug === categoria);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fotos.adjuntar(fd);
    startTransition(async () => {
      const r = editando ? await editarTema(fd) : await crearTema(fd);
      if (!r.ok) {
        setError(r.error);
        setReinicio(n => n + 1);
        return;
      }
      borrarBorrador();
      router.push(r.url);
    });
  }

  return (
    <form className="fo-form" onSubmit={enviar}>
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      <fieldset className="fo-campo">
        <legend>Categoría</legend>
        <div className="fo-fichas" role="radiogroup">
          {categorias.map(c => (
            <label key={c.slug} className="fo-ficha">
              <input
                type="radio"
                name="categoria"
                value={c.slug}
                checked={categoria === c.slug}
                onChange={() => setCategoria(c.slug)}
                required
              />
              <span>{c.nombre}</span>
            </label>
          ))}
        </div>
        {elegida && <small>{elegida.descripcion}</small>}
      </fieldset>

      <label className="fo-campo fo-campo-titulo">
        <span>Tu pregunta o tema, en una frase</span>
        <input
          type="text"
          name="titulo"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ej.: ¿Cuánto tarda la escritura si el vendedor tiene una hipoteca?"
          minLength={10}
          maxLength={140}
          required
          autoComplete="off"
        />
        <small>{titulo.length > 100 ? `${titulo.length} / 140` : "Una buena pregunta se entiende sin abrir el tema."}</small>
      </label>

      <div className="fo-campo">
        <span>El detalle</span>
        <Editor
          etiqueta="El detalle del tema"
          valor={cuerpo}
          onCambio={setCuerpo}
          filas={10}
          placeholder="Contá tu caso: barrio, tipo de propiedad, en qué etapa estás y qué ya averiguaste. Cuanto más contexto, mejores respuestas."
          pie={<SelectorFotos fotos={fotos} />}
        />
      </div>

      <Turnstile reinicio={reinicio} />
      {error && <p className="fo-error" role="alert">{error}</p>}

      <div className="fo-form-pie">
        <button type="submit" className="fo-btn" disabled={enviando || fotos.preparando}>
          {enviando ? (editando ? "Guardando…" : "Publicando…") : (editando ? "Guardar cambios" : "Publicar el tema")}
          {!enviando && <ArrowRight size={15} strokeWidth={1.8} />}
        </button>
        {editando && (
          <button type="button" className="fo-enlace" onClick={() => router.back()}>Cancelar</button>
        )}
      </div>
      <p className="fo-legal">
        Al publicar aceptás las <a href="/foro/normas" target="_blank">normas de la Tertulia</a>.
        No compartas datos personales tuyos ni de terceros (DNI, teléfonos, direcciones exactas).
      </p>
    </form>
  );
}
