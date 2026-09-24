import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marca en cada propiedad de un listado si la identidad de su dueño está
 * validada, para que la tarjeta muestre el sello.
 *
 * Es una sola consulta a profiles por listado (los dueños distintos, no
 * uno por tarjeta). Va aparte del SELECT de propiedades a propósito, como
 * en la ficha: si la consulta falla, el listado se muestra igual y solo
 * se apaga el sello, en vez de romper la página entera.
 */
export async function conPropietarioVerificado<T extends { owner_id: string }>(
  supabase: SupabaseClient,
  propiedades: T[]
): Promise<(T & { propietario_verificado: boolean })[]> {
  const duenos = [...new Set(propiedades.map(p => p.owner_id))];
  let verificados = new Set<string>();

  if (duenos.length) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .in("id", duenos)
      .eq("identidad_estado", "aprobada");
    if (!error && data) verificados = new Set(data.map(d => d.id as string));
  }

  return propiedades.map(p => ({ ...p, propietario_verificado: verificados.has(p.owner_id) }));
}
