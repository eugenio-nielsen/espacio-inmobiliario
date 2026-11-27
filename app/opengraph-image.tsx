import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "Espacio Inmobiliario · Propiedades directas de dueños y estimador online de departamentos";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Dueño directo · Sin comisiones",
    titulo: "Comprá y vendé tu propiedad con respaldo profesional",
    apoyo: "Propiedades de dueños, estimador de valores gratis y guías del mercado de Buenos Aires.",
  });
}
