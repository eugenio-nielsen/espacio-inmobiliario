import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { BARRIO_PAGES, TIPO_PAGES } from "@/lib/barrios";
import { CATEGORIAS } from "@/lib/foro/categorias";
import { temasParaSitemap } from "@/lib/foro/data";
import { urlTema } from "@/lib/foro/texto";
import { SITE } from "@/lib/site";

export const revalidate = 3600; // regenerar cada hora

/**
 * Las fechas son reales o no van: poner `new Date()` en todo le dice a
 * Google que todo cambió en cada regeneración, y termina ignorando la
 * señal. Las páginas estáticas no llevan fecha; los listados toman la de
 * su contenido más reciente.
 */
const maxFecha = (fechas: (string | null | undefined)[]): Date | undefined => {
  const validas = fechas.filter((f): f is string => !!f).map((f) => new Date(f).getTime());
  return validas.length ? new Date(Math.max(...validas)) : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas = (paths: [string, number][]): MetadataRoute.Sitemap =>
    paths.map(([path, priority]) => ({ url: `${SITE}${path}`, priority }));

  const static_pages: MetadataRoute.Sitemap = estaticas([
    ["", 1],
    ["/como-funciona", 0.7],
    ["/vender", 0.9],
    ["/comprar", 0.9],
    ["/contacto", 0.6],
    ["/sobre-nosotros", 0.6],
    ["/foro/normas", 0.3],
    ["/catedra", 0.7],
    ["/catedra/calculadora", 0.8],
    // /auth/registro no va en el sitemap: robots.txt bloquea /auth/ y
    // anunciarla acá mandaba señales contradictorias a los buscadores.
    ["/terminos", 0.3],
    ["/privacidad", 0.3],
  ]);

  try {
    const supabase = createAdminClient();

    const [{ data: properties }, { data: posts }, { data: precios }, temas] = await Promise.all([
      supabase
        .from("properties")
        .select("id, short_id, operacion, barrio, ciudad, tipo, updated_at")
        .eq("status", "activa")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("posts")
        .select("slug, updated_at, published_at")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(2000),
      supabase.from("barrio_precios").select("updated_at"),
      temasParaSitemap(),
    ]);

    const props = properties || [];
    const notas = posts || [];

    const hubs: MetadataRoute.Sitemap = [
      { url: `${SITE}/propiedades`, lastModified: maxFecha(props.map((p) => p.updated_at)), priority: 0.9 },
      { url: `${SITE}/estimador`, lastModified: maxFecha((precios || []).map((p) => p.updated_at)), priority: 0.9 },
      { url: `${SITE}/precios-m2`, lastModified: maxFecha((precios || []).map((p) => p.updated_at)), priority: 0.85 },
      { url: `${SITE}/blog`, lastModified: maxFecha(notas.map((n) => n.updated_at || n.published_at)), priority: 0.8 },
      { url: `${SITE}/foro`, lastModified: maxFecha(temas.map((t) => t.ultima_actividad_at)), priority: 0.8 },
      ...CATEGORIAS.map((c) => ({ url: `${SITE}/foro/${c.slug}`, priority: 0.6 })),
    ];

    // Landings por barrio y por tipo, con la fecha de su propiedad más reciente
    const landingsBarrio: MetadataRoute.Sitemap = BARRIO_PAGES.map((b) => ({
      url: `${SITE}/propiedades/venta/${b.slug}`,
      lastModified: maxFecha(props.filter((p) => (p.barrio || p.ciudad) === b.nombre).map((p) => p.updated_at)),
      priority: b.intro.length ? 0.85 : 0.7,
    }));
    const landingsTipo: MetadataRoute.Sitemap = TIPO_PAGES.map((t) => ({
      url: `${SITE}/propiedades/venta/${t.slug}`,
      lastModified: maxFecha(props.filter((p) => p.tipo === t.tipo).map((p) => p.updated_at)),
      priority: 0.8,
    }));

    const property_pages: MetadataRoute.Sitemap = props.map((p) => ({
      url: `${SITE}${buildPropertyUrl({ ...p, barrio: p.barrio || p.ciudad })}`,
      lastModified: new Date(p.updated_at),
      priority: 0.8,
    }));

    const blog_pages: MetadataRoute.Sitemap = notas.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at || p.published_at),
      priority: 0.7,
    }));

    const foro_pages: MetadataRoute.Sitemap = temas.map((t) => ({
      url: `${SITE}${urlTema(t)}`,
      lastModified: new Date(t.ultima_actividad_at),
      priority: 0.6,
    }));

    return [...static_pages, ...hubs, ...landingsTipo, ...landingsBarrio, ...property_pages, ...blog_pages, ...foro_pages];
  } catch {
    return static_pages;
  }
}
