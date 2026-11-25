"use client";

import { useState } from "react";
import { BedDouble, Bath, Ruler, LayoutGrid, ChevronUp, Banknote } from "lucide-react";

export type DatosBarra = {
  precioPorM2: string | null;
  ambientes?: number | null;
  dormitorios?: number | null;
  banos?: number | null;
  superficieTotal?: number | null;
};

/**
 * Barra fija inferior de la ficha (solo mobile: en desktop esta
 * información vive en la sidebar).
 *
 * Muestra siempre el precio y un resumen de una línea, y se despliega
 * hacia arriba con el detalle completo para no tener que volver a
 * subir la página a buscarlo.
 */
export default function StickyPropertyBar({
  precio,
  datos,
}: {
  precio: string;
  datos: DatosBarra;
}) {
  const [abierta, setAbierta] = useState(false);

  function scrollToForm() {
    setAbierta(false);
    document.getElementById("consultar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const items = [
    { icono: <Banknote size={14} />,   label: "Precio por m²", valor: datos.precioPorM2 },
    { icono: <LayoutGrid size={14} />, label: "Ambientes",     valor: datos.ambientes ? String(datos.ambientes) : null },
    { icono: <BedDouble size={14} />,  label: "Dormitorios",   valor: datos.dormitorios ? String(datos.dormitorios) : null },
    { icono: <Bath size={14} />,       label: "Baños",         valor: datos.banos ? String(datos.banos) : null },
    { icono: <Ruler size={14} />,      label: "Superficie",    valor: datos.superficieTotal ? `${datos.superficieTotal} m²` : null },
  ].filter(i => i.valor);

  // Resumen de una línea, para que se vea algo sin desplegar nada
  const resumen = [
    datos.ambientes ? `${datos.ambientes} amb` : null,
    datos.dormitorios ? `${datos.dormitorios} dorm` : null,
    datos.banos ? `${datos.banos} ${datos.banos === 1 ? "baño" : "baños"}` : null,
    datos.superficieTotal ? `${datos.superficieTotal} m²` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="property-sticky-wrap">
      {/* Detalle desplegable */}
      {abierta && items.length > 0 && (
        <div className="property-sticky-detalle">
          <div className="property-sticky-grid">
            {items.map(i => (
              <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "var(--radius-xs)", flexShrink: 0,
                  background: "var(--navy-50)", color: "var(--navy-700)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i.icono}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{
                    display: "block", fontFamily: "var(--font-sans)", fontSize: 10.5,
                    color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".05em",
                  }}>
                    {i.label}
                  </span>
                  <span style={{
                    display: "block", fontFamily: "var(--font-sans)", fontWeight: 700,
                    fontSize: 14, color: "var(--navy-800)", whiteSpace: "nowrap",
                  }}>
                    {i.valor}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="property-sticky-bar">
        <button
          type="button"
          onClick={() => setAbierta(a => !a)}
          aria-expanded={abierta}
          aria-label={abierta ? "Ocultar detalle" : "Ver detalle de la propiedad"}
          disabled={items.length === 0}
          style={{
            flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", padding: 0,
            cursor: items.length ? "pointer" : "default", textAlign: "left",
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: "block", fontFamily: "var(--font-sans)", fontWeight: 700,
              fontSize: 18, color: "var(--gold-700)", lineHeight: 1.1, whiteSpace: "nowrap",
            }}>
              {precio}
            </span>
            <span style={{
              display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5,
              color: "var(--ink-500)", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {resumen || "Ver detalle"}
            </span>
          </span>

          {items.length > 0 && (
            <ChevronUp
              size={16}
              strokeWidth={2.5}
              color="var(--ink-400)"
              style={{
                flexShrink: 0,
                transform: abierta ? "rotate(180deg)" : "none",
                transition: "transform .22s var(--ease-out)",
              }}
            />
          )}
        </button>

        <button onClick={scrollToForm} data-ga-evento="clic_consultar" data-ga-zona="barra_ficha" style={{
          flexShrink: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5,
          background: "var(--navy-800)", color: "#fff", border: "none",
          padding: "12px 22px", borderRadius: "var(--radius-sm)", cursor: "pointer",
        }}>
          Consultar
        </button>
      </div>
    </div>
  );
}
