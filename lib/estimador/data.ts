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

/** Config del modelo desde Supabase, con fallback al default. */
export async function getEstimadorConfig(): Promise<EstimadorConfig> {
  const supabase = await createClient();
  const { data } = await supabase.from("estimador_config").select("config").eq("id", 1).maybeSingle();
  if (data?.config) return data.config as EstimadorConfig;
  return DEFAULT_CONFIG;
}

/** Lista de barrios con precio cargado (ordenada). */
export async function getBarriosDisponibles(): Promise<string[]> {
  const precios = await getPreciosBarrios();
  return Object.keys(precios).sort((a, b) => a.localeCompare(b, "es"));
}
