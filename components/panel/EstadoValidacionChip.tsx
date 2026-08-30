import type { EstadoValidacion } from "@/lib/types";

const ESTILOS: Record<EstadoValidacion, { label: string; bg: string; color: string; borde: string }> = {
  sin_enviar: { label: "Sin enviar", bg: "var(--fill-100)", color: "var(--ink-500)", borde: "var(--line-200)" },
  pendiente:  { label: "En revisión", bg: "#FFFBEB", color: "#B45309", borde: "#FDE68A" },
  aprobada:   { label: "Aprobada",    bg: "#F0FDF4", color: "#15803D", borde: "#BBF7D0" },
  rechazada:  { label: "Rechazada",   bg: "#FEF2F2", color: "#B91C1C", borde: "#FECACA" },
};

export default function EstadoValidacionChip({ estado }: { estado: EstadoValidacion }) {
  const e = ESTILOS[estado];
  return (
    <span style={{
      flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700,
      padding: "3px 9px", borderRadius: 999,
      background: e.bg, color: e.color, border: `1px solid ${e.borde}`,
    }}>
      {e.label}
    </span>
  );
}
