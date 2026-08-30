"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LINEAS_VISIBLES = 7;

export default function DescripcionExpandible({ texto }: { texto: string }) {
  const [expandida, setExpandida] = useState(false);
  const [desborda, setDesborda] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Mostrar el toggle solo si el texto realmente supera el clamp
  useEffect(() => {
    const el = ref.current;
    if (el) setDesborda(el.scrollHeight > el.clientHeight + 2);
  }, [texto]);

  return (
    <div style={{ margin: "0 0 18px" }}>
      <p
        ref={ref}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.75,
          color: "var(--ink-600)", margin: 0, whiteSpace: "pre-line",
          ...(expandida ? {} : {
            display: "-webkit-box",
            WebkitLineClamp: LINEAS_VISIBLES,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }),
        }}
      >
        {texto}
      </p>

      {(desborda || expandida) && (
        <button
          onClick={() => setExpandida(e => !e)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            marginTop: 10, padding: 0, background: "none", border: "none",
            cursor: "pointer", fontFamily: "var(--font-sans)",
            fontSize: 14, fontWeight: 600, color: "var(--gold-700)",
          }}
        >
          {expandida ? "Ver menos" : "Ver más"}
          <ChevronDown
            size={15}
            strokeWidth={2}
            style={{ transition: "transform .2s ease", transform: expandida ? "rotate(180deg)" : "none" }}
          />
        </button>
      )}
    </div>
  );
}
