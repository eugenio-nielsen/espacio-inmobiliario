import { notaMd, respuestaTexto, type NotaParaMarkdown } from "@/lib/llms/markdown";
import { SITE } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/publico";

export const revalidate = 3600;

/**
 * Las notas publicadas se arman al compilar y se renuevan cada hora; las
 * que se publiquen después se arman en el primer pedido. Sin esto la ruta
 * quedaba dinámica y cada pedido consultaba la base.
 */
export async function generateStaticParams() {
  const { data } = await createPublicClient().from("posts").select("slug").eq("status", "publicado");
  return (data ?? []).map(({ slug }) => ({ slug: slug as string }));
}

/**
 * Versión en markdown de una nota del blog. Se publica en /blog/<slug>.md
 * (next.config.ts reescribe esa dirección a esta ruta); /api/ queda fuera
 * de los buscadores por robots.txt, así que la única dirección pública es
 * la .md. Solo notas publicadas.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return respuestaTexto("Nota no encontrada.\n", undefined, 404);

  const { data, error } = await createPublicClient()
    .from("posts")
    .select("slug, titulo, resumen, contenido, categoria, autor, published_at, updated_at")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) {
    console.error("md/blog:", error.message);
    return respuestaTexto("No se pudo leer la nota. Probá de nuevo en unos minutos.\n", undefined, 503);
  }
  if (!data) return respuestaTexto("Nota no encontrada.\n", undefined, 404);

  return respuestaTexto(notaMd(data as NotaParaMarkdown), `${SITE}/blog/${slug}`);
}
