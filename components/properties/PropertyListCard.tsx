import Image from "next/image";
import Link from "next/link";
import { MapPin, Maximize2, BedDouble, Car, LayoutGrid } from "lucide-react";
import type { PropertyCardData } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno",
  local: "Local", oficina: "Oficina",
};

function fmtPrecio(precio: number, moneda: string): string {
  return `${moneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(precio))}`;
}

/** `priority`: usar solo en las primeras tarjetas visibles (mejora el LCP). */
export default function PropertyListCard({ property: p, priority = false }: { property: PropertyCardData; priority?: boolean }) {
  const precioPorM2 = p.superficie_total && p.superficie_total > 0
    ? Math.round(p.precio / p.superficie_total)
    : null;

  return (
    <Link
      href={buildPropertyUrl(p)}
      className="card-lift"
      style={{
        background: "#fff",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--line-200)",
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        display: "block",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* ── Image area ──────────────────────────────── */}
      <div style={{ position: "relative", height: 220, overflow: "hidden", background: "var(--fill-100)" }}>
        {p.fotos?.[0] ? (
          <Image
            src={p.fotos[0]}
            alt={p.titulo}
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ transition: "transform 0.4s ease" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(45deg,#e9e3d6 0 11px,#f1ece1 11px 22px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ada592" }}>sin foto</span>
          </div>
        )}

        {/* Gradient overlay — dark bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(7,24,44,.82) 0%, rgba(7,24,44,.3) 45%, transparent 70%)",
        }} />

        {/* Badges — top left */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
            padding: "5px 10px", borderRadius: 999,
            background: "var(--navy-800)", color: "#fff",
          }}>
            Venta
          </span>
          {p.apto_credito && (
            <span style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
              padding: "5px 10px", borderRadius: 999,
              background: "#22c55e", color: "#fff",
            }}>
              Apto crédito
            </span>
          )}
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5,
            padding: "5px 10px", borderRadius: 999,
            background: "rgba(255,255,255,.88)", color: "var(--navy-800)",
            boxShadow: "var(--shadow-xs)",
          }}>
            {TIPO_LABEL[p.tipo]}
          </span>
        </div>

        {/* Price overlay — bottom left */}
        <div style={{ position: "absolute", bottom: 14, left: 14 }}>
          <p style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
            color: "#fff", margin: 0, lineHeight: 1,
            textShadow: "0 1px 4px rgba(0,0,0,.3)",
          }}>
            {fmtPrecio(p.precio, p.moneda)}
          </p>
          {precioPorM2 && (
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 12.5,
              color: "rgba(255,255,255,.75)", margin: "4px 0 0",
            }}>
              {p.moneda === "USD" ? "US$" : "$"} {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(precioPorM2)}/m²
            </p>
          )}
        </div>
      </div>

      {/* ── Card body ────────────────────────────────── */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Title */}
        <h3 style={{
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
          lineHeight: 1.4, color: "var(--ink-900)", margin: "0 0 6px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.titulo}
        </h3>

        {/* Location */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: "var(--ink-500)", marginBottom: 12,
        }}>
          <MapPin size={13} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.barrio ? `${p.barrio}` : p.ciudad}
          </span>
        </div>

        {/* Features row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: "var(--ink-600)", borderTop: "1px solid var(--line-100)", paddingTop: 12,
        }}>
          {p.ambientes != null && (
            <span style={feat}>
              <LayoutGrid size={14} strokeWidth={1.75} />
              {p.ambientes} amb.
            </span>
          )}
          {p.superficie_total != null && (
            <span style={feat}>
              <Maximize2 size={14} strokeWidth={1.75} />
              {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(p.superficie_total)} m²
            </span>
          )}
          {p.dormitorios != null && (
            <span style={feat}>
              <BedDouble size={14} strokeWidth={1.75} />
              {p.dormitorios} dorm.
            </span>
          )}
          {p.cochera && (
            <span style={feat}>
              <Car size={14} strokeWidth={1.75} />
              Cochera
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const feat: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
};
