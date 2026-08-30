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
  whatsappUrl,
  datos,
}: {
  precio: string;
  whatsappUrl: string | null;
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

        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 46, height: 46, borderRadius: "var(--radius-sm)",
            background: "#25D366", color: "#fff", flexShrink: 0, textDecoration: "none",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}

        <button onClick={scrollToForm} style={{
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
