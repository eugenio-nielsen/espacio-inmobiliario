import type { Guia } from "@/lib/catedra/guias-costos";
import { SITE, SITE_NOMBRE } from "@/lib/site";

/**
 * Versiones en markdown de las páginas con contenido, para asistentes y
 * agentes de IA (ver /llms.txt). Son la misma información que la página web,
 * sin menús ni scripts: se arman con los mismos datos, así que no se
 * desactualizan por separado.
 */

/** Una sola línea: sin saltos ni espacios repetidos. */
export const unaLinea = (t: string) => t.replace(/\s+/g, " ").trim();

/** Texto de un enlace markdown: los corchetes lo romperían. */
export const textoEnlace = (t: string) => unaLinea(t).replace(/[[\]]/g, "");

/** `/ruta` pasa a la URL completa del sitio; lo que ya es absoluto queda igual. */
export const absoluta = (href: string) => (href.startsWith("/") && !href.startsWith("//") ? `${SITE}${href}` : href);

/**
 * Los enlaces e imágenes relativos de un texto markdown pasan a absolutos:
 * quien lo lee fuera del sitio no sabe a qué dominio pertenece `/estimador`.
 */
export function enlacesAbsolutos(md: string): string {
  return md.replace(/\]\((\/(?!\/)[^)\s]*)((?:\s+"[^"]*")?)\)/g, (_m, ruta: string, titulo: string) => `](${SITE}${ruta}${titulo})`);
}

/** HTML en línea de las guías de la Cátedra (<strong>, <a>) a markdown. */
export function htmlEnLineaAMarkdown(html: string): string {
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**")
    .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, (_m, href: string, texto: string) => `[${textoEnlace(texto)}](${absoluta(href)})`)
    .replace(/<[^>]+>/g, "");
}

/** Herramientas interactivas que las notas insertan con una marca [[NOMBRE]]. */
const HERRAMIENTAS_EN_NOTAS: Record<string, { nombre: string; ruta: string }> = {
  CALCULADORA_ARANCELES: {
    nombre: "Calculadora de aranceles del Registro de la Propiedad Inmueble",
    ruta: "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble",
  },
  TASADOR: { nombre: "Tasador online de departamentos", ruta: "/estimador" },
};

/**
 * Markdown de una nota del blog. Las notas se escriben en markdown con unos
 * bloques propios (`:::en-corto`, `:::dato`, `:::video`, `:::ancha`, ver
 * lib/blog/markdown.ts) y marcas de herramientas ([[TASADOR]]) que solo
 * existen en la web: acá pasan a markdown común.
 */
export function contenidoNotaAMarkdown(md: string): string {
  const sinBloques = md.replace(
    /^:::(en-corto|dato|video|ancha)[ \t]*(.*)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm,
    (_m, tipo: string, arg: string, cuerpo: string) => {
      const interior = cuerpo.trim();
      if (tipo === "en-corto") {
        const lineas = interior.split(/\r?\n/).map(l => (l.trim() ? `> ${l}` : ">"));
        return ["> **En corto**", ">", ...lineas].join("\n");
      }
      if (tipo === "dato") {
        const [valor, ...resto] = interior.split(/\r?\n/);
        return `**${valor.trim()}** ${unaLinea(resto.join(" "))}`;
      }
      if (tipo === "video") return arg.trim() ? `Video: ${arg.trim()}` : "";
      return interior; // "ancha": una imagen a todo el ancho
    }
  );

  const conHerramientas = sinBloques.replace(/\[\[([A-Z_]+)\]\]/g, (_m, nombre: string) => {
    const h = HERRAMIENTAS_EN_NOTAS[nombre];
    return h ? `> Herramienta interactiva: [${h.nombre}](${SITE}${h.ruta}). Se usa en la versión web.` : "";
  });

  return enlacesAbsolutos(conHerramientas).replace(/\n{3,}/g, "\n\n").trim();
}

export type NotaParaMarkdown = {
  slug: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  categoria: string | null;
  autor: string | null;
  published_at: string | null;
  updated_at: string | null;
};

const dia = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

export function notaMd(n: NotaParaMarkdown): string {
  const publicada = dia(n.published_at);
  const actualizada = dia(n.updated_at);
  const datos = [
    n.categoria,
    n.autor ? `Por ${n.autor}` : null,
    publicada ? `Publicada el ${publicada}` : null,
    actualizada && actualizada !== publicada ? `Actualizada el ${actualizada}` : null,
  ].filter(Boolean).join(" · ");

  return [
    `# ${unaLinea(n.titulo)}`,
    n.resumen ? `> ${unaLinea(n.resumen)}` : null,
    datos || null,
    `Versión web: ${SITE}/blog/${n.slug}`,
    contenidoNotaAMarkdown(n.contenido),
    "---",
    `${SITE_NOMBRE} · ${SITE} · Índice para asistentes de IA: ${SITE}/llms.txt`,
  ].filter((parte): parte is string => !!parte).join("\n\n") + "\n";
}

/** Markdown de una guía de costos de la Cátedra (las dos salen de `guia()`). */
export function guiaCostosMd(g: Guia): string {
  const url = `${SITE}/catedra/${g.slug}`;
  // La página dice "la calculadora de arriba": acá la calculadora no está arriba
  const t = (texto: string) => htmlEnLineaAMarkdown(texto).replace("la calculadora de arriba", "la calculadora de la versión web");
  return [
    `# ${g.titulo}`,
    `> ${unaLinea(t(g.descripcion))}`,
    `Versión web, con la calculadora interactiva: ${url}`,
    t(g.lead),
    `**Respuesta corta:** ${t(g.respuesta)}`,
    ...g.secciones.flatMap(s => [`## ${t(s.t)}`, ...s.p.map(t)]),
    "## Preguntas frecuentes",
    ...g.preguntas.flatMap(p => [`### ${t(p.q)}`, t(p.a)]),
    "---",
    `Las cifras salen de la misma configuración que usa la calculadora y son orientativas: la escritura la cotiza cada escribanía.`,
    `${SITE_NOMBRE} · ${SITE} · Índice para asistentes de IA: ${SITE}/llms.txt`,
  ].join("\n\n") + "\n";
}

/** Respuesta de texto plano. Se sirve como text/plain para que el navegador lo muestre en vez de descargarlo. */
export function respuestaTexto(cuerpo: string, canonica?: string, estado = 200): Response {
  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8" };
  // Le dice a los buscadores cuál es la página "de verdad" (esta es una copia
  // para agentes) y a los agentes dónde está el índice que la describe
  if (canonica) headers.Link = `<${canonica}>; rel="canonical", </llms.txt>; rel="describedby"`;
  return new Response(cuerpo, { status: estado, headers });
}
