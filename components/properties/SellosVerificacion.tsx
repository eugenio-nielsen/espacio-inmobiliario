import { BadgeCheck, FileCheck2 } from "lucide-react";

/**
 * Sellos de confianza de la ficha.
 *
 * Son dos cosas distintas y conviene que se lean así:
 *   · Propietario verificado → validamos la identidad de la persona.
 *   · Dominio verificado     → validamos la escritura DE ESTA propiedad.
 *
 * Solo se muestran cuando la validación está aprobada a mano.
 */

const VERDE = { bg: "#F0FDF4", color: "#15803D", borde: "#BBF7D0" };

export function SelloPropietario({ compacto = false }: { compacto?: boolean }) {
  return (
    <span
      title="Validamos la identidad de esta persona con su documento."
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontFamily: "var(--font-sans)", fontWeight: 700,
        fontSize: compacto ? 10.5 : 11.5,
        padding: compacto ? "2px 7px" : "3px 9px", borderRadius: 999,
        background: VERDE.bg, color: VERDE.color, border: `1px solid ${VERDE.borde}`,
        whiteSpace: "nowrap",
      }}
    >
      <BadgeCheck size={compacto ? 11 : 12} strokeWidth={2.2} />
      Propietario verificado
    </span>
  );
}

export function SelloDominio() {
  return (
    <div
      title="Vimos la escritura de esta propiedad a nombre de quien publica."
      style={{
        display: "flex", alignItems: "flex-start", gap: 9,
        padding: "10px 12px", borderRadius: "var(--radius-sm)",
        background: VERDE.bg, border: `1px solid ${VERDE.borde}`,
        marginBottom: 18,
      }}
    >
      <FileCheck2 size={16} strokeWidth={2} color={VERDE.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{
          display: "block", fontFamily: "var(--font-sans)", fontWeight: 700,
          fontSize: 12.5, color: VERDE.color,
        }}>
          Dominio verificado
        </span>
        <span style={{
          display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5,
          color: "var(--ink-600)", marginTop: 1, lineHeight: 1.4,
        }}>
          Comprobamos la escritura a nombre de quien publica.
        </span>
      </span>
    </div>
  );
}
