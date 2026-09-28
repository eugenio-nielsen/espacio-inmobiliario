import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Tag, MessageCircle, CalendarDays, Sparkles, ShieldCheck, LineChart, LayoutDashboard, FileCheck, ArrowRight, Plus,
} from "lucide-react";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/user";
import SelloEN from "@/components/SelloEN";
import Guilloche from "@/components/ui/Guilloche";
import Secuencia from "@/components/ui/Secuencia";
import Indice, { type ItemIndice } from "@/components/ui/Indice";
import RegistroDueno from "@/components/propietarios/RegistroDueno";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";
const PAGINA = "/propietarios/publicar";

export const metadata: Metadata = {
  title: "Publicá tu propiedad gratis y sin comisión",
  description:
    "Publicá gratis tu departamento, casa o terreno en Espacio Inmobiliario: sin comisión, con los interesados escribiéndote directo a tu WhatsApp y cada publicación revisada antes de salir.",
  alternates: { canonical: `${SITE}${PAGINA}` },
  openGraph: {
    title: "Publicá tu propiedad gratis · Espacio Inmobiliario",
    description: "Sin costo, sin comisión y con contacto directo con los interesados. Creá tu cuenta en un minuto.",
    type: "website",
  },
};

const PASOS = [
  { t: "Creá tu cuenta", d: "Nombre, teléfono y email. Lleva un minuto." },
  { t: "Cargá tu propiedad", d: "Fotos, datos y la ubicación con un pin en el mapa. La descripción, si querés, te ayudamos a escribirla." },
  { t: "La revisamos", d: "Cada publicación pasa por Eugenio antes de salir al portal." },
  { t: "Recibí a los interesados", d: "Te escriben a tu WhatsApp o piden una visita en los horarios que elijas." },
] as const;

const INCLUYE: ItemIndice[] = [
  { icon: Tag, t: "Publicación gratuita", d: "Publicar no tiene costo, y si vendés por tu cuenta, no hay comisión." },
  { icon: MessageCircle, t: "Contacto directo", d: "Los interesados te escriben a tu WhatsApp desde la ficha, sin intermediarios." },
  { icon: CalendarDays, t: "Agenda de visitas", d: "Elegís tus horarios, los interesados piden turno online y vos confirmás." },
  { icon: Sparkles, t: "Descripción asistida", d: "Te ayudamos a escribir la descripción a partir de los datos que cargás." },
  { icon: ShieldCheck, t: "Sellos de verificación", d: "Validá tu identidad y tu escritura: la ficha lo muestra y el comprador llega con más confianza." },
  { icon: FileCheck, t: "Revisión previa", d: "Ninguna publicación sale al portal sin haber sido revisada, una por una." },
  { icon: LineChart, t: "Tasador gratis", d: "Estimá el valor de tu departamento antes de ponerle precio.", cta: "Usar el tasador", href: "/estimador" },
  { icon: LayoutDashboard, t: "Tu panel", d: "Consultas, visitas y publicaciones en un solo lugar. Pausás o editás cuando quieras." },
];

const PREGUNTAS = [
  {
    q: "¿Cuánto cuesta publicar?",
    a: "Nada. Publicar es gratis, y si vendés a un comprador que llegó por el portal, no pagás comisión.",
  },
  {
    q: "¿Qué propiedades puedo publicar?",
    a: "Departamentos, casas, terrenos, locales y oficinas, en venta, en la Ciudad y la Provincia de Buenos Aires.",
  },
  {
    q: "¿Cómo me contactan los interesados?",
    a: "Desde la ficha de tu propiedad: te escriben a tu WhatsApp, te dejan una consulta que ves en tu panel o te piden una visita en los horarios que elegiste.",
  },
  {
    q: "¿Tengo que validar mi identidad?",
    a: "Para empezar, no: podés publicar hasta cinco propiedades sin validarla. Si la validás, tu ficha muestra el sello de Propietario verificado.",
  },
  {
    q: "¿Puedo pausar o editar la publicación?",
    a: "Sí, cuando quieras, desde tu panel: editás los datos y las fotos, y la marcás como pausada o vendida.",
  },
  {
    q: "¿Y si prefiero no ocuparme de la venta?",
    a: "Podés delegarla: te acompañamos en toda la operación por un valor fijo, no un porcentaje del precio.",
  },
] as const;

/**
 * Publicá tu propiedad: la primera página del espacio para propietarios.
 *
 * Su único objetivo es que un dueño cree su cuenta y cargue su
 * propiedad. Por eso el alta está en la apertura (sin un clic de más),
 * lleva directo al formulario de carga, y cada sección termina en el
 * mismo lugar. Todo lo que promete es algo que la plataforma hace hoy.
 *
 * Con la sesión iniciada, en lugar del alta se ofrece publicar.
 */
export default async function PublicarPage() {
  const user = await getCurrentUser();
  const perfil = user ? await getCurrentProfile() : null;
  const nombre = perfil?.nombre?.trim().split(" ")[0];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PREGUNTAS.map(p => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      {/* ── Apertura: la promesa y el alta, juntas ─────────────── */}
      <section className="pr-apertura" aria-labelledby="pr-titulo">
        <div className="pr-fondo" aria-hidden="true">
          <Image src="/hero-bg.png" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="pr-foto" />
        </div>
        <div className="pr-velo" aria-hidden="true" />
        <Guilloche id="pr-gq" className="pr-gq" />

        <div className="pr-apertura-in">
          <div className="pr-texto">
            <p className="pr-eyebrow">Para propietarios</p>
            <h1 id="pr-titulo" className="pr-t">
              <span className="pr-corte"><span>Publicá tu propiedad.</span></span>{" "}
              <span className="pr-corte"><em>Gratis y sin comisión.</em></span>
            </h1>
            <p className="pr-lead">
              Los interesados te escriben directo a tu WhatsApp, sin intermediarios.
              Y cada publicación la revisa Eugenio Nielsen antes de salir al portal.
            </p>
            <ul className="pr-promesas">
              <li>Sin costo de publicación</li>
              <li>Sin comisión</li>
              <li>Contacto directo por WhatsApp</li>
              <li>Agenda de visitas online</li>
            </ul>
          </div>

          <div className="pr-alta-col">
            <SelloEN size={104} tono="claro" etiqueta="" className="pr-sello" />
            {user ? (
              <div className="pr-alta pr-alta-lista">
                <header className="pr-alta-cab">
                  <span className="pr-alta-k">Tu cuenta está lista</span>
                  <h2 className="pr-alta-t">{nombre ? `${nombre}, ` : ""}<em>publicá tu propiedad</em></h2>
                  <p className="pr-alta-sub">Fotos, datos y ubicación. Antes de salir al portal, la revisamos.</p>
                </header>
                <div className="pr-doble" aria-hidden="true" />
                <Link href="/panel/propiedades/nueva" className="pr-boton">
                  <Plus size={16} strokeWidth={2} />
                  Publicar mi propiedad
                </Link>
                <p className="pr-ya"><Link href="/panel">Ir a mi panel</Link></p>
              </div>
            ) : (
              <RegistroDueno pagina={PAGINA} />
            )}
          </div>
        </div>
      </section>

      {/* ── Cómo se publica ───────────────────────────────────── */}
      <section className="pr-seccion">
        <div className="pr-in">
          <header className="pr-cab">
            <p className="pr-cab-k">Cómo funciona</p>
            <h2 className="pr-cab-t">De la cuenta a la primera consulta, <em>en cuatro pasos</em></h2>
          </header>
          <Secuencia pasos={PASOS} tono="claro" />
        </div>
      </section>

      {/* ── Qué incluye ───────────────────────────────────────── */}
      <section className="pr-seccion pr-seccion-papel">
        <div className="pr-in">
          <header className="pr-cab">
            <p className="pr-cab-k">Qué incluye</p>
            <h2 className="pr-cab-t">Todo para vender <em>por tu cuenta</em></h2>
          </header>
          <Indice items={INCLUYE} tono="claro" columnas={4} />
        </div>
      </section>

      {/* ── Delegar ───────────────────────────────────────────── */}
      <section className="pr-delegar">
        <div className="pr-in pr-delegar-in">
          <div>
            <p className="pr-cab-k">¿Preferís no ocuparte?</p>
            <h2 className="pr-delegar-t">Delegá la venta, <em>con precio fijo</em></h2>
          </div>
          <div>
            <p className="pr-delegar-d">
              Si no querés atender consultas ni visitas, te acompañamos en toda la
              operación, del valor a la escritura, por un valor fijo y no un porcentaje del precio.
            </p>
            <Link href="/vender" className="pr-enlace">
              Cómo funciona la venta acompañada
              <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Preguntas ─────────────────────────────────────────── */}
      <section className="pr-seccion">
        <div className="pr-in pr-in-angosto">
          <header className="pr-cab">
            <p className="pr-cab-k">Preguntas frecuentes</p>
            <h2 className="pr-cab-t">Antes de <em>publicar</em></h2>
          </header>
          <div className="pr-faq">
            {PREGUNTAS.map((p, i) => (
              <details key={p.q} className="pr-faq-item" open={i === 0}>
                <summary>
                  <span className="pr-faq-n" aria-hidden="true">{["I", "II", "III", "IV", "V", "VI"][i]}</span>
                  {p.q}
                </summary>
                <p>{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cierre: el mismo lugar al que lleva todo ──────────── */}
      <section className="pr-cierre">
        <div className="pr-in pr-cierre-in">
          <h2 className="pr-cierre-t">Tu propiedad, <em>frente a quienes buscan.</em></h2>
          <Link href={user ? "/panel/propiedades/nueva" : "#registro"} className="pr-boton pr-boton-oro">
            {user ? "Publicar mi propiedad" : "Crear mi cuenta gratis"}
            <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </>
  );
}
