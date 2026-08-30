"use server";

import { createClient } from "@/lib/supabase/server";
import { PROPERTY_CARD_COLS, TOPE_HOME, type PropertyCardData } from "@/lib/types";

/**
 * Trae un tramo de propiedades activas para el scroll incremental de la home.
 * La home renderiza solo las primeras en el servidor; el resto se pide
 * a demanda a medida que el usuario baja, para que la carga inicial sea liviana.
 */
export async function cargarMasPropiedades(
  offset: number,
  limit = 6
): Promise<{ ok: true; items: PropertyCardData[] } | { ok: false; error: string }> {
  const desde = Math.max(0, Math.floor(offset));
  const cantidad = Math.min(12, Math.max(1, Math.floor(limit)));

  // Nunca devolver más allá del tope de la home
  if (desde >= TOPE_HOME) return { ok: true, items: [] };
  const hasta = Math.min(desde + cantidad, TOPE_HOME) - 1;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_CARD_COLS)
      .eq("status", "activa")
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    if (error) return { ok: false, error: error.message };
    return { ok: true, items: (data ?? []) as PropertyCardData[] };
  } catch (e) {
    console.error("Error cargando más propiedades:", e);
    return { ok: false, error: "No se pudieron cargar más propiedades." };
  }
}
