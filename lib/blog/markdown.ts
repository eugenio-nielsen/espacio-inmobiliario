import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

/** Convierte Markdown a HTML. El autor es de confianza (solo el admin carga notas). */
export function markdownToHtml(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
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
