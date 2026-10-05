import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";
import { BARRIOS_CABA, slugifyUbicacion } from "@/lib/ubicaciones";
import { COMUNA_DE_BARRIO } from "@/lib/barrios";
import { getPreciosConFecha, fmtUsd } from "@/lib/mercado";
import { ArrowRight, Calculator } from "lucide-react";

export const revalidate = 3600;

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export async function generateMetadata(): Promise<Metadata> {
  const title = "Precio del metro cuadrado en CABA por barrio";
  const description = "Cuánto vale el m² de un departamento en cada uno de los 48 barrios de la Ciudad de Buenos Aires: ranking de más caro a más barato, con valores de referencia en dólares.";
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/precios-m2` },
    openGraph: { title, description, url: `${SITE}/precios-m2`, type: "website" },
  };
}

export default async function PreciosM2Page() {
  const filas = await getPreciosConFecha();
  const ranking = filas
    .filter((f) => BARRIOS_CABA.includes(f.barrio))
    .sort((a, b) => b.precio - a.precio);

  const promedio = ranking.length ? ranking.reduce((s, f) => s + f.precio, 0) / ranking.length : 0;
  const masCaro = ranking[0];
  const masBarato = ranking[ranking.length - 1];
  const ultima = ranking.reduce((max, f) => (f.actualizado > max ? f.actualizado : max), "");

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Precio de referencia del metro cuadrado de departamentos en CABA, por barrio",
    description: "Valor de referencia en dólares del m² de departamentos en cada barrio de la Ciudad de Buenos Aires, usado por el tasador online de Espacio Inmobiliario.",
    url: `${SITE}/precios-m2`,
    inLanguage: "es-AR",
    spatialCoverage: "Ciudad Autónoma de Buenos Aires, Argentina",
    creator: { "@type": "Organization", name: "Espacio Inmobiliario", url: SITE },
    ...(ultima && { dateModified: ultima }),
    variableMeasured: "Precio del metro cuadrado (USD)",
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Precio del m² por barrio", item: `${SITE}/precios-m2` },
    ],
  };

  const celda: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid var(--line-200)", fontSize: 14.5 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />

      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)", fontFamily: "var(--font-sans)" }}>
        <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>
          <Link href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          Precio del m² por barrio
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(26px,4.8vw,42px)", letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 14px" }}>
          Precio del metro cuadrado en CABA, barrio por barrio
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--ink-600)", maxWidth: 760, margin: "0 0 10px" }}>
          Cuánto vale el m² de un departamento en cada uno de los {ranking.length} barrios porteños, ordenados de más caro a más barato.
          Son los valores de referencia que usa nuestro tasador online
          {ultima ? <>, actualizados el {fmtFecha(ultima)}</> : null}.
        </p>
        {ranking.length > 0 && (
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--ink-600)", maxWidth: 760, margin: "0 0 26px" }}>
            El promedio de la ciudad es de <b>US$ {fmtUsd(promedio)}/m²</b>. El barrio más caro es{" "}
            <b>{masCaro.barrio}</b> (US$ {fmtUsd(masCaro.precio)}/m²) y el más accesible,{" "}
            <b>{masBarato.barrio}</b> (US$ {fmtUsd(masBarato.precio)}/m²).
          </p>
        )}

        <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)", overflowX: "auto", marginBottom: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
            <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Precio de referencia del m² de departamentos por barrio de CABA, en dólares
            </caption>
            <thead>
              <tr style={{ background: "var(--navy-50)", textAlign: "left", color: "var(--navy-800)" }}>
                <th scope="col" style={{ ...celda, fontWeight: 600, width: 56 }}>#</th>
                <th scope="col" style={{ ...celda, fontWeight: 600 }}>Barrio</th>
                <th scope="col" style={{ ...celda, fontWeight: 600 }}>Comuna</th>
                <th scope="col" style={{ ...celda, fontWeight: 600, textAlign: "right" }}>US$ por m²</th>
                <th scope="col" style={{ ...celda, fontWeight: 600, textAlign: "right" }}>Depto. de 50 m²</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((f, i) => (
                <tr key={f.barrio}>
                  <td style={{ ...celda, color: "var(--ink-500)" }}>{i + 1}</td>
                  <th scope="row" style={{ ...celda, fontWeight: 500, textAlign: "left" }}>
                    <Link href={`/propiedades/venta/${slugifyUbicacion(f.barrio)}`} style={{ color: "var(--navy-800)", textDecoration: "none" }}>
                      {f.barrio}
                    </Link>
                  </th>
                  <td style={{ ...celda, color: "var(--ink-500)" }}>{COMUNA_DE_BARRIO[f.barrio] ?? "—"}</td>
                  <td style={{ ...celda, textAlign: "right", fontWeight: 600, color: "var(--navy-800)" }}>{fmtUsd(f.precio)}</td>
                  <td style={{ ...celda, textAlign: "right", color: "var(--ink-600)" }}>US$ {fmtUsd(f.precio * 50)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-500)", maxWidth: 760, margin: "0 0 36px" }}>
          Los valores son una referencia por metro cuadrado cubierto de un departamento usado promedio, no una tasación:
          el precio de una propiedad concreta depende del piso, el estado, la luz, la orientación, las amenities y la antigüedad.
          Para una estimación con esos factores, usá el tasador.
        </p>

        <div style={{ background: "var(--navy-800)", borderRadius: "var(--radius-lg)", padding: "clamp(28px,4vw,40px)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(20px,3.5vw,28px)", color: "#fff", margin: "0 0 10px" }}>
            ¿Cuánto vale tu departamento?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.78)", maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.6 }}>
            Estimalo gratis en cinco pasos: elegís el barrio y cargás los datos, y el tasador te devuelve un rango de valor.
          </p>
          <Link href="/estimador" className="esbtn esbtn-gold" style={{ fontWeight: 600, borderRadius: "var(--radius-sm)", border: "1.5px solid transparent", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, padding: "13px 24px", background: "var(--gold-500)", color: "#26200f", textDecoration: "none" }}>
            <Calculator size={16} strokeWidth={2} /> Tasar mi departamento <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
