import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PropertyListCard from "@/components/properties/PropertyListCard";
import FadeIn from "@/components/ui/FadeIn";
import type { PropertyCardData } from "@/lib/types";

/**
 * Grilla de propiedades de la home: tres filas y un botón al listado.
 *
 * Llegan hasta TOPE_HOME (3 filas de escritorio); en tablet y móvil el CSS
 * de .home-destacados oculta las que pasarían de la tercera fila, así la
 * sección ocupa lo mismo en cualquier pantalla y el resto queda en /propiedades.
 */
export default function PropiedadesHome({
  iniciales,
  totalActivas,
}: {
  iniciales: PropertyCardData[];
  totalActivas: number;
}) {
  return (
    <>
      <div className="grid-properties home-destacados">
        {iniciales.map((p, i) => (
          <FadeIn key={p.id} delay={(i % 3) * 110} direction="up">
            {/* Sin card-lift acá: la tarjeta ya lo trae, y anidados los dos
                el hover levantaba 6px en vez de 3 */}
            <PropertyListCard property={p} priority={i < 3} />
          </FadeIn>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <Link href="/propiedades" className="esbtn esbtn-primary home-ver-todas" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
          borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
          padding: "13px 26px", background: "var(--navy-800)", color: "#fff",
          textDecoration: "none",
        }}>
          {totalActivas > iniciales.length
            ? `Ver las ${totalActivas} propiedades disponibles`
            : "Ver todas las propiedades disponibles"}
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </>
  );
}
