import Link from "next/link";
import { BadgeCheck, ShieldCheck, Eye, ArrowRight, Plus } from "lucide-react";
import SelloEN from "@/components/SelloEN";
import FadeIn from "@/components/ui/FadeIn";

/**
 * Quién está detrás, con pruebas en vez de adjetivos.
 *
 * Los tres sellos no son promesas de marca: cada uno corresponde a algo
 * que el sistema efectivamente verifica (identidad del titular, dominio
 * de la propiedad, revisión previa). Hasta ahora solo se veían dentro de
 * la ficha, que es donde menos falta hacen.
 *
 * El sello giratorio es la misma pieza del footer y de /como-funciona:
 * repetirla es lo que la vuelve reconocible.
 */
const PRUEBAS = [
  { icon: BadgeCheck, t: "Propietario verificado" },
  { icon: ShieldCheck, t: "Dominio verificado" },
  { icon: Eye, t: "Cada publicación, revisada" },
];

export default function Respaldo() {
  return (
    <div className="hm-respaldo">
      <FadeIn direction="none">
        <SelloEN size={132} tono="claro" etiqueta="Fundador" className="hm-sello" />
      </FadeIn>

      <FadeIn delay={120} direction="up">
        <span className="es-eyebrow" style={{ display: "block", marginBottom: 12 }}>
          Respaldo profesional
        </span>
        <h2 className="hm-respaldo-t">
          Decisiones importantes, con <span className="hm-i">alguien detrás</span>
        </h2>
        <p className="hm-respaldo-p">
          <strong style={{ fontWeight: 600, color: "var(--navy-800)" }}>Eugenio Nielsen</strong>{" "}
          revisa cada publicación antes de que salga y acompaña cada operación.
          No hay un algoritmo del otro lado: hay una persona con nombre y apellido.
        </p>

        <div className="hm-pruebas">
          {PRUEBAS.map(p => {
            const Icon = p.icon;
            return (
              <span key={p.t} className="hm-prueba">
                <Icon size={14} strokeWidth={1.9} />
                {p.t}
              </span>
            );
          })}
        </div>

        {/* El CTA de publicar vivía en un bloque aparte que repetía el
            camino "Quiero vender". Se mudó acá para no perder la
            conversión y ahorrar una sección entera de scroll. */}
        <div className="hm-respaldo-ctas">
          <Link href="/auth/registro" className="hm-respaldo-cta hm-cta-primario">
            <Plus size={15} strokeWidth={2.2} />
            Publicar mi propiedad gratis
          </Link>
          <Link href="/como-funciona" className="hm-respaldo-cta">
            Cómo trabajamos
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
