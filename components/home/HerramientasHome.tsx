import Link from "next/link";
import { ArrowRight, Calculator, LineChart } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import { ARANCELES_DESTACADOS, VALOR_MODULO, VIGENCIA, pesos } from "@/lib/rpi";
import "./bloques.css";

const RPI_HREF = "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble";

/**
 * Bloque doble: las dos herramientas gratuitas del sitio, lado a lado.
 * Izquierda el tasador (navy); derecha la calculadora de aranceles del
 * Registro de la Propiedad (crema). Los importes salen de lib/rpi.ts,
 * la misma fuente que la calculadora, así no pueden desactualizarse
 * por separado.
 */
export default function HerramientasHome() {
  return (
    <section className="hb-herr" aria-label="Herramientas gratuitas">
      <div className="hb-in">
        <FadeIn direction="up">
          <div className="hb-cab">
            <div>
              <div className="es-eyebrow" style={{ marginBottom: 8 }}>Herramientas gratuitas</div>
              <h2 className="section-heading">Números claros antes de decidir</h2>
            </div>
          </div>
        </FadeIn>

        <div className="hb-doble">
          <FadeIn direction="up" className="hb-lado">
            <article className="hb-panel hb-panel-oscuro">
              <span className="hb-icono"><LineChart size={20} strokeWidth={1.6} /></span>
              <h3 className="hb-panel-t">¿Cuánto vale tu departamento?</h3>
              <p className="hb-panel-d">
                Estimá el valor de venta en cinco pasos, con valores de
                referencia por barrio de la Ciudad. Es orientativo, y si
                querés lo revisamos con vos sin cargo.
              </p>
              <ul className="hb-lista">
                <li>Gratis y sin registrarte</li>
                <li>Valores por barrio y por zona</li>
                <li>Revisión personal sin cargo</li>
              </ul>
              <Link href="/estimador" className="hb-cta hb-cta-oro">
                Tasar mi departamento <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
            </article>
          </FadeIn>

          <FadeIn delay={100} direction="up" className="hb-lado">
            <article className="hb-panel hb-panel-claro">
              <span className="hb-icono"><Calculator size={20} strokeWidth={1.6} /></span>
              <h3 className="hb-panel-t">Aranceles del Registro de la Propiedad</h3>
              <p className="hb-panel-d">
                Calculá cuánto cobra el Registro de la Capital Federal por cada
                trámite: informes, certificados e inscripción.
              </p>
              <dl className="hb-aranceles">
                {ARANCELES_DESTACADOS.map(a => (
                  <div key={a.nombre}>
                    <dt>{a.nombre}</dt>
                    <dd>{pesos(a.modulos * VALOR_MODULO)}</dd>
                  </div>
                ))}
              </dl>
              <p className="hb-vigencia">
                Módulo a {pesos(VALOR_MODULO)} · vigente desde el {VIGENCIA}.
                El Registro actualiza estos valores con frecuencia.
              </p>
              <Link href={RPI_HREF} className="hb-cta hb-cta-navy">
                Abrir la calculadora <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
            </article>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
