import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import HomeSearch from "@/components/HomeSearch";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { BadgeCheck, Handshake, MapPin, Plus, ArrowRight } from "lucide-react";

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

export default async function HomePage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        background: "var(--navy-800)", color: "#fff",
        padding: "72px 24px 84px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Gold radial glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Eyebrow */}
          <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 14 }}>
            Propiedades directas de dueños
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1.16,
            letterSpacing: "-.02em", margin: "0 0 20px", maxWidth: 760,
          }}>
            Encontrá tu próximo espacio,{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>
              sin intermediarios
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 19, lineHeight: 1.6,
            color: "var(--navy-300)", maxWidth: 540, margin: "0 0 36px",
          }}>
            Comprá, vendé o alquilá tratando directamente con los dueños.
            Sin comisiones en toda la Argentina.
          </p>

          {/* Search bar */}
          <div style={{ width: "100%" }}>
            <HomeSearch />
          </div>

          {/* Trust strip */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 32,
            marginTop: 34, flexWrap: "wrap",
          }}>
            {([
              [BadgeCheck, "Sin comisiones"],
              [Handshake, "Trato directo con el dueño"],
              [MapPin, "Todo Buenos Aires"],
            ] as const).map(([Icon, text]) => (
              <span key={text} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-sans)", fontSize: 14,
                color: "rgba(255,255,255,.85)",
              }}>
                <Icon size={17} strokeWidth={1.75} color="var(--gold-400)" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Últimas propiedades ───────────────────────────────── */}
      <section style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: 28,
        }}>
          <div>
            <div className="es-eyebrow" style={{ marginBottom: 8 }}>Recién publicadas</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 600,
              fontSize: 36, letterSpacing: "-.02em",
              color: "var(--navy-800)", margin: 0,
            }}>
              Últimas propiedades
            </h2>
          </div>
          <a href="/propiedades" style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
            color: "var(--gold-700)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            textDecoration: "none",
          }}>
            Ver todas <ArrowRight size={16} strokeWidth={2} />
          </a>
        </div>

        {!properties?.length ? (
          <div style={{
            textAlign: "center", padding: "64px 24px",
            background: "#fff", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--line-200)",
          }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 16 }}>
              Todavía no hay propiedades publicadas.
            </p>
            <a href="/auth/registro" style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
              background: "var(--navy-800)", color: "#fff", borderRadius: "var(--radius-sm)",
              padding: "11px 22px", display: "inline-flex", alignItems: "center", gap: 8,
              textDecoration: "none",
            }}>
              <Plus size={15} strokeWidth={2} />
              Publicar la primera
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {(properties as Property[]).map(p => (
              <PropertyListCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA para propietarios ─────────────────────────────── */}
      <section style={{
        background: "var(--cream)",
        borderTop: "1px solid var(--gold-200)",
        borderBottom: "1px solid var(--gold-200)",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div className="es-eyebrow" style={{ marginBottom: 14 }}>Para propietarios</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 34,
            letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 14px",
          }}>
            ¿Sos dueño y querés vender o alquilar?
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 16.5, lineHeight: 1.65,
            color: "var(--ink-600)", maxWidth: 520, margin: "0 auto 28px",
          }}>
            Publicá tu propiedad gratis, recibí consultas directamente
            y cerrá el trato sin pagar comisión.
          </p>
          <a
            href="/auth/registro"
            className="esbtn esbtn-primary"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600,
              borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14.5, padding: "13px 28px",
              background: "var(--navy-800)", color: "#fff",
              transition: "all var(--dur) var(--ease-out)",
              textDecoration: "none",
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Publicar mi propiedad gratis
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ background: "var(--navy-800)", color: "#fff" }}>
        <div style={{
          maxWidth: "var(--container)", margin: "0 auto",
          padding: "56px 24px 28px",
          display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 40,
        }}>
          <div>
            <Logo className="h-16 w-auto" />
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.7,
              color: "var(--navy-300)", maxWidth: 280, margin: 0,
            }}>
              El portal de propiedades directas de dueños en Argentina.
              Sin comisiones, sin intermediarios.
            </p>
          </div>
          <div>
            <h5 style={footH}>Propiedades</h5>
            {["Departamentos en venta", "Casas en alquiler", "Oficinas", "Terrenos"].map(t => (
              <a key={t} href="/propiedades" style={footLink}>{t}</a>
            ))}
          </div>
          <div>
            <h5 style={footH}>Espacio</h5>
            {[
              ["Cómo funciona", "#"],
              ["Publicar gratis", "/auth/registro"],
              ["Contacto", "#"],
            ].map(([t, href]) => (
              <a key={t} href={href} style={footLink}>{t}</a>
            ))}
            <p style={{ ...footLink, cursor: "default", opacity: 0.5, marginTop: 16 }}>
              📞 [Teléfono]<br />✉️ [Email]
            </p>
          </div>
        </div>
        <div style={{
          borderTop: "1px solid var(--navy-700)",
          padding: "18px 24px", textAlign: "center",
          fontFamily: "var(--font-sans)", fontSize: 12.5,
          color: "var(--navy-300)",
        }}>
          © {new Date().getFullYear()} Espacio Inmobiliario — espacioinmobiliario.com.ar
        </div>
      </footer>
    </div>
  );
}

const footH: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11,
  textTransform: "uppercase", letterSpacing: ".12em",
  color: "var(--gold-400)", margin: "0 0 16px", fontWeight: 600,
};
const footLink: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 13.5,
  color: "#fff", opacity: .82, textDecoration: "none", marginBottom: 11, cursor: "pointer",
};
