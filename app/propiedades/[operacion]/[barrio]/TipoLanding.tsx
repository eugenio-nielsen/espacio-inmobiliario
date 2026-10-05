import { SITE } from "@/lib/site";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PROPERTY_CARD_COLS, type PropertyCardData } from "@/lib/types";
import { BARRIO_PAGES, TIPO_PAGES, type TipoPageData } from "@/lib/barrios";
import TarjetaPropiedad from "@/components/properties/TarjetaPropiedad";
import { conPropietarioVerificado } from "@/lib/propiedades/verificados";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/** Landing de un tipo de propiedad: /propiedades/venta/departamentos, /casas, etc. */

const url = (t: TipoPageData) => `${SITE}/propiedades/venta/${t.slug}`;

export function metadataTipo(t: TipoPageData): Metadata {
  const title = `${t.plural} en venta · Dueño directo, sin comisión`;
  const description = `${t.plural} en venta en Buenos Aires publicados directamente por sus dueños. Sin comisión inmobiliaria, con acompañamiento profesional.`;
  return {
    title,
    description,
    alternates: { canonical: url(t) },
    openGraph: { title, description, url: url(t), type: "website" },
  };
}

export default async function TipoLanding({ tipo }: { tipo: TipoPageData }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select(PROPERTY_CARD_COLS)
    .eq("status", "activa")
    .eq("tipo", tipo.tipo)
    .order("created_at", { ascending: false })
    .limit(48);

  const lista = await conPropietarioVerificado(supabase, (data ?? []) as PropertyCardData[]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tipo.plural} en venta`,
    url: url(tipo),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
        { "@type": "ListItem", position: 2, name: "Propiedades", item: `${SITE}/propiedades` },
        { "@type": "ListItem", position: 3, name: tipo.plural, item: url(tipo) },
      ],
    },
  };

  const parrafo: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.75, color: "var(--ink-600)", margin: "0 0 14px" };
  const chip: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--navy-800)", background: "#fff", border: "1px solid var(--line-200)", borderRadius: 999, padding: "7px 16px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>
          <Link href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          <Link href="/propiedades" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Propiedades</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          {tipo.plural}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(24px,4.5vw,38px)", letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 14px" }}>
          {tipo.plural} en venta
        </h1>
        <p style={{ ...parrafo, maxWidth: 720, marginBottom: 28 }}>
          {tipo.plural} publicados directamente por sus dueños en la Ciudad de Buenos Aires y alrededores.
          Hablás con quien vende, sin intermediarios y sin pagar comisión de compra.
        </p>

        {!lista.length ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)", marginBottom: 36 }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 6 }}>
              En este momento no hay {tipo.plural.toLowerCase()} publicados.
            </p>
            <Link href="/propiedades" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)", textDecoration: "underline" }}>
              Ver todas las propiedades
            </Link>
          </div>
        ) : (
          <div className="grid-properties" style={{ marginBottom: 36 }}>
            {lista.map((p, i) => (
              <TarjetaPropiedad key={p.id} property={p} priority={i < 3} />
            ))}
          </div>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(17px,2.6vw,22px)", color: "var(--navy-800)", margin: "0 0 12px" }}>
            Buscá por barrio
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {BARRIO_PAGES.map((b) => (
              <Link key={b.slug} href={`/propiedades/venta/${b.slug}`} style={chip}>{b.nombre}</Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(17px,2.6vw,22px)", color: "var(--navy-800)", margin: "0 0 12px" }}>
            Otros tipos de propiedad
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {TIPO_PAGES.filter((t) => t.slug !== tipo.slug).map((t) => (
              <Link key={t.slug} href={`/propiedades/venta/${t.slug}`} style={chip}>{t.plural}</Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
