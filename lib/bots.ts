/**
 * ¿El User-Agent es de un robot (buscador, rastreador de IA, previsualización
 * de enlaces, herramienta de monitoreo o script)?
 *
 * Next trae `isBot` en `next/server`, pero es corto: no incluye a los
 * rastreadores de ChatGPT, Claude, Perplexity ni a las herramientas de SEO,
 * que son justamente los que más visitan un sitio nuevo. Este patrón es más
 * amplio a propósito: para contar visitas es mejor dejar pasar de menos que
 * inflar el número con robots.
 *
 * Un navegador de verdad siempre manda User-Agent: si falta, es un script.
 */
const PATRON_BOT = new RegExp(
  [
    // Casi todos se declaran con estas palabras (Googlebot, GPTBot, ClaudeBot,
    // PerplexityBot, Bytespider… y los que dicen "crawler" o "spider")
    "bot", "crawl", "spider", "slurp", "scrap", "fetcher",
    // Rastreadores de IA que no llevan "bot" en el nombre
    "chatgpt", "claude", "anthropic", "perplexity", "cohere", "mistral", "bytespider",
    // Previsualización de enlaces al compartir por redes y mensajería (los
    // que dicen "bot", como Twitterbot o TelegramBot, ya entran arriba)
    "facebookexternalhit", "facebookcatalog", "whatsapp", "skypeuripreview", "embedly",
    "quora link preview", "vkshare", "ia_archiver",
    // Google que no es el navegador (Google-InspectionTool, GoogleOther, AdsBot…)
    "google-", "googleother", "mediapartners", "adsbot", "storebot", "feedfetcher",
    // Medición de velocidad y monitoreo
    "lighthouse", "pagespeed", "gtmetrix", "pingdom", "uptime", "monitor", "headless",
    // Scripts y clientes HTTP
    "curl", "wget", "python", "go-http-client", "java/", "okhttp", "libwww", "httpclient",
    "axios", "node-fetch", "undici", "postman", "insomnia", "guzzle",
  ].join("|"),
  "i"
);

export function esBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return PATRON_BOT.test(userAgent);
}
