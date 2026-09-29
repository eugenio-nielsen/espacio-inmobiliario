import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MailCheck } from "lucide-react";
import EventoGA from "@/components/analytics/EventoGA";
import { volverSeguro } from "@/lib/foro/texto";

export const metadata: Metadata = {
  title: "Bienvenida · Tertulia Inmobiliaria",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ volver?: string; nuevo?: string }> };

/**
 * Después de crear la cuenta en la Tertulia. Supabase tiene activada la
 * confirmación de email, así que todavía no hay sesión: se explica el
 * paso que falta. El enlace del email vuelve solo al tema donde la
 * persona quería participar, ya con la sesión iniciada; si lo abre en
 * otro dispositivo, le pide ingresar y vuelve igual.
 */
export default async function BienvenidaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const volver = volverSeguro(sp.volver);

  return (
    <div className="fo-in" style={{ maxWidth: 600, padding: "clamp(48px, 7vw, 88px) 16px clamp(64px, 8vw, 104px)" }}>
      <div className="fo-papel">
        {sp.nuevo && <EventoGA nombre="sign_up" params={{ method: "email", origen: "foro" }} limpiar={["nuevo"]} />}
        <p className="fo-k">Bienvenida</p>
        <h1 className="fo-papel-t">Falta <em>un paso</em></h1>
        <p className="fo-papel-sub" style={{ display: "flex", gap: 12 }}>
          <MailCheck size={22} strokeWidth={1.5} color="var(--gold-600)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Te mandamos un email para confirmar tu cuenta. Tocá el enlace y volvés directo a la Tertulia,
            con tu sesión iniciada, listo para escribir. Si no lo ves en unos minutos, revisá la carpeta de spam.
          </span>
        </p>
        <div className="fo-doble" />
        <div className="fo-form-pie">
          <Link href={`/auth/login?volver=${encodeURIComponent(volver)}`} className="fo-btn">
            Ya lo confirmé · Ingresar <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
          <Link href={volver} className="fo-enlace">Seguir leyendo</Link>
        </div>
      </div>
    </div>
  );
}
