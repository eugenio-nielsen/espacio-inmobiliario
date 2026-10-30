import { TELEFONO_E164 } from "@/lib/contacto";
import { SITE } from "@/lib/site";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import type { Metadata } from "next";
import { PROPERTY_CARD_COLS, TOPE_HOME, type PropertyCardData } from "@/lib/types";
import PropiedadesHome from "@/components/home/PropiedadesHome";
import { conPropietarioVerificado } from "@/lib/propiedades/verificados";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, ArrowRight } from "lucide-react";
import Explainer from "@/components/home/Explainer";
import FadeIn from "@/components/ui/FadeIn";
import Caminos from "@/components/home/Caminos";
import ComoTrabajamos from "@/components/home/ComoTrabajamos";
import Respaldo from "@/components/home/Respaldo";
import Apertura from "@/components/home/Apertura";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario · Propiedades directas de dueños en Argentina",
  description: "Comprá o vendé propiedades directamente con los dueños, sin comisiones y con acompañamiento profesional. Espacio Inmobiliario, Buenos Aires.",
  alternates: { canonical: SITE },
  openGraph: {
    title: "Espacio Inmobiliario · Dueños Directos",
    description: "Propiedades directas de dueños en Buenos Aires. Sin comisiones.",
    type: "website",
  },
};

/** Quién es el sitio, para el panel de conocimiento y la búsqueda interna de Google. */
const datosEstructurados = [
  {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": `${SITE}/#organizacion`,
    name: "Espacio Inmobiliario",
    url: SITE,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/opengraph-image`,
    description: "Portal de propiedades de dueños directos y tasador online de departamentos en la Ciudad de Buenos Aires.",
    email: "eugenio@espacioinmobiliario.com.ar",
    telephone: TELEFONO_E164,
    areaServed: ["Ciudad Autónoma de Buenos Aires", "Provincia de Buenos Aires"],
    address: { "@type": "PostalAddress", addressLocality: "Buenos Aires", addressCountry: "AR" },
    founder: { "@type": "Person", name: "Eugenio Nielsen", url: `${SITE}/sobre-nosotros` },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#sitio`,
    name: "Espacio Inmobiliario",
    url: SITE,
    inLanguage: "es-AR",
    publisher: { "@id": `${SITE}/#organizacion` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE}/propiedades?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Cómo funciona Espacio Inmobiliario: de la cuenta a la escritura",
    description: "Recorrido por el sitio: crear la cuenta, publicar una propiedad, buscar, usar el tasador, el panel y las herramientas.",
    thumbnailUrl: `${SITE}/video/explainer-poster.jpg`,
    contentUrl: `${SITE}/video/explainer.mp4`,
    uploadDate: "2026-10-30",
    duration: "PT1M20S",
    inLanguage: "es-AR",
    publisher: { "@id": `${SITE}/#organizacion` },
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Las tres consultas van en paralelo: el tiempo total es el de la más
  // lenta, no la suma. Las estadísticas las agrega Postgres (home_stats).
  // getUser va aparte a propósito: dentro de un Promise.all junto a otras
  // consultas, el adaptador de cookies de Supabase falla. Está cacheado por
  // request, así que el Navbar reusa esta misma llamada.
  const user = await getCurrentUser();

  // Estas dos sí van en paralelo: el tiempo total es el de la más lenta.
  // Las estadísticas las agrega Postgres (home_stats) en vez de traer
  // todas las filas para sumarlas en JavaScript.
  const [{ data: properties }, { data: statsRow }] = await Promise.all([
    supabase
      .from("properties").select(PROPERTY_CARD_COLS).eq("status", "activa")
      .order("created_at", { ascending: false }).limit(TOPE_HOME),
    supabase.rpc("home_stats").maybeSingle<{ total_activas: number; total_views: number }>(),
  ]);

  const destacadas = await conPropietarioVerificado(supabase, (properties ?? []) as PropertyCardData[]);

  const activeCount = statsRow?.total_activas ?? 0;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
      <Navbar />

      {/* ── Apertura (hero) ─────────────────────────────────── */}
      <Apertura logueado={!!user} />

      {/* ── Las cuatro puertas ─────────────────────────────────── */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderBottom: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <Caminos />
        </div>
      </section>

      {/* ── Últimas propiedades ───────────────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
          <div>
            <div className="es-eyebrow" style={{ marginBottom: 8 }}>El portal es solo el comienzo</div>
            <h2 className="section-heading">Últimas propiedades</h2>
          </div>
          <Link href="/propiedades" style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            color: "var(--gold-700)", display: "inline-flex", alignItems: "center",
            gap: 4, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Ver todas <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>

        {!properties?.length ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 16 }}>
              Todavía no hay propiedades publicadas.
            </p>
            <Link href="/auth/registro" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, background: "var(--navy-800)", color: "#fff", borderRadius: "var(--radius-sm)", padding: "11px 22px", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <Plus size={15} strokeWidth={2} /> Publicar la primera
            </Link>
          </div>
        ) : (
          <>
            <PropiedadesHome
              iniciales={destacadas}
              totalActivas={activeCount}
            />
          </>
        )}
      </section>

      {/* ── Cómo trabajamos ───────────────────────────────────── */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(24px,3.5vw,36px)" }}>
              <div className="es-eyebrow" style={{ marginBottom: 10 }}>Cómo trabajamos</div>
              <h2>Te acompañamos en <span className="hm-i">cada paso</span></h2>
            </div>
          </FadeIn>
          <ComoTrabajamos />
        </div>
      </section>

      {/* ── Respaldo ──────────────────────────────────────────────
          Ocupa el lugar del viejo bloque "¿Sos dueño y querés vender?",
          que repetía palabra por palabra el camino "Quiero vender" de
          más arriba. Su CTA de publicar se conservó acá dentro. Trae
          su propia <section>: el fondo y la cinta van a todo el ancho. */}
      <Respaldo />

      {/* ── El recorrido en video ─────────────────────────────────
          Ocupa el lugar del viejo "Ecosistema de servicios", que había
          quedado desactualizado y fuera de la estética del sitio. */}
      <Explainer />

      {/* ── Footer ───────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
