import Image from "next/image";
import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

export default function PropertyListCard({ property: p }: { property: Property }) {
  const precio = `${p.moneda} ${new Intl.NumberFormat("es-AR").format(p.precio)}`;

  return (
    <a
      href={buildPropertyUrl(p)}
      className="card-lift"
      style={{
        background: "#fff", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--line-200)", overflow: "hidden",
        cursor: "pointer", textDecoration: "none", display: "block",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative" }}>
        {p.fotos?.[0] ? (
          <div style={{ position: "relative", height: 188, overflow: "hidden" }}>
            <Image
              src={p.fotos[0]} alt={p.titulo} fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div style={{
            height: 188, background: "repeating-linear-gradient(45deg,#e9e3d6 0 11px,#f1ece1 11px 22px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 11, color: "#ada592" }}>sin foto</span>
          </div>
        )}

        {/* Tipo badge — top left */}
        <span style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
            padding: "6px 11px", borderRadius: 999,
            background: "rgba(255,255,255,.92)", color: "var(--navy-800)",
            boxShadow: "var(--shadow-xs)",
          }}>
            {TIPO_LABEL[p.tipo]}
          </span>
        </span>

        {/* Operacion badge — top right */}
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
            padding: "6px 11px", borderRadius: 999,
            background: p.operacion === "venta" ? "var(--navy-800)" : "var(--gold-500)",
            color: p.operacion === "venta" ? "#fff" : "#26200f",
          }}>
            {p.operacion === "venta" ? "Venta" : "Alquiler"}
          </span>
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        {/* Title */}
        <h3 style={{
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16,
          lineHeight: 1.35, color: "var(--ink-900)", margin: "0 0 7px",
          minHeight: 43, display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.titulo}
        </h3>

        {/* Location */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: "var(--ink-500)", marginBottom: 13,
        }}>
          <MapPin size={14} strokeWidth={1.75} />
          {p.barrio ? `${p.barrio}, ${p.ciudad}` : p.ciudad}
        </div>

        {/* Specs */}
        <div style={{
          display: "flex", gap: 16, fontFamily: "var(--font-sans)",
          fontSize: 13, color: "var(--ink-600)",
          paddingBottom: 13, borderBottom: "1px solid var(--line-100)", marginBottom: 13,
        }}>
          {p.dormitorios != null && (
            <span style={spec}>
              <BedDouble size={15} strokeWidth={1.75} />
              {p.dormitorios} dorm.
            </span>
          )}
          {p.banos != null && (
            <span style={spec}>
              <Bath size={15} strokeWidth={1.75} />
              {p.banos} {p.banos !== 1 ? "baños" : "baño"}
            </span>
          )}
          {p.superficie_total && (
            <span style={spec}>
              <Ruler size={15} strokeWidth={1.75} />
              {p.superficie_total} m²
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
          color: "var(--gold-700)", letterSpacing: "-.01em",
        }}>
          {precio}
          {p.operacion === "alquiler" && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-500)" }}> /mes</span>
          )}
        </div>
      </div>
    </a>
  );
}

const spec: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
};
