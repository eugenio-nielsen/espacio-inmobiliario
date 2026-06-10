"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const PROVINCIAS = ["Ciudad Autónoma de Buenos Aires", "Provincia de Buenos Aires"];

interface Props {
  current: {
    tipo?: string; operacion?: string; provincia?: string;
    dormitorios?: string; precio_min?: string; precio_max?: string;
    apto_credito?: string; orden?: string; q?: string;
  };
}

export default function ListadoFilters({ current }: Props) {
  const router = useRouter();
  const [f, setF] = useState({
    q:          current.q          || "",
    tipo:       current.tipo       || "",
    operacion:  current.operacion  || "",
    provincia:  current.provincia  || "",
    dormitorios:current.dormitorios|| "",
    precio_max: current.precio_max || "",
    apto_credito: current.apto_credito || "",
  });

  function apply() {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v.trim()) params.set(k, v.trim()); });
    if (current.orden) params.set("orden", current.orden);
    router.push(`/propiedades?${params.toString()}`);
  }

  const sel: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-800)",
    background: "#fff", border: "1.5px solid var(--line-200)",
    borderRadius: "var(--radius-sm)", padding: "10px 12px",
    appearance: "none" as const, cursor: "pointer", width: "100%",
  };

  return (
    <div className="grid-filters">
      {/* Tipo */}
      <div style={{ position: "relative" }}>
        <select style={sel} value={f.tipo} onChange={e => setF(p => ({ ...p, tipo: e.target.value }))}>
          <option value="">Tipo: Todos</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="terreno">Terreno</option>
          <option value="local">Local</option>
          <option value="oficina">Oficina</option>
        </select>
        <Chevron />
      </div>

      {/* Barrio o zona — búsqueda por texto */}
      <input
        type="text"
        value={f.q}
        onChange={e => setF(p => ({ ...p, q: e.target.value }))}
        onKeyDown={e => e.key === "Enter" && apply()}
        placeholder="Barrio, zona o dirección"
        style={{ ...sel, cursor: "text" }}
      />

      {/* Zona */}
      <div style={{ position: "relative" }}>
        <select style={sel} value={f.provincia} onChange={e => setF(p => ({ ...p, provincia: e.target.value }))}>
          <option value="">Zona: Todas</option>
          {PROVINCIAS.map(p => <option key={p} value={p}>{p === "Ciudad Autónoma de Buenos Aires" ? "CABA" : "Pcia. Bs. As."}</option>)}
        </select>
        <Chevron />
      </div>

      {/* Dormitorios */}
      <div style={{ position: "relative" }}>
        <select style={sel} value={f.dormitorios} onChange={e => setF(p => ({ ...p, dormitorios: e.target.value }))}>
          <option value="">Dormitorios: Todos</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
        <Chevron />
      </div>

      {/* Precio */}
      <div style={{ position: "relative" }}>
        <select style={sel} value={f.precio_max} onChange={e => setF(p => ({ ...p, precio_max: e.target.value }))}>
          <option value="">Precio: Todos</option>
          <option value="50000">hasta USD 50k</option>
          <option value="100000">hasta USD 100k</option>
          <option value="200000">hasta USD 200k</option>
          <option value="500000">hasta USD 500k</option>
        </select>
        <Chevron />
      </div>

      {/* Botón */}
      <button
        onClick={apply}
        className="esbtn esbtn-primary"
        style={{
          fontFamily: "var(--font-sans)", fontWeight: 600,
          borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          justifyContent: "center", gap: 8, fontSize: 13,
          padding: "10px 16px", background: "var(--navy-800)", color: "#fff",
          transition: "all var(--dur) var(--ease-out)", whiteSpace: "nowrap",
        }}
      >
        <SlidersHorizontal size={15} strokeWidth={2} />
        Filtrar
      </button>

      {/* Apto crédito — fila completa debajo */}
      <label className="filters-apto" style={{
        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-600)",
        userSelect: "none",
      }}>
        <input
          type="checkbox"
          checked={f.apto_credito === "1"}
          onChange={e => setF(p => ({ ...p, apto_credito: e.target.checked ? "1" : "" }))}
          style={{ width: 16, height: 16, accentColor: "var(--navy-800)", cursor: "pointer" }}
        />
        Solo apto crédito hipotecario
      </label>
    </div>
  );
}

function Chevron() {
  return (
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-500)", fontSize: 11 }}>▾</span>
  );
}
