import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El contenido de /precios vivió un tiempo en /como-funciona y ahora
  // está en /vender, su lugar natural. El 308 apunta directo al destino
  // final en vez de encadenar dos saltos.
  async redirects() {
    return [
      { source: "/precios", destination: "/vender", permanent: true },
    ];
  },
  // Versión en markdown de las notas y de las guías de costos, para
  // asistentes de IA (ver /llms.txt): /blog/<nota>.md y /catedra/<guía>.md.
  // Las sirven las rutas de app/api/md; /api/ no se indexa (robots.txt).
  async rewrites() {
    return [
      { source: "/blog/:slug.md", destination: "/api/md/blog/:slug" },
      { source: "/catedra/:slug.md", destination: "/api/md/catedra/:slug" },
    ];
  },
  // Avisa en cada página que existe /llms.txt y que la describe
  // (https://llmstxt.org). Se excluyen los recursos de Next, la API y los
  // archivos con extensión (imágenes, sitemap, el propio llms.txt).
  async headers() {
    return [
      {
        source: "/((?!_next/|api/)[^.]*)",
        headers: [{ key: "Link", value: '</llms.txt>; rel="describedby"' }],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Sin optimizador de Vercel: el plan tiene un cupo mensual de imágenes
    // transformadas y, agotado, /_next/image responde 402 y las fotos nuevas
    // no se ven. Se sirven directo desde Supabase, que no tiene ese tope.
    unoptimized: true,
    // AVIF/WebP: ~30% menos peso que JPG/PNG en las fotos de propiedades
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
