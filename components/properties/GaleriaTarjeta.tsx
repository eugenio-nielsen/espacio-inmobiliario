"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

/**
 * Fotos de la tarjeta de propiedad: un carrusel corto, con swipe en touch
 * y flechas al pasar el puntero en escritorio.
 *
 * Eficiencia: la primera foto carga con la página; las demás recién se
 * montan cuando la persona muestra interés (pasa el puntero, toca o
 * enfoca la tarjeta). Un listado de doce tarjetas no descarga sesenta
 * fotos que nadie va a mirar.
 *
 * Muestra hasta `fotos.length` (el que llama recorta, hoy cinco) y, si la
 * propiedad tiene más, una última lámina "Ver las N fotos" que lleva a la
 * ficha. Cada lámina es un link a la ficha: así el swipe funciona (una capa
 * encima para el link bloquearía el scroll horizontal).
 */
export default function GaleriaTarjeta({
  fotos,
  total,
  href,
  alt,
  priority = false,
}: {
  fotos: string[];
  total: number;
  href: string;
  alt: string;
  priority?: boolean;
}) {
  const [activa, setActiva] = useState(false);
  const [actual, setActual] = useState(0);
  const pista = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const hayMas = total > fotos.length;
  const laminas = fotos.length + (hayMas ? 1 : 0);
  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px";

  function alMover() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = pista.current;
      if (el) setActual(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  function ir(paso: number) {
    setActiva(true);
    const el = pista.current;
    if (el) el.scrollBy({ left: paso * el.clientWidth, behavior: "smooth" });
  }

  if (!fotos.length) {
    return (
      <Link href={href} className="tp-galeria tp-sin-foto" tabIndex={-1} aria-hidden="true">
        <Images size={22} strokeWidth={1.4} />
        <span>Sin fotos todavía</span>
      </Link>
    );
  }

  return (
    <div
      className="tp-galeria"
      onPointerEnter={() => setActiva(true)}
      onTouchStart={() => setActiva(true)}
      onFocus={() => setActiva(true)}
    >
      <div ref={pista} className="tp-pista" onScroll={alMover}>
        {fotos.map((src, k) => (
          <Link key={src} href={href} className="tp-lamina" tabIndex={-1} aria-hidden={k > 0}>
            {(k === 0 || activa) && (
              <Image
                src={src}
                alt={k === 0 ? alt : ""}
                fill
                sizes={sizes}
                // En Next 16 `priority` está deprecado y ya no hace nada: para
                // varias tarjetas arriba del pliegue va eager + prioridad alta
                loading={priority && k === 0 ? "eager" : undefined}
                fetchPriority={priority && k === 0 ? "high" : undefined}
                className="tp-foto"
              />
            )}
          </Link>
        ))}
        {hayMas && (
          <Link href={href} className="tp-lamina tp-lamina-mas" tabIndex={-1} aria-hidden="true">
            {activa && (
              <Image src={fotos[fotos.length - 1]} alt="" fill sizes={sizes} className="tp-foto tp-foto-velada" />
            )}
            <span className="tp-mas">
              <Images size={20} strokeWidth={1.5} />
              Ver las {total} fotos
            </span>
          </Link>
        )}
      </div>

      {laminas > 1 && (
        <>
          <button
            type="button"
            className="tp-flecha tp-flecha-izq"
            onClick={() => ir(-1)}
            disabled={actual === 0}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="tp-flecha tp-flecha-der"
            onClick={() => ir(1)}
            disabled={actual >= laminas - 1}
            aria-label="Foto siguiente"
          >
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
          <div className="tp-marcas" aria-hidden="true">
            {Array.from({ length: laminas }, (_, k) => (
              <span key={k} data-on={k === actual} />
            ))}
          </div>
        </>
      )}

      <span className="tp-contador" aria-label={`${total} fotos`}>
        {Math.min(actual + 1, fotos.length)} / {total}
      </span>
    </div>
  );
}
