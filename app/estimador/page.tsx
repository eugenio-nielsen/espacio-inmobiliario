import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EstimadorWizard from "@/components/estimador/EstimadorWizard";
import { getBarriosDisponibles } from "@/lib/estimador/data";
import { Calculator } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Estimador de Precios de Deptos en CABA",
  description: "Estimá el valor de venta de un departamento en Capital Federal en menos de 30 segundos. Herramienta gratuita y orientativa basada en datos de mercado.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/estimador` },
  openGraph: {
    title: "Estimador de Precios de Deptos en CABA · Espacio Inmobiliario",
    description: "Estimá el valor de venta de tu departamento en CABA en 30 segundos. Gratis y orientativo.",
    type: "website",
  },
};

export default async function EstimadorPage() {
  const barrios = await getBarriosDisponibles();

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero compacto */}
      <section style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden", padding: "clamp(40px,6vw,64px) 20px clamp(44px,6vw,68px)", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(185,159,102,.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Calculator size={26} strokeWidth={1.75} color="var(--gold-400)" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(26px,4.5vw,44px)", letterSpacing: "-.02em", lineHeight: 1.12, margin: "0 0 14px" }}>
            Estimador de Precios{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>de Deptos en CABA</span>
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16.5px)", lineHeight: 1.65, color: "rgba(255,255,255,.72)", margin: 0 }}>
            Obtené un rango de valor de venta orientativo para un departamento
            en Capital Federal en menos de 30 segundos.
          </p>
        </div>
      </section>

      {/* Wizard */}
      <main style={{ flex: 1, padding: "clamp(28px,5vw,48px) 20px clamp(48px,7vw,72px)", maxWidth: "var(--container)", margin: "0 auto", width: "100%" }}>
        <EstimadorWizard barrios={barrios} />
      </main>

      <Footer />
    </div>
  );
}
