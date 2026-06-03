"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoResult } from "@/lib/utils/geocode";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 240, background: "var(--navy-50)",
      borderRadius: "var(--radius-lg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-400)" }}>
        Cargando mapa…
      </span>
    </div>
  ),
});

interface Props {
  direccion: string;
  barrio: string;
  ciudad: string;
  provincia: string;
}

export default function MapFormPreview({ direccion, barrio, ciudad, provincia }: Props) {
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!barrio && !ciudad) { setGeo(null); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const queries: Array<{ q: string; aproximada: boolean }> = [];

        if (direccion && (barrio || ciudad)) {
          queries.push({
            q: [direccion, barrio, ciudad, provincia, "Argentina"].filter(Boolean).join(", "),
            aproximada: false,
          });
        }
        queries.push({
          q: [barrio, ciudad, provincia, "Argentina"].filter(Boolean).join(", "),
          aproximada: true,
        });

        for (const { q, aproximada } of queries) {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ar`,
            { headers: { "User-Agent": "EspacioInmobiliario/1.0" } }
          );
          const data = await res.json();
          if (data?.[0]) {
            setGeo({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), aproximada });
            break;
          }
        }
      } catch {
        // silencioso — el mapa simplemente no se muestra
      } finally {
        setLoading(false);
      }
    }, 800); // debounce 800ms

    return () => clearTimeout(timer);
  }, [direccion, barrio, ciudad, provincia]);

  if (!barrio && !ciudad) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 12.5,
          color: "var(--ink-500)", margin: 0,
        }}>
          Vista previa de la ubicación en el mapa
        </p>
        {loading && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)" }}>
            Buscando…
          </span>
        )}
      </div>

      {geo ? (
        <PropertyMap
          lat={geo.lat}
          lng={geo.lng}
          aproximada={geo.aproximada}
          height={240}
          zoom={15}
        />
      ) : !loading ? (
        <div style={{
          height: 100, background: "var(--navy-50)",
          borderRadius: "var(--radius-lg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px dashed var(--line-200)",
        }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-400)" }}>
            No se encontró la ubicación en el mapa
          </span>
        </div>
      ) : null}
    </div>
  );
}
