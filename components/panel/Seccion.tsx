"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Bloque plegable del panel. Cada sección (datos, propiedades, consultas)
 * se abre y cierra para que el usuario vea de a una cosa por vez.
 */
export default function Seccion({
  icono,
  titulo,
  resumen,
  insignia,
  abiertaPorDefecto = false,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  resumen?: string;
  insignia?: number;
  abiertaPorDefecto?: boolean;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto);

  return (
    <section style={{
      background: "#fff",
      border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden",
      marginBottom: 14,
    }}>
      <button
        type="button"
        onClick={() => setAbierta(a => !a)}
        aria-expanded={abierta}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: "var(--radius-sm)", flexShrink: 0,
          background: "var(--navy-50)", color: "var(--navy-700)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icono}
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
            color: "var(--navy-800)",
          }}>
            {titulo}
            {!!insignia && insignia > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                background: "#EFF6FF", color: "#1D4ED8",
              }}>
                {insignia}
              </span>
            )}
          </span>
          {resumen && (
            <span style={{
              display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5,
              color: "var(--ink-500)", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {resumen}
            </span>
          )}
        </span>

        <ChevronDown
          size={18}
          strokeWidth={2}
          color="var(--ink-400)"
          style={{
            flexShrink: 0,
            transform: abierta ? "rotate(180deg)" : "none",
            transition: "transform .22s var(--ease-out)",
          }}
        />
      </button>

      {abierta && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--line-100)" }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </section>
  );
}
