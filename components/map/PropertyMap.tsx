"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Pin SVG con color navy institucional #0E2C50
const icon = L.divIcon({
  className: "",
  html: `
    <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.627 14.016 26.25 15.285 27.646a.999.999 0 001.43 0C17.984 42.25 32 26.627 32 16 32 7.163 24.837 0 16 0z" fill="#0E2C50"/>
      <circle cx="16" cy="16" r="6" fill="#B99F66"/>
    </svg>
  `,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44],
});

// Componente que centra el mapa cuando las coordenadas cambian (útil en el form)
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface PropertyMapProps {
  lat: number;
  lng: number;
  titulo?: string;
  aproximada?: boolean;
  height?: number | string;
  zoom?: number;
}

export default function PropertyMap({
  lat,
  lng,
  titulo,
  aproximada = false,
  height = 320,
  zoom = 15,
}: PropertyMapProps) {
  return (
    <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      {/* Badge ubicación aproximada */}
      {aproximada && (
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 1000,
          background: "rgba(14,44,80,.85)", backdropFilter: "blur(6px)",
          color: "#fff", fontFamily: "var(--font-sans)",
          fontSize: 11.5, fontWeight: 600,
          padding: "5px 10px", borderRadius: 999,
          pointerEvents: "none",
        }}>
          📍 Ubicación aproximada · zona del barrio
        </div>
      )}

      <MapContainer
        center={[lat, lng]}
        zoom={aproximada ? 14 : zoom}
        style={{ height, width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterMap lat={lat} lng={lng} />

        {aproximada ? (
          // Círculo difuso para ubicación aproximada
          <>
            <Circle
              center={[lat, lng]}
              radius={400}
              pathOptions={{ color: "#0E2C50", fillColor: "#0E2C50", fillOpacity: 0.12, weight: 1.5 }}
            />
            <Marker position={[lat, lng]} icon={icon}>
              {titulo && <Popup>{titulo}</Popup>}
            </Marker>
          </>
        ) : (
          // Pin exacto
          <Marker position={[lat, lng]} icon={icon}>
            {titulo && <Popup>{titulo}</Popup>}
          </Marker>
        )}

        {/* Attribution propio */}
        <div
          style={{
            position: "absolute", bottom: 4, right: 8, zIndex: 1000,
            fontSize: 10, color: "rgba(0,0,0,.5)", pointerEvents: "none",
          }}
        >
          © OpenStreetMap
        </div>
      </MapContainer>
    </div>
  );
}
