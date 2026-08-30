"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

const RE_H2 = /<h2 id="([^"]*)">([\s\S]*?)<\/h2>/g;

type Seccion = { id: string; tituloHtml: string; cuerpoHtml: string };

/**
 * Cuerpo de la nota con cada sección (h2) plegable.
 *
 * El contenido siempre se renderiza y solo se oculta con CSS: así sigue
 * estando en el HTML para los buscadores, y el usuario decide qué abrir.
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
    return <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const todasCerradas = cerradas.size === secciones.length;

  return (
    <>
      {intro.trim() && (
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: intro }} />
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", margin: "4px 0 -8px" }}>
        <button
          type="button"
          onClick={() => setCerradas(todasCerradas ? new Set() : new Set(secciones.map(s => s.id)))}
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
            color: "var(--ink-500)", background: "none", border: "none",
            cursor: "pointer", padding: "4px 2px",
          }}
        >
          {todasCerradas ? "Abrir todas las secciones" : "Cerrar todas las secciones"}
        </button>
      </div>

      {secciones.map(s => {
        const abierta = !cerradas.has(s.id);
        return (
          <div key={s.id} className="blog-prose nota-seccion">
            <h2 id={s.id}>
              <button
                type="button"
                className="nota-toggle"
                onClick={() => alternar(s.id)}
                aria-expanded={abierta}
                aria-controls={`cuerpo-${s.id}`}
              >
                <span dangerouslySetInnerHTML={{ __html: s.tituloHtml }} />
                <ChevronDown
                  size={20}
                  className="nota-chevron"
                  style={{ transform: abierta ? "rotate(180deg)" : "none" }}
                />
              </button>
            </h2>
            <div
              id={`cuerpo-${s.id}`}
              className="nota-cuerpo"
              hidden={!abierta}
              dangerouslySetInnerHTML={{ __html: s.cuerpoHtml }}
            />
          </div>
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
