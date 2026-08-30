import { portadaDe, TONOS } from "@/lib/blog/portada";

/**
 * Portada de una nota: ícono grande sobre un fondo de la paleta.
 * Reemplaza a la foto de stock — misma pieza en la tarjeta del
 * listado y en el encabezado de la nota, con distinto tamaño.
 */
export default function PortadaNota({
  post,
  tamano = "card",
}: {
  post: { slug: string; titulo: string; categoria?: string | null };
  tamano?: "card" | "hero";
}) {
  const { icono: Icono, tono } = portadaDe(post);
  const t = TONOS[tono];
  const hero = tamano === "hero";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: t.fondo,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Trama diagonal sutil, para que el fondo no quede plano */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, ${t.trama} 0 1px, transparent 1px 14px)`,
        }}
      />

      {/* Halo detrás del ícono */}
      <div
        style={{
          position: "absolute",
          width: hero ? 260 : 150,
          height: hero ? 260 : 150,
          borderRadius: 999,
          background: `radial-gradient(circle, ${t.halo} 0%, transparent 70%)`,
        }}
      />

      <Icono
        size={hero ? 88 : 52}
        strokeWidth={1.1}
        color={t.icono}
        style={{ position: "relative" }}
      />
    </div>
  );
}
