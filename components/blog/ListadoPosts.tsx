"use client";

import { useMemo, useState } from "react";
import PostCard from "@/components/blog/PostCard";
import FadeIn from "@/components/ui/FadeIn";
import type { Post } from "@/lib/blog/types";

/**
 * Listado del blog con filtro por sección.
 *
 * Las categorías salen de las notas publicadas, no de la lista fija:
 * así una sección aparece recién cuando tiene contenido, y desaparece
 * sola si se despublica todo lo que tenía.
 */
export default function ListadoPosts({ posts }: { posts: Post[] }) {
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
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 26 }}>
          <Chip activo={seccion === "todas"} onClick={() => setSeccion("todas")} label={`Todas (${posts.length})`} />
          {secciones.map(([nombre, n]) => (
            <Chip
              key={nombre}
              activo={seccion === nombre}
              onClick={() => setSeccion(nombre)}
              label={`${nombre} (${n})`}
            />
          ))}
        </div>
      )}

      <div className="grid-properties">
        {visibles.map((p, i) => (
          <FadeIn key={p.id} delay={(i % 3) * 90} direction="up">
            <PostCard post={p} />
          </FadeIn>
        ))}
      </div>
    </>
  );
}

function Chip({ activo, onClick, label }: { activo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
        padding: "8px 15px", borderRadius: 999, cursor: "pointer",
        border: `1px solid ${activo ? "var(--navy-800)" : "var(--line-200)"}`,
        background: activo ? "var(--navy-800)" : "#fff",
        color: activo ? "#fff" : "var(--ink-600)",
        transition: "all var(--dur) var(--ease-out)",
      }}
    >
      {label}
    </button>
  );
}
