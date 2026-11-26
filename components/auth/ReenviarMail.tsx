"use client";

import { useEffect, useState, useTransition } from "react";
import { reenviarConfirmacion } from "@/lib/actions/auth";
import { enviarEventoGA } from "@/lib/analytics";

/** Supabase deja pedir un mail por minuto a cada cuenta: el botón espera lo mismo. */
const ESPERA_SEGUNDOS = 60;

type Variante = "tarjeta" | "papel";

interface Props {
  email: string;
  /** "publicar" si el alta venía de las páginas para propietarios; define a dónde lleva el enlace. */
  destino?: string;
  /** Desde dónde se pide, para medir si los mails no llegan: "alta" o "login". */
  origen: "alta" | "login";
  /** Segundos que el botón espera antes de dejar pedir otro (si el mail salió recién). */
  esperaInicial?: number;
  variante: Variante;
}

/** `tarjeta`: las pantallas de ingreso y registro (Tailwind). `papel`: la ficha de /propietarios. */
const CLASES: Record<Variante, { caja: string; boton: string; estado: string }> = {
  tarjeta: {
    caja: "flex flex-wrap items-center gap-x-4 gap-y-2",
    boton:
      "rounded-lg border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-default disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent",
    estado: "text-xs text-gray-500 data-[tipo=ok]:text-green-700 data-[tipo=error]:text-red-700",
  },
  papel: { caja: "pr-reenvio", boton: "", estado: "pr-reenvio-estado" },
};

/**
 * Botón para que te mandemos de nuevo el mail de confirmación.
 * Espera un minuto entre pedidos y cuenta cuánto falta.
 */
export default function ReenviarMail({ email, destino, origen, esperaInicial = 0, variante }: Props) {
  const [faltan, setFaltan] = useState(esperaInicial);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enviando, startTransition] = useTransition();
  const clases = CLASES[variante];

  useEffect(() => {
    if (faltan <= 0) return;
    const t = setTimeout(() => setFaltan(f => f - 1), 1000);
    return () => clearTimeout(t);
  }, [faltan]);

  function reenviar() {
    setMensaje(null);
    const datos = new FormData();
    datos.set("email", email);
    if (destino) datos.set("destino", destino);

    startTransition(async () => {
      const r = await reenviarConfirmacion(datos);
      if (r && "error" in r) {
        setMensaje({ tipo: "error", texto: r.error });
        return;
      }
      enviarEventoGA("reenvio_confirmacion", { origen });
      setMensaje({ tipo: "ok", texto: "Listo, te lo mandamos de nuevo. Puede tardar unos minutos." });
      setFaltan(ESPERA_SEGUNDOS);
    });
  }

  const texto = mensaje?.texto ?? (faltan > 0 ? `Podés pedir otro en ${faltan} s.` : "");

  return (
    <div className={clases.caja}>
      <button
        type="button"
        onClick={reenviar}
        disabled={enviando || faltan > 0}
        className={clases.boton || undefined}
      >
        {enviando ? "Enviando…" : "Reenviar el mail"}
      </button>
      <span role="status" aria-live="polite" data-tipo={mensaje?.tipo} className={clases.estado}>
        {texto}
      </span>
    </div>
  );
}
