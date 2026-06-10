import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import PropertyMapWrapper from "@/components/map/PropertyMapWrapper";
import { geocodeProperty } from "@/lib/utils/geocode";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { getBarrioPage } from "@/lib/barrios";
import { slugifyUbicacion } from "@/lib/ubicaciones";
import type { Metadata } from "next";
import type { Property, Profile } from "@/lib/types";
import Footer from "@/components/Footer";
import StickyPropertyBar from "@/components/properties/StickyPropertyBar";
import PropertyGallery from "@/components/properties/PropertyGallery";
import InquiryForm from "@/components/properties/InquiryForm";
import Navbar from "@/components/Navbar";
import { MapPin, BedDouble, Bath, Ruler, Car, Home, Building2, Trees, Store, Briefcase, Calendar, LayoutGrid, Compass, AlignCenter, BadgeCheck } from "lucide-react";

export const revalidate = 60;

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};
const TIPO_ICON: Record<string, React.ReactNode> = {
  casa:         <Home size={18} strokeWidth={1.75} />,
  departamento: <Building2 size={18} strokeWidth={1.75} />,
  terreno:      <Trees size={18} strokeWidth={1.75} />,
  local:        <Store size={18} strokeWidth={1.75} />,
  oficina:      <Briefcase size={18} strokeWidth={1.75} />,
};

type PageProps = { params: Promise<{ operacion: string; barrio: string; tipo: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("titulo, descripcion, ciudad, barrio, provincia, fotos, operacion, tipo")
    .eq("short_id", id).eq("status", "activa").maybeSingle();

  if (!data) return { title: "Propiedad no encontrada" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const description = data.descripcion?.slice(0, 160) ||
    `${TIPO_LABEL[data.tipo]} en ${data.barrio || data.ciudad}, ${data.provincia}. Espacio Inmobiliario.`;
  const canonicalUrl = `${siteUrl}${buildPropertyUrl({ operacion: data.operacion, barrio: data.barrio, ciudad: data.ciudad, tipo: data.tipo, id })}`;

  return {
    title: data.titulo,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: data.titulo, description,
      images: data.fotos?.[0] ? [{ url: data.fotos[0], width: 1200, height: 630 }] : [],
    },
    twitter: { card: "summary_large_image", title: data.titulo, description },
  };
}

export default async function PropiedadPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*, profiles(nombre, email, telefono)")
    .eq("short_id", id).eq("status", "activa").maybeSingle();

  if (propError) console.error("Property fetch error:", propError);
  if (!property) notFound();

  // Incrementar vistas después de enviar la respuesta (no bloquea el render)
  // Usamos admin client porque after() corre fuera del contexto de request (sin cookies)
  after(async () => {
    try {
      const admin = createAdminClient();
      await admin.rpc("increment_property_views", { property_id: property.id });
    } catch (e) {
      console.error("Error incrementando views:", e);
    }
  });

  const p = property as Property & { profiles: Profile };

  // Coordenadas guardadas al crear/editar; fallback a Nominatim
  // solo para propiedades viejas que aún no fueron re-guardadas
  const geoResult =
    p.lat != null && p.lng != null
      ? { lat: p.lat, lng: p.lng, aproximada: p.geo_aproximada ?? true }
      : await geocodeProperty({
          direccion: p.direccion,
          barrio: p.barrio,
          ciudad: p.ciudad,
          provincia: p.provincia,
        });
  const precio = `${p.moneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(p.precio))}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org", "@type": "RealEstateListing",
    name: p.titulo, description: p.descripcion || p.titulo,
    url: `${siteUrl}${buildPropertyUrl({ operacion: p.operacion, barrio: p.barrio, ciudad: p.ciudad, tipo: p.tipo, id })}`,
    image: p.fotos,
    offers: { "@type": "Offer", price: p.precio, priceCurrency: p.moneda, availability: "https://schema.org/InStock" },
    address: { "@type": "PostalAddress", streetAddress: p.direccion || "", addressLocality: p.barrio || p.ciudad, addressRegion: p.provincia, addressCountry: "AR" },
    ...(p.superficie_total && { floorSize: { "@type": "QuantitativeValue", value: p.superficie_total, unitCode: "MTK" } }),
    ...(p.dormitorios && { numberOfRooms: p.dormitorios }),
  };

  const whatsappMsg = encodeURIComponent(`Hola, vi tu propiedad "${p.titulo}" en Espacio Inmobiliario y me interesa. ¿Podemos hablar?`);
  const whatsappUrl = p.profiles?.telefono
    ? `https://wa.me/${p.profiles.telefono.replace(/\D/g, "")}?text=${whatsappMsg}`
    : null;

  const feats: [React.ReactNode, string][] = [
    ...(p.ambientes != null ? [[<LayoutGrid key="amb" size={18} strokeWidth={1.75} />, `${p.ambientes} ${p.ambientes === 1 ? "ambiente" : "ambientes"}`] as [React.ReactNode, string]] : []),
    [<BedDouble key="bed" size={18} strokeWidth={1.75} />, `${p.dormitorios ?? "—"} ${p.dormitorios === 1 ? "dormitorio" : "dormitorios"}`],
    [<Bath key="bath" size={18} strokeWidth={1.75} />, `${p.banos ?? "—"} ${p.banos === 1 ? "baño" : "baños"}`],
    [<Ruler key="ruler" size={18} strokeWidth={1.75} />, p.superficie_total ? `${p.superficie_total} m² totales` : "— m²"],
    [<Car key="car" size={18} strokeWidth={1.75} />, p.cochera ? "Cochera incluida" : "Sin cochera"],
    ...(p.orientacion ? [[<Compass key="ori" size={18} strokeWidth={1.75} />, p.orientacion] as [React.ReactNode, string]] : []),
    ...(p.disposicion ? [[<AlignCenter key="dis" size={18} strokeWidth={1.75} />, `Disposición ${p.disposicion}`] as [React.ReactNode, string]] : []),
    ...(p.apto_credito ? [[<BadgeCheck key="cred" size={18} strokeWidth={1.75} />, "Apto crédito hipotecario"] as [React.ReactNode, string]] : []),
    [TIPO_ICON[p.tipo], TIPO_LABEL[p.tipo]],
    [<Calendar key="cal" size={18} strokeWidth={1.75} />, "Disponible ya"],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="property-page-pad" style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <Navbar />

        <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(16px,4vw,28px) 20px clamp(40px,6vw,64px)" }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", marginBottom: 18, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px 0", overflow: "hidden" }}>
            <a href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</a>
            <span style={{ color: "var(--gold-500)", margin: "0 8px" }}>/</span>
            <a href="/propiedades" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Propiedades</a>
            {p.barrio && (
              <>
                <span style={{ color: "var(--gold-500)", margin: "0 8px" }}>/</span>
                <a
                  href={
                    getBarrioPage(slugifyUbicacion(p.barrio))
                      ? `/propiedades/venta/${slugifyUbicacion(p.barrio)}`
                      : `/propiedades?provincia=${encodeURIComponent(p.provincia)}`
                  }
                  style={{ color: "var(--ink-500)", textDecoration: "none" }}
                >
                  {p.barrio}
                </a>
              </>
            )}
            <span style={{ color: "var(--gold-500)", margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--ink-800)", fontWeight: 500 }}>
              {p.titulo.slice(0, 45)}{p.titulo.length > 45 ? "…" : ""}
            </span>
          </div>

          {/* Gallery */}
          <PropertyGallery fotos={p.fotos} titulo={p.titulo} />

          {/* 2-column layout */}
          <div className="grid-detail">
            {/* Left — content */}
            <div>
              {/* Badges */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5, padding: "6px 11px", borderRadius: 999, background: "rgba(14,44,80,.08)", color: "var(--navy-800)" }}>
                  {TIPO_LABEL[p.tipo]}
                </span>
                <span style={{
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
                  padding: "6px 11px", borderRadius: 999,
                  background: "var(--navy-800)", color: "#fff",
                }}>
                  Venta
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 600,
                fontSize: "clamp(22px,4vw,34px)",
                lineHeight: 1.15, letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 10px",
              }}>
                {p.titulo}
              </h1>

              {/* Location */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--ink-600)", marginBottom: 28 }}>
                <MapPin size={17} strokeWidth={1.75} color="var(--gold-600)" />
                {[p.barrio, p.ciudad, p.provincia].filter(Boolean).join(", ")}
                {p.direccion && ` · ${p.direccion}`}
              </div>

              {/* Specs grid */}
              <div className="grid-specs">
                {feats.map(([icon, text], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 38, height: 38, borderRadius: "var(--radius-sm)",
                      background: "var(--navy-50)", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      color: "var(--navy-700)",
                    }}>
                      {icon}
                    </span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "#3b362e", fontWeight: 500 }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mapa */}
              {geoResult && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontWeight: 600,
                    fontSize: 22, color: "var(--navy-800)", margin: "0 0 14px",
                  }}>
                    Ubicación
                  </h3>
                  <PropertyMapWrapper
                    lat={geoResult.lat}
                    lng={geoResult.lng}
                    titulo={p.titulo}
                    aproximada={geoResult.aproximada}
                  />
                </div>
              )}

              {/* Description */}
              {p.descripcion && (
                <>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--navy-800)", margin: "0 0 12px" }}>
                    Descripción
                  </h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.75, color: "var(--ink-600)", margin: "0 0 18px", maxWidth: 560, whiteSpace: "pre-line" }}>
                    {p.descripcion}
                  </p>
                </>
              )}

              {/* Publisher tag */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
                <span style={{ height: 1.5, width: 60, background: "var(--gold-500)", display: "block" }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)" }}>
                  Publicado por el propietario
                </span>
              </div>
            </div>

            {/* Right — sticky sidebar */}
            <div className="detail-sidebar" id="consultar">
              <div style={{
                background: "#fff", border: "1px solid var(--line-200)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: 24,
              }}>
                {/* Price label */}
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", marginBottom: 4 }}>
                  Precio de venta
                </div>

                {/* Price */}
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 34, color: "var(--gold-700)", letterSpacing: "-.01em", marginBottom: 18 }}>
                  {precio}
                </div>

                {/* Owner */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid var(--line-100)", marginBottom: 18 }}>
                  <span style={{
                    width: 44, height: 44, borderRadius: 999,
                    background: "var(--navy-800)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, flexShrink: 0,
                  }}>
                    {p.profiles?.nombre?.[0]?.toUpperCase() || "D"}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-900)" }}>
                      {p.profiles?.nombre || "Propietario"}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" }}>
                      Propietario directo
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 8, width: "100%", fontFamily: "var(--font-sans)", fontWeight: 600,
                      borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
                      fontSize: 14.5, padding: "13px 24px", marginBottom: 10,
                      background: "#25D366", color: "#fff", textDecoration: "none",
                      transition: "all var(--dur) var(--ease-out)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Consultar por WhatsApp
                  </a>
                )}

                {/* Inquiry form */}
                <InquiryForm propertyId={p.id} />
              </div>

              {/* Reference */}
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", textAlign: "center" }}>
                Ref: {p.id.slice(0, 8).toUpperCase()} · Publicado {new Date(p.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Barra fija mobile con precio + contacto */}
      <StickyPropertyBar precio={precio} whatsappUrl={whatsappUrl} />
    </>
  );
}
