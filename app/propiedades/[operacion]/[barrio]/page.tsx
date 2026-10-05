import { SITE } from "@/lib/site";
import { Suspense } from "react";
import Link from "next/link";
import RecordarBusqueda from "@/components/properties/RecordarBusqueda";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROPERTY_CARD_COLS, type PropertyCardData } from "@/lib/types";
import { getBarrioPage, getTipoPage, barriosVecinos, COMUNA_DE_BARRIO, BARRIO_PAGES, TIPO_PAGES } from "@/lib/barrios";
import { resumenBarrio, fmtUsd } from "@/lib/mercado";
import { getPreciosBarrios } from "@/lib/estimador/data";
import TarjetaPropiedad from "@/components/properties/TarjetaPropiedad";
import { conPropietarioVerificado } from "@/lib/propiedades/verificados";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TipoLanding, { metadataTipo } from "./TipoLanding";
import { MapPin, TrendingUp, Building2, Calculator, Plus, ArrowRight } from "lucide-react";

export const revalidate = 300;

// Solo existen los barrios y tipos listados: cualquier otro slug es un 404
// de verdad (y no una página "no encontrada" con estado 200).
export const dynamicParams = false;

type PageProps = { params: Promise<{ operacion: string; barrio: string }> };

export function generateStaticParams() {
  return [
    ...BARRIO_PAGES.map((b) => ({ operacion: "venta", barrio: b.slug })),
    ...TIPO_PAGES.map((t) => ({ operacion: "venta", barrio: t.slug })),
  ];
}

const h2Estilo: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(19px,3vw,26px)",
  letterSpacing: "-.01em", color: "var(--navy-800)", margin: "0 0 14px",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { operacion, barrio } = await params;
  const tipoPage = getTipoPage(barrio);
  if (operacion === "venta" && tipoPage) return metadataTipo(tipoPage);
  const data = getBarrioPage(barrio);
  if (operacion !== "venta" || !data) return { title: "Página no encontrada", robots: { index: false } };

  const esCaba = data.provincia === "Ciudad Autónoma de Buenos Aires";
  const zona = esCaba ? "CABA" : "Provincia de Buenos Aires";
  const precio = esCaba ? resumenBarrio(data.nombre, await getPreciosBarrios())?.precio : undefined;
  const title = `Propiedades en venta en ${data.nombre} · Dueño directo`;
  const description = `Casas, terrenos y departamentos en venta en ${data.nombre}, ${zona}, publicados directamente por sus dueños. Sin comisión inmobiliaria.${precio ? ` Precio de referencia del m²: US$ ${fmtUsd(precio)}. Tasá tu propiedad gratis.` : esCaba ? " Tasá tu propiedad gratis." : ""}`;
  const url = `${SITE}/propiedades/venta/${data.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function BarrioPage({ params }: PageProps) {
  const { operacion, barrio } = await params;
  const tipoPage = getTipoPage(barrio);
  if (operacion === "venta" && tipoPage) return <TipoLanding tipo={tipoPage} />;
  const data = getBarrioPage(barrio);
  if (operacion !== "venta" || !data) notFound();

  const supabase = await createClient();
  const [{ data: properties }, precios] = await Promise.all([
    supabase
      .from("properties")
      .select(PROPERTY_CARD_COLS)
      .eq("status", "activa")
      .eq("barrio", data.nombre)
      .order("created_at", { ascending: false }),
    getPreciosBarrios(),
  ]);

  const lista = await conPropietarioVerificado(supabase, (properties ?? []) as PropertyCardData[]);
  const precioM2 = precios[data.nombre];
  const count = properties?.length || 0;
  // El tasador solo cubre CABA: no lo ofrecemos en partidos de provincia
  const esCaba = data.provincia === "Ciudad Autónoma de Buenos Aires";
  const siteUrl = SITE;
  const fmt = fmtUsd;

  const resumen = esCaba ? resumenBarrio(data.nombre, precios) : null;
  const comuna = COMUNA_DE_BARRIO[data.nombre];
  const vecinos = barriosVecinos(data.nombre);
  const nota = "Son valores de referencia del tasador, no una tasación: el precio real depende del estado, el piso, la luz y la orientación.";
  const posicion = !resumen ? "" : resumen.difPct === 0
    ? "en línea con el promedio porteño"
    : `un ${Math.abs(resumen.difPct)}% ${resumen.difPct > 0 ? "por encima" : "por debajo"} del promedio porteño`;

  const faq: { q: string; a: string }[] = [];
  if (resumen) {
    faq.push(
      {
        q: `¿Cuánto cuesta el metro cuadrado en ${data.nombre}?`,
        a: `El valor de referencia del m² en ${data.nombre} es de US$ ${fmt(resumen.precio)}. Es el barrio número ${resumen.puesto} de ${resumen.total} por precio en la Ciudad de Buenos Aires, ${posicion} (US$ ${fmt(resumen.promedio)}/m²).`,
      },
      {
        q: `¿Cuánto cuesta un departamento en ${data.nombre}?`,
        a: `A valor de referencia, un departamento de ${resumen.ejemplos.map((e) => `${e.m2} m² ronda los US$ ${fmt(e.valor)}`).join(", y uno de ")}. ${nota}`,
      },
      {
        q: `¿Cómo sé cuánto vale mi departamento en ${data.nombre}?`,
        a: "Podés estimarlo gratis con el tasador online: elegís el barrio, cargás superficie, piso, antigüedad y estado, y te devuelve un rango de valor al instante. Si querés, Eugenio Nielsen lo revisa con vos sin cargo.",
      },
    );
  }
  faq.push({
    q: `¿Puedo comprar sin comisión inmobiliaria en ${data.nombre}?`,
    a: "Sí. Las propiedades de esta página las publican sus dueños directamente, así que hablás con ellos sin intermediarios y sin pagar comisión de compra. Espacio Inmobiliario puede acompañarte con la revisión de la documentación antes de firmar.",
  });

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Propiedades en venta en ${data.nombre}`,
    url: `${siteUrl}/propiedades/venta/${data.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Propiedades", item: `${siteUrl}/propiedades` },
        { "@type": "ListItem", position: 3, name: data.nombre, item: `${siteUrl}/propiedades/venta/${data.slug}` },
      ],
    },
  };

  const parrafo: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.75, color: "var(--ink-600)", margin: "0 0 14px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Suspense fallback={null}><RecordarBusqueda /></Suspense>
      <Navbar />

      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>
          <Link href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          <Link href="/propiedades" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Propiedades</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          {data.nombre}
        </div>

        {/* Header */}
        <div className="es-eyebrow" style={{ marginBottom: 10 }}>
          <MapPin size={13} strokeWidth={2} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          {data.provincia}
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(24px,4.5vw,38px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 18px",
        }}>
          Propiedades en venta en {data.nombre}
        </h1>

        {/* Banda de datos del barrio */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "14px 28px", alignItems: "center",
          background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)", padding: "16px 20px", marginBottom: 24,
          fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-600)",
        }}>
          {precioM2 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={16} strokeWidth={1.75} color="var(--gold-600)" />
              Precio de referencia: <b style={{ color: "var(--navy-800)" }}>US$ {fmt(precioM2)}/m²</b>
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} strokeWidth={1.75} color="var(--gold-600)" />
            <b style={{ color: "var(--navy-800)" }}>{count}</b> {count === 1 ? "propiedad publicada" : "propiedades publicadas"}
          </span>
          {esCaba && (
            <Link href="/estimador" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--gold-700)", textDecoration: "underline", textUnderlineOffset: 2 }}>
              <Calculator size={16} strokeWidth={1.75} />
              Tasá tu propiedad en {data.nombre} gratis
            </Link>
          )}
        </div>

        {/* Texto editorial: el escrito a mano, o uno armado con los datos del barrio */}
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          {data.intro.length === 0 && (
            <p style={parrafo}>
              {data.nombre} es un barrio de la Ciudad de Buenos Aires{comuna ? `, parte de la Comuna ${comuna}` : ""}.
              {resumen
                ? ` Hoy el valor de referencia del metro cuadrado de un departamento es de US$ ${fmt(resumen.precio)}: el puesto ${resumen.puesto} de ${resumen.total} barrios por precio, ${posicion}.`
                : ""}
              {" "}Acá publican directamente sus dueños, así que podés comprar sin pagar comisión inmobiliaria.
            </p>
          )}
          {data.intro.map((p, i) => (
            <p key={i} style={parrafo}>{p}</p>
          ))}
        </div>

        {/* Propiedades */}
        <h2 style={{ ...h2Estilo, margin: "0 0 18px" }}>
          En venta ahora en {data.nombre}
        </h2>

        {!count ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)", marginBottom: 36 }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 6 }}>
              En este momento no hay propiedades publicadas en {data.nombre}.
            </p>
            <Link href="/propiedades" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)", textDecoration: "underline" }}>
              Ver propiedades en otros barrios
            </Link>
          </div>
        ) : (
          <div className="grid-properties" style={{ marginBottom: 36 }}>
            {lista.map((p, i) => (
              <TarjetaPropiedad key={p.id} property={p} priority={i < 3} />
            ))}
          </div>
        )}

        {/* Cuánto cuesta (datos del tasador) */}
        {resumen && (
          <section style={{ maxWidth: 760, marginBottom: 36 }}>
            <h2 style={h2Estilo}>Cuánto cuesta un departamento en {data.nombre}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 12 }}>
              {resumen.ejemplos.map((e) => (
                <div key={e.m2} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "14px 16px", fontFamily: "var(--font-sans)" }}>
                  <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Departamento de {e.m2} m²</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "var(--navy-800)", marginTop: 2 }}>US$ {fmt(e.valor)}</div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-500)", margin: 0 }}>
              {nota}{" "}
              <Link href="/precios-m2" style={{ color: "var(--gold-700)", textDecoration: "underline" }}>Ver el precio del m² de todos los barrios</Link>.
            </p>
          </section>
        )}

        {/* Preguntas frecuentes */}
        <section style={{ maxWidth: 760, marginBottom: 36 }}>
          <h2 style={h2Estilo}>Preguntas frecuentes sobre {data.nombre}</h2>
          {faq.map((f) => (
            <details key={f.q} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "14px 18px", marginBottom: 10, fontFamily: "var(--font-sans)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--navy-800)", fontSize: 15 }}>{f.q}</summary>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-600)", margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>

        {/* Barrios vecinos */}
        {vecinos.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ ...h2Estilo, fontSize: "clamp(17px,2.6vw,22px)", margin: "0 0 12px" }}>Otros barrios de la Comuna {comuna}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {vecinos.map((v) => (
                <Link key={v.slug} href={`/propiedades/venta/${v.slug}`} style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--navy-800)", background: "#fff", border: "1px solid var(--line-200)", borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>
                  {v.nombre}
                </Link>
              ))}
              <Link href="/precios-m2" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)", display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 8px", textDecoration: "none" }}>
                Todos los barrios <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* CTA dueños del barrio */}
        <div style={{
          background: "var(--navy-800)", borderRadius: "var(--radius-lg)",
          padding: "clamp(28px,4vw,40px)", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(20px,3.5vw,28px)",
            color: "#fff", margin: "0 0 10px",
          }}>
            ¿Tenés una propiedad en {data.nombre}?
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "rgba(255,255,255,.78)", maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.6 }}>
            {esCaba
              ? "Averiguá cuánto vale con nuestro tasador online y publicala gratis. Recibís las consultas directo, sin pagar comisión."
              : "Publicala gratis y recibí las consultas directo, sin comisión inmobiliaria."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {esCaba && (
              <Link href="/estimador" className="esbtn esbtn-gold" style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
                border: "1.5px solid transparent", display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 14.5, padding: "13px 24px", background: "var(--gold-500)", color: "#26200f",
                textDecoration: "none",
              }}>
                <Calculator size={16} strokeWidth={2} /> Tasar mi propiedad
              </Link>
            )}
            <Link href="/auth/registro" className={esCaba ? undefined : "esbtn esbtn-gold"} style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
              border: esCaba ? "1.5px solid rgba(255,255,255,.35)" : "1.5px solid transparent",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14.5, padding: "13px 24px",
              background: esCaba ? "transparent" : "var(--gold-500)",
              color: esCaba ? "#fff" : "#26200f",
              textDecoration: "none",
            }}>
              <Plus size={16} strokeWidth={2} /> Publicar gratis
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
