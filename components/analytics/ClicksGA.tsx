"use client";

import { useEffect } from "react";
import { enviarEventoGA, type ParamsGA } from "@/lib/analytics";

/**
 * Detecta en todo el sitio los clics que importan para entender el embudo
 * (WhatsApp, llamada, mail, botones de publicar / crear cuenta / tasador,
 * compartir) y los manda a Google Analytics. Un solo listener en el
 * documento: no hay que tocar cada botón ni acordarse de sumar el evento
 * cuando se agrega uno nuevo.
 *
 * Qué se mide y cómo se llama cada evento está en lib/analytics.ts.
 *
 * Para casos que el detector no puede deducir del enlace, el elemento se
 * marca a mano:
 *   data-ga-evento="nombre"   manda ese evento al hacer clic
 *   data-ga-zona="nombre"     dice dónde está el botón (si no, se deduce)
 *   data-ga-<param>="valor"   parámetros extra del evento
 */

/** Destinos internos del embudo y el evento que genera ir hacia ellos. */
const DESTINOS: [RegExp, string][] = [
  [/^\/(propietarios\/publicar|panel\/propiedades\/nueva)(\/|$)/, "clic_publicar"],
  [/^\/auth\/registro(\/|$)/, "clic_registro"],
  [/^\/estimador(\/|$)/, "clic_tasador"],
];

/** Dónde está el elemento: lo que se marcó a mano o el bloque de la página donde cae. */
function zonaDe(el: Element): string {
  const marcada = el.closest("[data-ga-zona]")?.getAttribute("data-ga-zona");
  if (marcada) return marcada;
  if (el.closest("header")) return "menu";
  if (el.closest("footer")) return "pie";
  return "contenido";
}

/** Qué se está compartiendo, para separar fichas de notas. */
function contenidoCompartido(): string {
  const ruta = window.location.pathname;
  if (/^\/propiedades\/[^/]+\/[^/]+\/[^/]+\/[^/]+/.test(ruta)) return "ficha";
  if (ruta.startsWith("/blog/")) return "nota";
  return "pagina";
}

/** Parámetros extra declarados con data-ga-<param>. */
function paramsDe(el: HTMLElement): ParamsGA {
  const params: ParamsGA = {};
  for (const [clave, valor] of Object.entries(el.dataset)) {
    if (!clave.startsWith("ga") || clave === "gaEvento" || clave === "gaZona" || valor === undefined) continue;
    // data-ga-method → dataset.gaMethod → "method"
    params[clave.charAt(2).toLowerCase() + clave.slice(3)] = valor;
  }
  return params;
}

/** Qué evento corresponde a un enlace, o null si no es de los que se miden. */
function clasificar(url: URL): { evento: string; params?: ParamsGA } | null {
  if (url.protocol === "tel:") return { evento: "clic_telefono" };
  if (url.protocol === "mailto:") return { evento: "clic_email" };
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^(www|api|web)\./, "");

  // WhatsApp con número es escribirnos; sin número (wa.me/?text=…) es compartir
  if (host === "wa.me" || host === "whatsapp.com") {
    const conNumero = /^\/\d{6,}/.test(url.pathname) || /^\d{6,}$/.test(url.searchParams.get("phone") ?? "");
    return conNumero ? { evento: "clic_whatsapp" } : { evento: "share", params: { method: "whatsapp" } };
  }
  if (host === "facebook.com" && url.pathname.startsWith("/sharer")) {
    return { evento: "share", params: { method: "facebook" } };
  }
  if ((host === "twitter.com" || host === "x.com") && url.pathname.startsWith("/intent")) {
    return { evento: "share", params: { method: "x" } };
  }
  if (host === "linkedin.com" && url.pathname.startsWith("/sharing")) {
    return { evento: "share", params: { method: "linkedin" } };
  }

  if (url.origin === window.location.origin) {
    const destino = DESTINOS.find(([patron]) => patron.test(url.pathname));
    if (destino) return { evento: destino[1], params: { destino: url.pathname } };
  }
  return null;
}

export default function ClicksGA() {
  useEffect(() => {
    function alHacerClic(e: MouseEvent) {
      // 0 = botón principal, 1 = rueda (abre en pestaña nueva); el derecho no es un clic
      if (e.button > 1) return;
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;

      let evento: string | null = null;
      let params: ParamsGA = {};
      let origen: Element = el;

      const marcado = el.closest<HTMLElement>("[data-ga-evento]");
      if (marcado?.dataset.gaEvento) {
        evento = marcado.dataset.gaEvento;
        params = paramsDe(marcado);
        origen = marcado;
      } else {
        const enlace = el.closest<HTMLAnchorElement>("a[href]");
        if (!enlace) return;
        let url: URL;
        try {
          url = new URL(enlace.href);
        } catch {
          return;
        }
        const clasificado = clasificar(url);
        if (!clasificado) return;
        evento = clasificado.evento;
        params = clasificado.params ?? {};
        origen = enlace;
      }

      if (evento === "share") params = { content_type: contenidoCompartido(), ...params };
      enviarEventoGA(evento, { ubicacion: zonaDe(origen), ...params });
    }

    // En fase de captura: si algún componente corta la propagación del clic
    // (stopPropagation), igual se cuenta
    document.addEventListener("click", alHacerClic, true);
    document.addEventListener("auxclick", alHacerClic, true);
    return () => {
      document.removeEventListener("click", alHacerClic, true);
      document.removeEventListener("auxclick", alHacerClic, true);
    };
  }, []);

  return null;
}
