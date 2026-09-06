import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/como-funciona/Reveal";
import Metodo from "@/components/como-funciona/Metodo";
import Cinta from "@/components/como-funciona/Cinta";
import Motas from "@/components/como-funciona/Motas";
import FirmaEugenio from "@/components/como-funciona/FirmaEugenio";
import PalabraRotativa from "@/components/como-funciona/PalabraRotativa";
import TarjetaViva from "@/components/como-funciona/TarjetaViva";
import ComparadorComision from "@/components/precios/ComparadorComision";
import AsesoriaContacto from "@/components/precios/AsesoriaContacto";
import {
  BadgeCheck, ShieldCheck, MessageSquare, CalendarClock,
  Users, Scale, ArrowRight, Plus, Check, MoveRight, Tag,
} from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Cómo funciona · Publicar es gratis, siempre",
  description:
    "Publicá tu propiedad gratis, sin comisiones ni intermediarios, con el acompañamiento de Eugenio Nielsen. Y si querés delegar la venta, precio fijo en lugar de un porcentaje.",
  alternates: { canonical: `${SITE}/como-funciona` },
  openGraph: {
    title: "Cómo funciona · Espacio Inmobiliario",
    description:
      "Publicar siempre gratis, sin comisiones. Y si querés acompañamiento para vender, precio fijo, no un porcentaje.",
    type: "website",
  },
};

/* Lo que suma el acompañamiento profesional (venía de /precios) */
const INCLUYE = [
  { icon: BadgeCheck, t: "Un responsable con nombre y apellido", d: "Alguien a cargo de tu operación de principio a fin. No un call center ni un formulario que nadie lee." },
  { icon: MessageSquare, t: "Gestión diaria de consultas", d: "Respondemos y filtramos las consultas por vos, para que solo te llegue lo que vale la pena." },
  { icon: CalendarClock, t: "Coordinación de visitas", d: "Organizamos y acompañamos las visitas a tu propiedad, sin que tengas que estar pendiente." },
  { icon: Users, t: "Red de profesionales de confianza", d: "Escribanos, fotógrafos y reparadores que conocemos y recomendamos, cuando los necesites." },
  { icon: ShieldCheck, t: "Respaldo legal y documental", d: "Te acompañamos con la documentación, los certificados y el cierre seguro de la operación." },
  { icon: Scale, t: "Precio fijo, no un porcentaje", d: "Cobramos un valor fijo por la venta. No un porcentaje del valor de tu propiedad como el resto del mercado." },
];

const CINTA = [
  "Sin comisiones",
  "Trato directo con el dueño",
  "Publicar es gratis, siempre",
  "Precio fijo, no un porcentaje",
  "Cada publicación, revisada",
];

export default function ComoFuncionaPage() {
  return (
    <div className="cf-page">
      <Navbar />

      {/* ══ Apertura ═══════════════════════════════════════════ */}
      <section
        className="cf-grain cf-hero"
        style={{
          position: "relative",
          background: "var(--navy-950)",
          padding: "clamp(72px,12vw,140px) 24px clamp(56px,8vw,92px)",
          overflow: "hidden",
        }}
      >
        {/* Luz cenital con deriva permanente */}
        <div
          className="cf-drift"
          style={{
            background:
              "radial-gradient(120% 80% at 50% -20%, rgba(185,159,102,.22), transparent 58%)",
          }}
        />
        <div
          className="cf-drift cf-drift-slow"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 110%, rgba(35,76,122,.55), transparent 62%)",
          }}
        />
        <Motas />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          boxShadow: "inset 0 0 180px 40px rgba(3,10,20,.75)",
        }} />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <span className="cf-label">Transparencia en cada paso</span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="cf-h1" style={{ margin: "34px 0 0", maxWidth: "16ch" }}>
              Un mercado
              <br />
              inmobiliario
              <br />
              <span className="cf-italic">abierto</span>
              <span style={{ color: "var(--gold-500)", opacity: .5 }}> · </span>
              <PalabraRotativa
                palabras={["sin comisiones", "sin intermediarios", "sin sorpresas"]}
                style={{ fontStyle: "italic", color: "var(--gold-300)" }}
              />
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0,1fr)",
              maxWidth: 560, marginLeft: "auto", marginTop: "clamp(36px,5vw,60px)",
            }}>
              <div className="cf-sweep is-in" style={{ marginBottom: 26 }} />
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.66)", margin: 0 }}>
                Espacio Inmobiliario conecta a dueños con compradores de manera directa
                y gratuita. Detrás no hay un algoritmo: hay una persona,{" "}
                <strong style={{ color: "var(--gold-300)", fontWeight: 500 }}>Eugenio Nielsen</strong>,
                que revisa cada publicación y acompaña cada operación.
              </p>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <div style={{
              display: "flex", gap: 14, flexWrap: "wrap",
              marginTop: "clamp(36px,5vw,56px)", alignItems: "center",
            }}>
              <Link href="/auth/registro" style={ctaGold}>
                <Plus size={15} strokeWidth={2.2} />
                Publicar mi propiedad gratis
              </Link>
              <Link href="#precios" style={ctaLine}>
                Ver precios
                <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Cinta en movimiento permanente ═════════════════════ */}
      <Cinta frases={CINTA} />

      {/* ══ El método · un solo bloque conmutable ══════════════ */}
      <section
        className="cf-grain cf-sect"
        style={{
          position: "relative",
          background: "var(--navy-900)",
          padding: "clamp(64px,9vw,116px) 24px",
          overflow: "hidden",
        }}
      >
        <div
          className="cf-drift"
          style={{ background: "radial-gradient(70% 50% at 100% 0%, rgba(185,159,102,.12), transparent 60%)" }}
        />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ textAlign: "center", maxWidth: 640, margin: "0 auto clamp(32px,4vw,48px)" }}>
              <span className="cf-label cf-label-center">El método</span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "26px 0 18px" }}>
                Elegí tu <span className="cf-italic">recorrido</span>
              </h2>
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.58)", margin: 0 }}>
                El camino no es el mismo si venís a vender o a comprar.
                Mirá el que te toca.
              </p>
            </header>
          </Reveal>

          <Reveal delay={120}>
            <Metodo />
          </Reveal>
        </div>
      </section>

      {/* ══ Precio · publicar es gratis ════════════════════════ */}
      <section
        id="precios"
        className="cf-sect"
        style={{
          background: "var(--cream)",
          padding: "clamp(64px,9vw,110px) 24px",
          scrollMarginTop: 80,
        }}
      >
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto clamp(30px,4vw,44px)" }}>
              <span className="cf-label cf-label-dark cf-label-center">Precios</span>
              <h2 className="cf-h2" style={{ color: "var(--navy-800)", margin: "26px 0 18px" }}>
                Publicar es{" "}
                <span style={{ fontStyle: "italic", color: "var(--gold-700)" }}>gratis</span>.
                Y va a seguir siéndolo.
              </h2>
              <p className="cf-lead" style={{ color: "var(--ink-600)", margin: 0 }}>
                Crear tu cuenta, publicar, editar, recibir consultas y cerrar el trato
                directo con el comprador es <strong>100% gratuito</strong>. Sin comisiones
                ni intermediarios. Esa es la esencia del proyecto, no una promoción.
              </p>
            </header>
          </Reveal>

          <Reveal delay={100}>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 10,
              justifyContent: "center", marginBottom: "clamp(38px,5vw,56px)",
            }}>
              {["Publicación gratis", "Sin comisiones", "Consultas directas", "Gratis para siempre"].map(t => (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
                  color: "var(--navy-800)", background: "#fff",
                  border: "1px solid var(--line-200)", padding: "9px 16px", borderRadius: 999,
                }}>
                  <Check size={14} strokeWidth={2.6} color="var(--success)" /> {t}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Comparador interactivo: precio fijo vs. comisión */}
          <Reveal delay={160}>
            <ComparadorComision />
          </Reveal>
        </div>
      </section>

      {/* ══ El acompañamiento, si lo querés ════════════════════ */}
      <section
        className="cf-grain cf-letterbox cf-sect"
        style={{
          position: "relative",
          background: "var(--navy-900)",
          padding: "clamp(64px,9vw,110px) 24px",
          overflow: "hidden",
        }}
      >
        <div
          className="cf-drift cf-drift-slow"
          style={{ background: "radial-gradient(70% 50% at 0% 0%, rgba(185,159,102,.12), transparent 60%)" }}
        />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ textAlign: "center", maxWidth: 640, margin: "0 auto clamp(32px,4vw,48px)" }}>
              <span className="cf-label cf-label-center">Acompañamiento · opcional</span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "26px 0 18px" }}>
                ¿Preferís que lo{" "}
                <span className="cf-italic">hagamos juntos</span>?
              </h2>
              <p className="cf-lead" style={{ color: "rgba(255,255,255,.58)", margin: 0 }}>
                Vos elegís: lo hacés solo, gratis, o sumás el acompañamiento integral
                con precio fijo. Nunca un porcentaje de tu propiedad.
              </p>
            </header>
          </Reveal>

          <Reveal delay={120}>
            <div className="cf-steps-3">
              {INCLUYE.map((item, i) => {
                const Icon = item.icon;
                return (
                  <TarjetaViva key={item.t} sheenDelay={i * 700}>
                    <span className="cf-card-icon" style={{ ["--sheen" as string]: `${i * 700}ms`, marginBottom: 18 }}>
                      <Icon size={19} strokeWidth={1.5} />
                    </span>
                    <h3 style={{
                      fontFamily: "var(--font-display)", fontWeight: 600,
                      fontSize: "clamp(17px,2vw,20px)", lineHeight: 1.25,
                      letterSpacing: "-.015em", color: "#fff", margin: "0 0 9px",
                    }}>
                      {item.t}
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 14,
                      lineHeight: 1.7, color: "rgba(255,255,255,.6)", margin: 0,
                    }}>
                      {item.d}
                    </p>
                  </TarjetaViva>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <span className="cf-swipe-hint" style={{ color: "var(--gold-400)" }}>
                Deslizá <MoveRight size={14} strokeWidth={1.6} />
              </span>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(32px,4vw,44px)" }}>
              <Link href="#contacto" style={ctaGold}>
                <Tag size={15} strokeWidth={2.2} />
                Consultar el precio fijo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Quién está detrás ══════════════════════════════════ */}
      <section
        className="cf-sect"
        style={{
          background: "var(--cream)",
          padding: "clamp(64px,9vw,110px) 24px",
          borderTop: "1px solid var(--gold-200)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Reveal>
            <FirmaEugenio />
          </Reveal>

          <Reveal delay={140}>
            <blockquote style={{
              margin: "clamp(34px,5vw,52px) 0 0",
              padding: "0 clamp(0px,4vw,32px)",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 400,
                fontSize: "clamp(19px,2.6vw,27px)", lineHeight: 1.5,
                letterSpacing: "-.015em", color: "var(--navy-800)",
                fontStyle: "italic", margin: 0,
              }}>
                &ldquo;Reviso personalmente cada publicación antes de que salga. Si algo no
                cierra, lo hablamos. Prefiero una propiedad menos publicada que un
                comprador desorientado.&rdquo;
              </p>
            </blockquote>
          </Reveal>

          <Reveal delay={220}>
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
              justifyContent: "center", marginTop: "clamp(30px,4vw,42px)",
            }}>
              <a
                href="https://wa.me/5491164519421"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 9,
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13.5,
                  background: "var(--navy-800)", color: "#fff",
                  padding: "13px 24px", borderRadius: 2, textDecoration: "none",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escribirle a Eugenio
              </a>
              <a
                href="mailto:eugenio@espacioinmobiliario.com.ar"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13.5,
                  color: "var(--navy-800)", border: "1px solid var(--gold-300)",
                  padding: "13px 24px", borderRadius: 2, textDecoration: "none",
                }}
              >
                eugenio@espacioinmobiliario.com.ar
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Contacto ═══════════════════════════════════════════ */}
      <section
        id="contacto"
        className="cf-sect"
        style={{
          background: "var(--cream)",
          borderTop: "1px solid var(--gold-200)",
          padding: "clamp(56px,8vw,88px) 24px",
          scrollMarginTop: 80,
        }}
      >
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <Reveal>
            <header style={{ textAlign: "center", marginBottom: "clamp(26px,4vw,38px)" }}>
              <span className="cf-label cf-label-dark cf-label-center">Conversemos</span>
              <h2 className="cf-h2" style={{
                color: "var(--navy-800)", margin: "24px 0 14px",
                fontSize: "clamp(24px,4vw,38px)",
              }}>
                No te vendemos nada. Hablemos de tu propiedad
              </h2>
              <p className="cf-lead" style={{ color: "var(--ink-600)", maxWidth: 520, margin: "0 auto" }}>
                Escribime y te cuento cómo podemos ayudarte a vender. Sin compromiso.
              </p>
            </header>
          </Reveal>
          <Reveal delay={120}>
            <AsesoriaContacto />
          </Reveal>
        </div>
      </section>

      {/* ══ Cierre ═════════════════════════════════════════════ */}
      <section
        className="cf-grain cf-sect"
        style={{
          position: "relative",
          background: "var(--navy-950)",
          padding: "clamp(64px,10vw,120px) 24px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="cf-drift"
          style={{ background: "radial-gradient(100% 70% at 50% 110%, rgba(185,159,102,.20), transparent 60%)" }}
        />
        <Motas />

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
            <p className="cf-lead" style={{ color: "rgba(255,255,255,.6)", margin: "0 auto 38px", maxWidth: 470 }}>
              Publicar tu propiedad es gratis, sin compromisos y lleva menos de 5 minutos.
              Y tenés a Eugenio disponible ante cualquier consulta.
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
