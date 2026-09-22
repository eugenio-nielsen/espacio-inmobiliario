import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/ui/FadeIn";
import SelloEN from "@/components/SelloEN";
import FormContacto from "@/components/contacto/FormContacto";
import { motivoValido } from "@/lib/motivos";
import { Mail, Clock, MapPin } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";
const WHATSAPP = "5491164519421";
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
                Te responde <strong style={{ fontWeight: 600, color: "var(--navy-800)" }}>Eugenio Nielsen</strong>.
                No hay call center ni formulario que nadie lee: del otro lado hay
                una persona con nombre y apellido.
              </p>

              <ul className="ct-datos">
                <li>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                    <span className="ct-dato-ic" style={{ color: "#16a34a" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </span>
                    +54 9 11 6451-9421
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} style={{ overflowWrap: "anywhere" }}>
                    <span className="ct-dato-ic"><Mail size={15} strokeWidth={1.8} /></span>
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <span className="ct-dato-ic"><Clock size={15} strokeWidth={1.8} /></span>
                  Lunes a viernes, 9 a 19 h
                </li>
                <li>
                  <span className="ct-dato-ic"><MapPin size={15} strokeWidth={1.8} /></span>
                  CABA y Provincia de Buenos Aires
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
