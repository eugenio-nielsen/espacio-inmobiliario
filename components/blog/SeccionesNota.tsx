"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

const RE_H2 = /<h2 id="([^"]*)">([\s\S]*?)<\/h2>/g;

type Seccion = { id: string; tituloHtml: string; cuerpoHtml: string };

/**
 * Cuerpo de la nota, partido en secciones (una por h2).
 *
 * La primera mitad se lee de corrido, como un artículo: plegar desde el
 * arranque cortaba la lectura. De la mitad en adelante, cada sección se
 * puede plegar para saltar a lo que interesa, pero arranca abierta.
 *
 * El contenido siempre se renderiza y solo se oculta con `hidden`: así
 * sigue en el HTML para los buscadores.
 */
export default function SeccionesNota({ html }: { html: string }) {
  const { intro, secciones } = useMemo(() => partir(html), [html]);
  const [cerradas, setCerradas] = useState<Set<string>>(new Set());

  const alternar = (id: string) =>
    setCerradas(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  if (!secciones.length) {
    return <div className="nt-prosa" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const mitad = Math.ceil(secciones.length / 2);

  return (
    <>
      {intro.trim() && <div className="nt-prosa nt-intro" dangerouslySetInnerHTML={{ __html: intro }} />}

      {secciones.map((s, i) => {
        if (i < mitad) {
          return (
            <section key={s.id} className="nt-prosa nt-seccion">
              <h2 id={s.id} dangerouslySetInnerHTML={{ __html: s.tituloHtml }} />
              <div dangerouslySetInnerHTML={{ __html: s.cuerpoHtml }} />
            </section>
          );
        }
        const abierta = !cerradas.has(s.id);
        return (
          <section key={s.id} className="nt-prosa nt-seccion nt-plegable">
            <h2 id={s.id}>
              <button
                type="button"
                className="nt-toggle"
                onClick={() => alternar(s.id)}
                aria-expanded={abierta}
                aria-controls={`cuerpo-${s.id}`}
              >
                <span dangerouslySetInnerHTML={{ __html: s.tituloHtml }} />
                <ChevronDown size={20} className="nt-chevron" data-abierta={abierta} />
              </button>
            </h2>
            <div id={`cuerpo-${s.id}`} hidden={!abierta} dangerouslySetInnerHTML={{ __html: s.cuerpoHtml }} />
          </section>
        );
      })}
    </>
  );
}

/** Separa el HTML en la introducción y una sección por cada h2. */
function partir(html: string): { intro: string; secciones: Seccion[] } {
  const marcas: { id: string; tituloHtml: string; inicio: number; fin: number }[] = [];
  RE_H2.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_H2.exec(html)) !== null) {
    marcas.push({ id: m[1], tituloHtml: m[2], inicio: m.index, fin: m.index + m[0].length });
  }

  if (!marcas.length) return { intro: html, secciones: [] };

  const intro = html.slice(0, marcas[0].inicio);
  const secciones = marcas.map((marca, i) => ({
    id: marca.id,
    tituloHtml: marca.tituloHtml,
    cuerpoHtml: html.slice(marca.fin, i + 1 < marcas.length ? marcas[i + 1].inicio : html.length),
  }));

  return { intro, secciones };
}
