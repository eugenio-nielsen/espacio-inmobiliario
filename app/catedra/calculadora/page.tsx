import Link from "next/link";
import type { Metadata } from "next";
import Guilloche from "@/components/ui/Guilloche";
import Calculadora from "@/components/catedra/Calculadora";
import { getCostosConfig } from "@/lib/catedra/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Calculadora de costos de compraventa en CABA 2026 · Cátedra Inmobiliaria",
  description:
    "Cuánto paga el comprador y cuánto le queda al vendedor en una compraventa en CABA: escribano, Sellos (con la exención de vivienda única 2026), honorarios inmobiliarios, IVA e hipoteca, con la norma de cada línea.",
  alternates: { canonical: `${SITE}/catedra/calculadora` },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CalculadoraPage({ searchParams }: Props) {
  const config = await getCostosConfig();
  // Los datos cargados viajan en la URL (el enlace "Copiar" los guarda)
  const consulta = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === "string" && v.length <= 20) consulta.set(k, v);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculadora de costos de compraventa en CABA",
    url: `${SITE}/catedra/calculadora`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
    isPartOf: { "@type": "WebSite", name: "Espacio Inmobiliario", url: SITE },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="cat-cab">
        <Guilloche id="gq-calc" className="cat-cab-gq" />
        <div className="cat-in cat-cab-in">
          <nav className="cat-migas" aria-label="Estás en">
            <Link href="/catedra">Cátedra Inmobiliaria</Link>
            <span aria-hidden="true">›</span>
            <span>Calculadora de costos</span>
          </nav>
          <h1 className="cat-cab-t">Cuánto cuesta <em>una compraventa</em></h1>
          <p className="cat-cab-lead">
            Las dos puntas de una operación en la Ciudad de Buenos Aires: lo que desembolsa quien compra y
            lo que le queda a quien vende. Tocá la <strong>(i)</strong> de cada línea para ver de dónde sale.
          </p>
          <p className="cat-vigencia">Valores vigentes: <strong>{config.vigencia}</strong> · CABA</p>
        </div>
      </header>

      <Calculadora config={config} consulta={consulta.toString()} />
    </>
  );
}
