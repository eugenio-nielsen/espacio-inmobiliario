"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HomeSearch() {
  const router = useRouter();
  const [operacion, setOperacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [zona, setZona] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (operacion) params.set("operacion", operacion);
    if (tipo)      params.set("tipo", tipo);
    if (zona)      params.set("q", zona);
    router.push(`/propiedades?${params.toString()}`);
  }

  const fieldLabel: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 9.5,
    textTransform: "uppercase", letterSpacing: ".1em",
    color: "var(--ink-400)", marginBottom: 4, display: "block",
  };
  const fieldValue: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14,
    color: "var(--ink-800)", background: "transparent",
    border: "none", outline: "none", width: "100%", padding: 0,
  };

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto", background: "#fff",
      borderRadius: "var(--radius-md)", padding: 10,
      display: "flex", gap: 8, boxShadow: "var(--shadow-lg)",
    }}>
      {/* Operación — solo venta */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 14px" }}>
        <span style={fieldLabel}>Operación</span>
        <span style={{ ...fieldValue, color: "var(--ink-600)" }}>Venta</span>
        <input type="hidden" value="venta" />
      </div>

      {/* Tipo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 14px", borderLeft: "1px solid var(--line-100)" }}>
        <span style={fieldLabel}>Tipo</span>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={fieldValue}>
          <option value="">Todos</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="terreno">Terreno</option>
          <option value="local">Local</option>
          <option value="oficina">Oficina</option>
        </select>
      </div>

      {/* Zona */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 14px", borderLeft: "1px solid var(--line-100)" }}>
        <span style={fieldLabel}>Zona o barrio</span>
        <input
          value={zona}
          onChange={e => setZona(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Palermo, San Isidro…"
          style={fieldValue}
        />
      </div>

      {/* Buscar */}
      <button
        onClick={handleSearch}
        className="esbtn esbtn-gold"
        style={{
          fontFamily: "var(--font-sans)", fontWeight: 600,
          borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          gap: 8, fontSize: 14.5, padding: "13px 22px",
          background: "var(--gold-500)", color: "#26200f",
          transition: "all var(--dur) var(--ease-out)", whiteSpace: "nowrap",
        }}
      >
        <Search size={16} strokeWidth={2} />
        Buscar
      </button>
    </div>
  );
}
