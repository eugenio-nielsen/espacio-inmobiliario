"use client";

import { useState } from "react";
import { List, ChevronDown } from "lucide-react";
import type { TocItem } from "@/lib/blog/markdown";

/**
 * Índice de la nota. Arranca cerrado para no empujar el contenido:
 * el lector lo abre si quiere saltar a una sección.
 */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [abierto, setAbierto] = useState(false);
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Índice de contenidos"
      style={{
        background: "var(--navy-800)",
        borderRadius: "var(--radius-lg)",
        margin: "0 0 32px",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 9,
          padding: "15px 20px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", color: "inherit",
        }}
      >
        <List size={16} color="var(--gold-400)" style={{ flexShrink: 0 }} />
        <span style={{
          flex: 1, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5,
          letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-300)",
        }}>
          En esta nota
        </span>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: 12,
          color: "rgba(255,255,255,.45)", flexShrink: 0,
        }}>
          {items.length} secciones
        </span>
        <ChevronDown
          size={17}
          color="rgba(255,255,255,.6)"
          style={{
            flexShrink: 0,
            transform: abierto ? "rotate(180deg)" : "none",
            transition: "transform .22s var(--ease-out)",
          }}
        />
      </button>

      {abierto && (
        <ol style={{
          listStyle: "none", margin: 0, padding: "0 20px 16px",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {items.map(item => (
            <li key={item.id} style={{ paddingLeft: item.level === 3 ? 18 : 0 }}>
              <a
                href={`#${item.id}`}
                onClick={() => setAbierto(false)}
                style={{
                  display: "block", fontFamily: "var(--font-sans)",
                  fontSize: item.level === 3 ? 13.5 : 14.5,
                  fontWeight: item.level === 3 ? 400 : 600,
                  color: item.level === 3 ? "rgba(255,255,255,.62)" : "rgba(255,255,255,.9)",
                  textDecoration: "none", padding: "7px 0", lineHeight: 1.4,
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
