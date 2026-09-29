import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/propiedades/"],
        disallow: [
          "/panel/", "/auth/", "/api/",
          "/foro/nuevo", "/foro/editar/", "/foro/perfil", "/foro/unirse",
          "/foro/bienvenida", "/foro/avisos",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
