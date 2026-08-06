"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const CLAVE_BUSQUEDA = "ultimaBusqueda";

/**
 * Guarda la búsqueda actual (ruta + filtros) para que la ficha de propiedad
 * pueda ofrecer "Volver a los resultados" sin perderlos.
 *
 * No se usa document.referrer porque con navegación client-side (<Link>)
 * el navegador no lo actualiza.
 */
export default function RecordarBusqueda() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    sessionStorage.setItem(CLAVE_BUSQUEDA, pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);

  return null;
}
