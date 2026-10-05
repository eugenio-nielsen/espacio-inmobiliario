import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "Propiedades en venta directo de dueños";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Propiedades en venta",
    titulo: "Departamentos y casas directo del dueño",
    apoyo: "Sin comisión inmobiliaria, en CABA y Gran Buenos Aires.",
  });
}
