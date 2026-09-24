import L from "leaflet";

/**
 * Pin de la marca (navy con centro dorado). Lo comparten el mapa de la
 * ficha (PropertyMap) y el selector del formulario (MapaSelector).
 * Solo se importa desde módulos que cargan sin SSR: Leaflet necesita window.
 */
export const pinIcon = L.divIcon({
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
