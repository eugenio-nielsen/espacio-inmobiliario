import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Guilloche from "@/components/ui/Guilloche";
import UnirseForm from "@/components/foro/UnirseForm";
import { getCurrentUser } from "@/lib/auth/user";
import { volverSeguro } from "@/lib/foro/texto";

export const metadata: Metadata = {
  title: "Sumate a la Tertulia Inmobiliaria",
  description: "Creá tu cuenta gratis para preguntar, responder y votar en el foro de Espacio Inmobiliario.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ volver?: string }> };

export default async function UnirsePage({ searchParams }: Props) {
  const { volver: v } = await searchParams;
  const volver = volverSeguro(v);
  // Con sesión no hay nada que crear: directo a donde iba
  if (await getCurrentUser()) redirect(volver);

  return (
    <div className="fo-cab" style={{ borderBottom: 0, background: "var(--cream)" }}>
      <Guilloche id="gq-unirse" className="fo-cab-gq" />
      <div className="fo-in" style={{ maxWidth: 560, padding: "clamp(40px, 6vw, 72px) 16px clamp(64px, 8vw, 104px)" }}>
        <div className="fo-papel">
          <p className="fo-k">Tertulia Inmobiliaria</p>
          <h1 className="fo-papel-t">Sumate a <em>la conversación</em></h1>
          <p className="fo-papel-sub">
            Preguntá, respondé y votá. Es gratis y es la misma cuenta de Espacio Inmobiliario:
            si algún día querés publicar una propiedad, ya la tenés.
          </p>
          <div className="fo-doble" />
          <UnirseForm volver={volver} />
        </div>
      </div>
    </div>
  );
}
