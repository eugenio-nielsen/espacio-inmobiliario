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
 * El camino gratuito va primero y no en letra chica: es cierto que es
 * gratis para siempre, y esconderlo para empujar al pago erosionaría
 * justo la confianza que el resto del sitio construye.
 */
const GRATIS = [
  "Publicás vos, en minutos",
  "Las consultas llegan a tu email y a tu panel",
  "Gestionás visitas y seguimiento desde el CRM",
  "Cerrás directo con el comprador",
];

const ACOMPANADO = [
  "Todo lo del plan gratuito, incluido",
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
              Gratis<span className="vd-via-precio-sub">para siempre</span>
            </p>
          </header>
          <p className="vd-via-desc">
            Publicás tu propiedad, recibís las consultas directo y cerrás
            el trato sin pagar comisión. Es el corazón del proyecto y no
            tiene letra chica.
          </p>
          <ul className="vd-lista">
            {GRATIS.map(t => (
              <li key={t}><Check size={14} strokeWidth={2.6} />{t}</li>
            ))}
          </ul>
          <Link href="/auth/registro" className="vd-via-cta">
            <Plus size={15} strokeWidth={2.2} />
            Publicar gratis
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
              Precio fijo<span className="vd-via-precio-sub">no un porcentaje</span>
            </p>
          </header>
          <p className="vd-via-desc">
            Nos ocupamos de la venta de principio a fin. Cobramos un valor
            fijo, no un porcentaje de tu propiedad: lo que valga no cambia
            lo que pagás.
          </p>
          <ul className="vd-lista vd-lista-clara">
            {ACOMPANADO.map(t => (
              <li key={t}><Check size={14} strokeWidth={2.6} />{t}</li>
            ))}
          </ul>
          <Link href="#contacto" className="vd-via-cta vd-via-cta-oro">
            Quiero delegar la venta
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </article>
      </FadeIn>
    </div>
  );
}
