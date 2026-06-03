"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path broken by webpack/next
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
          📍 Ubicación aproximada — zona del barrio
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
