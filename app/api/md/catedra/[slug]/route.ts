import { getCostosConfig } from "@/lib/catedra/data";
import { guia, SLUGS, type Foco } from "@/lib/catedra/guias-costos";
import { guiaCostosMd, respuestaTexto } from "@/lib/llms/markdown";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

/** Las dos guías se arman al compilar y se renuevan cada hora (la configuración de costos puede cambiar). */
export function generateStaticParams() {
  return Object.values(SLUGS).map(slug => ({ slug }));
}

/**
 * Versión en markdown de las guías "cuánto cuesta vender / comprar una
 * propiedad". Sale de la misma función que arma la página (`guia()`) y de
 * la misma configuración de la calculadora, así que las cifras coinciden.
 * Se publica en /catedra/<slug>.md (ver next.config.ts).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const foco = (Object.keys(SLUGS) as Foco[]).find(f => SLUGS[f] === slug);
  if (!foco) return respuestaTexto("Página no encontrada.\n", undefined, 404);

  const g = guia(foco, await getCostosConfig());
  return respuestaTexto(guiaCostosMd(g), `${SITE}/catedra/${g.slug}`);
}
