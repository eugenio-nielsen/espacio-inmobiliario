import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import HomeSearch from "@/components/HomeSearch";
import Logo from "@/components/Logo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario — Propiedades directas de dueños en Argentina",
  description:
    "Comprá, vendé o alquilá propiedades directamente con los dueños. Sin intermediarios. Espacio Inmobiliario, Argentina.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  openGraph: {
    title: "Espacio Inmobiliario",
    description: "Propiedades directas de dueños en Argentina. Sin comisiones.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/">
            <Logo className="h-12 w-auto" />
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/propiedades" className="text-gray-600 hover:text-[#0E2C50] font-medium hidden sm:block">
              Propiedades
            </a>
            <a
              href="/auth/registro"
              className="text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              style={{ background: "#0E2C50" }}
            >
              Publicar propiedad
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="text-white py-20 px-4 text-center" style={{ background: "#0E2C50" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Propiedades directas de dueños
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10" style={{ color: "#d4c49a" }}>
          Comprá, vendé o alquilá sin intermediarios en Buenos Aires.
        </p>
        <HomeSearch />
      </section>

      {/* Propiedades destacadas */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#0E2C50" }}>Últimas propiedades</h2>
          <a href="/propiedades" className="text-sm font-medium hover:underline" style={{ color: "#b99f66" }}>
            Ver todas →
          </a>
        </div>

        {!properties?.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-400 text-sm">Todavía no hay propiedades publicadas.</p>
            <a
              href="/auth/registro"
              className="inline-block mt-4 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              style={{ background: "#0E2C50" }}
            >
              Publicá la primera
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(properties as Property[]).map((p) => (
              <PropertyListCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center" style={{ background: "#f5f0e8", borderTop: "1px solid #e8dfc8", borderBottom: "1px solid #e8dfc8" }}>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "#0E2C50" }}>
          ¿Sos dueño y querés vender o alquilar?
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-6 text-sm">
          Publicá tu propiedad gratis, recibí consultas directamente y cerrá el trato sin pagar comisión.
        </p>
        <a
          href="/auth/registro"
          className="inline-block text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          style={{ background: "#0E2C50" }}
        >
          Publicar mi propiedad gratis
        </a>
      </section>

      <footer className="text-gray-400 text-sm text-center py-6 px-4" style={{ background: "#0E2C50" }}>
        <div className="flex justify-center mb-3">
          <Logo className="h-10 w-auto opacity-80" />
        </div>
        <p className="text-gray-300">© {new Date().getFullYear()} Espacio Inmobiliario — espacioinmobiliario.com.ar</p>
        <p className="mt-1 text-gray-500 text-xs">
          📞 [Teléfono] &nbsp;|&nbsp; ✉️ [Email] &nbsp;|&nbsp; 📍 Buenos Aires, Argentina
        </p>
      </footer>
    </main>
  );
}
