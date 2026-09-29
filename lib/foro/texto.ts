/**
 * Utilidades de texto de la Tertulia. Sin dependencias de servidor:
 * las usan tanto las páginas como los componentes de cliente.
 */

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "Eugenio Nielsen" → "Eugenio N.": el nombre visible que se propone al entrar. */
export function aliasPorDefecto(nombre: string | null | undefined, email?: string | null): string {
  const partes = (nombre || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return (email?.split("@")[0] || "Miembro").slice(0, 40);
  if (partes.length === 1) return partes[0].slice(0, 40);
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`.slice(0, 40);
}

/** Hasta dos iniciales para el avatar. */
export function iniciales(alias: string): string {
  const partes = alias.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "·";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * "hace 5 min", "hace 3 h", "ayer", "12 sep", "12 sep 2025".
 * Se calcula en el servidor, con la hora de Buenos Aires.
 */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  const seg = Math.max(0, (ahora.getTime() - fecha.getTime()) / 1000);
  if (seg < 60) return "recién";
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  if (seg < 172800) return "ayer";
  if (seg < 7 * 86400) return `hace ${Math.floor(seg / 86400)} días`;
  const ba = new Date(fecha.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hoy = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const base = `${ba.getDate()} ${MESES[ba.getMonth()]}`;
  return ba.getFullYear() === hoy.getFullYear() ? base : `${base} ${ba.getFullYear()}`;
}

export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires",
  });
}

/** Markdown → texto plano de una línea, para extractos y descripciones. */
export function extracto(md: string, largo = 180): string {
  const plano = (md || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#~|]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plano.length <= largo) return plano;
  const corte = plano.slice(0, largo);
  return corte.slice(0, Math.max(corte.lastIndexOf(" "), largo - 20)).trimEnd() + "…";
}

/**
 * La consulta del buscador, como la guarda la base: minúsculas y sin
 * tildes (ver foro_sin_tildes en la migración).
 */
export function normalizarBusqueda(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s"-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** La URL de un tema: /foro/{categoria}/{slug}. */
export function urlTema(t: { categoria: string; slug: string }): string {
  return `/foro/${t.categoria}/${t.slug}`;
}

export function plural(n: number, uno: string, varios: string): string {
  return `${new Intl.NumberFormat("es-AR").format(n)} ${n === 1 ? uno : varios}`;
}

/**
 * A dónde volver después de ingresar o registrarse. Solo rutas internas
 * (empiezan con una sola barra): nunca se redirige a otro sitio con algo
 * que llegó en la URL.
 */
export function volverSeguro(v: unknown, porDefecto = "/foro"): string {
  if (typeof v !== "string") return porDefecto;
  const s = v.trim();
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\") || s.length > 300) return porDefecto;
  return s;
}
