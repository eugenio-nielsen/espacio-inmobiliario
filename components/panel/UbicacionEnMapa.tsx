"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, LocateFixed } from "lucide-react";
import type { Enfoque } from "@/components/map/MapaSelector";
import "./ubicacion.css";

const MapaSelector = dynamic(() => import("@/components/map/MapaSelector"), {
  ssr: false,
  loading: () => <div className="ub-mapa ub-cargando" style={{ height: 300 }}>Cargando mapa…</div>,
});

type Origen = "guardada" | "direccion" | "barrio" | "manual" | null;
type Punto = { lat: number; lng: number };

/** Vista inicial cuando todavía no hay nada que mostrar: el AMBA. */
const AMBA: Enfoque = { lat: -34.62, lng: -58.45, zoom: 10, n: 0 };

/**
 * Ubicación de la propiedad en el formulario.
 *
 * Mientras se escribe la dirección, el pin la sigue (búsqueda en
 * OpenStreetMap). Pero el buscador no encuentra islas del Delta, lotes
 * sin calle ni barrios nuevos: para eso se toca el mapa o se arrastra el
 * pin, y desde ese momento la dirección ya no lo mueve. "Ubicar según la
 * dirección" vuelve al modo automático.
 *
 * En una publicación guardada arranca con su ubicación y no busca nada
 * hasta que se edita la dirección o el barrio.
 *
 * El punto viaja al servidor en campos ocultos (lat, lng, geo_aproximada)
 * y manda sobre la geocodificación (lib/actions/properties.ts).
 */
export default function UbicacionEnMapa({
  direccion,
  barrio,
  zona,
  inicial,
}: {
  direccion: string;
  barrio: string;
  zona: string;
  inicial?: { lat: number; lng: number; aproximada: boolean } | null;
}) {
  const [pos, setPos] = useState<Punto | null>(inicial ? { lat: inicial.lat, lng: inicial.lng } : null);
  const [aproximada, setAproximada] = useState(inicial?.aproximada ?? false);
  const [origen, setOrigen] = useState<Origen>(inicial ? "guardada" : null);
  const [enfoque, setEnfoque] = useState<Enfoque>(
    inicial ? { lat: inicial.lat, lng: inicial.lng, zoom: inicial.aproximada ? 14 : 16, n: 0 } : AMBA
  );
  const [buscando, setBuscando] = useState(false);
  const [sinResultado, setSinResultado] = useState(false);

  // El efecto de búsqueda lee el origen actual sin re-dispararse por él
  const origenRef = useRef<Origen>(origen);
  origenRef.current = origen;
  const primeraVez = useRef(true);

  async function buscar() {
    if (!barrio) return;
    setBuscando(true);
    setSinResultado(false);
    const intentos: { q: string; aproximada: boolean }[] = [];
    if (direccion.trim()) {
      intentos.push({ q: [direccion, barrio, zona, "Argentina"].filter(Boolean).join(", "), aproximada: false });
    }
    intentos.push({ q: [barrio, zona, "Argentina"].filter(Boolean).join(", "), aproximada: true });

    try {
      for (const { q, aproximada: aprox } of intentos) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ar`
        );
        const data = await res.json();
        if (data?.[0]) {
          const punto = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          // Si mientras buscaba alguien marcó a mano, gana lo marcado
          if (origenRef.current === "manual") return;
          setPos(punto);
          setAproximada(aprox);
          setOrigen(aprox ? "barrio" : "direccion");
          setEnfoque(e => ({ ...punto, zoom: aprox ? 14 : 16, n: e.n + 1 }));
          return;
        }
      }
      setSinResultado(true);
    } catch {
      setSinResultado(true);
    } finally {
      setBuscando(false);
    }
  }

  // Seguir la dirección mientras no se haya marcado a mano
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      if (inicial) return; // publicación guardada: arranca con su ubicación
    }
    if (origenRef.current === "manual" || !barrio) return;
    const t = setTimeout(buscar, 800);
    return () => clearTimeout(t);
    // buscar lee direccion/barrio/zona del render actual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion, barrio, zona]);

  function elegir(lat: number, lng: number) {
    setPos({ lat, lng });
    setAproximada(false);
    setOrigen("manual");
    setSinResultado(false);
  }

  function volverALaDireccion() {
    setOrigen(null);
    origenRef.current = null;
    void buscar();
  }

  const estado =
    origen === "manual" ? "Ubicación marcada a mano: se guarda exactamente donde está el pin."
      : origen === "direccion" ? "Ubicada según la dirección. Si no coincide, arrastrá el pin al lugar exacto."
      : origen === "barrio" ? (direccion.trim()
          ? `No encontramos la dirección: el pin está en el centro de ${barrio} y la ficha muestra solo la zona. Tocá el mapa donde está la propiedad.`
          : `El pin está en el centro de ${barrio} y la ficha muestra solo la zona. Escribí la dirección o tocá el mapa donde está la propiedad.`)
      : origen === "guardada" ? (aproximada
          ? "Ubicación guardada como aproximada (zona del barrio). Tocá el mapa para marcar el lugar exacto."
          : "Ubicación guardada. Tocá el mapa o arrastrá el pin para cambiarla.")
      : sinResultado ? "No encontramos esa ubicación en el mapa. Tocá el mapa para marcarla."
      : "Elegí la zona y el barrio, o tocá el mapa para marcar la ubicación.";

  return (
    <div className="ub">
      <div className="ub-cabeza">
        <p className="ub-titulo">
          <Crosshair size={15} strokeWidth={1.8} />
          Ubicación en el mapa
        </p>
        {buscando && <span className="ub-buscando">Buscando…</span>}
      </div>
      <p className="ub-ayuda">
        Tocá el mapa para poner el pin o arrastralo para ajustarlo. Sirve para lotes, islas del
        Delta o calles que el buscador no encuentra.
      </p>

      <MapaSelector pos={pos} aproximada={aproximada} enfoque={enfoque} onElegir={elegir} />

      <div className="ub-pie">
        <p className={`ub-estado${origen === "manual" ? " ub-estado-ok" : ""}`}>{estado}</p>
        {(origen === "manual" || origen === "guardada") && barrio && (
          <button type="button" className="ub-boton" onClick={volverALaDireccion} disabled={buscando}>
            <LocateFixed size={14} strokeWidth={1.8} />
            Ubicar según la dirección
          </button>
        )}
      </div>

      {pos && (
        <>
          <input type="hidden" name="lat" value={pos.lat.toFixed(6)} />
          <input type="hidden" name="lng" value={pos.lng.toFixed(6)} />
          <input type="hidden" name="geo_aproximada" value={String(aproximada)} />
        </>
      )}
    </div>
  );
}
