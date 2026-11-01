import Link from "next/link";
import { Check, ArrowRight, Plus } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";

/**
 * Las dos formas de vender, lado a lado.
 *
 * Es el bloque más importante de la página: el modelo de negocio hecho
 * visible. Hasta ahora la escalera estaba insinuada — publicar gratis
 * por un lado, acompañamiento por otro — pero nunca se mostraban juntas,
 * así que el dueño no sabía que podía elegir.
 *
 * Ninguna de las dos vías tiene comisión: la diferencia es cuánto
 * acompañamiento querés.
 */
const GRATIS = [
  "Publicás vos, en minutos",
  "Las consultas llegan a tu email y a tu panel",
  "Gestionás visitas y seguimiento desde el CRM",
  "Cerrás directo con el comprador",
];

const ACOMPANADO = [
  "Todo lo anterior, incluido",
  "Respondemos y filtramos las consultas por vos",
  "Coordinamos y acompañamos las visitas",
  "Te acompañamos en documentación y cierre",
];

export default function Escalera() {
  return (
    <div className="vd-escalera">
      {/* ── Vía 1 · autogestión ───────────────────────────── */}
      <FadeIn direction="up">
        <article className="vd-via">
          <header className="vd-via-top">
            <span className="vd-via-tag">Lo hacés vos</span>
            <p className="vd-via-precio">
              Por tu cuenta<span className="vd-via-precio-sub">sin comisión</span>
            </p>
          </header>
          <p className="vd-via-desc">
            Publicás tu propiedad, recibís las consultas directo y cerrás
            el trato sin comisión, porque no somos intermediarios. Es el
            corazón del proyecto.
          </p>
          <ul className="vd-lista">
            {GRATIS.map(t => (
              <li key={t}><Check size={14} strokeWidth={2.6} />{t}</li>
            ))}
          </ul>
          <Link href="/auth/registro" className="vd-via-cta">
            <Plus size={15} strokeWidth={2.2} />
            Publicar mi propiedad
          </Link>
        </article>
      </FadeIn>

      {/* ── Vía 2 · delegada ──────────────────────────────── */}
      <FadeIn direction="up" delay={120}>
        <article className="vd-via vd-via-destacada">
          <span className="vd-via-cinta">Con acompañamiento</span>
          <header className="vd-via-top">
            <span className="vd-via-tag">Lo hacemos juntos</span>
            <p className="vd-via-precio">
              Acompañados<span className="vd-via-precio-sub">sin comisión</span>
            </p>
          </header>
          <p className="vd-via-desc">
            Te acompañamos en la venta de principio a fin. No somos
            intermediarios: el trato lo cerrás vos, directo con el
            comprador, sin comisión.
          </p>
          <ul className="vd-lista vd-lista-clara">
            {ACOMPANADO.map(t => (
              <li key={t}><Check size={14} strokeWidth={2.6} />{t}</li>
            ))}
          </ul>
          <Link href="#contacto" className="vd-via-cta vd-via-cta-oro">
            Quiero que me acompañen
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </article>
      </FadeIn>
    </div>
  );
}
