import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/como-funciona/Reveal";
import {
  UserRound, Camera, MessageSquare, Handshake,
  Search, Phone, BadgeCheck, ShieldCheck, Star,
  ArrowRight, Plus, Scale, ArrowDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cómo funciona · Espacio Inmobiliario",
  description: "Publicá tu propiedad gratis, sin comisiones ni intermediarios, con acompañamiento en cada paso. Conocé cómo funciona Espacio Inmobiliario.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/como-funciona` },
  openGraph: {
    title: "Cómo funciona · Espacio Inmobiliario",
    description: "Publicá tu propiedad gratis, sin comisiones y con acompañamiento en cada paso.",
    type: "website",
  },
};

type Paso = { num: string; icon: React.ReactNode; titulo: string; descripcion: string };

const STEPS_DUENO: Paso[] = [
  {
    num: "01",
    icon: <UserRound size={17} strokeWidth={1.5} />,
    titulo: "Creá tu cuenta gratuita",
    descripcion:
      "Registrarte toma menos de dos minutos. Solo necesitás tu nombre, email y teléfono. Sin cargos, sin datos de tarjeta, sin letra chica.",
  },
  {
    num: "02",
    icon: <Camera size={17} strokeWidth={1.5} />,
    titulo: "Publicá tu propiedad",
    descripcion:
      "Cargá fotos, descripción, precio y ubicación. Tu publicación queda visible de inmediato para miles de interesados activos en Buenos Aires y alrededores.",
  },
  {
    num: "03",
    icon: <MessageSquare size={17} strokeWidth={1.5} />,
    titulo: "Recibí consultas directamente",
    descripcion:
      "Los interesados te escriben a vos, sin pasar por una agencia ni pagar comisión. Cada consulta llega a tu email y a tu panel en tiempo real.",
  },
  {
    num: "04",
    icon: <Handshake size={17} strokeWidth={1.5} />,
    titulo: "Cerrá con acompañamiento",
    descripcion:
      "Durante todo el proceso contás con el acompañamiento de Eugenio Nielsen. No estás solo: hay alguien con nombre y apellido detrás de cada operación.",
  },
];

const STEPS_COMPRADOR: Paso[] = [
  {
    num: "01",
    icon: <Search size={17} strokeWidth={1.5} />,
    titulo: "Explorá el catálogo",
    descripcion:
      "Propiedades reales, publicadas directamente por sus dueños. Sin inflación de precio por comisiones de agencia. Lo que ves es el precio que pide el propietario.",
  },
  {
    num: "02",
    icon: <Phone size={17} strokeWidth={1.5} />,
    titulo: "Contactá al dueño directo",
    descripcion:
      "Cada ficha tiene un formulario de consulta que llega directo al propietario. Sin intermediarios que filtren la información ni demoren las respuestas.",
  },
  {
    num: "03",
    icon: <BadgeCheck size={17} strokeWidth={1.5} />,
    titulo: "Negociá a precio de mercado",
    descripcion:
      "Al no haber comisiones implícitas en el precio, accedés a valores competitivos y reales. Y si necesitás orientación, el equipo de Espacio está disponible para asesorarte.",
  },
];

const DIFERENCIALES = [
  {
    icon: ShieldCheck,
    titulo: "Cada publicación, revisada",
    descripcion:
      "Eugenio Nielsen revisa cada publicación antes de que salga. No somos una plataforma automática: hay una persona detrás, con nombre y apellido.",
  },
  {
    icon: Scale,
    titulo: "Sin comisiones, precio justo",
    descripcion:
      "El dueño vende al precio que considera justo. El comprador accede a ese precio directamente, sin el recargo de una comisión inmobiliaria implícita.",
  },
  {
    icon: Star,
    titulo: "Gratis para siempre",
    descripcion:
      "Publicar en Espacio Inmobiliario no tiene costo. Creemos que acceder al mercado inmobiliario debería ser un derecho, no un privilegio.",
  },
];

/* ── Bloque de pasos, reutilizado por los dos actos ─────────── */
function Acto({
  pasos,
  tono,
}: {
  pasos: Paso[];
  tono: "oscuro" | "claro";
}) {
  const oscuro = tono === "oscuro";
  return (
    <div className="cf-act">
      {pasos.map((p, i) => (
        <Reveal key={p.num} delay={i * 90}>
          <div className="cf-step">
            <div className="cf-num" aria-hidden="true">{p.num}</div>
            <div>
              <div
                className="cf-step-icon"
                style={{ color: oscuro ? "var(--gold-400)" : "var(--gold-600)" }}
              >
                {p.icon}
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 500,
                  letterSpacing: ".26em", textTransform: "uppercase",
                }}>
                  Paso {p.num}
                </span>
              </div>
              <h3
                className="cf-step-title"
                style={{ color: oscuro ? "#fff" : "var(--navy-800)" }}
              >
                {p.titulo}
              </h3>
              <p
                className="cf-step-body"
                style={{ color: oscuro ? "rgba(255,255,255,.62)" : "var(--ink-600)" }}
              >
                {p.descripcion}
              </p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="cf-page">
      <Navbar />

      {/* ══ Apertura ═══════════════════════════════════════════ */}
      <section
        className="cf-grain"
        style={{
          position: "relative",
          background: "var(--navy-950)",
          padding: "clamp(72px,12vw,150px) 24px clamp(56px,8vw,96px)",
          overflow: "hidden",
        }}
      >
        {/* Luz cenital + viñeteado */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(120% 80% at 50% -20%, rgba(185,159,102,.20), transparent 58%)," +
            "radial-gradient(80% 60% at 50% 120%, rgba(14,44,80,.85), transparent 60%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          boxShadow: "inset 0 0 180px 40px rgba(3,10,20,.75)",
        }} />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <span className="cf-label">Transparencia en cada paso</span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="cf-h1" style={{ margin: "34px 0 0", maxWidth: "15ch" }}>
              Un mercado
              <br />
              inmobiliario
              <br />
              <span className="cf-italic">abierto</span>
              <span style={{ color: "var(--gold-500)", opacity: .5 }}> · </span>
              <span className="cf-italic">sin comisiones</span>
            </h1>
          </Reveal>

          {/* Regla + bajada, en composición asimétrica */}
          <Reveal delay={240}>
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr)",
              maxWidth: 560, marginLeft: "auto", marginTop: "clamp(36px,5vw,64px)",
            }}>
              <div className="cf-sweep is-in" style={{ marginBottom: 26 }} />
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.66)", margin: 0 }}>
                Espacio Inmobiliario conecta a dueños con compradores de manera directa,
                gratuita y con acompañamiento humano en cada paso.
              </p>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <div style={{
              display: "flex", gap: 14, flexWrap: "wrap",
              marginTop: "clamp(40px,5vw,60px)", alignItems: "center",
            }}>
              <Link href="/auth/registro" style={ctaGold}>
                <Plus size={15} strokeWidth={2.2} />
                Publicar mi propiedad gratis
              </Link>
              <Link href="/propiedades" style={ctaLine}>
                Explorar propiedades
                <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Acto I · Propietarios ══════════════════════════════ */}
      <section
        className="cf-grain cf-letterbox"
        style={{
          position: "relative",
          background: "var(--navy-900)",
          padding: "clamp(64px,9vw,120px) 24px",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(70% 50% at 100% 0%, rgba(185,159,102,.10), transparent 60%)",
        }} />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ maxWidth: 620, marginBottom: "clamp(36px,5vw,64px)" }}>
              <span className="cf-label">Acto I · Para propietarios</span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "26px 0 18px" }}>
                Vendé tu propiedad con{" "}
                <span className="cf-italic">visibilidad real</span>
              </h2>
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.58)", margin: 0 }}>
                Publicar en Espacio Inmobiliario es gratuito y te da acceso a un canal de
                venta serio, con acompañamiento durante todo el proceso.
              </p>
            </header>
          </Reveal>

          <Acto pasos={STEPS_DUENO} tono="oscuro" />
        </div>
      </section>

      {/* ══ Interludio · Ficha técnica ═════════════════════════ */}
      <section style={{
        background: "var(--cream)",
        padding: "clamp(64px,9vw,116px) 24px",
        position: "relative",
      }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ textAlign: "center", marginBottom: "clamp(36px,5vw,58px)" }}>
              <span className="cf-label cf-label-dark cf-label-center">Nuestros diferenciales</span>
              <h2 className="cf-h2" style={{ color: "var(--navy-800)", margin: "26px auto 18px", maxWidth: "18ch" }}>
                Por qué elegir <span style={{ fontStyle: "italic", color: "var(--gold-700)" }}>Espacio</span>
              </h2>
              <p className="cf-lead" style={{ color: "var(--ink-600)", maxWidth: 480, margin: "0 auto" }}>
                No somos una inmobiliaria. Somos una plataforma pública, gratuita
                y profesionalmente supervisada.
              </p>
            </header>
          </Reveal>

          <Reveal delay={120}>
            <div className="cf-specs cf-frame">
              {DIFERENCIALES.map((d, i) => {
                const Icon = d.icon;
                return (
                  <div key={d.titulo} className="cf-spec">
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: 26,
                    }}>
                      <Icon size={20} strokeWidth={1.4} color="var(--gold-600)" />
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: 15,
                        color: "var(--gold-500)", fontStyle: "italic",
                      }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: "var(--font-display)", fontWeight: 600,
                      fontSize: "clamp(18px,2.1vw,22px)", lineHeight: 1.25,
                      letterSpacing: "-.015em", color: "var(--navy-800)", margin: "0 0 12px",
                    }}>
                      {d.titulo}
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 14.5,
                      lineHeight: 1.75, color: "var(--ink-600)", margin: 0,
                    }}>
                      {d.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Acto II · Compradores ══════════════════════════════ */}
      <section
        className="cf-grain cf-letterbox"
        style={{
          position: "relative",
          background: "var(--navy-900)",
          padding: "clamp(64px,9vw,120px) 24px",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(70% 50% at 0% 0%, rgba(185,159,102,.10), transparent 60%)",
        }} />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{
              maxWidth: 620, marginLeft: "auto", textAlign: "right",
              marginBottom: "clamp(36px,5vw,64px)",
            }}>
              <span className="cf-label" style={{ flexDirection: "row-reverse" }}>
                Acto II · Para compradores
              </span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "26px 0 18px" }}>
                Accedé a propiedades a{" "}
                <span className="cf-italic">precio real</span>
              </h2>
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.58)", margin: 0 }}>
                Sin comisiones ocultas en el precio. Tratás directamente con el dueño
                y comprás a lo que la propiedad realmente vale.
              </p>
            </header>
          </Reveal>

          <Acto pasos={STEPS_COMPRADOR} tono="oscuro" />
        </div>
      </section>

      {/* ══ El profesional ═════════════════════════════════════ */}
      <section style={{
        background: "var(--cream)",
        padding: "clamp(64px,9vw,116px) 24px",
        borderTop: "1px solid var(--gold-200)",
      }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div className="como-funciona-pro" style={{ display: "grid", gap: "clamp(32px,5vw,56px)", alignItems: "center" }}>
            <Reveal>
              {/* Monograma: sello, no avatar */}
              <div style={{ position: "relative", width: 148, height: 148, margin: "0 auto" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 999,
                  border: "1px solid var(--gold-400)", opacity: .55,
                }} />
                <div style={{
                  position: "absolute", inset: 11, borderRadius: 999,
                  border: "1px solid var(--gold-500)", opacity: .3,
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 44,
                    letterSpacing: ".02em", color: "var(--navy-800)", lineHeight: 1,
                  }}>
                    EN
                  </span>
                  <span style={{
                    fontFamily: "var(--font-sans)", fontSize: 8.5, fontWeight: 500,
                    letterSpacing: ".3em", textTransform: "uppercase", color: "var(--gold-700)",
                  }}>
                    Responsable
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <span className="cf-label cf-label-dark">Quién está detrás</span>
              <h2 className="cf-h2" style={{
                color: "var(--navy-800)", margin: "24px 0 18px",
                fontSize: "clamp(24px,3.4vw,38px)",
              }}>
                Eugenio Nielsen
              </h2>
              <p className="cf-lead" style={{ color: "var(--ink-600)", margin: "0 0 30px" }}>
                Es el responsable detrás de Espacio Inmobiliario. Cada publicación pasa por su
                revisión antes de salir, y el proceso de compraventa cuenta con su
                acompañamiento, para que tanto dueños como compradores operen con
                claridad y sin sorpresas.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="https://wa.me/5491164519421" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13.5,
                    letterSpacing: ".01em",
                    background: "var(--navy-800)", color: "#fff",
                    padding: "13px 24px", borderRadius: 2, textDecoration: "none",
                  }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Consultá con Eugenio
                </a>
                <a href="mailto:eugenio@espacioinmobiliario.com.ar"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13.5,
                    color: "var(--navy-800)", border: "1px solid var(--gold-300)",
                    background: "transparent",
                    padding: "13px 24px", borderRadius: 2, textDecoration: "none",
                  }}>
                  eugenio@espacioinmobiliario.com.ar
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ Cierre ═════════════════════════════════════════════ */}
      <section
        className="cf-grain"
        style={{
          position: "relative",
          background: "var(--navy-950)",
          padding: "clamp(72px,10vw,132px) 24px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(100% 70% at 50% 110%, rgba(185,159,102,.18), transparent 60%)",
        }} />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <Reveal>
            <span className="cf-label cf-label-center">Empezá ahora</span>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="cf-h2" style={{ color: "#fff", margin: "28px 0 20px" }}>
              ¿Listo para dar el <span className="cf-italic">primer paso</span>?
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="cf-lead" style={{ color: "rgba(255,255,255,.6)", margin: "0 auto 40px", maxWidth: 470 }}>
              Publicar tu propiedad es gratis, sin compromisos y lleva menos de 5 minutos.
              Contás con alguien disponible ante cualquier consulta.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/registro" style={ctaGold}>
                <Plus size={15} strokeWidth={2.2} />
                Publicar mi propiedad gratis
              </Link>
              <Link href="/propiedades" style={ctaLine}>
                Ver propiedades
                <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={380}>
            <div style={{ marginTop: "clamp(48px,7vw,80px)", display: "flex", justifyContent: "center" }}>
              <ArrowDown size={16} strokeWidth={1.3} color="var(--gold-500)" style={{ opacity: .5 }} />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Botones: rectos, finos, sin sombras — registro "ejecutivo" ── */
const ctaGold: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 9,
  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
  letterSpacing: ".02em",
  background: "var(--gold-500)", color: "var(--navy-950)",
  padding: "15px 30px", borderRadius: 2, textDecoration: "none",
  border: "1px solid var(--gold-500)",
};
const ctaLine: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 9,
  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13.5,
  letterSpacing: ".02em",
  background: "transparent", color: "rgba(255,255,255,.86)",
  border: "1px solid rgba(255,255,255,.24)",
  padding: "15px 30px", borderRadius: 2, textDecoration: "none",
};
