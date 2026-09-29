import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Normas de la Tertulia Inmobiliaria",
  description: "Cómo conversamos en la Tertulia Inmobiliaria, el foro de Espacio Inmobiliario: respeto, contexto, sin publicidad y sin datos personales.",
  alternates: { canonical: `${SITE}/foro/normas` },
};

/**
 * Normas de convivencia y aviso legal del foro. Redactadas como las
 * cláusulas del resto del sitio: cortas, numeradas y en segunda persona.
 */
export default function NormasPage() {
  return (
    <article className="fo-in fo-angosto fo-normas">
      <nav className="fo-migas" aria-label="Estás en">
        <Link href="/foro">Tertulia Inmobiliaria</Link>
        <span aria-hidden="true">›</span>
        <span>Normas</span>
      </nav>
      <h1>Cómo conversamos <em>en la Tertulia</em></h1>
      <p className="fo-normas-lead">
        La Tertulia es un lugar para preguntar sin vergüenza y responder con generosidad. Estas normas
        existen para que siga siendo útil y agradable. Participar implica aceptarlas.
      </p>

      <ol className="fo-clausulas">
        <li>
          <div>
            <h2>Respeto, siempre</h2>
            <p>
              Se discuten ideas, no personas. No se aceptan insultos, burlas, discriminación de ningún tipo
              ni agresiones, tampoco hacia quien no está presente (vendedores, inmobiliarias, vecinos).
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Contexto concreto</h2>
            <p>
              Una buena pregunta dice dónde (barrio o partido), qué (tipo de propiedad), cuánto
              (aproximado) y en qué etapa estás. Una buena respuesta cuenta desde dónde habla: si es
              experiencia propia, conocimiento profesional o un dato de una fuente, y cuál.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Sin publicidad</h2>
            <p>
              No se publican avisos de propiedades, servicios ni captación de clientes, ni enlaces
              de afiliados. Para publicar una propiedad está el <Link href="/vender">espacio para dueños</Link>.
              Compartir la opinión profesional está bien; ofrecer los servicios propios en cada respuesta, no.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Sin datos personales</h2>
            <p>
              No compartas DNI, CUIT, teléfonos, emails, direcciones exactas ni documentos, tuyos ni de
              terceros. Tampoco nombres propios de personas involucradas en un conflicto. Si necesitás
              mostrar un papel, tapá los datos antes de subir la foto.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Un tema, una duda</h2>
            <p>
              Antes de abrir un tema, buscá si ya se habló de lo mismo. Si tu duda es otra, abrí un tema
              nuevo en la categoría que corresponda: así cada pregunta encuentra a quien sabe.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Votos y soluciones</h2>
            <p>
              Votá las respuestas que te sirvieron: así suben las mejores. Si abriste el tema y una
              respuesta te resolvió la duda, marcala como solución; ayuda a quien llegue después.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Moderación</h2>
            <p>
              Cualquier miembro puede reportar un contenido. Lo revisamos y, si no cumple estas normas,
              lo ocultamos o lo borramos; ante faltas graves o repetidas, suspendemos la cuenta. Un
              contenido con varios reportes se oculta solo hasta que lo revisemos.
            </p>
          </div>
        </li>
      </ol>

      <div className="fo-nota-legal">
        <p style={{ margin: "0 0 10px" }}>
          <strong>Aviso importante.</strong> Lo que se publica en la Tertulia son opiniones y experiencias de
          sus miembros. Orienta, pero no constituye asesoramiento legal, contable, notarial ni profesional,
          y no reemplaza la consulta con un profesional matriculado para tu caso particular.
        </p>
        <p style={{ margin: 0 }}>
          Cada miembro es responsable de lo que publica. Espacio Inmobiliario no verifica la exactitud de
          las respuestas, salvo las identificadas como «Respuesta de Espacio Inmobiliario». El distintivo de
          «Profesional verificado» indica que revisamos su matrícula, no que avalemos cada opinión.
          Ver también los <Link href="/terminos">términos y condiciones</Link> y la <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </div>

      <p style={{ marginTop: 36 }}>
        <Link href="/foro" className="fo-btn">Ir a la Tertulia <ArrowRight size={15} strokeWidth={1.8} /></Link>
      </p>
    </article>
  );
}
