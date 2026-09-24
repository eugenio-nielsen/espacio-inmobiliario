import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import Indice, { type ItemIndice } from "@/components/ui/Indice";
import Secuencia from "@/components/ui/Secuencia";
import Motas from "@/components/como-funciona/Motas";
import PropertyListCard from "@/components/properties/PropertyListCard";
import AsesoriaContacto from "@/components/precios/AsesoriaContacto";
import { createClient } from "@/lib/supabase/server";
import { PROPERTY_CARD_COLS, type PropertyCardData } from "@/lib/types";
import { Scale, BadgeCheck, FileText, Wallet, ArrowRight, Send } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Comprar una propiedad · Con quién consultarlo antes de decidir",
  description:
    "Comprar de dueño directo no significa comprar solo. Verificamos quién vende, te ayudamos a saber si el precio es razonable y te acompañamos hasta la escritura.",
  alternates: { canonical: `${SITE}/comprar` },
  openGraph: {
    title: "Comprar una propiedad · Espacio Inmobiliario",
    description:
      "Comprar de dueño directo no significa comprar solo. Te acompañamos a decidir con información.",
    type: "website",
  },
};

/* Las cuatro dudas que aparecen al comprar sin inmobiliaria. Cada una
   enlaza a algo que ya existe y la responde, no a una promesa. */
const DUDAS: ItemIndice[] = [
  {
    icon: Scale,
    t: "¿El precio es razonable?",
    d: "Estimá el valor de mercado de un departamento en CABA con el mismo modelo que usamos para tasar, y compará contra lo que te están pidiendo.",
    cta: "Usar el tasador",
    href: "/estimador",
  },
  {
    icon: BadgeCheck,
    t: "¿Quién me está vendiendo?",
    d: "Verificamos la identidad del titular contra su documento y la escritura de cada propiedad. Cuando una ficha muestra los sellos, ya pasó ese control.",
    cta: "Cómo verificamos",
    href: "/como-funciona",
  },
  {
    icon: Wallet,
    t: "¿Qué pago además del precio?",
    d: "Escritura, sellos y aranceles del Registro suman bastante más de lo que la mayoría calcula. Tenemos una calculadora con los valores vigentes.",
    cta: "Calcular aranceles",
    href: "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble",
  },
  {
    icon: FileText,
    t: "¿Y si algo no cierra?",
    d: "Antes de firmar hay documentación para revisar y preguntas que conviene hacer. Si algo no te cierra, consultanos: para eso estamos.",
    cta: "Hacer una consulta",
    href: "/contacto?motivo=comprar",
  },
];

const PASOS = [
  { t: "Mirás", d: "Explorás el catálogo, o nos contás qué buscás si todavía no está publicado." },
  { t: "Consultás", d: "Escribís al dueño directo desde la ficha, y a nosotros si querés una opinión antes." },
  { t: "Decidís acompañado", d: "Analizamos la propiedad, la operación y los costos con vos hasta el cierre." },
];

export default async function ComprarPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select(PROPERTY_CARD_COLS)
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .limit(3);

  const propiedades = (properties ?? []) as PropertyCardData[];

  return (
    <div className="cf-page">
      <Navbar />

      {/* ══ Apertura ══════════════════════════════════════════ */}
      <section className="cf-grain cf-hero vd-hero">
        <div
          className="cf-drift"
          style={{ background: "radial-gradient(110% 75% at 50% -15%, rgba(185,159,102,.20), transparent 58%)" }}
        />
        <div
          className="cf-drift cf-drift-slow"
          style={{ background: "radial-gradient(75% 60% at 82% 110%, rgba(35,76,122,.5), transparent 62%)" }}
        />
        <Motas />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          boxShadow: "inset 0 0 170px 38px rgba(3,10,20,.7)",
        }} />

        <div className="vd-hero-in">
          <FadeIn direction="up">
            <span className="cf-label">Para quien compra</span>
          </FadeIn>
          <FadeIn direction="up" delay={110}>
            <h1 className="cf-h1 vd-h1">
              Comprar de dueño directo no significa comprar{" "}
              <span className="cf-italic">solo</span>.
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={210}>
            <p className="cf-lead vd-hero-lead">
              Te ahorrás la comisión, no el criterio. Verificamos quién vende,
              te ayudamos a entender si el precio tiene sentido y te acompañamos
              hasta la escritura.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={300}>
            <div className="vd-hero-ctas">
              <Link href="/contacto?motivo=comprar" className="vd-btn vd-btn-oro">
                Contanos qué buscás
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
              <Link href="/propiedades" className="vd-btn vd-btn-linea">
                Ver propiedades
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ Las cuatro dudas ══════════════════════════════════ */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderBottom: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(26px,4vw,42px)" }}>
              <span className="es-eyebrow" style={{ display: "block", marginBottom: 10 }}>
                Lo que se pregunta todo el mundo
              </span>
              <h2>Las dudas que aparecen <span className="hm-i">antes de firmar</span></h2>
              <p>
                Ninguna de estas se resuelve mirando fotos. Cada una tiene del
                otro lado algo concreto para consultarla.
              </p>
            </div>
          </FadeIn>

          <Indice items={DUDAS} tono="claro" />
        </div>
      </section>

      {/* ══ Cómo te acompañamos ═══════════════════════════════ */}
      <section
        className="cf-grain cf-letterbox hm-sect"
        style={{ position: "relative", background: "var(--navy-900)", overflow: "hidden" }}
      >
        <div
          className="cf-drift cf-drift-slow"
          style={{ background: "radial-gradient(70% 50% at 100% 0%, rgba(185,159,102,.12), transparent 60%)" }}
        />
        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <header style={{ textAlign: "center", maxWidth: 600, margin: "0 auto clamp(26px,4vw,42px)" }}>
              <span className="cf-label cf-label-center">Cómo te acompañamos</span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "22px 0 0" }}>
                Mirás, consultás, <span className="cf-italic">decidís</span>
              </h2>
            </header>
          </FadeIn>
          <Secuencia pasos={PASOS} tono="oscuro" />
        </div>
      </section>

      {/* ══ El portal, al final y no al principio ═════════════
          La página es de acompañamiento: el catálogo entra como
          consecuencia, después de haber dicho para qué estamos. */}
      <section className="hm-sect">
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              gap: 14, flexWrap: "wrap", marginBottom: 22,
            }}>
              <div>
                <span className="es-eyebrow" style={{ display: "block", marginBottom: 8 }}>
                  Lo que hay hoy
                </span>
                <h2 className="hm-respaldo-t" style={{ margin: 0 }}>
                  Mirá las propiedades publicadas
                </h2>
              </div>
              <Link href="/propiedades" className="hm-camino-cta" style={{ fontSize: 13.5 }}>
                Ver todas
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </FadeIn>

          {propiedades.length > 0 ? (
            <div className="grid-properties">
              {propiedades.map((p, i) => (
                <FadeIn key={p.id} delay={i * 100} direction="up">
                  <PropertyListCard property={p} />
                </FadeIn>
              ))}
            </div>
          ) : (
            <p style={{
              fontFamily: "var(--font-sans)", color: "var(--ink-500)",
              textAlign: "center", padding: "30px 0", margin: 0,
            }}>
              Todavía no hay propiedades publicadas.
            </p>
          )}
        </div>
      </section>

      {/* ══ El bloque que convierte el catálogo chico ═════════ */}
      <section
        id="buscamos"
        className="hm-sect"
        style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)", scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(22px,3.5vw,34px)" }}>
              <span className="es-eyebrow" style={{ display: "block", marginBottom: 10 }}>
                <Send size={12} strokeWidth={2} style={{ verticalAlign: "-1px", marginRight: 6 }} />
                Si no está publicado
              </span>
              <h2>¿No encontraste lo que <span className="hm-i">buscabas</span>?</h2>
              <p>
                Nuestro catálogo no es todo el mercado, y no vamos a fingir que sí.
                Contanos qué necesitás — zona, ambientes, presupuesto — y lo buscamos
                por vos. También podemos analizar con vos una propiedad que hayas
                encontrado en otro lado.
              </p>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={110}>
            <AsesoriaContacto motivo="comprar" />
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
