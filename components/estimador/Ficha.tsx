"use client";

import SelloEN from "@/components/SelloEN";
import type { EstimadorInput, NivelConfianza } from "@/lib/estimador/types";

const PRECISION: Record<NivelConfianza, { n: number; l: string; d: string }> = {
  baja: { n: 1, l: "Baja", d: "Los detalles del paso IV ajustan el rango." },
  media: { n: 2, l: "Media", d: "Orientación, vista y expensas la llevan a alta." },
  alta: { n: 3, l: "Alta", d: "Con estos datos, el rango es el más ajustado." },
};

const OBRA = { usado: "Usado", a_estrenar: "A estrenar", pozo: "En pozo" } as const;
const ESTADO = { a_reciclar: "a reciclar", bueno: "en buen estado", muy_bueno: "en muy buen estado", excelente: "en estado excelente" } as const;
const CATEGORIA = { regular: "Categoría regular", estandar: "Categoría estándar", premium: "Categoría premium" } as const;
const AMENITY = { pileta: "Piscina", sum: "SUM", gimnasio: "Gimnasio", seguridad: "Seguridad", parrilla: "Parrilla" } as const;
const DISPOSICION = { frente: "Frente", contrafrente: "Contrafrente", interno: "Interno" } as const;
const VISTA = { abierta: "vista abierta", despejada: "vista despejada", a_la_calle: "vista a la calle", interna: "vista interna" } as const;
const COCHERA = { descubierta: "cochera descubierta", movil: "cochera móvil", fija: "cochera fija" } as const;

const num = (n: number) => new Intl.NumberFormat("es-AR").format(n);

/**
 * La ficha de la unidad: un documento que se va escribiendo con cada
 * respuesta, con líneas de puntos como un formulario notarial. Cada
 * valor nuevo entra con un trazo dorado (la key cambia y la animación
 * vuelve a correr). Abajo, la precisión que va a tener la estimación.
 *
 * El sello espera en la esquina, punteado; al emitir, se estampa.
 */
export default function Ficha({
  input,
  paso,
  confianza,
  nombre,
  emitiendo,
}: {
  input: EstimadorInput;
  paso: number;
  confianza: NivelConfianza | null;
  nombre: string;
  emitiendo: boolean;
}) {
  const extras = [
    input.m2Semicubierto > 0 && `${num(input.m2Semicubierto)} m² de balcón`,
    input.m2Descubiertos > 0 && `${num(input.m2Descubiertos)} m² de patio o terraza`,
  ].filter(Boolean).join(" · ");

  const ambientes = input.ambientes
    ? input.ambientes === 1 ? "Monoambiente" : `${input.ambientes}${input.ambientes >= 5 ? " o más" : ""} ambientes`
    : null;
  const banos = `${input.banos}${input.banos >= 3 ? " o más" : ""} ${input.banos === 1 ? "baño" : "baños"}`;

  const obra = input.condicionObra === "usado"
    ? `Usado, ${input.antiguedad ? `${input.antiguedad} años` : "menos de un año"}, ${ESTADO[input.estado]}`
    : OBRA[input.condicionObra];

  const amenities = Object.entries(input.amenities)
    .filter(([, v]) => v)
    .map(([k]) => AMENITY[k as keyof typeof AMENITY]);

  const orientacion = input.orientacion ? `al ${input.orientacion}` : null;
  const detalles = [
    DISPOSICION[input.disposicion],
    orientacion,
    input.vista && VISTA[input.vista],
    input.expensas && `expensas ${input.expensas}`,
    input.cochera !== "no" && COCHERA[input.cochera],
  ].filter(Boolean).join(", ");

  const lineas: { t: string; v: string | null; d?: string | null }[] = [
    { t: "Barrio", v: input.barrio || null, d: input.barrio ? input.direccion?.trim() || null : null },
    { t: "Superficie", v: input.m2Cubiertos > 0 ? `${num(input.m2Cubiertos)} m² cubiertos` : null, d: extras || null },
    { t: "Distribución", v: paso > 2 || ambientes ? [ambientes, banos].filter(Boolean).join(" · ") : null },
    {
      t: "Piso",
      v: paso > 2 ? (input.piso === 0 ? "Planta baja" : `${input.piso}° piso`) : null,
      d: paso > 2 ? [input.ascensor ? "con ascensor" : "sin ascensor", input.ultimoPiso && "último piso"].filter(Boolean).join(", ") : null,
    },
    { t: "Edificio", v: paso > 3 ? obra : null, d: paso > 3 ? CATEGORIA[input.categoria] : null },
    { t: "Amenities", v: paso > 3 ? (amenities.length ? amenities.join(" · ") : "Sin amenities") : null },
    { t: "Detalles", v: paso > 4 ? detalles.charAt(0).toUpperCase() + detalles.slice(1) : null },
    { t: "A nombre de", v: nombre || null },
  ];

  const p = confianza ? PRECISION[confianza] : null;

  return (
    <aside className="ts-ficha" aria-label="Ficha de la unidad">
      <div className={`ts-ficha-sello${emitiendo ? " is-sellando" : ""}`} aria-hidden="true">
        {emitiendo ? (
          <SelloEN size={96} tono="claro" etiqueta="" />
        ) : (
          <span className="ts-sello-espera">
            <span>EN</span>
          </span>
        )}
      </div>

      <header className="ts-ficha-cab">
        <span className="ts-ficha-k">Ficha de la unidad</span>
        <h3 className="ts-ficha-t">Estimación <em>de valor</em></h3>
        <span className="ts-ficha-sub">Departamento · Ciudad de Buenos Aires</span>
      </header>
      <div className="ts-doble" aria-hidden="true" />

      <dl className="ts-lineas">
        {lineas.map(l => (
          <div key={l.t} className="ts-linea" data-lleno={!!l.v}>
            <dt>{l.t}</dt>
            <dd>
              {l.v ? <span key={l.v} className="ts-linea-v">{l.v}</span> : <span className="ts-linea-vacia">—</span>}
              {l.d && <small key={l.d}>{l.d}</small>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="ts-precision" data-nivel={p?.n ?? 0}>
        <div className="ts-precision-cab">
          <span className="ts-rotulo">Precisión de la estimación</span>
          <strong>{p ? p.l : "—"}</strong>
        </div>
        <div className="ts-precision-riel" aria-hidden="true">
          <span /><span /><span />
        </div>
        <p>{p ? p.d : "Elegí el barrio para empezar."}</p>
      </div>
    </aside>
  );
}
