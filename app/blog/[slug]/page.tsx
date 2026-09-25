import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import PortadaNota from "@/components/blog/PortadaNota";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelloEN from "@/components/SelloEN";
import FirmaTrazo from "@/components/FirmaTrazo";
import Guilloche from "@/components/ui/Guilloche";
import FadeIn from "@/components/ui/FadeIn";
import Reveal from "@/components/como-funciona/Reveal";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/blog/data";
import { renderPost, readingTime, stripMarkdown } from "@/lib/blog/markdown";
import TableOfContents from "@/components/blog/TableOfContents";
import IndiceLateral from "@/components/blog/IndiceLateral";
import ContenidoNota from "@/components/blog/ContenidoNota";
import ShareButtons from "@/components/blog/ShareButtons";
import ProgresoLectura from "@/components/blog/ProgresoLectura";
import MovimientoNota from "@/components/blog/MovimientoNota";
import type { Post } from "@/lib/blog/types";
import "@/components/blog/blog.css";
import "@/components/blog/nota.css";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Nota no encontrada" };

  const title = post.meta_title || post.titulo;
  const description = post.meta_description || post.resumen || stripMarkdown(post.contenido);
  const url = `${SITE}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: [post.autor],
      images: post.cover ? [{ url: post.cover, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      images: post.cover ? [post.cover] : [],
    },
  };
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "";

/**
 * El cierre invita a lo que la nota abrió: quien lee una guía para
 * comprar va a /comprar, no a "¿Sos dueño y querés vender?".
 */
function llamadoPara(categoria: string | null) {
  if (categoria === "Guía para comprar") {
    return { t: "¿Estás por", em: "comprar?", p: "Te acompañamos a decidir con información, antes de firmar.", href: "/comprar", cta: "Comprar con respaldo" };
  }
  if (categoria === "Guía para vender" || categoria === "Consejos para propietarios") {
    return { t: "¿Querés", em: "vender tu propiedad?", p: "Publicá gratis o delegá la venta completa a precio fijo.", href: "/vender", cta: "Cómo vender" };
  }
  return { t: "¿Y en tu", em: "caso?", p: "Contanos tu operación y lo vemos juntos, sin compromiso.", href: "/contacto", cta: "Hacer una consulta" };
}

/** Hasta tres para seguir: primero de la misma sección, después las más recientes. */
function paraSeguir(actual: Post, todas: Post[]) {
  const otras = todas.filter(p => p.id !== actual.id);
  const misma = otras.filter(p => p.categoria && p.categoria === actual.categoria);
  const resto = otras.filter(p => !misma.includes(p));
  return [...misma, ...resto].slice(0, 3);
}

/**
 * La nota, pensada para leer:
 *
 *   · Apertura de cine: portada de marca detrás, título grande en serif,
 *     bajada y la firma con el sello EN.
 *   · Columna de lectura angosta con el índice fijo al costado (en
 *     escritorio) y un filete dorado arriba que marca cuánto se leyó.
 *   · Primer párrafo en serif con capitular; subtítulos numerados en
 *     romanos; citas, cifras, figuras y videos como piezas editoriales
 *     (ver lib/blog/markdown.ts) que entran al llegar al scroll.
 *   · Cierre con la firma de Eugenio, un llamado según la sección y
 *     notas para seguir leyendo.
 */
export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const { html, toc } = renderPost(post.contenido);
  const min = readingTime(post.contenido);
  const url = `${SITE}/blog/${post.slug}`;
  const description = post.meta_description || post.resumen || stripMarkdown(post.contenido);

  const seguir = paraSeguir(post, await getPublishedPosts());
  const llamado = llamadoPara(post.categoria);
  const esEugenio = post.autor === "Eugenio Nielsen";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description,
    image: post.cover ? [post.cover] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.autor },
    publisher: {
      "@type": "Organization",
      name: "Espacio Inmobiliario",
      logo: { "@type": "ImageObject", url: `${SITE}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.categoria || undefined,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.titulo, item: url },
    ],
  };

  return (
    <div className="nt" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ProgresoLectura idArticulo="nota" />
      <Navbar />

      <main style={{ flex: 1 }}>
        <article id="nota">
          {/* ── Apertura ─────────────────────────────────────── */}
          <header className="nt-apertura">
            <div className="nt-apertura-fondo"><PortadaNota post={post} tamano="hero" /></div>
            <div className="nt-velo" aria-hidden="true" />
            <div className="nt-apertura-in">
              <FadeIn direction="none">
                <nav className="nt-migas" aria-label="Migas de pan">
                  <Link href="/">Inicio</Link><i>/</i><Link href="/blog">Blog</Link>
                </nav>
              </FadeIn>
              <FadeIn delay={120} direction="up">
                {post.categoria && <span className="nt-seccion-rotulo">{post.categoria}</span>}
                <h1 className="nt-titulo">{post.titulo}</h1>
              </FadeIn>
              <FadeIn delay={240} direction="up">
                {post.resumen && <p className="nt-bajada">{post.resumen}</p>}
                <div className="nt-firma-linea">
                  {esEugenio && <SelloEN size={48} tono="oscuro" etiqueta="" />}
                  <p>
                    <strong>Por {post.autor}</strong>
                    <time dateTime={post.published_at || undefined}>{fmtDate(post.published_at)}</time> · {min} min de lectura
                  </p>
                </div>
              </FadeIn>
            </div>
          </header>

          {/* ── Cuerpo ───────────────────────────────────────── */}
          <div className="nt-cuerpo">
            <aside className="nt-riel">
              <div className="nt-riel-in">
                <IndiceLateral items={toc} />
                <ShareButtons url={url} title={post.titulo} />
              </div>
            </aside>

            <div className="nt-texto" id="nota-texto">
              <TableOfContents items={toc} />
              <ContenidoNota html={html} />
              <MovimientoNota idTexto="nota-texto" />

              {esEugenio ? (
                <Reveal className="nt-autor">
                  <SelloEN size={76} tono="claro" etiqueta="" />
                  <div>
                    <div className="cf-firma nt-autor-firma"><FirmaTrazo height={40} grosor={3.4} color="var(--gold-600)" /></div>
                    <p className="nt-autor-nombre">Eugenio Nielsen</p>
                    <p className="nt-autor-rol">Fundador · Espacio Inmobiliario</p>
                    <p className="nt-autor-bio">Escribe sobre compra, venta y mercado inmobiliario en Buenos Aires.</p>
                  </div>
                </Reveal>
              ) : (
                <p className="nt-autor-nombre" style={{ marginTop: "3em" }}>{post.autor}</p>
              )}

              <div className="nt-compartir-pie"><ShareButtons url={url} title={post.titulo} /></div>
            </div>
          </div>
        </article>

        {/* ── Llamado según la sección ───────────────────────── */}
        <section className="nt-cta">
          <FadeIn direction="up">
            <div className="nt-cta-in">
              <Guilloche id="gq-cta-nota" className="nt-cta-gq" />
              <div>
                <h2 className="nt-cta-t">{llamado.t} <em>{llamado.em}</em></h2>
                <p className="nt-cta-p">{llamado.p}</p>
              </div>
              <Link href={llamado.href} className="bl-leer" style={{ marginTop: 0 }}>
                {llamado.cta}
                <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ── Seguí leyendo ──────────────────────────────────── */}
        {seguir.length > 0 && (
          <section className="nt-mas">
            <div className="bl-bloque-cabeza">
              <h2 className="bl-h2">Seguí <em>leyendo</em></h2>
              <Link href="/blog" className="hm-camino-cta">
                Todas las notas <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>
            <div className="nt-mas-grilla">
              {seguir.map((p, i) => (
                <FadeIn key={p.id} delay={i * 110} direction="up">
                  <Link href={`/blog/${p.slug}`} className="bl-tarjeta">
                    <div className="bl-tarjeta-portada"><PortadaNota post={p} tamano="card" /></div>
                    {p.categoria && <p className="bl-tarjeta-seccion">{p.categoria}</p>}
                    <h3 className="bl-tarjeta-titulo">{p.titulo}</h3>
                    <p className="bl-tarjeta-meta">{fmtDate(p.published_at)} · {readingTime(p.contenido)} min de lectura</p>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
