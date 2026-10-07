import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONFIG } from "./config.default";
import type { EstimadorConfig } from "./types";
import { getPreciosConFecha } from "@/lib/mercado";

/** Mapa { barrio: precio_m2_usd } desde Supabase. */
export async function getPreciosBarrios(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("barrio_precios").select("barrio, precio_m2_usd");
  const map: Record<string, number> = {};
  for (const row of data || []) map[row.barrio] = row.precio_m2_usd;
  return map;
}

/**
 * Mergea una config guardada con el default:
 * - completa parámetros top-level que falten (ej. factores nuevos agregados en código)
 * - agrega factores del default que no existan (por id) en la config guardada
 * Preserva siempre los valores que el admin ya editó.
 */
function mergeConfig(saved: EstimadorConfig): EstimadorConfig {
  const merged: EstimadorConfig = {
    version: DEFAULT_CONFIG.version,
    superficieSemicubiertaFactor: saved.superficieSemicubiertaFactor ?? DEFAULT_CONFIG.superficieSemicubiertaFactor,
    superficieDescubiertaFactor: saved.superficieDescubiertaFactor ?? DEFAULT_CONFIG.superficieDescubiertaFactor,
    estadoObra: saved.estadoObra ?? DEFAULT_CONFIG.estadoObra,
    topeMin: saved.topeMin ?? DEFAULT_CONFIG.topeMin,
    topeMax: saved.topeMax ?? DEFAULT_CONFIG.topeMax,
    rango: saved.rango ?? DEFAULT_CONFIG.rango,
    // Config guardada antes de que existieran los topes: se completan con los del default
    topesGrupo: saved.topesGrupo ?? DEFAULT_CONFIG.topesGrupo,
    zonas: saved.zonas ?? [],
    factores: (saved.factores ?? []).map(f => ({
      ...f,
      grupo: f.grupo ?? DEFAULT_CONFIG.factores.find(d => d.id === f.id)?.grupo,
    })),
  };
  const ids = new Set(merged.factores.map(f => f.id));
  for (const f of DEFAULT_CONFIG.factores) {
    if (!ids.has(f.id)) merged.factores.push(f);
  }
  return merged;
}

/**
 * Config del modelo desde Supabase.
 * Si la versión guardada difiere de la del código, se migra al nuevo default
 * (el modelo v2 reemplaza el tuning viejo por una base profesional). Los precios
 * por barrio viven en otra tabla y no se tocan.
 */
export async function getEstimadorConfig(): Promise<EstimadorConfig> {
  const supabase = await createClient();
  const { data } = await supabase.from("estimador_config").select("config").eq("id", 1).maybeSingle();
  const saved = data?.config as EstimadorConfig | undefined;
  if (saved && saved.version === DEFAULT_CONFIG.version) return mergeConfig(saved);
  return DEFAULT_CONFIG;
}

/** Lista de barrios con precio cargado (ordenada). */
export async function getBarriosDisponibles(): Promise<string[]> {
  const precios = await getPreciosBarrios();
  return Object.keys(precios).sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Lo que necesita el tasador para armarse: los barrios con precio, cuáles
 * tienen zonas cargadas (ahí la dirección ajusta el valor) y cuándo se
 * actualizaron por última vez los precios de referencia.
 */
export async function getContextoTasador(): Promise<{ barrios: string[]; barriosConZonas: string[]; actualizado: string | null }> {
  const [filas, config] = await Promise.all([getPreciosConFecha(), getEstimadorConfig()]);
  const barrios = filas.map(f => f.barrio).sort((a, b) => a.localeCompare(b, "es"));
  const barriosConZonas = [...new Set((config.zonas ?? []).filter(z => z.activa).map(z => z.barrio))];
  const actualizado = filas.reduce<string | null>((max, f) => (!max || f.actualizado > max ? f.actualizado : max), null);
  return { barrios, barriosConZonas, actualizado };
}
