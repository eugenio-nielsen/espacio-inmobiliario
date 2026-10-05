import { createClient } from "@/lib/supabase/server";
import { BARRIOS_CABA } from "@/lib/ubicaciones";

export type PrecioBarrio = { barrio: string; precio: number; actualizado: string };

/** Precios de referencia por m² de cada barrio, con la fecha de la última carga. */
export async function getPreciosConFecha(): Promise<PrecioBarrio[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("barrio_precios").select("barrio, precio_m2_usd, updated_at");
  return (data || []).map((r) => ({ barrio: r.barrio, precio: r.precio_m2_usd, actualizado: r.updated_at }));
}

export const fmtUsd = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n));

/** Superficies de ejemplo (m² cubiertos) que se muestran en cada barrio. */
export const SUPERFICIES_EJEMPLO = [40, 60, 80] as const;

export type ResumenBarrio = {
  precio: number;
  /** Posición en el ranking de CABA, de más caro (1) a más barato. */
  puesto: number;
  total: number;
  promedio: number;
  /** Diferencia porcentual contra el promedio de CABA (positiva = más caro). */
  difPct: number;
  ejemplos: { m2: number; valor: number }[];
};

/** Posiciona a un barrio frente al resto de CABA. Null si no tiene precio cargado. */
export function resumenBarrio(nombre: string, precios: Record<string, number>): ResumenBarrio | null {
  const precio = precios[nombre];
  if (!precio) return null;
  const valores = BARRIOS_CABA.map((b) => precios[b]).filter((v): v is number => !!v);
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  const puesto = valores.filter((v) => v > precio).length + 1;
  return {
    precio,
    puesto,
    total: valores.length,
    promedio,
    difPct: Math.round(((precio - promedio) / promedio) * 100),
    ejemplos: SUPERFICIES_EJEMPLO.map((m2) => ({ m2, valor: m2 * precio })),
  };
}
