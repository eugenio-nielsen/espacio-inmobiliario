import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import { getBarrioPage, BARRIO_PAGES } from "@/lib/barrios";
import { getPreciosBarrios } from "@/lib/estimador/data";
import PropertyListCard from "@/components/properties/PropertyListCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, TrendingUp, Building2, Calculator, Plus } from "lucide-react";

export const revalidate = 300;

type PageProps = { params: Promise<{ operacion: string; barrio: string }> };

export function generateStaticParams() {
  return BARRIO_PAGES.map((b) => ({ operacion: "venta", barrio: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { operacion, barrio } = await params;
  const data = getBarrioPage(barrio);
  if (operacion !== "venta" || !data) return { title: "Página no encontrada" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: `Propiedades en venta en ${data.nombre} · Dueño directo`,
    description: `Casas y departamentos en venta en ${data.nombre}, CABA, publicados directamente por sus dueños. Sin comisión inmobiliaria. Mirá el precio del m² y tasá tu propiedad gratis.`,
    alternates: { canonical: `${siteUrl}/propiedades/venta/${data.slug}` },
  };
}

export default async function BarrioPage({ params }: PageProps) {
  const { operacion, barrio } = await params;
  const data = getBarrioPage(barrio);
  if (operacion !== "venta" || !data) notFound();

  const supabase = await createClient();
  const [{ data: properties }, precios] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("status", "activa")
      .eq("barrio", data.nombre)
      .order("created_at", { ascending: false }),
    getPreciosBarrios(),
  ]);

  const precioM2 = precios[data.nombre];
  const count = properties?.length || 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>
          <a href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</a>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          <a href="/propiedades" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Propiedades</a>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          {data.nombre}
        </div>

        {/* Header */}
        <div className="es-eyebrow" style={{ marginBottom: 10 }}>
          <MapPin size={13} strokeWidth={2} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          Ciudad Autónoma de Buenos Aires
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
          <a href="/estimador" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--gold-700)", textDecoration: "underline", textUnderlineOffset: 2 }}>
            <Calculator size={16} strokeWidth={1.75} />
            Tasá tu propiedad en {data.nombre} gratis
          </a>
        </div>

        {/* Texto editorial */}
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          {data.intro.map((p, i) => (
            <p key={i} style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.75, color: "var(--ink-600)", margin: "0 0 14px" }}>
              {p}
            </p>
          ))}
        </div>

        {/* Propiedades */}
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(19px,3vw,26px)",
          letterSpacing: "-.01em", color: "var(--navy-800)", margin: "0 0 18px",
        }}>
          En venta ahora en {data.nombre}
        </h2>

        {!count ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)", marginBottom: 36 }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 6 }}>
              En este momento no hay propiedades publicadas en {data.nombre}.
            </p>
            <a href="/propiedades" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)", textDecoration: "underline" }}>
              Ver propiedades en otros barrios
            </a>
          </div>
        ) : (
          <div className="grid-properties" style={{ marginBottom: 36 }}>
            {(properties as Property[]).map((p) => (
              <PropertyListCard key={p.id} property={p} />
            ))}
          </div>
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
            Averiguá cuánto vale con nuestro tasador online y publicala gratis.
            Recibís las consultas directo, sin pagar comisión.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/estimador" className="esbtn esbtn-gold" style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
              border: "1.5px solid transparent", display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14.5, padding: "13px 24px", background: "var(--gold-500)", color: "#26200f",
              textDecoration: "none",
            }}>
              <Calculator size={16} strokeWidth={2} /> Tasar mi propiedad
            </a>
            <a href="/auth/registro" style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
              border: "1.5px solid rgba(255,255,255,.35)", display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14.5, padding: "13px 24px", background: "transparent", color: "#fff",
              textDecoration: "none",
            }}>
              <Plus size={16} strokeWidth={2} /> Publicar gratis
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
