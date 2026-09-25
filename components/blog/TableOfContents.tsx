"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TocItem } from "@/lib/blog/markdown";

const romano = (n: number) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"][n - 1] ?? String(n);

/**
 * Índice de la nota para pantallas angostas (en escritorio lo reemplaza
 * IndiceLateral, fijo al costado). Arranca cerrado para no empujar el
 * texto; numera con los mismos romanos que los subtítulos.
 */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [abierto, setAbierto] = useState(false);
  const secciones = items.filter(i => i.level === 2);
  if (secciones.length < 2) return null;

  return (
    <nav aria-label="Índice de contenidos" className="nt-toc">
      <button type="button" onClick={() => setAbierto(a => !a)} aria-expanded={abierto} className="nt-toc-boton">
        <span className="nt-toc-t">En esta nota</span>
        <span className="nt-toc-n">{secciones.length} secciones</span>
        <ChevronDown size={17} className="nt-chevron" data-abierta={abierto} />
      </button>

      {abierto && (
        <ol className="nt-toc-lista">
          {secciones.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setAbierto(false)}>
                <span className="nt-indice-n">{romano(i + 1)}</span>
                {s.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
