import { imagenOg, OG_SIZE, OG_TYPE } from "@/lib/og";
import { ACLARATORIO } from "@/lib/estimador/aclaratorio";

export const alt = "Estimador online de departamentos en CABA";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return imagenOg({
    rotulo: "Estimador online · Gratis",
    titulo: "¿Cuánto vale tu departamento?",
    apoyo: `Con valores de referencia por barrio de CABA. ${ACLARATORIO}`,
  });
}
