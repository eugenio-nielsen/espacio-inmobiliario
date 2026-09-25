import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import Guilloche from "@/components/ui/Guilloche";
import PortadaNota from "@/components/blog/PortadaNota";
import ListadoPosts from "@/components/blog/ListadoPosts";
import { getPublishedPosts } from "@/lib/blog/data";
import { readingTime } from "@/lib/blog/markdown";
import "@/components/blog/blog.css";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

/** La serie mensual con los datos del Colegio de Escribanos. */
const ES_SERIE = (categoria: string | null) => !!categoria?.startsWith("Seguimiento de Escrituras");

export const metadata: Metadata = {
  title: "Blog · Guías y consejos inmobiliarios",
  description: "Guías, análisis de mercado y consejos para vender, comprar y gestionar propiedades en Argentina, por Espacio Inmobiliario. Información confiable de fuente profesional.",
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "Blog · Espacio Inmobiliario",
    description: "Guías y consejos inmobiliarios de fuente profesional.",
    type: "website",
  },
};

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "";

/**
 * Listado del blog, armado como una revista y no como una grilla:
 *
 *   · La nota más reciente abre a pantalla completa, con su portada de
 *     marca detrás y el título grande en serif.
 *   · Las dos siguientes, en tarjetas grandes.
 *   · La serie mensual de escrituras, con franja propia: lo que se
 *     repite cada mes es lo que hace reconocible a una publicación.
 *   · El índice completo, filtrable por sección (ListadoPosts).
 */
export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const [destacada, ...resto] = posts;
  const recientes = resto.slice(0, 2);
  const serie = posts.filter(p => ES_SERIE(p.categoria));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog de Espacio Inmobiliario",
    url: `${SITE}/blog`,
    description: "Guías y consejos inmobiliarios de fuente profesional.",
    blogPost: posts.slice(0, 20).map(p => ({
      "@type": "BlogPosting",
      headline: p.titulo,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.published_at,
      author: { "@type": "Person", name: p.autor },
    })),
  };

  return (
    <div className="bl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {!destacada ? (
        <main style={{ flex: 1, maxWidth: "var(--container)", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h1 className="bl-h2">Blog</h1>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)" }}>Pronto vas a encontrar acá nuestras primeras notas.</p>
        </main>
      ) : (
        <main style={{ flex: 1 }}>
          {/* ── Destacada ───────────────────────────────────── */}
          <section className="bl-portada">
            <div className="bl-portada-fondo"><PortadaNota post={destacada} tamano="hero" /></div>
            <div className="bl-velo" aria-hidden="true" />
            <div className="bl-portada-in">
              <FadeIn direction="none">
                <h1 className="bl-marca">Blog de Espacio Inmobiliario</h1>
              </FadeIn>
              <div className="bl-destacada">
                <FadeIn delay={120} direction="up">
                  {destacada.categoria && <span className="bl-seccion">{destacada.categoria}</span>}
                  <h2 className="bl-titulo">
                    <Link href={`/blog/${destacada.slug}`}>{destacada.titulo}</Link>
                  </h2>
                </FadeIn>
                <FadeIn delay={240} direction="up">
                  {destacada.resumen && <p className="bl-resumen">{destacada.resumen}</p>}
                  <p className="bl-meta">
                    {fecha(destacada.published_at)} · {readingTime(destacada.contenido)} min de lectura
                  </p>
                  <Link href={`/blog/${destacada.slug}`} className="bl-leer">
                    Leer la nota
                    <ArrowRight size={15} strokeWidth={1.8} />
                  </Link>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* ── Recientes ───────────────────────────────────── */}
          {recientes.length > 0 && (
            <section className="bl-bloque">
              <div className="bl-bloque-cabeza">
                <h2 className="bl-h2">Lo <em>último</em></h2>
              </div>
              <div className="bl-recientes">
                {recientes.map((p, i) => (
                  <FadeIn key={p.id} delay={i * 120} direction="up">
                    <Link href={`/blog/${p.slug}`} className="bl-tarjeta">
                      <div className="bl-tarjeta-portada"><PortadaNota post={p} tamano="card" /></div>
                      {p.categoria && <p className="bl-tarjeta-seccion">{p.categoria}</p>}
                      <h3 className="bl-tarjeta-titulo">{p.titulo}</h3>
                      {p.resumen && <p className="bl-tarjeta-resumen">{p.resumen}</p>}
                      <p className="bl-tarjeta-meta">{fecha(p.published_at)} · {readingTime(p.contenido)} min de lectura</p>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </section>
          )}

          {/* ── Serie mensual ───────────────────────────────── */}
          {serie.length > 0 && (
            <section className="bl-bloque">
              <FadeIn direction="up">
                <div className="bl-serie">
                  <Guilloche id="gq-serie" className="bl-serie-gq" />
                  <div>
                    <span className="bl-serie-rotulo">Serie mensual</span>
                    <h2 className="bl-serie-t">Escrituras en <em>CABA</em></h2>
                    <p className="bl-serie-p">
                      Cada mes, los números del Colegio de Escribanos de la Ciudad, ordenados y
                      leídos desde el lugar de quien vende o compra.
                    </p>
                  </div>
                  <Link href={`/blog/${serie[0].slug}`} className="bl-serie-ultima">
                    <small>Última entrega{serie.length > 1 ? ` · ${serie.length} publicadas` : ""}</small>
                    <strong>{serie[0].titulo}</strong>
                    <span>Leer la entrega <ArrowRight size={13} strokeWidth={2} /></span>
                  </Link>
                </div>
              </FadeIn>
            </section>
          )}

          {/* ── Índice ─────────────────────────────────────── */}
          <section className="bl-bloque">
            <div className="bl-bloque-cabeza">
              <h2 className="bl-h2">Todas las <em>notas</em></h2>
            </div>
            <ListadoPosts
              posts={posts.map(p => ({
                id: p.id,
                slug: p.slug,
                titulo: p.titulo,
                resumen: p.resumen,
                categoria: p.categoria,
                fecha: fecha(p.published_at),
                minutos: readingTime(p.contenido),
              }))}
            />
          </section>
          <div className="bl-cierre" />
        </main>
      )}

      <Footer />
    </div>
  );
}
