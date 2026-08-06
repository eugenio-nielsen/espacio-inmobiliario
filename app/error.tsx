"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de la aplicación:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "70vh", background: "var(--cream)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div className="es-eyebrow" style={{ marginBottom: 14 }}>Algo salió mal</div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(22px,4vw,32px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 12px",
        }}>
          No pudimos cargar esta página
        </h1>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.65,
          color: "var(--ink-600)", margin: "0 0 28px",
        }}>
          Puede ser algo momentáneo. Probá de nuevo y, si sigue pasando,
          escribinos y lo revisamos.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 24px", borderRadius: "var(--radius-sm)",
              background: "var(--navy-800)", color: "#fff",
              border: "1.5px solid transparent", cursor: "pointer",
            }}
          >
            <RefreshCw size={16} strokeWidth={2} /> Reintentar
          </button>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 24px", borderRadius: "var(--radius-sm)",
              background: "#fff", color: "var(--navy-800)",
              border: "1.5px solid var(--line-200)", textDecoration: "none",
            }}
          >
            <Home size={16} strokeWidth={2} /> Ir al inicio
          </Link>
        </div>
        {error.digest && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", marginTop: 24 }}>
            Código de referencia: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
