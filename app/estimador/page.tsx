import { SITE } from "@/lib/site";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Guilloche from "@/components/ui/Guilloche";
import Tasador from "@/components/estimador/Tasador";
import InfoTasador, { PREGUNTAS_TASADOR } from "@/components/estimador/InfoTasador";
import { getBarriosDisponibles } from "@/lib/estimador/data";
import "@/components/estimador/tasador.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tasador de departamentos en CABA · Estimá su valor gratis",
  description: "Estimá gratis el valor de venta de un departamento en Capital Federal en cinco pasos, con valores de referencia por barrio. Orientativo, y con revisión sin cargo.",
  alternates: { canonical: `${SITE}/estimador` },
  openGraph: {
    title: "Tasador de departamentos en CABA · Espacio Inmobiliario",
    description: "¿Cuánto vale tu departamento? Estimalo gratis en cinco pasos, con valores de referencia por barrio.",
    type: "website",
  },
};

/**
 * El tasador. La página es un escenario nocturno donde los papeles
 * quedan iluminados: arriba la pregunta, y la mesa de trabajo (la
 * escena del formulario y la ficha que se va escribiendo) cruza el
 * límite entre el navy y el crema. Todo lo interactivo vive en
 * components/estimador/Tasador.tsx; estilos en tasador.css (.ts-).
 */
export default async function EstimadorPage() {
  const barrios = await getBarriosDisponibles();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Tasador online de departamentos en CABA",
      url: `${SITE}/estimador`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "es-AR",
      description: "Estimá gratis el valor de venta de un departamento en la Ciudad de Buenos Aires, con valores de referencia por barrio.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
      provider: { "@type": "Organization", name: "Espacio Inmobiliario", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PREGUNTAS_TASADOR.map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
    },
  ];


  return (
    <div className="ts-pagina">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <section className="ts-escenario" aria-labelledby="ts-titulo">
        <div className="ts-escenario-luz" aria-hidden="true" />
        <Guilloche id="ts-gq-escenario" className="ts-escenario-gq" />

        <div className="ts-apertura">
          <p className="ts-eyebrow">Tasador · Departamentos en CABA</p>
          <h1 id="ts-titulo" className="ts-titulo">
            <span className="ts-corte"><span>¿Cuánto vale</span></span>{" "}
            <span className="ts-corte"><em>tu departamento?</em></span>
          </h1>
          <p className="ts-lead">
            Una estimación orientativa en cinco pasos, con el valor de referencia de
            {" "}{barrios.length} barrios porteños. Y si querés, Eugenio la revisa con vos sin cargo.
          </p>
        </div>
      </section>

      <main className="ts-principal">
        <Tasador barrios={barrios} />
        <InfoTasador />
      </main>

      <Footer />
    </div>
  );
}
