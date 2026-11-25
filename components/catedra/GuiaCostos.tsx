import Link from "next/link";
import { calcularCostos, type CostosConfig } from "@/lib/catedra/costos";
import { entradaEjemplo, PRECIOS_EJEMPLO, SLUGS, type Foco, type Guia } from "@/lib/catedra/guias-costos";

/**
 * Texto indexable de las páginas "cuánto cuesta vender / comprar":
 * respuesta directa, tabla de ejemplos con las cuentas de la calculadora,
 * explicación por concepto y preguntas frecuentes. Es un componente de
 * servidor: todo el contenido llega en el HTML.
 */

const usd = (x: number) => `US$ ${Math.round(x).toLocaleString("es-AR")}`;

export default function GuiaCostos({ guia, config }: { guia: Guia; config: CostosConfig }) {
  const vender = guia.foco === "vender";
  const otro: Foco = vender ? "comprar" : "vender";

  return (
    <>
      <section className="cat-seccion cat-guia" aria-labelledby="cat-guia-resp">
        <div className="cat-in cat-guia-in">
          <p className="cat-k">{vender ? "Para el vendedor" : "Para el comprador"}</p>
          <h2 className="cat-seccion-t" id="cat-guia-resp">
            {vender ? <>La respuesta <em>corta</em></> : <>La respuesta <em>corta</em></>}
          </h2>
          <p className="cat-guia-resp">{guia.respuesta}</p>

          <h3 className="cat-guia-h3">
            {vender ? "Cuánto le queda al vendedor según el precio" : "Cuánto desembolsa el comprador según el precio"}
          </h3>
          <div className="cat-tabla-wrap">
            <table className="cat-tabla">
              <thead>
                <tr>
                  <th scope="col">Precio de venta</th>
                  <th scope="col">{vender ? "Gastos del vendedor" : "Gastos del comprador"}</th>
                  <th scope="col">% del precio</th>
                  <th scope="col">{vender ? "Neto para el vendedor" : "Total a desembolsar"}</th>
                </tr>
              </thead>
              <tbody>
                {PRECIOS_EJEMPLO.map(p => {
                  const r = calcularCostos(entradaEjemplo(p, config), config);
                  const costos = vender ? r.vendedor.costos : r.comprador.costos;
                  const final = vender ? r.vendedor.neto : r.comprador.total;
                  return (
                    <tr key={p}>
                      <th scope="row">{usd(p)}</th>
                      <td>{usd(costos)}</td>
                      <td>{((costos / p) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %</td>
                      <td><strong>{usd(final)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="cat-guia-nota">
            Cálculo con inmobiliaria ({config.inmobiliaria.comprador} % comprador y {config.inmobiliaria.vendedor} % vendedor, más
            IVA), vivienda única del comprador, escribano al {config.escribania.honorarios} % y dólar a $ {config.tipoCambio.toLocaleString("es-AR")}.
            Valores vigentes: {config.vigencia}. Es una estimación: la liquidación final la hace el escribano.
          </p>
        </div>
      </section>

      {guia.secciones.map(s => (
        <section key={s.t} className="cat-seccion cat-guia">
          <div className="cat-in cat-guia-in">
            <h2 className="cat-seccion-t">{s.t}</h2>
            {s.p.map((t, i) => <p key={i} className="cat-guia-p" dangerouslySetInnerHTML={{ __html: t }} />)}
          </div>
        </section>
      ))}

      <section className="cat-seccion cat-guia" aria-labelledby="cat-guia-faq">
        <div className="cat-in cat-guia-in">
          <h2 className="cat-seccion-t" id="cat-guia-faq">Preguntas <em>frecuentes</em></h2>
          <dl className="cat-faq">
            {guia.preguntas.map(p => (
              <div key={p.q}>
                <dt>{p.q}</dt>
                <dd>{p.a}</dd>
              </div>
            ))}
          </dl>
          <p className="cat-guia-cruce">
            ¿Ves la otra punta de la operación?{" "}
            <Link href={`/catedra/${SLUGS[otro]}`}>
              {vender ? "Cuánto cuesta comprar una propiedad" : "Cuánto cuesta vender una propiedad"}
            </Link>
            {" · "}
            <Link href="/catedra/calculadora">Calculadora completa de las dos puntas</Link>
          </p>
        </div>
      </section>
    </>
  );
}
