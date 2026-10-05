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
    a: "El barrio, la superficie cubierta y descubierta, los ambientes, el piso, la antigüedad y el estado. Los datos opcionales (vista, orientación, cochera, amenities, situación de la escritura) afinan el rango.",
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

export default function InfoTasador() {
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
