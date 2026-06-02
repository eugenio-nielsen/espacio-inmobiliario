import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import HomeSearch from "@/components/HomeSearch";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { BadgeCheck, Handshake, MapPin, Plus, ArrowRight } from "lucide-react";
import ServiciosEcosistema from "@/components/servicios/ServiciosEcosistema";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario — Propiedades directas de dueños en Argentina",
  description: "Comprá, vendé o alquilá propiedades directamente con los dueños. Sin comisiones ni intermediarios. Espacio Inmobiliario, Buenos Aires.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  openGraph: {
    title: "Espacio Inmobiliario — Dueños Directos",
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

  return (
    <div>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden", padding: "clamp(48px,8vw,84px) 20px clamp(56px,9vw,96px)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 14 }}>
            Propiedades directas de dueños
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1.16,
            letterSpacing: "-.02em", margin: "0 0 20px", maxWidth: 760,
          }}>
            Encontrá tu próximo espacio,{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>sin intermediarios</span>
          </h1>
          <p className="hero-subtitle">
            Comprá, vendé o alquilá tratando directamente con los dueños.
            Sin comisiones en toda la Argentina.
          </p>
          <div style={{ width: "100%" }}>
            <HomeSearch />
          </div>
          <div className="trust-strip">
            {([
              [BadgeCheck, "Sin comisiones"],
              [Handshake, "Trato directo con el dueño"],
              [MapPin, "Todo Buenos Aires"],
            ] as const).map(([Icon, text]) => (
              <span key={text} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)", fontSize: 13.5, color: "rgba(255,255,255,.85)",
              }}>
                <Icon size={17} strokeWidth={1.75} color="var(--gold-400)" />
                {text}
              </span>
            ))}
          </div>
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
          <div className="grid-properties">
            {(properties as Property[]).map(p => <PropertyListCard key={p.id} property={p} />)}
          </div>
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
      <footer style={{ background: "var(--navy-800)", color: "#fff" }}>
        <div className="grid-footer">
          <div>
            <Logo className="h-14 w-auto mb-4" />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.7, color: "var(--navy-300)", maxWidth: 280, margin: 0 }}>
              El portal de propiedades directas de dueños en Argentina. Sin comisiones, sin intermediarios.
            </p>
          </div>
          <div>
            <h5 style={footH}>Propiedades</h5>
            {["Departamentos en venta", "Casas en venta", "Oficinas", "Terrenos"].map(t => (
              <a key={t} href="/propiedades" style={footLink}>{t}</a>
            ))}
          </div>
          <div>
            <h5 style={footH}>Espacio</h5>
            {[["Cómo funciona", "#"], ["Publicar gratis", "/auth/registro"], ["Contacto", "#"]].map(([t, href]) => (
              <a key={t} href={href} style={footLink}>{t}</a>
            ))}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="https://wa.me/5491164519421" target="_blank" rel="noopener noreferrer"
                style={{ ...footLink, display: "inline-flex", alignItems: "center", gap: 7, opacity: 1 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#4ade80", flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                +54 9 11 6451-9421
              </a>
              <a href="mailto:eugenio@espacioinmobiliario.com.ar"
                style={{ ...footLink, display: "inline-flex", alignItems: "center", gap: 7, opacity: 1 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                eugenio@espacioinmobiliario.com.ar
              </a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--navy-700)", padding: "18px 24px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--navy-300)" }}>
          © {new Date().getFullYear()} Espacio Inmobiliario — espacioinmobiliario.com.ar
        </div>
      </footer>
    </div>
  );
}

const footH: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase",
  letterSpacing: ".12em", color: "var(--gold-400)", margin: "0 0 16px", fontWeight: 600,
};
const footLink: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 13.5,
  color: "#fff", opacity: .82, textDecoration: "none", marginBottom: 11, cursor: "pointer",
};
