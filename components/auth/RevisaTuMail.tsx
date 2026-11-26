"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MailCheck } from "lucide-react";
import EventoGA from "@/components/analytics/EventoGA";
import ReenviarMail from "./ReenviarMail";

interface Props {
  email: string;
  /** "publicar" si el alta venía de las páginas para propietarios. */
  destino?: string;
  /** Página donde se creó la cuenta, para medir de dónde vienen las altas. */
  pagina: string;
  /** `tarjeta`: las pantallas de ingreso y registro. `papel`: la ficha de /propietarios. */
  variante: "tarjeta" | "papel";
  /** La persona se equivocó de email: vuelve al formulario con lo que ya cargó. */
  onCorregir: () => void;
}

/**
 * El paso que sigue a crear la cuenta: Supabase tiene activada la
 * confirmación de email, así que todavía no hay sesión y hay que decirle a
 * la persona que revise su mail. Reemplaza al formulario en el mismo lugar.
 *
 * Es también el momento en que se cuenta el alta (sign_up): la cuenta ya
 * existe aunque nunca confirme. La confirmación se mide aparte, cuando entra
 * por el enlace (cuenta_confirmada).
 */
export default function RevisaTuMail({ email, destino, pagina, variante, onCorregir }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);

  // El formulario desaparece: el foco pasa al aviso para que lo lea un lector de pantalla
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  const sigue = destino === "publicar" ? "seguí con la carga de tu propiedad" : "entrá a tu panel";
  // Si ya lo confirmó (en otra pestaña o dispositivo), ingresa y sigue donde iba
  const ingresar = destino === "publicar"
    ? `/auth/login?volver=${encodeURIComponent("/panel/propiedades/nueva")}`
    : "/auth/login";

  const evento = (
    <EventoGA nombre="sign_up" params={{ method: "email", pagina_origen: pagina, confirmacion: "pendiente" }} />
  );

  if (variante === "papel") {
    return (
      <div className="pr-alta" id="registro">
        {evento}
        <header className="pr-alta-cab">
          <span className="pr-alta-k">Falta un paso</span>
          <h2 className="pr-alta-t" ref={titulo} tabIndex={-1} style={{ outline: "none" }}>
            Revisá <em>tu mail</em>
          </h2>
          <p className="pr-alta-sub">Te mandamos un enlace para confirmar tu cuenta.</p>
        </header>
        <div className="pr-doble" aria-hidden="true" />

        <div className="pr-aviso">
          <MailCheck size={22} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p>
              Lo enviamos a <strong>{email}</strong>. Tocá el enlace y {sigue}.
            </p>
            <p>Puede tardar unos minutos. Si no lo ves, revisá spam y promociones.</p>
          </div>
        </div>

        <ReenviarMail email={email} destino={destino} origen="alta" esperaInicial={60} variante="papel" />

        <p className="pr-ya">
          <Link href={ingresar}>Ya lo confirmé: ingresar</Link>
          {" · "}
          <button type="button" onClick={onCorregir}>Usé otro email</button>
        </p>
      </div>
    );
  }

  return (
    <div>
      {evento}
      <div className="flex items-center gap-3 mb-3">
        <MailCheck size={28} strokeWidth={1.6} className="text-blue-700 shrink-0" aria-hidden="true" />
        <h1 ref={titulo} tabIndex={-1} className="text-2xl font-bold text-gray-800 outline-none">
          Revisá tu mail
        </h1>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        Te mandamos un enlace a <strong className="font-semibold text-gray-800 break-all">{email}</strong> para
        confirmar tu cuenta. Tocalo y {sigue}.
      </p>
      <p className="text-xs text-gray-500 mb-5">Puede tardar unos minutos. Si no lo ves, revisá spam y promociones.</p>

      <ReenviarMail email={email} destino={destino} origen="alta" esperaInicial={60} variante="tarjeta" />

      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap justify-between gap-x-4 gap-y-2 text-sm">
        <Link href={ingresar} className="text-blue-600 hover:underline font-medium">
          Ya lo confirmé: ingresar
        </Link>
        <button type="button" onClick={onCorregir} className="text-blue-600 hover:underline font-medium">
          Usé otro email
        </button>
      </div>
    </div>
  );
}
