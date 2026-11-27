import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import { getCostosConfig } from "@/lib/catedra/data";
import { PRECIO_EJ, SLUGS, porcentaje, rangosCostos } from "@/lib/catedra/guias-costos";
import { ACLARATORIO } from "@/lib/estimador/aclaratorio";
import "./bloques.css";

/**
 * Bloque de compraventa: el estimador (navy) y, al lado, las dos guías de
 * costos de la Cátedra (comprar y vender). Los porcentajes salen de la
 * misma configuración que las guías, así no pueden decir cosas distintas.
 */
export default async function HerramientasHome() {
  const r = rangosCostos(await getCostosConfig());
  // Espacio duro: la moneda no se separa del importe al cortar la línea
  const ejemplo = `US$ ${PRECIO_EJ.toLocaleString("es-AR")}`;

  const guias = [
    {
      href: `/catedra/${SLUGS.comprar}`,
      titulo: "¿Cuánto cuesta comprar una propiedad?",
      cifra: `${porcentaje(r.comprarMin)} a ${porcentaje(r.comprarMax)} %`,
      cifraDetalle: "en gastos, además del precio",
      detalle: "Escribano, Sellos, honorarios e hipoteca, con la calculadora para tu caso.",
      cta: "Ver los gastos de compra",
    },
    {
      href: `/catedra/${SLUGS.vender}`,
      titulo: "¿Cuánto cuesta vender una propiedad?",
      cifra: `${porcentaje(r.venderSin)} %`,
      cifraDetalle: `sin inmobiliaria · ${porcentaje(r.venderCon)} % con ella`,
      detalle: "Qué se descuenta del precio, qué impuestos ya no se pagan y cuánto te queda.",
      cta: "Ver los gastos de venta",
    },
  ];

  return (
    <section className="hb-herr" aria-label="Estimador y costos de compraventa">
      <div className="hb-in">
        <FadeIn direction="up">
          <div className="hb-cab">
            <div>
              <div className="es-eyebrow" style={{ marginBottom: 8 }}>Compraventa entre dueños</div>
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
                referencia por barrio de la Ciudad. Si querés, lo revisamos
                con vos sin cargo.
              </p>
              <ul className="hb-lista">
                <li>Gratis y sin registrarte</li>
                <li>Valores por barrio y por zona</li>
                <li>Revisión personal sin cargo</li>
              </ul>
              <Link href="/estimador" className="hb-cta hb-cta-oro">
                Estimar mi departamento <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
              <p className="hb-aclaratorio">{ACLARATORIO}</p>
            </article>
          </FadeIn>

          <FadeIn delay={100} direction="up" className="hb-lado">
            <div className="hb-guias">
              {guias.map(g => (
                <Link key={g.href} href={g.href} className="hb-guia">
                  <h3 className="hb-guia-t">{g.titulo}</h3>
                  <p className="hb-guia-cifra">
                    <strong>{g.cifra}</strong> <span>{g.cifraDetalle}</span>
                  </p>
                  <p className="hb-guia-d">{g.detalle}</p>
                  <span className="hb-guia-cta">
                    {g.cta} <ArrowRight size={15} strokeWidth={1.8} />
                  </span>
                </Link>
              ))}
              <p className="hb-nota-cifras">
                Ejemplo orientativo en CABA sobre una operación de {ejemplo}; en
                la venta, con Sellos exentos por vivienda única del comprador.
                La escritura la cotiza cada escribanía.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
