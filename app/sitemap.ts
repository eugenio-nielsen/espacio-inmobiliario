import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPropertyUrl } from "@/lib/utils/urls";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const revalidate = 3600; // regenerar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const static_pages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/propiedades`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/auth/registro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
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

    return [...static_pages, ...property_pages];
  } catch {
    return static_pages;
  }
}
