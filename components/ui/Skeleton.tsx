/**
 * Bloques de carga (skeletons) para los loading.tsx del App Router.
 * Se muestran mientras Next resuelve los datos del servidor: la navegación
 * se siente inmediata en lugar de dejar la pantalla anterior congelada.
 */

export function SkeletonBox({
  height,
  width = "100%",
  radius = "var(--radius-sm)",
  style,
}: {
  height: number | string;
  width?: number | string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className="skeleton-shimmer"
      style={{ display: "block", height, width, borderRadius: radius, ...style }}
    />
  );
}

/** Tarjeta de propiedad en carga — imita a TarjetaPropiedad (foto 3:2,
 *  rótulo, título, precio, libro de datos y pie). */
export function SkeletonPropertyCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 6,
        border: "1px solid var(--line-200)",
        overflow: "hidden",
      }}
    >
      <SkeletonBox height="auto" radius="0" style={{ aspectRatio: "3 / 2" }} />
      <div style={{ padding: "16px 20px 0" }}>
        <SkeletonBox height={10} width="42%" style={{ marginBottom: 12 }} />
        <SkeletonBox height={17} width="92%" style={{ marginBottom: 7 }} />
        <SkeletonBox height={17} width="64%" style={{ marginBottom: 16 }} />
        <SkeletonBox height={24} width="46%" style={{ marginBottom: 16 }} />
      </div>
      <div style={{ display: "flex", gap: 18, padding: "12px 20px", borderTop: "1px solid var(--line-200)", borderBottom: "1px solid var(--line-200)" }}>
        <SkeletonBox height={28} width={52} />
        <SkeletonBox height={28} width={40} />
        <SkeletonBox height={28} width={40} />
      </div>
      <div style={{ padding: "13px 20px" }}>
        <SkeletonBox height={10} width="55%" />
      </div>
    </div>
  );
}

/** Grilla de tarjetas en carga. */
export function SkeletonPropertyGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid-properties">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPropertyCard key={i} />
      ))}
    </div>
  );
}
