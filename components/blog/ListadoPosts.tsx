"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PortadaNota from "@/components/blog/PortadaNota";
import FadeIn from "@/components/ui/FadeIn";

/** Lo que el índice necesita de cada nota (sin el contenido completo). */
export type NotaIndice = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  categoria: string | null;
  fecha: string;
  minutos: number;
};

/**
 * Índice completo del blog, filtrable por sección.
 *
 * Filas en vez de tarjetas: portada chica, sección, título, resumen y
 * fecha, separadas por filetes. Se lee de arriba abajo como el índice de
 * una revista y entra el doble de notas por pantalla.
 *
 * Las secciones salen de las notas publicadas, no de la lista fija: una
 * sección aparece recién cuando tiene contenido.
 */
export default function ListadoPosts({ posts }: { posts: NotaIndice[] }) {
  const [seccion, setSeccion] = useState<string>("todas");

  const secciones = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const p of posts) {
      if (!p.categoria) continue;
      cuenta.set(p.categoria, (cuenta.get(p.categoria) ?? 0) + 1);
    }
    // Más notas primero; a igualdad, alfabético
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  }, [posts]);

  const visibles = seccion === "todas" ? posts : posts.filter(p => p.categoria === seccion);

  return (
    <>
      {secciones.length > 1 && (
        <div className="bl-pestanas" role="group" aria-label="Filtrar por sección">
          <button type="button" className="bl-pestana" aria-pressed={seccion === "todas"} onClick={() => setSeccion("todas")}>
            Todas<span>{posts.length}</span>
          </button>
          {secciones.map(([nombre, n]) => (
            <button key={nombre} type="button" className="bl-pestana" aria-pressed={seccion === nombre} onClick={() => setSeccion(nombre)}>
              {nombre}<span>{n}</span>
            </button>
          ))}
        </div>
      )}

      <ul className="bl-filas">
        {visibles.map((p, i) => (
          <li key={p.id} className="bl-fila">
            <FadeIn delay={Math.min(i, 6) * 60} direction="up">
              <Link href={`/blog/${p.slug}`}>
                <span className="bl-fila-portada"><PortadaNota post={p} tamano="fila" /></span>
                <span>
                  {p.categoria && <span className="bl-fila-seccion">{p.categoria}</span>}
                  <span className="bl-fila-titulo">{p.titulo}</span>
                  {p.resumen && <span className="bl-fila-resumen">{p.resumen}</span>}
                  <span className="bl-fila-meta">{p.fecha} · {p.minutos} min de lectura</span>
                </span>
                <ArrowRight className="bl-fila-flecha" size={18} strokeWidth={1.6} />
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
    </>
  );
}
