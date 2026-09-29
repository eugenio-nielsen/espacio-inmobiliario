import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Guilloche from "@/components/ui/Guilloche";
import Muro from "@/components/catedra/Muro";
import RedProfesionales from "@/components/catedra/RedProfesionales";
import { getCurrentUser } from "@/lib/auth/user";
import { profesionalesAprobados } from "@/lib/catedra/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Red de profesionales de confianza · Cátedra Inmobiliaria",
  description: "Escribanos, abogados, agrimensores, tasadores y más profesionales de confianza para derivar operaciones inmobiliarias en CABA y GBA.",
  alternates: { canonical: `${SITE}/catedra/profesionales` },
  // Tiene datos de contacto de personas y es solo para usuarios registrados
  robots: { index: false, follow: true },
};

/**
 * La red de profesionales. Solo con sesión: son datos de contacto de
 * personas que aceptaron mostrarlos a usuarios registrados, no a
 * cualquiera que pase (ni a buscadores).
 */
export default async function ProfesionalesPage() {
  const user = await getCurrentUser();
  const profesionales = user ? await profesionalesAprobados() : [];

  return (
    <>
      <header className="cat-cab">
        <Guilloche id="gq-red" className="cat-cab-gq" />
        <div className="cat-in cat-cab-in">
          <nav className="cat-migas" aria-label="Estás en">
            <Link href="/catedra">Cátedra Inmobiliaria</Link>
            <span aria-hidden="true">›</span>
            <span>Profesionales de confianza</span>
          </nav>
          <h1 className="cat-cab-t">Profesionales <em>de confianza</em></h1>
          <p className="cat-cab-lead">
            Una operación la cierran varias personas. Acá están las que conocemos o que se sumaron y
            revisamos: para derivar una escritura, una mensura o una sucesión con tranquilidad.
          </p>
          <div className="cat-cab-acciones">
            <Link href="/catedra/profesionales/postular" className="cat-enlace">
              ¿Sos profesional? Sumate a la red <ArrowRight size={13} strokeWidth={1.8} style={{ display: "inline", verticalAlign: "-2px" }} />
            </Link>
          </div>
        </div>
      </header>

      {user ? (
        <RedProfesionales profesionales={profesionales} />
      ) : (
        <Muro
          volver="/catedra/profesionales"
          titulo={<>La red es para <em>usuarios registrados</em></>}
          texto="Los profesionales comparten su contacto con la comunidad del sitio. Creá tu cuenta gratis (lleva un minuto) o ingresá para verla."
        />
      )}
    </>
  );
}
