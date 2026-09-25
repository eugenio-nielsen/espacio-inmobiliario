import Guilloche from "@/components/ui/Guilloche";
import { portadaDe, TONOS } from "@/lib/blog/portada";
import "./blog.css";

/**
 * Portada de una nota, hecha con la identidad de la marca y no con fotos
 * de stock: el ícono de la nota en un medallón (como el sello EN) sobre
 * un guilloché, en el tono de su sección.
 *
 * Tres tamaños: "hero" (apertura de la nota y destacada del listado, con
 * marco de esquineros), "card" (tarjetas) y "fila" (miniatura del índice,
 * sin giro: en una lista larga, veinte rosetas moviéndose serían ruido).
 */
export default function PortadaNota({
  post,
  tamano = "card",
}: {
  post: { slug: string; titulo: string; categoria?: string | null };
  tamano?: "card" | "hero" | "fila";
}) {
  const { icono: Icono, tono } = portadaDe(post);
  const t = TONOS[tono];

  return (
    <div
      aria-hidden="true"
      className={`bp bp-${tamano}`}
      style={{ background: t.fondo, ["--bp-tinta" as string]: t.icono }}
    >
      <Guilloche id={`gq-${tamano}-${post.slug}`} className="bp-gq" />
      <span className="bp-medalla">
        <Icono size={tamano === "hero" ? 42 : tamano === "fila" ? 20 : 28} strokeWidth={1.15} />
      </span>
      {tamano === "hero" && <span className="bp-marco" />}
    </div>
  );
}
