"use client";

import { useId, useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";

/*
 * Controles del tasador. Todos son inputs nativos (radio, checkbox,
 * number) vestidos con CSS: el teclado, el foco y los lectores de
 * pantalla funcionan sin trabajo extra. Estilos en tasador.css (.ts-).
 */

export type Opcion<V extends string | number> = { v: V; l: string; d?: string };

/** Una sola opción, en fichas. Con `d`, cada ficha lleva una línea de ayuda. */
export function Opciones<V extends string | number>({
  nombre,
  opciones,
  valor,
  onCambio,
  columnas,
}: {
  nombre: string;
  opciones: readonly Opcion<V>[];
  valor: V | undefined;
  onCambio: (v: V) => void;
  /** Fichas por fila; sin esto se acomodan solas. */
  columnas?: number;
}) {
  const id = useId();
  const conDetalle = opciones.some(o => o.d);
  return (
    <div
      className={`ts-ops${conDetalle ? " ts-ops-tarjetas" : ""}`}
      role="radiogroup"
      aria-label={nombre}
      style={columnas ? { gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` } : undefined}
    >
      {opciones.map(o => (
        <label key={String(o.v)} className="ts-op">
          <input
            type="radio"
            name={id}
            className="ts-oculto"
            checked={valor === o.v}
            onChange={() => onCambio(o.v)}
          />
          <span className="ts-op-t">{o.l}</span>
          {o.d && <span className="ts-op-d">{o.d}</span>}
        </label>
      ))}
    </div>
  );
}

/** Varias opciones a la vez (amenities, extras). */
export function Marcas({
  nombre,
  opciones,
  marcadas,
  onCambio,
}: {
  nombre: string;
  opciones: readonly { k: string; l: string }[];
  marcadas: Record<string, boolean>;
  onCambio: (k: string, v: boolean) => void;
}) {
  return (
    <div className="ts-ops" role="group" aria-label={nombre}>
      {opciones.map(o => (
        <label key={o.k} className="ts-op ts-op-marca">
          <input
            type="checkbox"
            className="ts-oculto"
            checked={!!marcadas[o.k]}
            onChange={e => onCambio(o.k, e.target.checked)}
          />
          <span className="ts-op-t">{o.l}</span>
        </label>
      ))}
    </div>
  );
}

/** Un número grande, en serif, con botones para sumar y restar. */
export function Numero({
  etiqueta,
  valor,
  onCambio,
  min = 0,
  max = 9999,
  unidad,
  placeholder,
  formato,
  chico,
  autoFocus,
}: {
  etiqueta: string;
  valor: number | undefined;
  onCambio: (v: number | undefined) => void;
  min?: number;
  max?: number;
  unidad?: string;
  placeholder?: string;
  /** Cómo leer el valor en palabras (ej. 0 → "Planta baja"). */
  formato?: (v: number) => string | null;
  chico?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const n = valor ?? 0;
  const paso = (d: number) => onCambio(Math.min(max, Math.max(min, n + d)));
  const leyenda = valor != null && formato ? formato(valor) : null;

  return (
    <div className={`ts-num${chico ? " ts-num-chico" : ""}`}>
      <label htmlFor={id} className="ts-rotulo">{etiqueta}</label>
      <div className="ts-num-caja">
        <button type="button" className="ts-num-b" onClick={() => paso(-1)} aria-label={`Restar a ${etiqueta}`} disabled={n <= min}>
          <Minus size={14} strokeWidth={1.8} />
        </button>
        <div className="ts-num-campo">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={valor ?? ""}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onChange={e => {
              const t = e.target.value;
              if (t === "") return onCambio(undefined);
              const v = Math.floor(Number(t));
              if (Number.isFinite(v)) onCambio(Math.min(max, Math.max(min, v)));
            }}
          />
          {unidad && <span className="ts-num-u">{unidad}</span>}
        </div>
        <button type="button" className="ts-num-b" onClick={() => paso(1)} aria-label={`Sumar a ${etiqueta}`} disabled={n >= max}>
          <Plus size={14} strokeWidth={1.8} />
        </button>
      </div>
      {leyenda && <span className="ts-num-leyenda">{leyenda}</span>}
    </div>
  );
}

/** Sí / no, como una línea de la ficha con su interruptor. */
export function Interruptor({
  etiqueta,
  detalle,
  valor,
  onCambio,
}: {
  etiqueta: string;
  detalle?: string;
  valor: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <label className="ts-sw">
      <span className="ts-sw-txt">
        <span className="ts-sw-t">{etiqueta}</span>
        {detalle && <span className="ts-sw-d">{detalle}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="ts-oculto"
        checked={valor}
        onChange={e => onCambio(e.target.checked)}
      />
      <span className="ts-sw-riel" aria-hidden="true"><span /></span>
    </label>
  );
}

/** Los barrios, con un buscador arriba: se escribe y quedan los que coinciden. */
export function BuscadorBarrio({
  barrios,
  valor,
  onCambio,
}: {
  barrios: string[];
  valor: string;
  onCambio: (v: string) => void;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const sinTildes = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visibles = useMemo(() => {
    const b = sinTildes(q.trim());
    return b ? barrios.filter(x => sinTildes(x).includes(b)) : barrios;
  }, [barrios, q]);

  return (
    <div className="ts-barrios">
      <label className="ts-buscar">
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscá tu barrio"
          aria-label="Buscar barrio"
          onKeyDown={e => {
            // Enter con un solo resultado lo elige, en vez de avanzar sin barrio
            if (e.key === "Enter" && visibles.length === 1) {
              e.preventDefault();
              onCambio(visibles[0]);
            }
          }}
        />
      </label>
      <div className="ts-barrios-lista" role="radiogroup" aria-label="Barrio">
        {visibles.map(b => (
          <label key={b} className="ts-op ts-op-barrio">
            <input
              type="radio"
              name={id}
              className="ts-oculto"
              checked={valor === b}
              onChange={() => onCambio(b)}
            />
            <span className="ts-op-t">{b}</span>
          </label>
        ))}
        {!visibles.length && <p className="ts-vacio">No tenemos valores de referencia para ese barrio todavía.</p>}
      </div>
    </div>
  );
}

const RUMBOS = [
  { v: "norte", l: "N", a: 0 },
  { v: "noreste", l: "NE", a: 45 },
  { v: "este", l: "E", a: 90 },
  { v: "sureste", l: "SE", a: 135 },
  { v: "sur", l: "S", a: 180 },
  { v: "suroeste", l: "SO", a: 225 },
  { v: "oeste", l: "O", a: 270 },
  { v: "noroeste", l: "NO", a: 315 },
] as const;

/**
 * Orientación en una rosa de los vientos: ocho rumbos alrededor y el
 * centro para "no sé". La aguja gira hacia el rumbo elegido.
 */
export function RosaVientos({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const id = useId();
  const elegido = RUMBOS.find(r => r.v === valor);
  return (
    <div className="ts-rosa" role="radiogroup" aria-label="Orientación">
      <svg viewBox="-100 -100 200 200" className="ts-rosa-dibujo" aria-hidden="true">
        <circle r="78" />
        <circle r="70" className="ts-rosa-fina" />
        {RUMBOS.map(r => (
          <line key={r.v} x1="0" y1={r.a % 90 ? -58 : -66} x2="0" y2="-74" transform={`rotate(${r.a})`} />
        ))}
        <g className="ts-rosa-aguja" style={{ transform: `rotate(${elegido?.a ?? 0}deg)`, opacity: elegido ? 1 : 0.28 }}>
          <path d="M0 -56 L7 0 L0 8 L-7 0 Z" />
        </g>
      </svg>
      {RUMBOS.map(r => {
        const rad = ((r.a - 90) * Math.PI) / 180;
        return (
          <label
            key={r.v}
            className="ts-rumbo"
            style={{ left: `${50 + Math.cos(rad) * 45}%`, top: `${50 + Math.sin(rad) * 45}%` }}
          >
            <input type="radio" name={id} className="ts-oculto" checked={valor === r.v} onChange={() => onCambio(r.v)} />
            <span>{r.l}</span>
          </label>
        );
      })}
      <label className="ts-rumbo ts-rumbo-centro" style={{ left: "50%", top: "50%" }}>
        <input type="radio" name={id} className="ts-oculto" checked={!valor} onChange={() => onCambio("")} />
        <span>No sé</span>
      </label>
    </div>
  );
}
