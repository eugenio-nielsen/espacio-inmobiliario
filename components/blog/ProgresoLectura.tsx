"use client";

import { useEffect, useRef } from "react";

/**
 * Filete dorado arriba de todo que avanza a medida que se lee la nota
 * (el <article> con id `idArticulo`). Escribe el ancho directo en el
 * estilo, dentro de requestAnimationFrame: nada de estado de React en
 * cada evento de scroll.
 */
export default function ProgresoLectura({ idArticulo }: { idArticulo: string }) {
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const articulo = document.getElementById(idArticulo);
    if (!articulo || !barra.current) return;
    let frame: number | null = null;

    const medir = () => {
      frame = null;
      const r = articulo.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      const avance = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 1;
      if (barra.current) barra.current.style.transform = `scaleX(${avance})`;
    };
    const alMover = () => { if (frame === null) frame = requestAnimationFrame(medir); };

    medir();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [idArticulo]);

  return <div ref={barra} className="nt-progreso" aria-hidden="true" />;
}
