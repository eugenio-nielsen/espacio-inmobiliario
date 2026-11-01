import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import Indice, { type ItemIndice } from "@/components/ui/Indice";
import Motas from "@/components/como-funciona/Motas";
import Escalera from "@/components/vender/Escalera";
import AsesoriaContacto from "@/components/precios/AsesoriaContacto";
import {
  BadgeCheck, ShieldCheck, MessageSquare, CalendarClock,
  Users, Scale, LineChart, ArrowRight,
} from "lucide-react";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vender tu propiedad · Tasación gratis y sin comisión",
  description:
    "Conocé cuánto vale tu propiedad y elegí cómo venderla: publicá y gestionala vos, o sumá nuestro acompañamiento. Sin comisión: no somos intermediarios.",
  alternates: { canonical: `${SITE}/vender` },
  openGraph: {
    title: "Vender tu propiedad · Espacio Inmobiliario",
    description:
      "Tasá tu propiedad gratis y elegí cómo vender: por tu cuenta, o con nuestro acompañamiento. Sin comisión.",
    type: "website",
  },
};

/* Lo que suma el acompañamiento profesional */
const INCLUYE: ItemIndice[] = [
  { icon: BadgeCheck, t: "Un responsable con nombre y apellido", d: "Alguien a cargo de tu operación de principio a fin. No un call center ni un formulario que nadie lee." },
  { icon: MessageSquare, t: "Gestión diaria de consultas", d: "Respondemos y filtramos las consultas por vos, para que solo te llegue lo que vale la pena." },
  { icon: CalendarClock, t: "Coordinación de visitas", d: "Organizamos y acompañamos las visitas a tu propiedad, sin que tengas que estar pendiente." },
  { icon: Users, t: "Red de profesionales de confianza", d: "Escribanos, fotógrafos y reparadores que conocemos y recomendamos, cuando los necesites." },
  { icon: ShieldCheck, t: "Respaldo legal y documental", d: "Te acompañamos con la documentación, los certificados y el cierre seguro de la operación." },
  { icon: Scale, t: "Sin comisión", d: "No somos intermediarios: el trato es entre vos y el comprador, y nosotros te acompañamos en el camino." },
];

export default function VenderPage() {
  return (
    <div className="cf-page">
      <Navbar />

      {/* ══ Apertura · la pregunta que trae al vendedor ═══════ */}
      <section className="cf-grain cf-hero vd-hero">
        <div
          className="cf-drift"
          style={{ background: "radial-gradient(110% 75% at 50% -15%, rgba(185,159,102,.22), transparent 58%)" }}
        />
        <div
          className="cf-drift cf-drift-slow"
          style={{ background: "radial-gradient(75% 60% at 18% 110%, rgba(35,76,122,.5), transparent 62%)" }}
        />
        <Motas />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          boxShadow: "inset 0 0 170px 38px rgba(3,10,20,.7)",
        }} />

        <div className="vd-hero-in">
          <FadeIn direction="up">
            <span className="cf-label">Para propietarios</span>
          </FadeIn>
          <FadeIn direction="up" delay={110}>
            <h1 className="cf-h1 vd-h1">
              ¿Cuánto vale <span className="cf-italic">realmente</span> tu propiedad?
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={210}>
            <p className="cf-lead vd-hero-lead">
              Una buena venta empieza por una valoración correcta. Estimala gratis
              en dos minutos y después decidí cómo querés vender: por tu cuenta,
              o con acompañamiento.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={300}>
            <div className="vd-hero-ctas">
              <Link href="/estimador" className="vd-btn vd-btn-oro">
                <LineChart size={15} strokeWidth={2} />
                Tasar mi propiedad gratis
              </Link>
              <Link href="#contacto" className="vd-btn vd-btn-linea">
                Hablar con Eugenio
                <ArrowRight size={14} strokeWidth={1.9} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ La escalera · el bloque central ═══════════════════ */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderBottom: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(26px,4vw,40px)" }}>
              <span className="es-eyebrow" style={{ display: "block", marginBottom: 10 }}>
                Elegí cómo vender
              </span>
              <h2>Dos formas de vender. <span className="hm-i">La misma persona detrás.</span></h2>
              <p>
                Sin comisión en ningún caso: no somos intermediarios. Si querés,
                sumás nuestro acompañamiento de principio a fin.
              </p>
            </div>
          </FadeIn>
          <Escalera />
        </div>
      </section>

      {/* ══ Qué incluye el acompañamiento ═════════════════════ */}
      <section
        className="cf-grain cf-letterbox hm-sect"
        style={{ position: "relative", background: "var(--navy-900)", overflow: "hidden" }}
      >
        <div
          className="cf-drift cf-drift-slow"
          style={{ background: "radial-gradient(70% 50% at 0% 0%, rgba(185,159,102,.12), transparent 60%)" }}
        />
        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <header style={{ textAlign: "center", maxWidth: 620, margin: "0 auto clamp(28px,4vw,44px)" }}>
              <span className="cf-label cf-label-center">Qué incluye</span>
              <h2 className="cf-h2" style={{ color: "#fff", margin: "22px 0 16px" }}>
                Todo lo que dejás de <span className="cf-italic">tener que hacer</span>
              </h2>
            </header>
          </FadeIn>
          <Indice items={INCLUYE} tono="oscuro" columnas={3} />
        </div>
      </section>

      {/* ══ Contacto ══════════════════════════════════════════ */}
      <section
        id="contacto"
        className="hm-sect"
        style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)", scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(22px,3.5vw,34px)" }}>
              <span className="es-eyebrow" style={{ display: "block", marginBottom: 10 }}>
                Conversemos
              </span>
              <h2>Contanos sobre tu propiedad</h2>
              <p>
                Te contamos cuánto puede valer y cómo podemos acompañarte
                en la venta. Sin compromiso.
              </p>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={110}>
            <AsesoriaContacto motivo="vender" />
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
