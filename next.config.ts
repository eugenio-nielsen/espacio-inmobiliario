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
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
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
