"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeSearch() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [operacion, setOperacion] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (operacion) params.set("operacion", operacion);
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3">
      <select
        value={tipo}
        onChange={e => setTipo(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tipo de propiedad</option>
        <option value="casa">Casa</option>
        <option value="departamento">Departamento</option>
        <option value="terreno">Terreno</option>
        <option value="local">Local</option>
        <option value="oficina">Oficina</option>
      </select>
      <select
        value={operacion}
        onChange={e => setOperacion(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Operación</option>
        <option value="venta">Venta</option>
        <option value="alquiler">Alquiler</option>
      </select>
      <button
        onClick={handleSearch}
        className="bg-blue-600 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
      >
        Buscar
      </button>
    </div>
  );
}
