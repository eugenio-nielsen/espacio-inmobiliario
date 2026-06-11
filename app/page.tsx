import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import HomeSearch from "@/components/HomeSearch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BadgeCheck, Handshake, MapPin, Plus, ArrowRight, Building2, Eye, Map as MapIcon, Percent } from "lucide-react";
import ServiciosEcosistema from "@/components/servicios/ServiciosEcosistema";
import Counter from "@/components/ui/Counter";
import FadeIn from "@/components/ui/FadeIn";
import SkylineVivo from "@/components/ui/SkylineVivo";
import { BARRIOS_CABA, PARTIDOS_PBA } from "@/lib/ubicaciones";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario · Propiedades directas de dueños en Argentina",
  description: "Comprá, vendé o alquilá propiedades directamente con los dueños. Sin comisiones ni intermediarios. Espacio Inmobiliario, Buenos Aires.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  openGraph: {
    title: "Espacio Inmobiliario · Dueños Directos",
    description: "Propiedades directas de dueños en Buenos Aires. Sin comisiones.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: properties } = await supabase
    .from("properties").select("*").eq("status", "activa")
    .order("created_at", { ascending: false }).limit(6);

  // Datos para la banda de estadísticas
  const { count: activeCount } = await supabase
    .from("properties").select("*", { count: "exact", head: true }).eq("status", "activa");
  const { data: viewsRows } = await supabase
    .from("properties").select("views").eq("status", "activa");
  const totalViews = (viewsRows || []).reduce((acc, r) => acc + (r.views ?? 0), 0);
  const totalZonas = BARRIOS_CABA.length + PARTIDOS_PBA.length;

  const stats: { icon: typeof Building2; to: number; suffix: string; label: string; static?: string }[] = [
    { icon: Building2, to: activeCount ?? 0, suffix: "", label: "Propiedades publicadas" },
    { icon: Eye,       to: totalViews,        suffix: "", label: "Visitas totales" },
    { icon: MapIcon,   to: totalZonas,        suffix: "", label: "Barrios y partidos" },
    { icon: Percent,   to: 0,                 suffix: "%", label: "Comisiones", static: "0%" },
  ];

  return (
    <div>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden", padding: "clamp(48px,8vw,84px) 20px clamp(56px,9vw,96px)" }}>
        {/* Imagen de fondo con Ken Burns (zoom lento infinito) */}
        <div className="hero-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: "url('/hero-bg.png')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.22, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)", pointerEvents: "none" }} />
        {/* Skyline vivo: ventanas, nubes y pins en movimiento continuo */}
        <SkylineVivo />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div className="es-eyebrow es-eyebrow-light hero-animate" style={{ marginBottom: 14 }}>
            Propiedades directas de dueños
          </div>
          <h1 className="hero-animate hero-animate-delay-1" style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1.16,
            letterSpacing: "-.02em", margin: "0 0 20px", maxWidth: 760,
          }}>
            Dueños Directos.{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>Publicá tu propiedad Gratis</span>
          </h1>
          <p className="hero-subtitle hero-animate hero-animate-delay-2">
            Comprá, vendé o alquilá tratando directamente con los dueños.
            Sin comisiones en toda la Argentina.
          </p>
          <div className="hero-animate hero-animate-delay-2" style={{ width: "100%" }}>
            <HomeSearch />
          </div>
          <div className="trust-strip hero-animate hero-animate-delay-3">
            {([
              [BadgeCheck, "Sin comisiones"],
              [Handshake, "Trato directo con el dueño"],
              [MapPin, "Todo Buenos Aires"],
            ] as const).map(([Icon, text]) => (
              <span key={text} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)", fontSize: 13.5, color: "rgba(255,255,255,.92)",
                background: "rgba(7,24,44,.55)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 999, padding: "8px 16px",
              }}>
                <Icon size={17} strokeWidth={1.75} color="var(--gold-400)" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banda de estadísticas ─────────────────────────────── */}
      <section style={{ background: "var(--navy-900)", borderTop: "1px solid rgba(185,159,102,.25)", borderBottom: "1px solid rgba(185,159,102,.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(185,159,102,.10), transparent 60%)", pointerEvents: "none" }} />
        <div className="grid-stats-band" style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(36px,5vw,52px) 24px" }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.label} delay={i * 100} direction="up" className="stat-cell">
                <span className="stat-number">
                  {s.static ?? <Counter to={s.to} suffix={s.suffix} />}
                </span>
                <span className="stat-rule" />
                <span className="stat-label">
                  <Icon size={13} strokeWidth={2} color="var(--gold-400)" />
                  {s.label}
                </span>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Últimas propiedades ───────────────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
          <div>
            <div className="es-eyebrow" style={{ marginBottom: 8 }}>Recién publicadas</div>
            <h2 className="section-heading">Últimas propiedades</h2>
          </div>
          <a href="/propiedades" style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            color: "var(--gold-700)", display: "inline-flex", alignItems: "center",
            gap: 4, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Ver todas <ArrowRight size={15} strokeWidth={2} />
          </a>
        </div>

        {!properties?.length ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 16 }}>
              Todavía no hay propiedades publicadas.
            </p>
            <a href="/auth/registro" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, background: "var(--navy-800)", color: "#fff", borderRadius: "var(--radius-sm)", padding: "11px 22px", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <Plus size={15} strokeWidth={2} /> Publicar la primera
            </a>
          </div>
        ) : (
          <>
            <div className="grid-properties home-destacados">
              {(properties as Property[]).map((p, i) => (
                <FadeIn key={p.id} delay={(i % 3) * 110} direction="up">
                  <div className="card-lift">
                    <PropertyListCard property={p} />
                  </div>
                </FadeIn>
              ))}
            </div>
            {/* Botón "Ver todas" — solo visible en mobile (lista vertical de 5) */}
            <a href="/propiedades" className="home-ver-todas esbtn esbtn-primary" style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
              border: "1.5px solid transparent", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 14.5, padding: "13px 24px", marginTop: 20,
              background: "var(--navy-800)", color: "#fff", textDecoration: "none",
            }}>
              Ver todas las propiedades <ArrowRight size={16} strokeWidth={2} />
            </a>
          </>
        )}
      </section>

      {/* ── CTA para propietarios ─────────────────────────────── */}
      <section className="section-pad" style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)", borderBottom: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div className="es-eyebrow" style={{ marginBottom: 14 }}>Para propietarios</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 600,
            fontSize: "clamp(22px,4vw,34px)", letterSpacing: "-.02em",
            color: "var(--navy-800)", margin: "0 0 14px",
          }}>
            ¿Sos dueño y querés vender?
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16.5px)",
            lineHeight: 1.65, color: "var(--ink-600)", maxWidth: 480, margin: "0 auto 28px",
          }}>
            Publicá tu propiedad gratis, recibí consultas directamente
            y cerrá el trato sin pagar comisión.
          </p>
          <a href="/auth/registro" className="esbtn esbtn-primary" style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: "var(--radius-sm)",
            border: "1.5px solid transparent", display: "inline-flex", alignItems: "center",
            gap: 8, fontSize: 14.5, padding: "13px 28px",
            background: "var(--navy-800)", color: "#fff",
            transition: "all var(--dur) var(--ease-out)", textDecoration: "none",
          }}>
            <Plus size={16} strokeWidth={2} />
            Publicar mi propiedad gratis
          </a>
        </div>
      </section>

      {/* ── Ecosistema de servicios ───────────────────────────── */}
      <ServiciosEcosistema isLoggedIn={!!user} />

      {/* ── Footer ───────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
