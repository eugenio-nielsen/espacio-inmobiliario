/**
 * URL pública del sitio, sin barra final. Única fuente para canonicals,
 * sitemap, robots y datos estructurados: en producción es la variable de
 * entorno (https://www…), en local cae al dominio real para que ningún
 * canonical salga como "undefined/…" o apuntando a localhost.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.espacioinmobiliario.com.ar").replace(/\/+$/, "");

export const SITE_NOMBRE = "Espacio Inmobiliario";
