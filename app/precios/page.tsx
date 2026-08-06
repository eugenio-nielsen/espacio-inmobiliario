import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import AsesoriaContacto from "@/components/precios/AsesoriaContacto";
import {
  Check, BadgeCheck, ShieldCheck, MessageSquare, CalendarClock,
  Users, Scale, ArrowRight, Plus, Tag,
} from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Precios · Publicar es gratis, vender con acompañamiento",
  description: "Publicar tu propiedad en Espacio Inmobiliario es y será siempre gratis. Si querés, sumás el acompañamiento de un martillero público matriculado con un precio fijo por la venta, no un porcentaje.",
  alternates: { canonical: `${SITE}/precios` },
  openGraph: {
    title: "Precios · Espacio Inmobiliario",
    description: "Publicar siempre gratis. Acompañamiento profesional con precio fijo, no un porcentaje.",
    type: "website",
  },
};

const INCLUYE = [
  { icon: BadgeCheck, t: "Martillero público matriculado", d: "Un profesional responsable detrás de toda la operación, dándole respaldo y validez a cada paso." },
  { icon: MessageSquare, t: "Gestión diaria de consultas", d: "Respondemos y filtramos las consultas por vos, para que solo te llegue lo que vale la pena." },
  { icon: CalendarClock, t: "Coordinación de visitas", d: "Organizamos y acompañamos las visitas a tu propiedad, sin que tengas que estar pendiente." },
  { icon: Users, t: "Red de profesionales de confianza", d: "Escribanos, fotógrafos y reparadores que conocemos y recomendamos, cuando los necesites." },
  { icon: ShieldCheck, t: "Respaldo legal y documental", d: "Te acompañamos con la documentación, los certificados y el cierre seguro de la operación." },
  { icon: Scale, t: "Precio fijo, no un porcentaje", d: "Cobramos un valor fijo por la venta. No un porcentaje del valor de tu propiedad como el resto del mercado." },
];

export default function PreciosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden", padding: "clamp(56px,9vw,104px) 20px clamp(60px,9vw,108px)", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% -10%, rgba(185,159,102,.16), transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div className="es-eyebrow es-eyebrow-light hero-animate" style={{ marginBottom: 16 }}>Precios y acompañamiento</div>
          <h1 className="hero-animate hero-animate-delay-1" style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(30px,5vw,56px)", lineHeight: 1.1, letterSpacing: "-.025em", margin: "0 0 20px",
          }}>
            Publicar siempre es{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>gratis</span>.
            <br />Vender, si querés, con nosotros.
          </h1>
          <p className="hero-animate hero-animate-delay-2" style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(15px,2.2vw,18px)", lineHeight: 1.7,
            color: "rgba(255,255,255,.72)", maxWidth: 560, margin: "0 auto 36px",
          }}>
            Somos un espacio para conectar dueños directos con compradores directos.
            Y si necesitás una mano profesional para vender, estamos para acompañarte.
          </p>
          <div className="hero-animate hero-animate-delay-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/registro" style={ctaGold}><Plus size={16} strokeWidth={2.5} /> Publicar gratis</Link>
            <Link href="#contacto" style={ctaGhost}>Hablar con Eugenio <ArrowRight size={15} strokeWidth={2} /></Link>
          </div>
        </div>
      </section>

      {/* ── Lo principal: SIEMPRE GRATIS ──────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto", width: "100%" }}>
        <FadeIn style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18,
            background: "rgba(34,197,94,.1)", color: "#15803D",
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
            padding: "8px 16px", borderRadius: 999,
          }}>
            <Tag size={15} /> Gratis, para siempre
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,4vw,38px)", letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 16px" }}>
            Publicar y gestionar tu propiedad no cuesta nada
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16.5px)", lineHeight: 1.65, color: "var(--ink-600)", margin: "0 0 28px" }}>
            Crear tu cuenta, publicar, editar, recibir consultas y cerrar el trato directo con el comprador
            es y será siempre <strong>100% gratuito</strong>. Sin comisiones ni intermediarios. Esa es nuestra esencia.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {["Publicación gratis", "Sin comisiones", "Consultas directas", "Trato directo con el comprador"].map(t => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--navy-800)", background: "#fff", border: "1px solid var(--line-200)", padding: "9px 16px", borderRadius: 999 }}>
                <Check size={15} strokeWidth={2.5} color="#15803D" /> {t}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── Si querés, te acompañamos ─────────────────────────── */}
      <section style={{ background: "var(--navy-800)", padding: "clamp(56px,8vw,96px) 20px", overflow: "hidden" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: "clamp(32px,5vw,52px)" }}>
            <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 12 }}>Acompañamiento profesional</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-.02em", color: "#fff", margin: "0 0 14px" }}>
              ¿Querés ayuda para vender? Estamos para eso
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)", color: "rgba(255,255,255,.65)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              Si preferís delegar y vender con respaldo, sumás el acompañamiento integral de un martillero
              público matriculado. Vos elegís: lo hacés solo (gratis) o con nosotros al lado.
            </p>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }} className="hscroll-cards">
            {INCLUYE.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.t} delay={(i % 3) * 100}>
                  <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)", borderRadius: "var(--radius-lg)", padding: "28px 24px", height: "100%" }}>
                    <div style={{ width: 48, height: 48, background: "rgba(185,159,102,.15)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={22} strokeWidth={1.75} color="var(--gold-400)" />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "#fff", margin: "0 0 8px" }}>{item.t}</h3>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "rgba(255,255,255,.62)", lineHeight: 1.6, margin: 0 }}>{item.d}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contacto ──────────────────────────────────────────── */}
      <section id="contacto" style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)", padding: "clamp(56px,8vw,88px) 20px" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: "clamp(28px,4vw,40px)" }}>
            <div className="es-eyebrow" style={{ marginBottom: 12 }}>Conversemos</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,4vw,38px)", letterSpacing: "-.02em", color: "var(--navy-800)", margin: "0 0 14px" }}>
              No te vendemos nada. Hablemos de tu propiedad
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)", color: "var(--ink-600)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
              Escribime y te cuento cómo podemos ayudarte a vender. Sin compromiso.
            </p>
          </FadeIn>
          <FadeIn><AsesoriaContacto /></FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const ctaGold: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5,
  background: "var(--gold-500)", color: "var(--navy-900)", padding: "14px 28px", borderRadius: "var(--radius-sm)", textDecoration: "none",
};
const ctaGhost: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
  background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,.3)", padding: "14px 28px", borderRadius: "var(--radius-sm)", textDecoration: "none",
};
