import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import SelloEN from "@/components/SelloEN";
import FormContacto from "@/components/contacto/FormContacto";
import { motivoValido } from "@/lib/motivos";
import { Mail, Clock, MapPin, MessageCircle } from "lucide-react";
import "@/components/contacto/contacto.css";

import { SITE } from "@/lib/site";
import { WHATSAPP, TELEFONO_TEXTO } from "@/lib/contacto";
const EMAIL = "eugenio@espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Contacto · Hablemos de tu operación",
  description:
    "Escribinos si querés vender, comprar, invertir o simplemente entender una operación inmobiliaria. Te responde Eugenio Nielsen, sin compromiso.",
  alternates: { canonical: `${SITE}/contacto` },
  openGraph: {
    title: "Contacto · Espacio Inmobiliario",
    description: "Contanos qué necesitás. Te responde Eugenio Nielsen, sin compromiso.",
    type: "website",
  },
};

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  // El motivo llega por querystring desde las puertas de la home. Se
  // valida en el servidor: cualquier valor inventado cae en "otro".
  const sp = await searchParams;
  const motivo = motivoValido(sp.motivo);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main className="ct-main">
        <div className="ct-grid">
          {/* ── Columna de contexto ─────────────────────────── */}
          <aside className="ct-aside">
            <FadeIn direction="none">
              <SelloEN size={104} tono="claro" etiqueta="Fundador" />
            </FadeIn>
            <FadeIn direction="up" delay={100}>
              <h1 className="ct-h1">Hablemos de tu <span className="ct-i">operación</span></h1>
              <p className="ct-lead">
                Te responde <strong>Eugenio Nielsen</strong>.
                No hay call center ni formulario que nadie lee: del otro lado hay
                una persona con nombre y apellido.
              </p>

              <ul className="ct-datos">
                <li>
                  <a className="ct-dato" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                    <span className="ct-dato-ic"><MessageCircle size={20} strokeWidth={1.4} aria-hidden="true" /></span>
                    <span>
                      <span className="ct-dato-lbl">WhatsApp</span>
                      <span className="ct-dato-val">{TELEFONO_TEXTO}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a className="ct-dato" href={`mailto:${EMAIL}`}>
                    <span className="ct-dato-ic"><Mail size={20} strokeWidth={1.4} aria-hidden="true" /></span>
                    <span>
                      <span className="ct-dato-lbl">Email</span>
                      <span className="ct-dato-val">{EMAIL}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <div className="ct-dato">
                    <span className="ct-dato-ic"><Clock size={20} strokeWidth={1.4} aria-hidden="true" /></span>
                    <span>
                      <span className="ct-dato-lbl">Horario</span>
                      <span className="ct-dato-val">Lunes a viernes, 9 a 19 h</span>
                    </span>
                  </div>
                </li>
                <li>
                  <div className="ct-dato">
                    <span className="ct-dato-ic"><MapPin size={20} strokeWidth={1.4} aria-hidden="true" /></span>
                    <span>
                      <span className="ct-dato-lbl">Zona</span>
                      <span className="ct-dato-val">CABA y Provincia de Buenos Aires</span>
                    </span>
                  </div>
                </li>
              </ul>
            </FadeIn>
          </aside>

          {/* ── Formulario ──────────────────────────────────── */}
          <FadeIn direction="up" delay={160} className="ct-form-wrap">
            <FormContacto motivoInicial={motivo} />
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
}
