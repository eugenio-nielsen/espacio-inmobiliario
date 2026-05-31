import Image from "next/image";
import type { Property } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

export default function PropertyListCard({ property: p }: { property: Property }) {
  const precio = new Intl.NumberFormat("es-AR").format(p.precio);

  return (
    <a
      href={buildPropertyUrl(p)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-[#0E2C50]/20 transition-all"
    >
      <div className="relative h-48 bg-gray-100">
        {p.fotos?.[0] ? (
          <Image
            src={p.fotos[0]}
            alt={p.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-5xl">🏠</div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 text-[#0E2C50] text-xs font-semibold px-2 py-1 rounded-full">
          {TIPO_LABEL[p.tipo]}
        </span>
        <span className="absolute top-3 right-3 text-white text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#b99f66" }}>
          {p.operacion === "venta" ? "Venta" : "Alquiler"}
        </span>
      </div>

      <div className="p-4">
        <h2 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug mb-1">{p.titulo}</h2>
        <p className="text-xs text-gray-400 mb-3">
          📍 {p.barrio ? `${p.barrio}, ` : ""}{p.ciudad || p.provincia}
        </p>
        {(p.dormitorios || p.banos || p.superficie_total) && (
          <div className="flex gap-3 text-xs text-gray-500 mb-3">
            {p.dormitorios != null && <span>🛏 {p.dormitorios} dorm.</span>}
            {p.banos != null && <span>🚿 {p.banos} baño{p.banos !== 1 ? "s" : ""}</span>}
            {p.superficie_total && <span>📐 {p.superficie_total} m²</span>}
          </div>
        )}
        <p className="font-bold text-base" style={{ color: "#b99f66" }}>
          {p.moneda} {precio}
        </p>
      </div>
    </a>
  );
}
