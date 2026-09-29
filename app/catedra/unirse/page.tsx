import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Guilloche from "@/components/ui/Guilloche";
import UnirseForm from "@/components/foro/UnirseForm";
import { getCurrentUser } from "@/lib/auth/user";
import { volverSeguro } from "@/lib/foro/texto";
import "@/components/foro/foro.css";

export const metadata: Metadata = {
  title: "Creá tu cuenta · Cátedra Inmobiliaria",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ volver?: string }> };

/**
 * Alta desde la Cátedra. Es la misma cuenta y el mismo formulario que la
 * Tertulia (sin teléfono, con "qué te trae"), con el texto de la Cátedra.
 * Usa las piezas de foro.css porque el formulario es compartido.
 */
export default async function UnirseCatedraPage({ searchParams }: Props) {
  const { volver: v } = await searchParams;
  const volver = volverSeguro(v, "/catedra");
  if (await getCurrentUser()) redirect(volver);

  return (
    <div className="cat-cab" style={{ borderBottom: 0, background: "var(--cream)" }}>
      <Guilloche id="gq-catedra-unirse" className="cat-cab-gq" />
      <div className="cat-in" style={{ maxWidth: 560, padding: "clamp(40px, 6vw, 72px) 16px clamp(64px, 8vw, 104px)" }}>
        <div className="fo-papel">
          <p className="fo-k">Cátedra Inmobiliaria</p>
          <h1 className="fo-papel-t">Creá tu <em>cuenta</em></h1>
          <p className="fo-papel-sub">
            Gratis, para ver la red de profesionales y participar en la Tertulia. Es la misma cuenta de
            Espacio Inmobiliario: con ella también podés publicar una propiedad.
          </p>
          <div className="fo-doble" />
          <UnirseForm volver={volver} boton="Crear mi cuenta" />
        </div>
      </div>
    </div>
  );
}
