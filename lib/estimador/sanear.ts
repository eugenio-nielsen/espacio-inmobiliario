import type { EstimadorInput } from "./types";

/**
 * El input llega del navegador y no se puede dar por bueno: acá se lleva a
 * la forma que espera el motor. Los números fuera de rango se descartan (el
 * dato queda "no informado") y los textos fuera de lista también. Solo la
 * superficie cubierta y el barrio son obligatorios.
 */

const ENUMS = {
  condicionObra: ["usado", "a_estrenar", "pozo"],
  estado: ["a_reciclar", "bueno", "muy_bueno", "excelente"],
  categoria: ["regular", "estandar", "premium"],
  disposicion: ["frente", "contrafrente", "interno"],
  vista: ["abierta", "despejada", "a_la_calle", "interna"],
  expensas: ["bajas", "medias", "altas"],
  cochera: ["no", "descubierta", "movil", "fija"],
  calefaccion: ["losa", "central", "individual", "sin"],
  ocupacion: ["libre", "alquilada", "ocupada"],
  situacionDominial: ["escritura", "sucesion", "observaciones"],
  orientacion: ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"],
} as const;

const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined;

function lista<K extends keyof typeof ENUMS>(v: unknown, k: K): (typeof ENUMS)[K][number] | "" {
  return typeof v === "string" && (ENUMS[k] as readonly string[]).includes(v) ? (v as (typeof ENUMS)[K][number]) : "";
}

export function sanearInput(raw: unknown): EstimadorInput | { error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const barrio = typeof r.barrio === "string" ? r.barrio.trim().slice(0, 80) : "";
  if (!barrio) return { error: "Falta el barrio." };

  const cubiertos = num(r.m2Cubiertos, 1, 2000);
  if (cubiertos == null) return { error: "Los metros cubiertos deben estar entre 1 y 2.000." };

  const am = (r.amenities && typeof r.amenities === "object" ? r.amenities : {}) as Record<string, unknown>;
  const condicionObra = lista(r.condicionObra, "condicionObra") || "usado";

  return {
    barrio,
    direccion: typeof r.direccion === "string" ? r.direccion.trim().slice(0, 160) : "",
    m2Cubiertos: cubiertos,
    m2Semicubierto: num(r.m2Semicubierto, 0, 2000) ?? 0,
    m2Descubiertos: num(r.m2Descubiertos, 0, 2000) ?? 0,
    ambientes: num(r.ambientes, 1, 20),
    dormitorios: num(r.dormitorios, 0, 20),
    banos: num(r.banos, 1, 20),
    antiguedad: num(r.antiguedad, 0, 150),
    condicionObra,
    estado: lista(r.estado, "estado"),
    piso: num(r.piso, 0, 80),
    ultimoPiso: r.ultimoPiso === true,
    // Sin dato se asume con ascensor (lo habitual): "sin ascensor" es el que resta
    ascensor: r.ascensor !== false,
    disposicion: lista(r.disposicion, "disposicion"),
    orientacion: lista(r.orientacion, "orientacion"),
    vista: lista(r.vista, "vista"),
    cochera: lista(r.cochera, "cochera") || "no",
    baulera: r.baulera === true,
    dependenciaServicio: r.dependenciaServicio === true,
    calefaccion: lista(r.calefaccion, "calefaccion"),
    expensas: lista(r.expensas, "expensas"),
    aptoCredito: r.aptoCredito === true,
    ocupacion: lista(r.ocupacion, "ocupacion"),
    situacionDominial: lista(r.situacionDominial, "situacionDominial"),
    vecinosEspeciales: r.vecinosEspeciales === true,
    categoria: lista(r.categoria, "categoria"),
    amenities: {
      pileta: am.pileta === true,
      sum: am.sum === true,
      gimnasio: am.gimnasio === true,
      seguridad: am.seguridad === true,
      parrilla: am.parrilla === true,
    },
  };
}
