import Link from "next/link";
import { slugifyUbicacion } from "@/lib/ubicaciones";

/**
 * Texto de apoyo del tasador: cómo funciona, qué se tiene en cuenta y las
 * preguntas frecuentes. Es contenido de servidor (rastreable por los
 * buscadores) y responde lo que la gente pregunta antes de usar la
 * herramienta. Las preguntas se exportan para armar el FAQPage del schema.
 */
export const PREGUNTAS_TASADOR: { q: string; a: string }[] = [
  {
    q: "¿Cuánto cuesta tasar un departamento con esta herramienta?",
    a: "Nada. La estimación online es gratuita y no te pide registrarte para ver el rango de valor. Si querés una revisión con una persona, Eugenio Nielsen la hace sin cargo.",
  },
  {
    q: "¿Qué tan precisa es la estimación?",
    a: "Es orientativa. Parte del valor de referencia del m² de tu barrio y lo ajusta con las características de tu departamento (superficie, piso, estado, antigüedad, orientación y más), y te devuelve un rango en vez de un número único. No reemplaza una tasación profesional ni una tasación para un trámite bancario o judicial.",
  },
  {
    q: "¿Qué datos del departamento tengo que cargar?",
    a: "El barrio y la superficie cubierta son obligatorios. El resto (dirección, ambientes, piso, antigüedad, estado, vista, orientación, cochera, amenities, situación de la escritura) es opcional, pero cada dato que sumás ajusta el valor y estrecha el rango.",
  },
  {
    q: "¿Tengo que dar la dirección exacta?",
    a: "No, es opcional. Si la cargás, ubicamos el departamento en el mapa y, en los barrios donde distinguimos zonas, ajustamos el valor a la tuya: dentro de un mismo barrio el metro cuadrado puede cambiar bastante, así que es lo que más acerca la estimación al valor real. Alcanza con la calle y la altura, o con la esquina. Si preferís no darla por seguridad, no pasa nada: usamos el valor promedio del barrio.",
  },
  {
    q: "¿Para qué barrios funciona?",
    a: "Para los barrios de la Ciudad de Buenos Aires. Cada uno tiene su valor de referencia por metro cuadrado, que podés consultar en la tabla de precios por barrio.",
  },
  {
    q: "¿La estimación es el precio al que tengo que publicar?",
    a: "Es un punto de partida. El precio de publicación suele definirse mirando también las propiedades comparables que hoy están a la venta en tu zona y cuánto apurás la operación.",
  },
];

const BARRIOS_DESTACADOS = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Villa Crespo", "Núñez", "Almagro", "Villa Urquiza"];

const fmtMes = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export default function InfoTasador({ actualizado }: { actualizado?: string | null }) {
  return (
    <div className="ts-info">
      <section>
        <h2>Cómo funciona el tasador de departamentos</h2>
        <p>
          Elegís el barrio, cargás las características del departamento en cinco pasos y obtenés un rango de valor de venta en dólares.
          El cálculo parte del <Link href="/precios-m2">valor de referencia del metro cuadrado de cada barrio</Link> y
          lo ajusta con las características propias de tu propiedad, en lugar de aplicar un promedio general.
        </p>
      </section>

      <section>
        <h2>Qué se tiene en cuenta</h2>
        <ul>
          <li><b>Superficie:</b> cubierta, semicubierta y descubierta, que no valen lo mismo.</li>
          <li><b>El edificio:</b> categoría, antigüedad, ascensor, amenities y expensas.</li>
          <li><b>La unidad:</b> piso, último piso, disposición (frente o contrafrente), vista y orientación.</li>
          <li><b>Estado y extras:</b> conservación, cochera, baulera, calefacción y cantidad de baños.</li>
          <li><b>Situación legal:</b> ocupación, escritura al día o sucesión, y si es apto crédito hipotecario.</li>
        </ul>
      </section>

      <section>
        <h2>De dónde salen los valores</h2>
        <p>
          El punto de partida es un valor de referencia por metro cuadrado, en dólares, para cada barrio de la Ciudad. Lo carga y
          lo actualiza el equipo de Espacio Inmobiliario{actualizado ? <>; la última actualización fue en <b>{fmtMes(actualizado)}</b></> : null}.
          Es una referencia de mercado para departamentos usados, no el precio al que se cierra una operación.
        </p>
        <p>
          Si cargás la dirección, ubicamos el departamento en el mapa y, en los barrios donde distinguimos zonas, ajustamos el valor
          a la tuya. Si preferís no cargarla, usamos el promedio del barrio. En cualquier caso, la estimación muestra con qué datos
          se calculó y qué faltó completar para que el rango sea más preciso.
        </p>
      </section>

      <section>
        <h2>Preguntas frecuentes</h2>
        {PREGUNTAS_TASADOR.map((p) => (
          <details key={p.q}>
            <summary>{p.q}</summary>
            <p>{p.a}</p>
          </details>
        ))}
      </section>

      <section>
        <h2>Valor del m² por barrio y guías para vender</h2>
        <p>
          Antes de poner un precio, mirá cómo se ubica tu zona:{" "}
          {BARRIOS_DESTACADOS.map((b, i) => (
            <span key={b}>
              <Link href={`/propiedades/venta/${slugifyUbicacion(b)}`}>{b}</Link>
              {i < BARRIOS_DESTACADOS.length - 1 ? ", " : "."}
            </span>
          ))}{" "}
          También podés ver la <Link href="/precios-m2">tabla completa de los 48 barrios</Link>, leer{" "}
          <Link href="/blog/valor-del-metro-cuadrado-en-caba">cuánto vale el m² en CABA</Link> y{" "}
          <Link href="/vender">publicar tu departamento gratis</Link>.
        </p>
      </section>
    </div>
  );
}
