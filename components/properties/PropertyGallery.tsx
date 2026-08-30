"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2, Images, Ruler } from "lucide-react";

interface Props {
  fotos: string[];
  titulo: string;
  plano?: string | null;
}

export default function PropertyGallery({ fotos, titulo, plano }: Props) {
  // El plano se integra como último ítem de la galería
  const items = plano ? [...fotos, plano] : fotos;
  const planoIndex = plano ? items.length - 1 : -1;

  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const enPlano = !!plano && current === planoIndex;
  const mostrarChips = !!plano && fotos.length > 0;

  const prev = useCallback(() => setCurrent(c => (c - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % items.length), [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     setLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (!items.length) {
    return (
      <div style={{
        width: "100%", height: 580, borderRadius: "var(--radius-lg)",
        background: "var(--fill-100)", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "var(--ink-400)",
      }}>
        <span style={{ fontSize: 14, fontFamily: "var(--font-sans)" }}>Sin fotos</span>
      </div>
    );
  }

  const altActual = enPlano ? `Plano de ${titulo}` : `${titulo} · foto ${current + 1}`;

  return (
    <>
      {/* ── Main gallery ─────────────────────────────── */}
      <div>
        {/* Primary photo */}
        <div
          className="property-gallery-main"
          onClick={() => setLightbox(true)}
          title="Clic para ampliar"
          style={enPlano ? { background: "#fff" } : undefined}
        >
          <Image
            src={items[current]}
            alt={altActual}
            fill
            className={enPlano ? "object-contain" : "object-cover"}
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority={current === 0}
            style={{ transition: "transform 0.35s ease" }}
          />

          {/* Chips Fotos / Plano — top left */}
          {mostrarChips && (
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8, zIndex: 2 }}>
              {([
                [<Images key="i" size={14} strokeWidth={2} />, "Fotos", false, 0],
                [<Ruler key="r" size={14} strokeWidth={2} />, "Plano", true, planoIndex],
              ] as [React.ReactNode, string, boolean, number][]).map(([icon, label, esPlano, idx]) => {
                const activo = esPlano === enPlano;
                return (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); setCurrent(idx); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
                      padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                      border: "1px solid transparent",
                      background: activo ? "#fff" : "rgba(7,24,44,.55)",
                      color: activo ? "var(--navy-800)" : "#fff",
                      backdropFilter: "blur(4px)",
                      transition: "all var(--dur) var(--ease-out)",
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Expand hint — top right */}
          <div style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(7,24,44,.55)", backdropFilter: "blur(4px)",
            borderRadius: "var(--radius-sm)", padding: "7px 11px",
            display: "flex", alignItems: "center", gap: 6,
            color: "#fff", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 500,
            pointerEvents: "none",
          }}>
            <Maximize2 size={14} strokeWidth={2} />
            Ampliar
          </div>

          {/* Counter — bottom right */}
          <div style={{
            position: "absolute", bottom: 14, right: 14,
            background: "rgba(7,24,44,.55)", backdropFilter: "blur(4px)",
            color: "#fff", fontFamily: "var(--font-sans)", fontSize: 12.5,
            padding: "5px 12px", borderRadius: 999, pointerEvents: "none",
          }}>
            {enPlano ? "Plano" : `${current + 1} / ${fotos.length}`}
          </div>

          {/* Arrow buttons (only when multiple items) */}
          {items.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                style={arrowBtn}
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                style={{ ...arrowBtn, left: "auto", right: 14 }}
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {items.length > 1 && (
          <div className="property-thumbs">
            {items.map((url, i) => {
              const esPlano = i === planoIndex;
              return (
                <button
                  key={url}
                  className="property-thumb"
                  onClick={() => setCurrent(i)}
                  style={{
                    borderRadius: "var(--radius-sm)", overflow: "hidden",
                    outline: i === current
                      ? "2.5px solid var(--gold-500)"
                      : "2.5px solid transparent",
                    outlineOffset: -1,
                    background: esPlano ? "#fff" : "none",
                    border: esPlano ? "1px solid var(--line-200)" : "none",
                    cursor: "pointer",
                    padding: 0, position: "relative",
                    opacity: i === current ? 1 : 0.7,
                    transition: "opacity var(--dur) var(--ease-out), outline var(--dur) var(--ease-out)",
                  }}
                >
                  <Image
                    src={url}
                    alt={esPlano ? "Miniatura del plano" : `Miniatura ${i + 1}`}
                    fill
                    className={esPlano ? "object-contain" : "object-cover"}
                    sizes="104px"
                  />
                  {esPlano && (
                    <span style={{
                      position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                      fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      background: "var(--navy-800)", color: "#fff",
                      padding: "2px 7px", borderRadius: 999, pointerEvents: "none",
                    }}>
                      Plano
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(5,14,26,.96)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 180ms ease",
          }}
        >
          {/* Click on the image itself shouldn't close */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(92vw, 1200px)",
              height: "min(88vh, 800px)",
              background: enPlano ? "#fff" : "transparent",
              borderRadius: enPlano ? "var(--radius-md)" : 0,
            }}
          >
            <Image
              src={items[current]}
              alt={altActual}
              fill
              className="object-contain"
              sizes="92vw"
              priority
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setLightbox(false)}
            style={{ ...lbBtn, top: 20, right: 20, position: "fixed" }}
            title="Cerrar (Esc)"
          >
            <X size={20} strokeWidth={2} />
          </button>

          {/* Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                style={{ ...lbBtn, position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)" }}
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                style={{ ...lbBtn, position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)" }}
              >
                <ChevronRight size={24} strokeWidth={2} />
              </button>
            </>
          )}

          {/* Counter */}
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
            color: "#fff", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            padding: "7px 18px", borderRadius: 999,
          }}>
            {enPlano ? "Plano" : `${current + 1} / ${fotos.length}`}
          </div>

          {/* Thumbnail strip */}
          {items.length > 1 && (
            <div style={{
              position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 8,
            }}>
              {items.map((url, i) => (
                <button
                  key={url}
                  onClick={e => { e.stopPropagation(); setCurrent(i); }}
                  style={{
                    width: 52, height: 38,
                    borderRadius: "var(--radius-xs)", overflow: "hidden",
                    outline: i === current ? "2px solid var(--gold-500)" : "2px solid transparent",
                    outlineOffset: -1,
                    background: i === planoIndex ? "#fff" : "none",
                    border: "none", cursor: "pointer",
                    padding: 0, position: "relative",
                    opacity: i === current ? 1 : 0.5,
                    transition: "opacity var(--dur) var(--ease-out)",
                  }}
                >
                  <Image src={url} alt="" fill className={i === planoIndex ? "object-contain" : "object-cover"} sizes="52px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

const arrowBtn: React.CSSProperties = {
  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
  background: "rgba(7,24,44,.55)", backdropFilter: "blur(4px)",
  border: "none", borderRadius: "var(--radius-sm)",
  color: "#fff", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
  width: 38, height: 38,
  transition: "background var(--dur) var(--ease-out)",
};

const lbBtn: React.CSSProperties = {
  background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,.15)",
  borderRadius: "var(--radius-sm)", color: "#fff",
  cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
  width: 44, height: 44,
  transition: "background var(--dur) var(--ease-out)",
  zIndex: 101,
};
