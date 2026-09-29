import { Marked } from "marked";

/**
 * Markdown de la Tertulia: lo escribe cualquiera, así que se renderiza
 * con un juego acotado y seguro, en una instancia propia de Marked (no
 * toca la configuración global que usa el blog).
 *
 *   · HTML crudo → se muestra como texto, nunca se interpreta.
 *   · Títulos (#) → párrafo en negrita: en un foro, un H1 gritado
 *     rompe la lectura y la jerarquía de la página.
 *   · Enlaces → solo http(s), mailto y rutas internas. Los externos
 *     van con rel="nofollow ugc" (spam y SEO) y abren aparte.
 *   · Imágenes en markdown → enlace: las fotos se suben aparte, y así
 *     nadie inserta un píxel de rastreo de otro sitio.
 *
 * Sirve en el servidor (páginas) y en el cliente (vista previa del editor).
 */

const SITIO = /^https?:\/\/(www\.)?espacioinmobiliario\.com\.ar(\/|$)/i;

const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function hrefSeguro(href: string | null | undefined): string | null {
  const h = (href || "").trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(h)) return h;
  if (/^mailto:[^\s"'<>]+$/i.test(h)) return h;
  if (/^\/(?![/\\])[^\s"'<>]*$/.test(h)) return h;
  return null;
}

function enlace(href: string, texto: string): string {
  const interno = href.startsWith("/") || SITIO.test(href);
  const extra = interno ? "" : ' rel="nofollow ugc noopener" target="_blank"';
  return `<a href="${esc(href)}"${extra}>${texto}</a>`;
}

const foroMd = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) {
      return esc(text);
    },
    heading({ tokens }) {
      return `<p><strong>${this.parser.parseInline(tokens)}</strong></p>\n`;
    },
    link({ href, tokens }) {
      const texto = this.parser.parseInline(tokens);
      const h = hrefSeguro(href);
      return h ? enlace(h, texto) : texto;
    },
    image({ href, text }) {
      const h = hrefSeguro(href);
      return h ? enlace(h, esc(text || "imagen")) : esc(text || "");
    },
  },
});

export function renderForo(md: string): string {
  return foroMd.parse(md || "", { async: false }) as string;
}
