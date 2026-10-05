import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "Tasador online de departamentos en CABA";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Tasador online · Gratis",
    titulo: "¿Cuánto vale tu departamento?",
    apoyo: "Estimalo en cinco pasos con valores de referencia por barrio de CABA.",
  });
}
