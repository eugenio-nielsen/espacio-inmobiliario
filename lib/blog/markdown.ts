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

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Una sola línea: marked trata un bloque HTML hasta la primera línea en blanco. */
const enLinea = (html: string) => html.replace(/\n+/g, " ").trim();

/** URL para embeber un video de YouTube o Vimeo, y su miniatura si la hay. */
function videoEmbebible(url: string): { src: string; miniatura: string | null } | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  if (yt) {
    return {
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`,
      miniatura: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`, miniatura: null };
  return null;
}

/**
 * Bloques editoriales que se escriben en el propio Markdown de la nota,
 * entre dos líneas `:::`:
 *
 *   :::en-corto          Las ideas clave, para quien tiene un minuto.
 *   - …
 *   :::
 *
 *   :::dato              Una cifra grande (1.ª línea) y qué es (resto).
 *   6.051
 *   escrituras en julio
 *   :::
 *
 *   :::video https://youtu.be/…      Video que carga recién al tocarlo.
 *   Epígrafe opcional
 *   :::
 *
 *   :::ancha             Lo de adentro (una imagen) va a todo el ancho.
 *   ![Alt](url "Epígrafe")
 *   :::
 *
 * Además, una imagen con título (`![alt](url "epígrafe")`) sale como
 * figura con epígrafe, y las tablas se envuelven para scrollear en móvil.
 */
function bloquesEditoriales(md: string): string {
  return md.replace(
    /^:::(en-corto|dato|video|ancha)[ \t]*(.*)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm,
    (_m, tipo: string, arg: string, cuerpo: string) => {
      const interior = cuerpo.trim();
      let html = "";
      if (tipo === "en-corto") {
        html = `<aside class="nt-en-corto"><p class="nt-rotulo">En corto</p>${markdownToHtml(interior)}</aside>`;
      } else if (tipo === "dato") {
        const [valor, ...resto] = interior.split(/\r?\n/);
        html = `<div class="nt-dato"><span class="nt-dato-v">${escapar(valor.trim())}</span>` +
          `<span class="nt-dato-l">${escapar(resto.join(" ").trim())}</span></div>`;
      } else if (tipo === "video") {
        const video = videoEmbebible(arg.trim());
        if (!video) return "";
        html = `<figure class="nt-video" data-src="${escapar(video.src)}">` +
          (video.miniatura ? `<img src="${video.miniatura}" alt="" loading="lazy">` : "") +
          `<button type="button" class="nt-video-play" aria-label="Reproducir el video"></button>` +
          (interior ? `<figcaption>${escapar(interior)}</figcaption>` : "") +
          `</figure>`;
      } else if (tipo === "ancha") {
        html = `<div class="nt-ancha">${markdownToHtml(interior)}</div>`;
      }
      return `\n\n${enLinea(html)}\n\n`;
    }
  );
}

/**
 * Renderiza la nota: HTML con ids en los h2/h3 + índice de contenidos.
 * El id se inyecta sobre el HTML ya generado (robusto, sin depender de la API interna de marked).
 */
export function renderPost(md: string): { html: string; toc: TocItem[] } {
  let html = marked.parse(bloquesEditoriales(md || ""), { async: false }) as string;

  // Imagen con título → figura con epígrafe
  html = html.replace(
    /<p>\s*<img src="([^"]+)" alt="([^"]*)"(?: title="([^"]*)")?\s*\/?>\s*<\/p>/g,
    (_m, src: string, alt: string, titulo?: string) =>
      `<figure class="nt-figura"><img src="${src}" alt="${alt}" loading="lazy">` +
      (titulo ? `<figcaption>${titulo}</figcaption>` : "") + `</figure>`
  );

  // Tablas: contenedor propio para que scrolleen en pantallas angostas
  html = html.replace(/<table>/g, '<div class="nt-tabla"><table>').replace(/<\/table>/g, "</table></div>");
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
