/**
 * Título de una publicación, prolijo para mostrarlo en una tarjeta.
 *
 * Los dueños escriben como pueden: más de la mitad de los títulos llegan
 * EN MAYÚSCULAS, algunos con emojis, y casi todos empiezan con "Venta…"
 * aunque en el portal todo es venta. La ficha conserva el texto original;
 * la tarjeta muestra esta versión:
 *
 *   · Sin emojis ni espacios dobles.
 *   · Superficies normalizadas: "1080m2", "1000mts2" → "1080 m²".
 *   · Si viene en mayúsculas, cada palabra con inicial mayúscula (salvo
 *     artículos y preposiciones). No se pasa a oración: bajaría a
 *     minúscula los nombres propios ("en loma verde escobar").
 *   · Sin el "Venta de" / "Vendo" del principio ni el "en venta" del medio.
 */
const MENORES = new Set([
  "de", "del", "la", "las", "el", "los", "en", "con", "y", "e", "a", "al",
  "por", "para", "o", "u", "sin", "un", "una",
]);

/** Palabras que en mayúsculas suelen llegar sin tilde. */
const TILDES: Record<string, string> = {
  belen: "Belén", ubicacion: "Ubicación", jardin: "Jardín", balcon: "Balcón",
  rio: "Río", habitacion: "Habitación", construccion: "Construcción",
  unica: "Única",
};

const SIGLAS = new Set(["ph", "caba", "usd", "gba", "amba"]);

export function tituloTarjeta(original: string): string {
  let s = original
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/(\d)\s*(?:m2|mts2|mt2|metros2|m²)(?![\p{L}\d])/giu, "$1 m²")
    .replace(/\s+/g, " ")
    .trim();

  const letras = s.match(/\p{L}/gu) ?? [];
  const mayusculas = letras.filter(c => c !== c.toLowerCase()).length;
  if (letras.length && mayusculas / letras.length > 0.6) {
    s = s.toLowerCase().replace(/\p{L}+/gu, (palabra, pos: number) => {
      if (palabra === "m" && s[pos + 1] === "²") return palabra;
      if (SIGLAS.has(palabra)) return palabra.toUpperCase();
      if (TILDES[palabra]) return TILDES[palabra];
      if (pos > 0 && MENORES.has(palabra)) return palabra;
      return palabra[0].toUpperCase() + palabra.slice(1);
    });
  }

  s = s
    .replace(/^(?:venta|vendo|se vende)(?:\s+de)?\s+/i, "")
    .replace(/\s+en venta\b/i, "")
    .trim();

  // Primera letra en mayúscula, aunque la anteceda un signo de apertura
  return s.replace(/^([¡¿"“]*)(\p{L})/u, (_, signos: string, letra: string) => signos + letra.toUpperCase());
}
