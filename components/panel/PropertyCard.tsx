"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteProperty } from "@/lib/actions/properties";
import type { Property } from "@/lib/types";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
};

interface Props {
  property: Property;
  statusLabel: string;
  statusColor: string;
}

export default function PropertyCard({ property: p, statusLabel, statusColor }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => { await deleteProperty(p.id); });
  }

  const precio = new Intl.NumberFormat("es-AR").format(p.precio);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row overflow-hidden">
      {/* Foto */}
      <div className="relative w-full sm:w-48 h-40 sm:h-auto bg-gray-100 shrink-0">
        {p.fotos?.[0] ? (
          <Image
            src={p.fotos[0]}
            alt={p.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 192px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-4xl">
            🏠
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col sm:flex-row justify-between p-4 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
            <span className="text-xs text-gray-400">
              {TIPO_LABEL[p.tipo]} · Venta
            </span>
          </div>
          <h2 className="font-semibold text-gray-800 truncate">{p.titulo}</h2>
          <p className="text-sm text-gray-500 truncate">
            {p.ciudad}, {p.provincia}
          </p>
          <p className="text-blue-700 font-bold mt-1">
            {p.moneda} {precio}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex sm:flex-col gap-2 items-start sm:items-end justify-start sm:justify-center shrink-0">
          <a
            href={`/propiedades/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            Ver publicación
          </a>
          <a
            href={`/panel/propiedades/${p.slug}/editar`}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            Editar
          </a>
          {confirming ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs border border-red-100 rounded-lg px-3 py-1.5 text-red-400 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
