import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "Espacio Inmobiliario · Propiedades directas de dueños y tasador online de departamentos";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Dueño directo · Sin comisiones",
    titulo: "Comprá, vendé y tasá tu propiedad con respaldo profesional",
    apoyo: "Propiedades de dueños, tasador online gratis y guías del mercado de Buenos Aires.",
  });
}
