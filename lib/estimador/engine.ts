import type {
  EstimadorInput, EstimadorConfig, EstimadorResultado,
  Factor, FactorAplicado, NivelConfianza,
} from "./types";

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

function calcularConfianza(input: EstimadorInput, tienePrecioBarrio: boolean): NivelConfianza {
  if (!tienePrecioBarrio) return "baja";
  // Completitud de datos clave (cuantos más completos, mayor confianza)
  let faltantes = 0;
  if (!input.m2Cubiertos || input.m2Cubiertos <= 0) faltantes++;
  if (input.antiguedad == null) faltantes++;
  if (!input.estado) faltantes++;
  if (!input.categoria) faltantes++;
  if (!input.disposicion) faltantes++;
  if (input.piso == null) faltantes++;
  if (!input.orientacion) faltantes++;
  if (!input.vista) faltantes++;
  if (!input.expensas) faltantes++;
  if (!input.ambientes) faltantes++;
  if (faltantes === 0) return "alta";
  if (faltantes <= 3) return "media";
  return "baja";
}

export function estimarPrecio(
  input: EstimadorInput,
  precios: Record<string, number>,
  config: EstimadorConfig,
): EstimadorResultado | { error: string } {
  const precioM2 = precios[input.barrio];
  if (!precioM2 || precioM2 <= 0) {
    return { error: `No hay un precio de referencia cargado para el barrio "${input.barrio}".` };
  }
  if (!input.m2Cubiertos || input.m2Cubiertos <= 0) {
    return { error: "Los metros cubiertos deben ser mayores a 0." };
  }

  // 1. Precio de referencia ajustado por condición de obra (usado / a estrenar / pozo)
  const obraMult = config.estadoObra?.[input.condicionObra] ?? 1;
  const precioM2Ref = precioM2 * obraMult;

  // Valor base (cubierto + balcón ponderado + patio/terraza ponderado)
  const semiFactor = config.superficieSemicubiertaFactor ?? 0.5;
  const descFactor = config.superficieDescubiertaFactor ?? 0.3;
  const valorBase =
    input.m2Cubiertos * precioM2Ref +
    (input.m2Semicubierto || 0) * precioM2Ref * semiFactor +
    (input.m2Descubiertos || 0) * precioM2Ref * descFactor;

  // 2. Índice de ajuste = producto de coeficientes
  let indice = 1;
  const factoresPositivos: FactorAplicado[] = [];
  const factoresNegativos: FactorAplicado[] = [];

  for (const factor of config.factores) {
    if (!factor.activo) continue;
    const resolved = resolveFactor(factor, input);
    if (!resolved) continue;
    indice *= resolved.coef;
    if (resolved.coef === 1) continue; // neutro: no lo mostramos como factor
    const aplicado: FactorAplicado = {
      label: factor.label,
      coef: resolved.coef,
      detalle: resolved.detalle,
      positivo: resolved.coef > 1,
    };
    (resolved.coef > 1 ? factoresPositivos : factoresNegativos).push(aplicado);
  }

  indice = clamp(indice, config.topeMin, config.topeMax);

  // 3. Valor ajustado y rango
  const estimadoRaw = valorBase * indice;
  const estimado = roundMiles(estimadoRaw);

  const confianza = calcularConfianza(input, true);
  const spread = config.rango[confianza];

  return {
    estimado,
    rangoMin: roundMiles(estimadoRaw * (1 - spread)),
    rangoMax: roundMiles(estimadoRaw * (1 + spread)),
    precioM2Resultante: Math.round(estimadoRaw / input.m2Cubiertos),
    precioM2Referencia: Math.round(precioM2Ref),
    valorBase: roundMiles(valorBase),
    indiceAjuste: Number(indice.toFixed(3)),
    ajustePct: Math.round((indice - 1) * 100),
    confianza,
    // ordenar por impacto
    factoresPositivos: factoresPositivos.sort((a, b) => b.coef - a.coef),
    factoresNegativos: factoresNegativos.sort((a, b) => a.coef - b.coef),
  };
}
