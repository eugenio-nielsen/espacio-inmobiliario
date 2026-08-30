import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListadoPosts from "@/components/blog/ListadoPosts";
import { getPublishedPosts } from "@/lib/blog/data";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

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

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  // JSON-LD del listado (Blog)
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
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero */}
      <section style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden", padding: "clamp(44px,6vw,72px) 20px clamp(48px,6vw,76px)", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 12 }}>Blog</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px,4.5vw,46px)", letterSpacing: "-.02em", lineHeight: 1.12, margin: "0 0 14px" }}>
            Guías y consejos{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>inmobiliarios</span>
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16.5px)", lineHeight: 1.65, color: "rgba(255,255,255,.72)", margin: 0 }}>
            Información confiable, de fuente profesional, para vender y comprar mejor en Argentina.
          </p>
        </div>
      </section>

      <main style={{ flex: 1, maxWidth: "var(--container)", margin: "0 auto", width: "100%", padding: "clamp(32px,5vw,56px) 20px clamp(48px,7vw,72px)" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", margin: 0 }}>Pronto vas a encontrar acá nuestras primeras notas.</p>
          </div>
        ) : (
          <ListadoPosts posts={posts} />
        )}
      </main>

      <Footer />
    </div>
  );
}
