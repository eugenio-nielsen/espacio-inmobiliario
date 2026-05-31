import { slugifyUbicacion } from "@/lib/ubicaciones";

export function buildPropertyUrl(p: {
  operacion: string;
  barrio?: string | null;
  ciudad?: string;
  tipo: string;
  id: string;
}): string {
  const barrioSlug = slugifyUbicacion(p.barrio || p.ciudad || "sin-ubicacion");
  return `/propiedades/${p.operacion}/${barrioSlug}/${p.tipo}/${p.id.slice(0, 8)}`;
}
