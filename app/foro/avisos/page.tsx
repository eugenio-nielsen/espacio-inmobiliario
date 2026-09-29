import type { Metadata } from "next";
import BajaAvisos from "@/components/foro/BajaAvisos";

export const metadata: Metadata = {
  title: "Avisos por email · Tertulia Inmobiliaria",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ t?: string }> };

/**
 * Dejar de recibir avisos desde el enlace del email. Pide un clic en vez
 * de darlos de baja al abrir la página: algunos filtros de correo abren
 * los enlaces solos para revisarlos, y eso no debería apagar nada.
 */
export default async function AvisosPage({ searchParams }: Props) {
  const { t } = await searchParams;
  return (
    <div className="fo-in" style={{ maxWidth: 560, padding: "clamp(48px, 7vw, 88px) 16px clamp(64px, 8vw, 104px)" }}>
      <div className="fo-papel">
        <p className="fo-k">Tertulia Inmobiliaria</p>
        <h1 className="fo-papel-t">Avisos <em>por email</em></h1>
        <p className="fo-papel-sub">
          Te escribimos cuando responden tus temas, comentan tus respuestas o eligen una como solución.
        </p>
        <div className="fo-doble" />
        <BajaAvisos token={t ?? ""} />
      </div>
    </div>
  );
}
