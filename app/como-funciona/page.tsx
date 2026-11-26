import { WHATSAPP } from "@/lib/contacto";
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
import AsesoriaContacto from "@/components/precios/AsesoriaContacto";
import ExplainerVideo from "@/components/home/ExplainerVideo";
import { ArrowRight, Plus } from "lucide-react";
import "@/components/como-funciona/como-funciona.css";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cómo funciona · Comprar y vender con acompañamiento",
  description:
    "Cómo funciona Espacio Inmobiliario paso a paso, para quien vende y para quien compra, con el acompañamiento de Eugenio Nielsen en cada operación.",
  alternates: { canonical: `${SITE}/como-funciona` },
  openGraph: {
    title: "Cómo funciona · Espacio Inmobiliario",
    description:
      "Sin comisiones: no somos intermediarios. Acompañamos a dueños y compradores en cada operación.",
    type: "website",
  },
};

const CINTA = [
  "Sin comisiones",
  "Trato directo con el dueño",
  "Sin intermediarios",
  "Acompañamiento en cada paso",
  "Cada publicación, revisada",
];

export default function ComoFuncionaPage() {
  return (
    <div className="cf-page">
      <Navbar />

      {/* ══ Apertura ═══════════════════════════════════════════
          Titular a la izquierda y el recorrido en video (el mismo de la
          home) a la derecha; en el celular, uno debajo del otro. */}
      <section
        className="cf-grain cf-hero"
        style={{
          position: "relative",
          background: "var(--navy-950)",
          padding: "clamp(64px,7vw,104px) 24px clamp(56px,7vw,92px)",
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

        <div className="cf-apertura" style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <div>
            <Reveal>
              <span className="cf-label">Transparencia en cada paso</span>
            </Reveal>

            <Reveal delay={120}>
              <h1 className="cf-h1" style={{ margin: "30px 0 0", maxWidth: "16ch" }}>
                Un mercado
                <br />
                inmobiliario
                <br />
                <span className="cf-italic">abierto</span>
                <br />
                <PalabraRotativa
                  palabras={["sin comisiones", "con acompañamiento", "sin sorpresas"]}
                  style={{ fontStyle: "italic", color: "var(--gold-300)" }}
                />
              </h1>
            </Reveal>

            <Reveal delay={240}>
              <div style={{ maxWidth: 520, marginTop: "clamp(28px,3.4vw,40px)" }}>
                <div className="cf-sweep is-in" style={{ marginBottom: 22 }} />
                <p className="cf-lead" style={{ color: "rgba(255,255,255,.66)", margin: 0 }}>
                  Espacio Inmobiliario conecta a dueños con compradores de manera directa,
                  sin comisiones. Detrás no hay un algoritmo: hay una persona,{" "}
                  <strong style={{ color: "var(--gold-300)", fontWeight: 500 }}>Eugenio Nielsen</strong>,
                  que revisa cada publicación y acompaña cada operación.
                </p>
              </div>
            </Reveal>

            <Reveal delay={360}>
              <div style={{
                display: "flex", gap: 14, flexWrap: "wrap",
                marginTop: "clamp(30px,3.6vw,44px)", alignItems: "center",
              }}>
                <Link href="/auth/registro" style={ctaGold}>
                  <Plus size={15} strokeWidth={2.2} />
                  Publicar mi propiedad gratis
                </Link>
                <Link href="/vender" style={ctaLine}>
                  Quiero vender
                  <ArrowRight size={14} strokeWidth={1.8} />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <ExplainerVideo />
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

      {/* ══ Quién está detrás, y cómo escribirle ═══════════════
          Un solo bloque: Eugenio a la izquierda y el formulario a la derecha.
          El ancla #precios queda porque hubo links externos apuntando a esta
          altura de la página (el comparador de comisión vive en /vender). */}
      <span id="precios" aria-hidden="true" style={{ display: "block", scrollMarginTop: 80 }} />
      <section
        id="contacto"
        className="cf-sect"
        style={{
          background: "var(--cream)",
          padding: "clamp(64px,9vw,110px) 24px",
          scrollMarginTop: 80,
        }}
      >
        <div className="cf-persona" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <div>
            <Reveal>
              <FirmaEugenio />
            </Reveal>

            <Reveal delay={140}>
              <blockquote className="cf-persona-cita">
                <p>
                  &ldquo;Reviso personalmente cada publicación antes de que salga. Si algo no
                  cierra, lo hablamos. Prefiero una propiedad menos publicada que un
                  comprador desorientado.&rdquo;
                </p>
              </blockquote>
            </Reveal>

            <Reveal delay={220}>
              <div className="cf-persona-enlaces">
                <a
                  href={`https://wa.me/${WHATSAPP}`}
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

          <Reveal delay={120}>
            <div className="cf-persona-form">
              <header>
                <span className="cf-label cf-label-dark">Conversemos</span>
                <h2 className="cf-h2">No te vendemos nada. Hablemos de tu propiedad</h2>
                <p className="cf-lead">
                  Escribime y te cuento cómo podemos ayudarte a vender. Sin compromiso.
                </p>
              </header>
              {/* El botón de WhatsApp ya está al lado, junto a la firma */}
              <AsesoriaContacto conWhatsApp={false} />
            </div>
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
              Publicar tu propiedad es sin compromisos y lleva menos de 5 minutos.
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
