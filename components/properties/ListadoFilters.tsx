"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
  "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén",
  "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

interface Props {
  current: {
    tipo?: string; operacion?: string; provincia?: string;
    dormitorios?: string; precio_min?: string; precio_max?: string;
  };
}

export default function ListadoFilters({ current }: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    tipo: current.tipo || "",
    operacion: current.operacion || "",
    provincia: current.provincia || "",
    dormitorios: current.dormitorios || "",
    precio_min: current.precio_min || "",
    precio_max: current.precio_max || "",
  });

  function apply() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/propiedades?${params.toString()}`);
  }

  function reset() {
    setFilters({ tipo: "", operacion: "", provincia: "", dormitorios: "", precio_min: "", precio_max: "" });
    router.push("/propiedades");
  }

  const hasFilters = Object.values(filters).some(Boolean);

  const sel = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const inp = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <select className={sel} value={filters.tipo} onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}>
          <option value="">Tipo</option>
          <option value="casa">Casa</option>
          <option value="departamento">Departamento</option>
          <option value="terreno">Terreno</option>
          <option value="local">Local</option>
          <option value="oficina">Oficina</option>
        </select>

        <select className={sel} value={filters.operacion} onChange={e => setFilters(f => ({ ...f, operacion: e.target.value }))}>
          <option value="">Operación</option>
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
        </select>

        <select className={sel} value={filters.provincia} onChange={e => setFilters(f => ({ ...f, provincia: e.target.value }))}>
          <option value="">Provincia</option>
          {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select className={sel} value={filters.dormitorios} onChange={e => setFilters(f => ({ ...f, dormitorios: e.target.value }))}>
          <option value="">Dormitorios</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>

        <input className={inp} type="number" placeholder="Precio mín (USD)" value={filters.precio_min}
          onChange={e => setFilters(f => ({ ...f, precio_min: e.target.value }))} />

        <input className={inp} type="number" placeholder="Precio máx (USD)" value={filters.precio_max}
          onChange={e => setFilters(f => ({ ...f, precio_max: e.target.value }))} />
      </div>

      <div className="flex gap-2 mt-3 justify-end">
        {hasFilters && (
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
            Limpiar filtros
          </button>
        )}
        <button onClick={apply} className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          Buscar
        </button>
      </div>
    </div>
  );
}
