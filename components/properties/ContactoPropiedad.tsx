"use client";

import { useState } from "react";
import AgendarVisita from "@/components/properties/AgendarVisita";
import InquiryForm from "@/components/properties/InquiryForm";
import type { DiaConSlots } from "@/lib/utils/agenda";

/**
 * Bloque de contacto de la ficha.
 *
 * Si el dueño tiene agenda activa, la visita es el camino principal y la
 * consulta común queda a un clic. Si no configuró disponibilidad, se
 * muestra el formulario de siempre sin cambios.
 */
export default function ContactoPropiedad({
  propertyId,
  dias,
}: {
  propertyId: string;
  dias: DiaConSlots[];
}) {
  const hayAgenda = dias.length > 0;
  const [modo, setModo] = useState<"agenda" | "consulta">(hayAgenda ? "agenda" : "consulta");

  if (!hayAgenda) return <InquiryForm propertyId={propertyId} />;

  return (
    <div id="visitas">
      {modo === "agenda"
        ? <AgendarVisita propertyId={propertyId} dias={dias} />
        : <InquiryForm propertyId={propertyId} />}

      <button
        type="button"
        onClick={() => setModo(m => (m === "agenda" ? "consulta" : "agenda"))}
        style={{
          display: "block", width: "100%", marginTop: 12, padding: "8px 0",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
          color: "var(--ink-500)", textDecoration: "underline",
          textUnderlineOffset: 3, textDecorationColor: "var(--line-200)",
        }}
      >
        {modo === "agenda"
          ? "Prefiero hacer una consulta sin agendar"
          : "Volver a elegir un horario de visita"}
      </button>
    </div>
  );
}
