import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/blog/data";
import { renderPost, readingTime, stripMarkdown } from "@/lib/blog/markdown";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";

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

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const { html, toc } = renderPost(post.contenido);
  const min = readingTime(post.contenido);
  const url = `${SITE}/blog/${post.slug}`;
  const description = post.meta_description || post.resumen || stripMarkdown(post.contenido);

  // Notas relacionadas (misma categoría)
  const all = await getPublishedPosts();
  const relacionadas = all.filter(p => p.id !== post.id && p.categoria === post.categoria).slice(0, 3);

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
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />

      <main style={{ flex: 1, maxWidth: 760, margin: "0 auto", width: "100%", padding: "clamp(20px,4vw,36px) 20px clamp(48px,7vw,72px)" }}>
        {/* Breadcrumb */}
        <nav style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ color: "var(--gold-500)" }}>/</span>
          <Link href="/blog" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Blog</Link>
        </nav>

        <article>
          <header style={{ marginBottom: 28 }}>
            {post.categoria && <div className="es-eyebrow" style={{ marginBottom: 12 }}>{post.categoria}</div>}
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px,4.5vw,44px)", letterSpacing: "-.02em", lineHeight: 1.15, color: "var(--navy-800)", margin: "0 0 16px" }}>
              {post.titulo}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", flexWrap: "wrap" }}>
              <span>Por {post.autor}</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--ink-300)" }} />
              <time dateTime={post.published_at || undefined}>{fmtDate(post.published_at)}</time>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--ink-300)" }} />
              <span>{min} min de lectura</span>
            </div>
          </header>

          {post.cover && (
            <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24, background: "var(--navy-50)" }}>
              <Image src={post.cover} alt={post.titulo} fill className="object-cover" sizes="760px" priority />
            </div>
          )}

          {/* Compartir (arriba) */}
          <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid var(--line-200)" }}>
            <ShareButtons url={url} title={post.titulo} />
          </div>

          {/* Índice de contenidos */}
          <TableOfContents items={toc} />

          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Compartir (abajo) */}
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--line-200)" }}>
            <ShareButtons url={url} title={post.titulo} />
          </div>
        </article>

        {/* CTA */}
        <div style={{ marginTop: 40, background: "var(--navy-800)", borderRadius: "var(--radius-lg)", padding: "28px 26px", textAlign: "center", color: "#fff" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, margin: "0 0 8px" }}>¿Sos dueño y querés vender?</h3>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "rgba(255,255,255,.7)", margin: "0 0 18px" }}>
            Publicá gratis, sin comisiones, con el respaldo de un martillero público.
          </p>
          <Link href="/auth/registro" style={{ display: "inline-flex", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, background: "var(--gold-500)", color: "var(--navy-900)", padding: "12px 24px", borderRadius: "var(--radius-sm)", textDecoration: "none" }}>
            Publicar mi propiedad gratis
          </Link>
        </div>

        {/* Relacionadas */}
        {relacionadas.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--navy-800)", margin: "0 0 18px" }}>Seguí leyendo</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {relacionadas.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "14px 18px", textDecoration: "none" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--navy-800)" }}>{p.titulo}</span>
                  <span style={{ color: "var(--gold-600)", fontSize: 18 }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
