"use client";

import { useEffect } from "react";

/**
 * Avisa al servidor que alguien vio esta ficha (ver app/api/vistas/route.ts).
 *
 * No se dibuja nada. La ficha no lo incluye cuando mira el dueño de la
 * propiedad o el administrador, para que revisar el propio aviso no infle
 * el número.
 *
 * Una vez por pestaña y propiedad: al volver atrás o recargar no se vuelve
 * a pedir. El servidor igual descuenta repeticiones por IP durante el día,
 * así que si el navegador no deja guardar nada, el conteo no se rompe.
 */
export default function RegistrarVista({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const clave = `ei-vista-${propertyId}`;
    try {
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch {
      // Sin almacenamiento (modo privado, cookies bloqueadas): se sigue
    }

    fetch("/api/vistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: propertyId }),
      keepalive: true,
    }).catch(() => {
      // Contar una visita nunca debe romper ni demorar la página
    });
  }, [propertyId]);

  return null;
}
