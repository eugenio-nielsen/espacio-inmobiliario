"use client";

import { useRouter } from "next/navigation";

interface Props {
  current: Record<string, string | undefined>;
}

export default function SortSelect({ current }: Props) {
  const router = useRouter();

  function handleChange(orden: string) {
    const params = new URLSearchParams();
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (orden) params.set("orden", orden);
    else params.delete("orden");
    params.delete("pagina"); // volver a la página 1 al reordenar
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <div style={{ position: "relative" }}>
      <select
        value={current.orden || ""}
        onChange={e => handleChange(e.target.value)}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 13.5,
          background: "#fff", border: "1.5px solid var(--line-200)",
          borderRadius: "var(--radius-sm)", padding: "9px 30px 9px 12px",
          appearance: "none", cursor: "pointer",
        }}
      >
        <option value="">Ordenar: más recientes</option>
        <option value="precio_asc">Precio: menor a mayor</option>
        <option value="precio_desc">Precio: mayor a menor</option>
      </select>
      <span style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none", color: "var(--ink-500)", fontSize: 11 }}>▾</span>
    </div>
  );
}
