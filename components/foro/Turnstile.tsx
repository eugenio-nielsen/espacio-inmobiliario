"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opciones: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
    __foroTurnstile?: Promise<void>;
  }
}

const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!window.__foroTurnstile) {
    window.__foroTurnstile = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile"));
      document.head.appendChild(s);
    });
  }
  return window.__foroTurnstile;
}

/**
 * Antispam de Cloudflare. Casi siempre es invisible ("interaction-only"):
 * solo aparece si Cloudflare necesita que la persona haga clic.
 * El widget agrega el campo cf-turnstile-response dentro del formulario,
 * que el servidor valida (lib/foro/turnstile.ts).
 *
 * Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no se muestra nada. Cada token sirve
 * una sola vez: `reinicio` cambia después de un envío fallido para pedir
 * uno nuevo.
 */
export default function Turnstile({ reinicio = 0 }: { reinicio?: number }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITEKEY || !caja.current) return;
    let id: string | null = null;
    let vivo = true;
    cargarScript()
      .then(() => {
        if (!vivo || !caja.current || !window.turnstile) return;
        id = window.turnstile.render(caja.current, {
          sitekey: SITEKEY,
          language: "es",
          theme: "light",
          size: "flexible",
          appearance: "interaction-only",
        });
      })
      .catch(() => {});
    return () => {
      vivo = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [reinicio]);

  if (!SITEKEY) return null;
  return <div ref={caja} className="fo-turnstile" />;
}
