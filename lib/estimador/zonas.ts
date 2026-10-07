import type { EstimadorConfig, ZonaMicro } from "./types";

const RADIO_TIERRA_M = 6371000;
const aRad = (g: number) => (g * Math.PI) / 180;

/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanciaM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = aRad(b.lat - a.lat);
  const dLng = aRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aRad(a.lat)) * Math.cos(aRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** Zonas activas definidas para un barrio. */
export function zonasDelBarrio(config: EstimadorConfig, barrio: string): ZonaMicro[] {
  return (config.zonas ?? []).filter((z) => z.activa && z.barrio === barrio);
}

/**
 * La zona del barrio que contiene al punto. Si el punto cae en más de una
 * (círculos superpuestos), gana la que lo tiene más cerca de su centro en
 * proporción a su radio: la más específica.
 */
export function zonaDelPunto(
  config: EstimadorConfig,
  barrio: string,
  punto: { lat: number; lng: number },
): ZonaMicro | null {
  let mejor: { zona: ZonaMicro; cercania: number } | null = null;
  for (const z of zonasDelBarrio(config, barrio)) {
    const d = distanciaM(punto, z);
    if (d > z.radioM) continue;
    const cercania = d / z.radioM;
    if (!mejor || cercania < mejor.cercania) mejor = { zona: z, cercania };
  }
  return mejor?.zona ?? null;
}
