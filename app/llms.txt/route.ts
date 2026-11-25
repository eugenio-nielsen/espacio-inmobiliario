import { generarLlmsTxt } from "@/lib/llms/llms-txt";

// Se regenera cada hora, igual que el sitemap
export const revalidate = 3600;

/**
 * GET /llms.txt — índice del sitio para asistentes y agentes de IA
 * (https://llmstxt.org). Lo arma lib/llms/llms-txt.ts.
 *
 * Se sirve como text/plain para que el navegador lo muestre en vez de
 * descargarlo; el contenido es markdown.
 */
export async function GET() {
  const cuerpo = await generarLlmsTxt();
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
