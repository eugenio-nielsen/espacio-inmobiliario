import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Property, Profile } from "@/lib/types";
import PropertyGallery from "@/components/properties/PropertyGallery";
import InquiryForm from "@/components/properties/InquiryForm";
import Logo from "@/components/Logo";

export const revalidate = 60;

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

type PageProps = { params: Promise<{ operacion: string; barrio: string; tipo: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("titulo, descripcion, ciudad, barrio, provincia, fotos, operacion, tipo")
    .eq("short_id", id)
    .eq("status", "activa")
    .maybeSingle();

  if (!data) return { title: "Propiedad no encontrada" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const description =
    data.descripcion?.slice(0, 160) ||
    `${TIPO_LABEL[data.tipo]} en ${data.barrio || data.ciudad}, ${data.provincia}. Espacio Inmobiliario.`;

  return {
    title: data.titulo,
    description,
    alternates: { canonical: `${siteUrl}/propiedades/${data.operacion}/${id}` },
    openGraph: {
      title: data.titulo,
      description,
      images: data.fotos?.[0] ? [{ url: data.fotos[0], width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.titulo,
      description,
      images: data.fotos?.[0] ? [data.fotos[0]] : [],
    },
  };
}

export default async function PropiedadPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*, profiles(nombre, email, telefono)")
    .eq("short_id", id)
    .eq("status", "activa")
    .maybeSingle();

  if (propError) console.error("Property fetch error:", propError);
  if (!property) notFound();

  const p = property as Property & { profiles: Profile };
  const precio = new Intl.NumberFormat("es-AR").format(p.precio);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const publicUrl = `${siteUrl}/propiedades/${p.operacion}/${p.barrio ? p.barrio.toLowerCase().replace(/\s+/g, "-") : ""}/${p.tipo}/${p.id.slice(0, 8)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    description: p.descripcion || p.titulo,
    url: publicUrl,
    image: p.fotos,
    offers: {
      "@type": "Offer",
      price: p.precio,
      priceCurrency: p.moneda,
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: p.direccion || "",
      addressLocality: p.barrio || p.ciudad,
      addressRegion: p.provincia,
      addressCountry: "AR",
    },
    ...(p.superficie_total && { floorSize: { "@type": "QuantitativeValue", value: p.superficie_total, unitCode: "MTK" } }),
    ...(p.dormitorios && { numberOfRooms: p.dormitorios }),
    ...(p.banos && { numberOfBathroomsTotal: p.banos }),
  };

  const whatsappMsg = encodeURIComponent(
    `Hola, vi tu propiedad "${p.titulo}" en Espacio Inmobiliario y me interesa. ¿Podemos hablar?`
  );
  const whatsappUrl = p.profiles?.telefono
    ? `https://wa.me/${p.profiles.telefono.replace(/\D/g, "")}?text=${whatsappMsg}`
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href="/" className="flex items-center">
              <Logo className="h-10 w-auto" />
            </a>
            <span className="text-gray-300 hidden sm:block">›</span>
            <a href="/propiedades" className="text-sm text-gray-500 hover:text-[#0E2C50] hidden sm:block">Propiedades</a>
            <span className="text-gray-300 hidden sm:block">›</span>
            <span className="text-sm text-gray-700 truncate hidden sm:block max-w-xs">{p.titulo}</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <PropertyGallery fotos={p.fotos} titulo={p.titulo} />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#0E2C50", color: "#fff" }}>
                    {TIPO_LABEL[p.tipo]}
                  </span>
                  <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#b99f6622", color: "#7a6535" }}>
                    {p.operacion === "venta" ? "Venta" : "Alquiler"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#0E2C50] mb-2">{p.titulo}</h1>
                <p className="text-gray-500 text-sm mb-4">
                  📍 {p.barrio ? `${p.barrio}, ` : ""}{p.ciudad}, {p.provincia}
                  {p.direccion && ` — ${p.direccion}`}
                </p>
                <p className="text-3xl font-bold" style={{ color: "#b99f66" }}>
                  {p.moneda} {precio}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-[#0E2C50] mb-4">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {p.superficie_total && (
                    <div className="text-center bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">📐</div>
                      <div className="font-semibold text-gray-800">{p.superficie_total} m²</div>
                      <div className="text-xs text-gray-500">Sup. total</div>
                    </div>
                  )}
                  {p.superficie_cubierta && (
                    <div className="text-center bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">🏗️</div>
                      <div className="font-semibold text-gray-800">{p.superficie_cubierta} m²</div>
                      <div className="text-xs text-gray-500">Sup. cubierta</div>
                    </div>
                  )}
                  {p.dormitorios != null && (
                    <div className="text-center bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">🛏️</div>
                      <div className="font-semibold text-gray-800">{p.dormitorios}</div>
                      <div className="text-xs text-gray-500">Dormitorio{p.dormitorios !== 1 ? "s" : ""}</div>
                    </div>
                  )}
                  {p.banos != null && (
                    <div className="text-center bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">🚿</div>
                      <div className="font-semibold text-gray-800">{p.banos}</div>
                      <div className="text-xs text-gray-500">Baño{p.banos !== 1 ? "s" : ""}</div>
                    </div>
                  )}
                  {p.cochera && (
                    <div className="text-center bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">🚗</div>
                      <div className="font-semibold text-gray-800">Sí</div>
                      <div className="text-xs text-gray-500">Cochera</div>
                    </div>
                  )}
                </div>
              </div>

              {p.descripcion && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-semibold text-[#0E2C50] mb-3">Descripción</h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{p.descripcion}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Publicado por el dueño</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#0E2C50" }}>
                    {p.profiles?.nombre?.[0]?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{p.profiles?.nombre || "Dueño"}</p>
                    <p className="text-xs text-gray-400">Propietario directo</p>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm mb-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Consultar por WhatsApp
                  </a>
                )}

                <InquiryForm propertyId={p.id} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-xs text-gray-400 space-y-1">
                <p>Publicado: {new Date(p.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Referencia: {p.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-[#0E2C50] text-gray-400 text-sm text-center py-6 px-4 mt-12">
          <p className="text-gray-300">© {new Date().getFullYear()} Espacio Inmobiliario — espacioinmobiliario.com.ar</p>
        </footer>
      </div>
    </>
  );
}
