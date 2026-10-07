import type {
  EstimadorInput, EstimadorConfig, EstimadorResultado,
  Factor, FactorAplicado, NivelConfianza, UbicacionEstimada,
} from "./types";
import { zonaDelPunto, zonasDelBarrio } from "./zonas";

// Lee un valor del input soportando dot-notation ("amenities.pileta")
function getInputValue(input: EstimadorInput, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, input);
}

// Resuelve el coeficiente y la etiqueta del tramo aplicado para un factor
function resolveFactor(factor: Factor, input: EstimadorInput): { coef: number; detalle: string } | null {
  const value = getInputValue(input, factor.input);

  if (factor.tipo === "booleano") {
    const on = value === true;
    const coef = on ? (factor.coefTrue ?? 1) : (factor.coefFalse ?? 1);
    return { coef, detalle: on ? "Sí" : "No" };
  }

  if (factor.tipo === "opcion") {
    if (value == null || value === "") return null;
    const opt = factor.opciones?.[String(value)];
    if (!opt) return null;
    return { coef: opt.coef, detalle: opt.label };
  }

  if (factor.tipo === "rango") {
    // Sin dato no hay tramo: Number(undefined) es NaN, pero Number(null) y
    // Number("") serían 0 y caerían en el primer tramo.
    if (value == null || value === "") return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    for (const r of factor.rangos ?? []) {
      const okMin = r.min === undefined || num >= r.min;
      const okMax = r.max === undefined || num <= r.max;
      if (okMin && okMax) return { coef: r.coef, detalle: r.label };
    }
    return null;
  }

  return null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Redondea a múltiplos de 1000 (USD) para mostrar valores "limpios"
function roundMiles(n: number) {
  return Math.round(n / 1000) * 1000;
}

/**
 * La antigüedad y el estado de conservación describen a un departamento
 * usado. En uno a estrenar o en pozo ya están contemplados en el multiplicador
 * de obra: aplicarlos también los contaba dos veces.
 */
const SOLO_USADOS = new Set(["antiguedad", "estado"]);

// ── Confianza ──────────────────────────────────────────────────

/** Lo que el contexto aporta a la confianza: la dirección solo suma si de verdad puede afinar el precio. */
export type ContextoConfianza = {
  /** El barrio tiene zonas cargadas: ubicar la dirección puede ajustar el precio. */
  direccionAfina?: boolean;
  /** La dirección se pudo ubicar en el mapa. Sin dato (cliente) se asume que sí si se escribió. */
  ubicada?: boolean;
};

type Campo = {
  label: string;
  /** Cuánto pesa en el valor: los datos que más mueven el precio cuentan más. */
  peso: number;
  respondido: (i: EstimadorInput) => boolean;
  soloUsados?: boolean;
};

const CAMPOS: Campo[] = [
  { label: "categoría del edificio", peso: 12, respondido: (i) => !!i.categoria },
  { label: "estado de conservación", peso: 10, respondido: (i) => !!i.estado, soloUsados: true },
  { label: "piso", peso: 10, respondido: (i) => i.piso != null },
  { label: "antigüedad", peso: 8, respondido: (i) => i.antiguedad != null, soloUsados: true },
  { label: "ocupación", peso: 8, respondido: (i) => !!i.ocupacion },
  { label: "situación de la escritura", peso: 6, respondido: (i) => !!i.situacionDominial },
  { label: "disposición (frente o contrafrente)", peso: 6, respondido: (i) => !!i.disposicion },
  { label: "ambientes", peso: 6, respondido: (i) => !!i.ambientes },
  { label: "vista", peso: 5, respondido: (i) => !!i.vista },
  { label: "expensas", peso: 5, respondido: (i) => !!i.expensas },
  { label: "orientación", peso: 4, respondido: (i) => !!i.orientacion },
  { label: "baños", peso: 3, respondido: (i) => i.banos != null },
  { label: "calefacción", peso: 3, respondido: (i) => !!i.calefaccion },
];

/** Cuánto resta cada incoherencia detectada, hasta un máximo. */
const PENALIZACION = 8;
const PENALIZACION_MAX = 24;

/** Datos que no cierran entre sí: probablemente un error de carga. */
function detectarIncoherencias(i: EstimadorInput): string[] {
  const avisos: string[] = [];
  const cub = i.m2Cubiertos;

  if (cub > 0 && cub < 15) avisos.push("La superficie cubierta es muy chica para un departamento: revisala.");
  if (cub > 400) avisos.push("La superficie cubierta es muy grande para un departamento: revisala.");

  if (i.ambientes && cub > 0) {
    const porAmb = cub / i.ambientes;
    if (porAmb < 9) avisos.push(`${cub} m² parece poco para ${i.ambientes === 1 ? "un monoambiente" : `${i.ambientes} ambientes`}.`);
    // "5 o más" no tiene techo: solo se controla cuando el número es exacto
    else if (i.ambientes < 5 && porAmb > 45) avisos.push(`${cub} m² parece mucho para ${i.ambientes === 1 ? "un monoambiente" : `${i.ambientes} ambientes`}.`);
  }

  if (i.ambientes && i.ambientes < 5 && i.banos != null && i.banos > i.ambientes) {
    avisos.push("Hay más baños que ambientes.");
  }

  if (cub > 0 && (i.m2Semicubierto || 0) + (i.m2Descubiertos || 0) > cub) {
    avisos.push("El balcón y el patio suman más que la superficie cubierta.");
  }

  return avisos;
}

export type EvaluacionConfianza = {
  nivel: NivelConfianza;
  puntaje: number;
  faltantes: string[];
  advertencias: string[];
};

/**
 * Qué tan firme es la estimación, a partir de lo que de verdad se respondió
 * (ya no hay valores por defecto que cuenten como respuesta) y de que los datos
 * sean coherentes entre sí. Exportada para que el tasador muestre la precisión
 * mientras se completa: el cliente calcula lo mismo que devuelve el servidor.
 */
export function evaluarConfianza(input: EstimadorInput, tienePrecioBarrio: boolean, ctx: ContextoConfianza = {}): EvaluacionConfianza {
  const advertencias = detectarIncoherencias(input);
  if (!tienePrecioBarrio) return { nivel: "baja", puntaje: 0, faltantes: [], advertencias };

  const usado = input.condicionObra === "usado";
  const direccion: Campo = {
    label: "dirección",
    peso: 8,
    respondido: (i) => ctx.ubicada ?? !!i.direccion?.trim(),
  };
  const aplican = [...CAMPOS, ...(ctx.direccionAfina ? [direccion] : [])].filter((c) => usado || !c.soloUsados);
  const total = aplican.reduce((s, c) => s + c.peso, 0);
  const respondido = aplican.filter((c) => c.respondido(input)).reduce((s, c) => s + c.peso, 0);
  const faltantes = aplican.filter((c) => !c.respondido(input)).sort((a, b) => b.peso - a.peso).map((c) => c.label);

  const penal = Math.min(PENALIZACION_MAX, advertencias.length * PENALIZACION);
  const puntaje = Math.max(0, Math.round((respondido / total) * 100) - penal);
  const nivel: NivelConfianza = puntaje >= 80 ? "alta" : puntaje >= 50 ? "media" : "baja";
  return { nivel, puntaje, faltantes, advertencias };
}

export function calcularConfianza(input: EstimadorInput, tienePrecioBarrio: boolean): NivelConfianza {
  return evaluarConfianza(input, tienePrecioBarrio).nivel;
}

export function estimarPrecio(
  input: EstimadorInput,
  precios: Record<string, number>,
  config: EstimadorConfig,
  contexto: {
    /** Cuándo se cargó por última vez el precio de referencia de este barrio. */
    precioActualizado?: string;
    /** Dónde cayó la dirección, si la dio y se pudo ubicar. */
    ubicacion?: { lat: number; lng: number; barrioDetectado?: string } | null;
    /** Si se intentó ubicar la dirección y no se pudo. */
    direccionNoUbicada?: boolean;
  } = {},
): EstimadorResultado | { error: string } {
  const { precioActualizado, ubicacion, direccionNoUbicada } = contexto;
  const precioM2 = precios[input.barrio];
  if (!precioM2 || precioM2 <= 0) {
    return { error: `No hay un precio de referencia cargado para el barrio "${input.barrio}".` };
  }
  if (!input.m2Cubiertos || input.m2Cubiertos <= 0) {
    return { error: "Los metros cubiertos deben ser mayores a 0." };
  }

  // 1. Precio de referencia ajustado por zona (si la dirección cae en una de
  // las zonas del barrio) y por condición de obra (usado / a estrenar / pozo)
  const zona = ubicacion ? zonaDelPunto(config, input.barrio, ubicacion) : null;
  const obraMult = config.estadoObra?.[input.condicionObra] ?? 1;
  const precioM2Ref = precioM2 * (zona?.coef ?? 1) * obraMult;

  // Valor base (cubierto + balcón ponderado + patio/terraza ponderado)
  const semiFactor = config.superficieSemicubiertaFactor ?? 0.5;
  const descFactor = config.superficieDescubiertaFactor ?? 0.3;
  const valorBase =
    input.m2Cubiertos * precioM2Ref +
    (input.m2Semicubierto || 0) * precioM2Ref * semiFactor +
    (input.m2Descubiertos || 0) * precioM2Ref * descFactor;

  // 2. Índice de ajuste = producto de coeficientes. Los factores de un mismo
  // grupo se multiplican entre sí y ese producto se topea antes de entrar al
  // índice general (los amenities, por ejemplo, no pueden sumar sin límite).
  const usado = input.condicionObra === "usado";
  const factoresPositivos: FactorAplicado[] = [];
  const factoresNegativos: FactorAplicado[] = [];
  const porGrupo: Record<string, number> = {};
  let indice = 1;

  for (const factor of config.factores) {
    if (!factor.activo) continue;
    if (!usado && SOLO_USADOS.has(factor.input)) continue;
    const resolved = resolveFactor(factor, input);
    if (!resolved) continue;
    if (factor.grupo && config.topesGrupo?.[factor.grupo]) {
      porGrupo[factor.grupo] = (porGrupo[factor.grupo] ?? 1) * resolved.coef;
    } else {
      indice *= resolved.coef;
    }
    if (resolved.coef === 1) continue; // neutro: no lo mostramos como factor
    const aplicado: FactorAplicado = {
      label: factor.label,
      coef: resolved.coef,
      detalle: resolved.detalle,
      positivo: resolved.coef > 1,
    };
    (resolved.coef > 1 ? factoresPositivos : factoresNegativos).push(aplicado);
  }

  const topesAplicados: EstimadorResultado["topesAplicados"] = [];
  for (const [grupo, antes] of Object.entries(porGrupo)) {
    const tope = config.topesGrupo![grupo];
    const despues = clamp(antes, tope.min ?? -Infinity, tope.max ?? Infinity);
    if (Math.abs(despues - antes) > 1e-9) {
      topesAplicados.push({ grupo, label: tope.label, antes: Number(antes.toFixed(3)), despues: Number(despues.toFixed(3)) });
    }
    indice *= despues;
  }

  indice = clamp(indice, config.topeMin, config.topeMax);

  // 3. Valor ajustado y rango. El rango se estrecha o se abre de forma continua
  // con el puntaje de confianza: de ±(alta) con todos los datos a ±(baja) sin ninguno.
  const estimadoRaw = valorBase * indice;
  const estimado = roundMiles(estimadoRaw);

  const hayZonas = zonasDelBarrio(config, input.barrio).length > 0;
  const conf = evaluarConfianza(input, true, { direccionAfina: hayZonas, ubicada: !!ubicacion });
  const advertencias = [...conf.advertencias];
  if (direccionNoUbicada) {
    advertencias.push("No pudimos ubicar la dirección en el mapa: usamos el valor promedio del barrio.");
  }
  if (ubicacion?.barrioDetectado) {
    advertencias.push(`El mapa ubica la dirección en ${ubicacion.barrioDetectado}, no en ${input.barrio}: revisá cuál es el barrio correcto.`);
  }
  const ubicacionResultado: UbicacionEstimada | undefined = ubicacion
    ? { ...ubicacion, ...(zona && { zona: { nombre: zona.nombre, coef: zona.coef } }) }
    : undefined;
  const spread = config.rango.baja - (config.rango.baja - config.rango.alta) * (conf.puntaje / 100);

  return {
    estimado,
    rangoMin: roundMiles(estimadoRaw * (1 - spread)),
    rangoMax: roundMiles(estimadoRaw * (1 + spread)),
    precioM2Resultante: Math.round(estimadoRaw / input.m2Cubiertos),
    precioM2Referencia: Math.round(precioM2Ref),
    valorBase: roundMiles(valorBase),
    indiceAjuste: Number(indice.toFixed(3)),
    ajustePct: Math.round((indice - 1) * 100),
    confianza: conf.nivel,
    puntaje: conf.puntaje,
    faltantes: conf.faltantes,
    advertencias,
    topesAplicados,
    ...(precioActualizado && { precioActualizado }),
    ...(ubicacionResultado && { ubicacion: ubicacionResultado }),
    // ordenar por impacto
    factoresPositivos: factoresPositivos.sort((a, b) => b.coef - a.coef),
    factoresNegativos: factoresNegativos.sort((a, b) => a.coef - b.coef),
  };
}
