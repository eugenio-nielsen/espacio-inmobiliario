export interface GeoResult {
  lat: number;
  lng: number;
  aproximada: boolean;
}

/**
 * Geocodifica una dirección usando Nominatim (OpenStreetMap).
 * Si hay dirección exacta la usa; si no, usa barrio + ciudad.
 */
export async function geocodeProperty(opts: {
  direccion?: string | null;
  barrio?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
}): Promise<GeoResult | null> {
  const { direccion, barrio, ciudad, provincia } = opts;

  const queries: Array<{ q: string; aproximada: boolean }> = [];

  // Intento 1: dirección exacta
  if (direccion && (barrio || ciudad)) {
    queries.push({
      q: [direccion, barrio, ciudad, provincia, "Argentina"].filter(Boolean).join(", "),
      aproximada: false,
    });
  }

  // Intento 2: barrio/localidad
  if (barrio || ciudad) {
    queries.push({
      q: [barrio, ciudad, provincia, "Argentina"].filter(Boolean).join(", "),
      aproximada: true,
    });
  }

  for (const { q, aproximada } of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ar`;
      const res = await fetch(url, {
        headers: { "User-Agent": "EspacioInmobiliario/1.0 (eugenio@espacioinmobiliario.com.ar)" },
        next: { revalidate: 86400 }, // cachear 24h — las direcciones no cambian
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), aproximada };
      }
    } catch {
      continue;
    }
  }

  return null;
}
