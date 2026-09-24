"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { pinIcon } from "./pin";

export type Enfoque = { lat: number; lng: number; zoom: number; n: number };

/**
 * Mapa del formulario donde se marca la ubicación: se toca el mapa para
 * poner el pin o se arrastra el pin para ajustarlo.
 *
 * Solo mueve la vista cuando cambia `enfoque.n` (una búsqueda por
 * dirección, por ejemplo). Al tocar o arrastrar no recentra: el mapa
 * saltando bajo el dedo haría imposible afinar el lugar.
 */
function Enfocar({ enfoque }: { enfoque: Enfoque }) {
  const map = useMap();
  useEffect(() => {
    map.setView([enfoque.lat, enfoque.lng], enfoque.zoom);
    // Solo cuando se pide un enfoque nuevo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfoque.n, map]);
  return null;
}

function AlTocar({ onElegir }: { onElegir: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onElegir(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapaSelector({
  pos,
  aproximada,
  enfoque,
  onElegir,
  height = 300,
}: {
  pos: { lat: number; lng: number } | null;
  aproximada: boolean;
  enfoque: Enfoque;
  onElegir: (lat: number, lng: number) => void;
  height?: number;
}) {
  return (
    <div className="ub-mapa" style={{ height }}>
      <MapContainer
        center={[enfoque.lat, enfoque.lng]}
        zoom={enfoque.zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Enfocar enfoque={enfoque} />
        <AlTocar onElegir={onElegir} />
        {pos && aproximada && (
          <Circle
            center={[pos.lat, pos.lng]}
            radius={400}
            pathOptions={{ color: "#0E2C50", fillColor: "#0E2C50", fillOpacity: 0.1, weight: 1.5 }}
          />
        )}
        {pos && (
          <Marker
            position={[pos.lat, pos.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: e => {
                const { lat, lng } = e.target.getLatLng();
                onElegir(lat, lng);
              },
            }}
          />
        )}
      </MapContainer>
      <span className="ub-atribucion">© OpenStreetMap</span>
    </div>
  );
}
