import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TarjetaPropiedad from "@/components/properties/TarjetaPropiedad";
import FadeIn from "@/components/ui/FadeIn";
import type { PropertyCardData } from "@/lib/types";

/**
 * Grilla de propiedades de la home: seis y un botón al listado.
 *
 * Llegan TOPE_HOME (6): dos filas en escritorio, tres en tablet. En móvil
 * el CSS de .home-destacados deja tres, porque cada tarjeta ocupa casi una
 * pantalla y seis alejarían todo lo que viene después. El resto queda en
 * /propiedades.
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
            <TarjetaPropiedad property={p} priority={i < 3} />
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
