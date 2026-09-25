"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/blog/markdown";

const romano = (n: number) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"][n - 1] ?? String(n);

/**
 * Índice fijo al costado de la nota (escritorio). Numera las secciones
 * con los mismos romanos que llevan los subtítulos en el texto y marca
 * en dorado la que se está leyendo.
 */
export default function IndiceLateral({ items }: { items: TocItem[] }) {
  const secciones = items.filter(i => i.level === 2);
  const [activa, setActiva] = useState<string | null>(secciones[0]?.id ?? null);

  useEffect(() => {
    const titulos = secciones
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!titulos.length) return;

    // La activa es la última sección cuyo título ya pasó el tercio superior
    const obs = new IntersectionObserver(
      () => {
        const limite = window.innerHeight * 0.33;
        let actual = titulos[0].id;
        for (const t of titulos) if (t.getBoundingClientRect().top <= limite) actual = t.id;
        setActiva(actual);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] }
    );
    titulos.forEach(t => obs.observe(t));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (secciones.length < 2) return null;

  return (
    <nav className="nt-indice" aria-label="En esta nota">
      <p className="nt-indice-t">En esta nota</p>
      <ol>
        {secciones.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={activa === s.id ? "true" : undefined}>
              <span className="nt-indice-n">{romano(i + 1)}</span>
              {s.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
