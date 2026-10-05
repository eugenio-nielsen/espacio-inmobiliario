import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "Blog de Espacio Inmobiliario";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Blog",
    titulo: "Guías y datos para comprar y vender con información",
    apoyo: "Mercado, escrituras, impuestos y créditos, explicados por profesionales.",
  });
}
