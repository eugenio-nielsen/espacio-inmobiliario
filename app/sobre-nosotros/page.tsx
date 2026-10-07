import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FirmaTrazo from "@/components/FirmaTrazo";
import { SITE } from "@/lib/site";
import { MessageCircle, ArrowRight } from "lucide-react";

import { WHATSAPP } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Sobre nosotros · Quién está detrás del portal",
  description:
    "Espacio Inmobiliario es un portal de propiedades de dueños directos con respaldo profesional: cada publicación la revisa Eugenio Nielsen y cada operación tiene a alguien que la acompaña hasta la escritura.",
  alternates: { canonical: `${SITE}/sobre-nosotros` },
  openGraph: {
    title: "Sobre nosotros · Espacio Inmobiliario",
    description: "Un portal de dueños directos, con una persona con nombre y apellido detrás de cada publicación.",
    url: `${SITE}/sobre-nosotros`,
    type: "website",
  },
};

export default function SobreNosotrosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE}/sobre-nosotros`,
    name: "Sobre Espacio Inmobiliario",
    mainEntity: {
      "@type": "Person",
      name: "Eugenio Nielsen",
      jobTitle: "Fundador",
      worksFor: { "@type": "Organization", name: "Espacio Inmobiliario", url: SITE },
      url: `${SITE}/sobre-nosotros`,
    },
  };

  const p: React.CSSProperties = { fontSize: 16.5, lineHeight: 1.8, color: "var(--ink-600)", margin: "0 0 16px" };
  const h2: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(21px,3vw,28px)", letterSpacing: "-.01em", color: "var(--navy-800)", margin: "34px 0 12px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(28px,5vw,56px) 20px clamp(48px,7vw,80px)", fontFamily: "var(--font-sans)" }}>
        <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>
          <Link href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</Link>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          Sobre nosotros
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(28px,5vw,44px)", letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 20px" }}>
          Un portal de dueños directos, con una persona detrás
        </h1>
        <p style={p}>
          Espacio Inmobiliario reúne propiedades publicadas directamente por sus dueños en la Ciudad y la Provincia de Buenos Aires,
          sin comisión inmobiliaria. Pero no funciona en piloto automático: cada publicación pasa por las manos de
          {" "}<strong>Eugenio Nielsen</strong> antes de salir, y cada operación tiene a alguien que la acompaña hasta la escritura.
        </p>

        <h2 style={h2}>Qué hacemos</h2>
        <p style={p}>
          Si querés <Link href="/vender" style={{ color: "var(--gold-700)" }}>vender</Link>, publicar es gratis y los interesados te escriben directo.
          Si querés <Link href="/comprar" style={{ color: "var(--gold-700)" }}>comprar</Link>, hablás con quien vende y podés pedir
          acompañamiento para revisar la documentación antes de firmar. Y si todavía no sabés cuánto vale tu propiedad, el{" "}
          <Link href="/estimador" style={{ color: "var(--gold-700)" }}>tasador online</Link> te da un rango de valor gratis.
        </p>

        <h2 style={h2}>Información en la que podés apoyarte</h2>
        <p style={p}>
          Además del portal publicamos el <Link href="/blog" style={{ color: "var(--gold-700)" }}>blog</Link> con guías y datos del mercado,
          la tabla de <Link href="/precios-m2" style={{ color: "var(--gold-700)" }}>precio del m² por barrio</Link>, las herramientas de la{" "}
          <Link href="/catedra" style={{ color: "var(--gold-700)" }}>Cátedra</Link> y la <Link href="/foro" style={{ color: "var(--gold-700)" }}>Tertulia Inmobiliaria</Link>,
          un foro para resolver dudas entre personas que compran y venden.
        </p>

        <div style={{ margin: "34px 0", padding: "24px 28px", background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)" }}>
          <FirmaTrazo height={46} grosor={3.4} color="var(--gold-600)" />
          <p style={{ margin: "10px 0 2px", fontWeight: 600, color: "var(--navy-800)" }}>Eugenio Nielsen</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-500)" }}>Fundador · Espacio Inmobiliario</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14.5, padding: "13px 22px", borderRadius: "var(--radius-sm)", background: "var(--gold-500)", color: "#26200f", textDecoration: "none" }}>
            <MessageCircle size={16} strokeWidth={2} /> Hablar con Eugenio
          </a>
          <Link href="/contacto" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14.5, padding: "13px 22px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--line-200)", color: "var(--navy-800)", textDecoration: "none", background: "#fff" }}>
            Escribirnos <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
