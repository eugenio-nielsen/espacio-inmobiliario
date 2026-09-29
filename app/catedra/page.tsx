import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calculator, MessagesSquare, ScrollText, Users } from "lucide-react";
import Guilloche from "@/components/ui/Guilloche";
import Indice from "@/components/ui/Indice";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Cátedra Inmobiliaria · Herramientas para corredores y martilleros",
  description:
    "Para estudiantes de corredor inmobiliario y martillero público y para quienes recién se matriculan: calculadora de costos de una compraventa, modelos de contratos y una red de profesionales de confianza.",
  alternates: { canonical: `${SITE}/catedra` },
};

/**
 * Portada de la Cátedra. Tres herramientas, presentadas como un índice
 * (celdas con filetes, sin cajas). Los modelos de contratos se anuncian
 * como "en preparación": los textos los aporta Eugenio y no se publican
 * sin su revisión.
 */
export default function CatedraPage() {
  return (
    <>
      <header className="cat-cab">
        <Guilloche id="gq-catedra" className="cat-cab-gq" />
        <div className="cat-in cat-cab-in">
          <p className="cat-k">Para estudiantes y recién matriculados</p>
          <h1 className="cat-cab-t">Cátedra <em>Inmobiliaria</em></h1>
          <p className="cat-cab-lead">
            Herramientas para quienes se forman como corredores o martilleros: la cuenta completa de
            una operación, los papeles que la sostienen y la gente de confianza que la hace posible.
            Libres y pensadas para usar en el trabajo de todos los días.
          </p>
          <div className="cat-cab-acciones">
            <Link href="/catedra/calculadora" className="cat-btn">
              Abrir la calculadora <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
            <Link href="/catedra/profesionales" className="cat-enlace">Ver la red de profesionales</Link>
          </div>
        </div>
      </header>

      <section className="cat-seccion">
        <div className="cat-in">
          <p className="cat-k">Las herramientas</p>
          <h2 className="cat-seccion-t">Lo que se usa <em>en cada operación</em></h2>
          <Indice
            columnas={3}
            items={[
              {
                icon: Calculator,
                t: "Calculadora de costos",
                d: "Cuánto desembolsa el comprador y cuánto le queda al vendedor, línea por línea y con la norma de cada una. Se imprime para el cliente.",
                cta: "Abrir la calculadora",
                href: "/catedra/calculadora",
              },
              {
                icon: ScrollText,
                t: "Modelos de contratos",
                d: "Reserva, boleto, autorización de venta y más: en blanco, para completar y comentados cláusula por cláusula. En preparación.",
              },
              {
                icon: Users,
                t: "Profesionales de confianza",
                d: "Escribanos, abogados, agrimensores, tasadores y más, para derivar con tranquilidad. Visible con tu cuenta gratuita.",
                cta: "Ver la red",
                href: "/catedra/profesionales",
              },
            ]}
          />
        </div>
      </section>

      <section className="cat-seccion">
        <div className="cat-in" style={{ display: "grid", gap: 28 }}>
          <div>
            <p className="cat-k">Para seguir aprendiendo</p>
            <h2 className="cat-seccion-t">Las dudas se resuelven <em>conversando</em></h2>
            <p className="cat-cab-lead" style={{ marginTop: -8 }}>
              En la Tertulia Inmobiliaria, el foro del sitio, podés preguntar lo que no está en los apuntes
              y leer cómo se resolvieron casos reales de escrituras, tasaciones, créditos y consorcios.
            </p>
            <div className="cat-cab-acciones">
              <Link href="/foro" className="cat-btn cat-btn-claro">
                <MessagesSquare size={15} strokeWidth={1.7} /> Ir a la Tertulia
              </Link>
              <Link href="/catedra/profesionales/postular" className="cat-enlace">¿Sos profesional? Sumate a la red</Link>
            </div>
          </div>
          <p className="cat-aviso">
            <strong>Material orientativo.</strong> Las herramientas de la Cátedra se basan en la normativa
            vigente de la Ciudad de Buenos Aires y en los usos de plaza, y se actualizan cuando cambian.
            No reemplazan el asesoramiento de un escribano, un abogado o un contador para cada caso.
          </p>
        </div>
      </section>
    </>
  );
}
