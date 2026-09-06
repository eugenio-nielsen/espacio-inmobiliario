"use client";

import { useEffect, useState } from "react";

/**
 * Palabra que se releva sola dentro del titular.
 *
 * Todas las palabras se renderizan apiladas en la misma celda de grilla
 * (ver .cf-rotor): las ocultas reservan el ancho de la más larga, asi
 * que el titular nunca salta de tamaño al cambiar.
 */
export default function PalabraRotativa({
  palabras,
  intervalo = 2600,
  style,
}: {
  palabras: string[];
  intervalo?: number;
  style?: React.CSSProperties;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI(p => (p + 1) % palabras.length), intervalo);
    return () => clearInterval(t);
  }, [palabras.length, intervalo]);

  return (
    <span className="cf-rotor">
      {palabras.map(p => (
        <span key={p} aria-hidden="true" style={{ visibility: "hidden", ...style }}>
          {p}
        </span>
      ))}
      <span key={i} className="cf-rotor-word" style={style}>
        {palabras[i]}
      </span>
    </span>
  );
}
