import { BARRIOS_CABA } from "@/lib/ubicaciones";

export type Ubicacion = { lat: number; lng: number; barrioDetectado?: string };

// Caja de la Ciudad de Buenos Aires (oeste, norte, este, sur): evita que
// "Santa Fe 1234" se resuelva en la provincia de Santa Fe.
const CABA_CAJA = { oeste: -58.54, norte: -34.52, este: -58.33, sur: -34.71 };

const norm = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

type RespuestaNominatim = {
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

/**
 * Ubica una dirección de la Ciudad con Nominatim (OpenStreetMap). Devuelve
 * null si no la encuentra a nivel de calle: una coincidencia que solo
 * resuelve el barrio no sirve para ajustar por zona, y es mejor decir "no
 * la ubicamos" que inventar un punto.
 *
 * También detecta si el mapa asigna la dirección a otro barrio que el elegido,
 * pero solo cuando el nombre detectado es un barrio porteño reconocido: así
 * una subdivisión como "Palermo Soho" no dispara un falso aviso.
 *
 * Nunca demora la estimación más de unos segundos: si el servicio no
 * contesta, se sigue con el promedio del barrio.
 */
export async function ubicarDireccion(direccion: string, barrio: string): Promise<Ubicacion | null> {
  const limpia = direccion.replace(/s+/g, " ").trim();
  if (limpia.length < 4) return null;

  // Primero con el barrio (desambigua calles repetidas). Si no aparece, sin el
  // barrio: puede ser que el barrio elegido no sea el de esa dirección, y en
  // ese caso hay que ubicarla igual para poder avisar.
  const r = (await buscar(`${limpia}, ${barrio}`)) ?? (await buscar(limpia));
  if (!r) return null;

  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // ¿El mapa la pone en otro barrio? Solo si es un barrio porteño conocido
  const elegido = norm(barrio);
  const a = r.address!;
  const candidatos = [a.suburb, a.neighbourhood, a.quarter, a.city_district]
    .filter((c): c is string => !!c)
    .map(norm);
  const coincide = candidatos.some((c) => c === elegido || c.includes(elegido) || elegido.includes(c));
  let barrioDetectado: string | undefined;
  if (!coincide) {
    const otro = BARRIOS_CABA.find((b) => candidatos.includes(norm(b)));
    if (otro) barrioDetectado = otro;
  }

  return { lat, lng, ...(barrioDetectado && { barrioDetectado }) };
}

/** Una consulta a Nominatim acotada a la Ciudad. Solo devuelve coincidencias a nivel de calle. */
async function buscar(consulta: string): Promise<RespuestaNominatim | null> {
  const params = new URLSearchParams({
    q: `${consulta}, Ciudad Autónoma de Buenos Aires, Argentina`,
    format: "json",
    limit: "1",
    addressdetails: "1",
    countrycodes: "ar",
    viewbox: `${CABA_CAJA.oeste},${CABA_CAJA.norte},${CABA_CAJA.este},${CABA_CAJA.sur}`,
    bounded: "1",
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "EspacioInmobiliario/1.0 (eugenio@espacioinmobiliario.com.ar)" },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RespuestaNominatim[];
    return data?.[0]?.address?.road ? data[0] : null;
  } catch {
    return null;
  }
}
