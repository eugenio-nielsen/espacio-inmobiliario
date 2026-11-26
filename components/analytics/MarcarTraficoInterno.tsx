"use client";

import { useEffect } from "react";
import { CLAVE_TRAFICO_INTERNO } from "@/lib/trafico-interno";

/**
 * Se monta solo en el superadmin: marca este navegador como del equipo, para
 * que Analytics separe su tráfico del de los visitantes (ver
 * lib/trafico-interno.ts). No muestra nada.
 */
export default function MarcarTraficoInterno() {
  useEffect(() => {
    try {
      window.localStorage.setItem(CLAVE_TRAFICO_INTERNO, "1");
    } catch {
      return; // sin almacenamiento no se puede recordar
    }
    window.gtag?.("set", { traffic_type: "internal" });
  }, []);
  return null;
}
