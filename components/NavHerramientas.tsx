"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { GRUPOS_HERRAMIENTAS } from "@/lib/menu";

/**
 * Desplegable "Herramientas" del menú de escritorio. Trae tres grupos
 * con rótulo (lib/menu.ts): la operación (comprar, vender), las
 * herramientas gratuitas y el blog.
 */
export default function NavHerramientas({ style }: { style?: React.CSSProperties }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={caja} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-haspopup="true"
        style={{
          ...style,
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "none", border: "none", padding: 0,
        }}
      >
        Herramientas
        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .2s var(--ease-out)" }}
        />
      </button>

      {abierto && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)",
            width: 292, background: "#fff", zIndex: 30,
            border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)", padding: 6,
          }}
        >
          {GRUPOS_HERRAMIENTAS.map((g, gi) => (
            <div
              key={g.titulo}
              style={gi ? { borderTop: "1px solid var(--line-100)", marginTop: 4, paddingTop: 4 } : undefined}
            >
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600,
                letterSpacing: ".2em", textTransform: "uppercase",
                color: "var(--gold-700)", margin: 0, padding: "9px 11px 3px",
              }}>
                {g.titulo}
              </p>
              {g.items.map(({ href, label, detalle, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAbierto(false)}
                  className="nav-herramienta"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 11px", borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: "var(--radius-xs)", flexShrink: 0,
                    background: "var(--navy-50)", color: "var(--navy-700)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{
                      display: "block", fontFamily: "var(--font-sans)", fontWeight: 600,
                      fontSize: 13.5, color: "var(--navy-800)", lineHeight: 1.3,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      display: "block", fontFamily: "var(--font-sans)",
                      fontSize: 12, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.35,
                    }}>
                      {detalle}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
