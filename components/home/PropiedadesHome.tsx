"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import PropertyListCard from "@/components/properties/PropertyListCard";
import FadeIn from "@/components/ui/FadeIn";
import { cargarMasPropiedades } from "@/lib/actions/listado";
import { TOPE_HOME, type PropertyCardData } from "@/lib/types";

const POR_TANDA = 6;

/**
 * Grilla de propiedades de la home con carga incremental.
 *
 * Las primeras llegan renderizadas desde el servidor (rápido y indexable);
 * las siguientes se piden recién cuando el usuario se acerca al final,
 * para no cargar de entrada lo que quizá no mire.
 */
export default function PropiedadesHome({
  iniciales,
  totalActivas,
}: {
  iniciales: PropertyCardData[];
  totalActivas: number;
}) {
  const [items, setItems] = useState<PropertyCardData[]>(iniciales);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const centinelaRef = useRef<HTMLDivElement>(null);

  const disponibles = Math.min(totalActivas, TOPE_HOME);
  const hayMas = !error && items.length < disponibles;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const res = await cargarMasPropiedades(items.length, POR_TANDA);
    if (res.ok) {
      // Filtrar por id: evita duplicados si algo se publicó entre tandas
      setItems(prev => {
        const vistos = new Set(prev.map(p => p.id));
        return [...prev, ...res.items.filter(p => !vistos.has(p.id))];
      });
    } else {
      setError(res.error);
    }
    setCargando(false);
  }, [items.length]);

  useEffect(() => {
    if (!hayMas || cargando) return;
    const el = centinelaRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          void cargar();
        }
      },
      { rootMargin: "320px 0px" } // se anticipa: llega antes de que se vea el final
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hayMas, cargando, cargar]);

  return (
    <>
      <div className="grid-properties home-destacados">
        {items.map((p, i) => (
          <FadeIn key={p.id} delay={(i % 3) * 110} direction="up">
            <div className="card-lift">
              <PropertyListCard property={p} priority={i < 3} />
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Centinela: dispara la siguiente tanda al acercarse */}
      {hayMas && <div ref={centinelaRef} aria-hidden="true" style={{ height: 1 }} />}

      {cargando && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 9, padding: "26px 0 4px",
          fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)",
        }}>
          <Loader2 size={15} strokeWidth={2} className="spin-slow" />
          Cargando más propiedades…
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", padding: "22px 0 4px" }}>
          <button
            type="button"
            onClick={() => void cargar()}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600,
              color: "var(--gold-700)", background: "none", border: "none",
              cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
            }}
          >
            No se pudieron cargar más. Reintentar
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <Link href="/propiedades" className="esbtn esbtn-primary" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
          borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
          padding: "13px 26px", background: "var(--navy-800)", color: "#fff",
          textDecoration: "none",
        }}>
          Ver todas las propiedades <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </>
  );
}
