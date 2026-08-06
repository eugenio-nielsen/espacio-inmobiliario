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

/** Tarjeta de propiedad en carga — imita a PropertyListCard. */
export function SkeletonPropertyCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--line-200)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <SkeletonBox height={220} radius="0" />
      <div style={{ padding: "14px 16px 16px" }}>
        <SkeletonBox height={15} width="88%" style={{ marginBottom: 8 }} />
        <SkeletonBox height={15} width="60%" style={{ marginBottom: 14 }} />
        <SkeletonBox height={13} width="45%" style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 14, borderTop: "1px solid var(--line-100)", paddingTop: 12 }}>
          <SkeletonBox height={13} width={58} />
          <SkeletonBox height={13} width={58} />
          <SkeletonBox height={13} width={58} />
        </div>
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
