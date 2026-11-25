"use client";

import { useEffect, useRef } from "react";
import { enviarEventoGA, type ParamsGA } from "@/lib/analytics";

/**
 * Manda un evento a Google Analytics una sola vez, al montarse.
 *
 * Se usa en la página a la que llega una acción ya hecha (la cuenta
 * creada, la propiedad publicada), que es el único lugar donde se sabe
 * que salió bien. Después borra de la URL los parámetros que la
 * marcaron (?bienvenida=1, ?creada=1): si la página se recarga o se
 * comparte, el evento no se cuenta dos veces.
 *
 * Cómo se manda (y qué pasa si el script de GA todavía no cargó) está
 * en enviarEventoGA, en lib/analytics.ts.
 */
export default function EventoGA({
  nombre,
  params,
  limpiar = [],
}: {
  nombre: string;
  params?: ParamsGA;
  /** Parámetros de la URL que se sacan después de enviar el evento. */
  limpiar?: string[];
}) {
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;

    enviarEventoGA(nombre, params);

    if (limpiar.length) {
      const url = new URL(window.location.href);
      limpiar.forEach(p => url.searchParams.delete(p));
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, [nombre, params, limpiar]);

  return null;
}
