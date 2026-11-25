import Link from "next/link";
import Guilloche from "@/components/ui/Guilloche";
import Calculadora from "@/components/catedra/Calculadora";
import GuiaCostos from "@/components/catedra/GuiaCostos";
import { getCostosConfig } from "@/lib/catedra/data";
import { guia as armarGuia, PRECIO_EJ, type Foco } from "@/lib/catedra/guias-costos";
import { SITE } from "@/lib/site";

/** Cuerpo compartido de las páginas "cuánto cuesta vender / comprar". */
export default async function PaginaCostos({
  foco,
  searchParams,
}: {
  foco: Foco;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const config = await getCostosConfig();
  const guia = armarGuia(foco, config);
  const consulta = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === "string" && v.length <= 20) consulta.set(k, v);
  }
  const url = `${SITE}/catedra/${guia.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: guia.titulo.split(" · ")[0],
      url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "es-AR",
      description: guia.descripcion,
      offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
      isPartOf: { "@type": "WebSite", name: "Espacio Inmobiliario", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guia.preguntas.map(p => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cátedra Inmobiliaria", item: `${SITE}/catedra` },
        { "@type": "ListItem", position: 2, name: guia.migas, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="cat-cab">
        <Guilloche id={`gq-${foco}`} className="cat-cab-gq" />
        <div className="cat-in cat-cab-in">
          <nav className="cat-migas" aria-label="Estás en">
            <Link href="/catedra">Cátedra Inmobiliaria</Link>
            <span aria-hidden="true">›</span>
            <span>{guia.migas}</span>
          </nav>
          <h1 className="cat-cab-t">{guia.h1[0]}<em>{guia.h1[1]}</em></h1>
          <p className="cat-cab-lead">{guia.lead}</p>
          <p className="cat-vigencia">Valores vigentes: <strong>{config.vigencia}</strong> · CABA</p>
        </div>
      </header>

      <Calculadora config={config} consulta={consulta.toString()} foco={foco} precioInicial={PRECIO_EJ} />
      <GuiaCostos guia={guia} config={config} />
    </>
  );
}
