import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

/** Convierte Markdown a HTML. El autor es de confianza (solo el admin carga notas). */
export function markdownToHtml(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
}

export interface TocItem { id: string; text: string; level: number }

function slugBase(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "seccion";
}

/**
 * Renderiza la nota: HTML con ids en los h2/h3 + índice de contenidos.
 * El id se inyecta sobre el HTML ya generado (robusto, sin depender de la API interna de marked).
 */
export function renderPost(md: string): { html: string; toc: TocItem[] } {
  let html = marked.parse(md || "", { async: false }) as string;
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugBase(text);
    if (used.has(id)) { const n = (used.get(id) || 0) + 1; used.set(id, n); id = `${id}-${n}`; }
    else used.set(id, 0);
    toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });

  return { html, toc };
}

/** Tiempo de lectura estimado en minutos (200 palabras/min). */
export function readingTime(md: string): number {
  const words = (md || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Genera un slug a partir de un título. */
export function slugifyTitulo(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Texto plano (para descripciones/excerpts) a partir de Markdown. */
export function stripMarkdown(md: string, max = 160): string {
  const text = (md || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")     // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")  // links → texto
    .replace(/[#>*_`~-]/g, "")                // marcas
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
