import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /precios se fusionó dentro de /como-funciona. El redirect es permanente
  // (308) para que los buscadores trasladen el posicionamiento de la URL
  // vieja en lugar de dejar dos páginas compitiendo por lo mismo.
  async redirects() {
    return [
      { source: "/precios", destination: "/como-funciona#precios", permanent: true },
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
