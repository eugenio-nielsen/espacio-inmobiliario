"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Manda un evento a Google Analytics una sola vez, al montarse.
 *
 * Se usa en la página a la que llega una acción ya hecha (la cuenta
 * creada, la propiedad publicada), que es el único lugar donde se sabe
 * que salió bien. Después borra de la URL los parámetros que la
 * marcaron (?bienvenida=1, ?creada=1): si la página se recarga o se
 * comparte, el evento no se cuenta dos veces.
 *
 * El script de GA carga "afterInteractive" y puede llegar después que
 * este efecto: si gtag todavía no existe, el evento queda en la cola de
 * dataLayer con el mismo formato que usa gtag, y se envía al cargar.
 */
export default function EventoGA({
  nombre,
  params,
  limpiar = [],
}: {
  nombre: string;
  params?: Record<string, string | number>;
  /** Parámetros de la URL que se sacan después de enviar el evento. */
  limpiar?: string[];
}) {
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;

    window.dataLayer = window.dataLayer || [];
    const gtag =
      window.gtag ??
      function () {
        // gtag encola el objeto `arguments`, no un array: se respeta
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
    gtag("event", nombre, params ?? {});

    if (limpiar.length) {
      const url = new URL(window.location.href);
      limpiar.forEach(p => url.searchParams.delete(p));
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, [nombre, params, limpiar]);

  return null;
}
