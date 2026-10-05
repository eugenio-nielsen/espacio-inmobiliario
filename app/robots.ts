import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

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
          "/catedra/unirse", "/catedra/profesionales/postular",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
