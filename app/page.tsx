import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import HomeSearch from "@/components/HomeSearch";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario — Propiedades directas de dueños en Argentina",
  description:
    "Comprá, vendé o alquilá propiedades directamente con los dueños. Sin comisiones ni intermediarios. Espacio Inmobiliario, Buenos Aires.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  openGraph: {
    title: "Espacio Inmobiliario — Dueños Directos",
    description: "Propiedades directas de dueños en Buenos Aires. Sin comisiones.",
    type: "website",
  },
};

const STEPS = [
  {
    num: "01",
    color: "#0E2C50",
    title: "Publicá tu Propiedad",
    desc: "Cargá las fotos, datos y ubicación de tu propiedad en minutos. Es completamente gratis y sin compromiso.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    num: "02",
    color: "#b99f66",
    title: "Recibí Consultas",
    desc: "Los compradores interesados te contactan directamente por WhatsApp, email o desde la plataforma.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    num: "03",
    color: "#059669",
    title: "Cerrá la Operación",
    desc: "Acordá directamente con el comprador, sin comisiones ni intermediarios. Ahorrás entre un 3% y 6%.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "0%", label: "Comisión inmobiliaria" },
  { value: "100%", label: "Trato directo con el dueño" },
  { value: "24hs", label: "Tiempo promedio de primera consulta" },
  { value: "Gratis", label: "Publicación de tu propiedad" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      {/*
        Para agregar imagen de fondo real:
        1. Poné una foto en public/hero-bg.jpg
        2. Cambiá la línea del style por:
           style={{ backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      */}
      <section className="hero-pattern relative min-h-[620px] flex items-center">
        {/* Subtle gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "#b99f66" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border"
              style={{ borderColor: "rgba(185,159,102,0.4)", background: "rgba(185,159,102,0.1)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#b99f66" }} />
              <span className="text-xs font-medium" style={{ color: "#d4c49a" }}>
                La nueva forma de comprar propiedades
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-serif font-bold leading-tight mb-6">
              <span className="block text-5xl md:text-6xl lg:text-7xl text-white">
                Dueños Directos.
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl italic text-gradient-gold mt-1">
                Publicá tu propiedad Gratis.
              </span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Propiedades publicadas directamente por sus Dueños.
              Comprá y Vendé sin Comisión Inmobiliaria ni Intermediarios.
            </p>

            {/* Search bar */}
            <div className="mb-8">
              <HomeSearch />
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-wrap gap-3">
              <a href="#"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/25 rounded-xl hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Obtener informe de valor
              </a>
              <a href="/auth/registro"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/25 rounded-xl hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Publicar propiedad
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <section style={{ background: "#0E2C50" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center px-4">
                <p className="text-2xl font-bold font-serif" style={{ color: "#b99f66" }}>{s.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#b99f66" }}>
              Simple y Directo
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: "#0E2C50" }}>
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
              Vendé tu propiedad en 3 simples pasos, sin comisiones y
              conectando directamente con compradores reales.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-14">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop only, not last) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+52px)] right-[calc(-50%+52px)] h-px"
                    style={{ background: `linear-gradient(to right, ${step.color}40, transparent)` }} />
                )}

                {/* Number badge */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-0"
                    style={{ background: `${step.color}10`, color: step.color }}>
                    {step.icon}
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                    style={{ background: step.color }}
                  >
                    {step.num.replace("0", "")}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="/auth/registro"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: "#0E2C50" }}
            >
              Publicar mi propiedad gratis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── PROPIEDADES DESTACADAS ───────────────────── */}
      <section className="py-24" style={{ background: "#f8f8f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#b99f66" }}>
                Selección Premium
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold" style={{ color: "#0E2C50" }}>
                Propiedades en Buenos Aires
                <br className="hidden md:block" /> Destacadas
              </h2>
              <p className="text-gray-500 text-sm mt-2 max-w-md">
                Encontrá oportunidades en estas propiedades. ¡Contactate directo con el dueño!
              </p>
            </div>
            <a
              href="/propiedades"
              className="inline-flex items-center gap-1 text-sm font-semibold hover:underline shrink-0"
              style={{ color: "#0E2C50" }}
            >
              Ver todo el catálogo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {!properties?.length ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#0E2C5010" }}>
                <svg className="w-8 h-8" fill="none" stroke="#0E2C50" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">Todavía no hay propiedades publicadas.</p>
              <a href="/auth/registro"
                className="inline-block text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
                style={{ background: "#0E2C50" }}>
                Publicá la primera
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(properties as Property[]).map((p) => (
                <PropertyListCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA DUEÑOS ──────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#0E2C50" }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-5"
          style={{ background: "#b99f66" }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-5"
          style={{ background: "#b99f66" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#b99f66" }}>
            Para Propietarios
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            ¿Sos dueño y querés<br />
            <span className="italic" style={{ color: "#b99f66" }}>vender o alquilar?</span>
          </h2>
          <p className="text-blue-200 max-w-lg mx-auto mb-10 leading-relaxed">
            Publicá tu propiedad gratis, recibí consultas directamente y cerrá el
            trato sin pagar comisión. Miles de compradores te están esperando.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/auth/registro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-navy rounded-xl transition-all hover:opacity-90"
              style={{ background: "#b99f66" }}>
              Publicar mi propiedad gratis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="/propiedades"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white border border-white/25 rounded-xl hover:bg-white/10 transition-colors">
              Ver propiedades
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer style={{ background: "#071828" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <Logo className="h-12 w-auto mb-4 opacity-90" />
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                El marketplace inmobiliario donde los dueños publican directamente.
                Sin comisiones, sin intermediarios.
              </p>
              <p className="text-gray-500 text-xs mt-3">espacioinmobiliario.com.ar</p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#b99f66" }}>
                Plataforma
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/propiedades" className="hover:text-white transition-colors">Propiedades</a></li>
                <li><a href="/auth/registro" className="hover:text-white transition-colors">Publicar propiedad</a></li>
                <li><a href="/auth/login" className="hover:text-white transition-colors">Ingresar</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#b99f66" }}>
                Contacto
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 [Teléfono]</li>
                <li>✉️ [Email]</li>
                <li>📍 Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Espacio Inmobiliario. Todos los derechos reservados.</p>
            <p>Buenos Aires, Argentina</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
