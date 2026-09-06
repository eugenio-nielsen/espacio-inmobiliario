import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { BARRIO_PAGES } from "@/lib/barrios";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const revalidate = 3600; // regenerar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const static_pages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/propiedades`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/como-funciona`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/estimador`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/auth/registro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    // Páginas SEO por barrio
    ...BARRIO_PAGES.map((b) => ({
      url: `${SITE}/propiedades/venta/${b.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  ];

  // Propiedades activas
  try {
    const supabase = createAdminClient();
    const { data: properties } = await supabase
      .from("properties")
      .select("id, short_id, operacion, barrio, ciudad, tipo, updated_at")
      .eq("status", "activa")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const property_pages: MetadataRoute.Sitemap = (properties || []).map((p) => ({
      url: `${SITE}${buildPropertyUrl({ ...p, barrio: p.barrio || p.ciudad })}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Notas del blog publicadas
    const { data: posts } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(2000);

    const blog_pages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at || p.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...static_pages, ...property_pages, ...blog_pages];
  } catch {
    return static_pages;
  }
}
