import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONFIG } from "./config.default";
import type { EstimadorConfig } from "./types";

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
    factores: [...(saved.factores ?? [])],
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
