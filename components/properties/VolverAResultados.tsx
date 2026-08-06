"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CLAVE_BUSQUEDA } from "./RecordarBusqueda";

/**
 * "Volver a los resultados": vuelve al último listado que vio el usuario,
 * conservando sus filtros. Si entró directo (Google, link compartido),
 * ofrece el listado general.
 */
export default function VolverAResultados() {
  const [busqueda, setBusqueda] = useState<string | null>(null);

  useEffect(() => {
    const guardada = sessionStorage.getItem(CLAVE_BUSQUEDA);
    if (guardada?.startsWith("/")) setBusqueda(guardada);
  }, []);

  const estilo: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 500,
    color: "var(--ink-600)", textDecoration: "none",
  };

  return (
    <Link href={busqueda ?? "/propiedades"} style={estilo}>
      <ArrowLeft size={15} strokeWidth={2} color="var(--gold-600)" />
      {busqueda ? "Volver a los resultados" : "Ver todas las propiedades"}
    </Link>
  );
}
