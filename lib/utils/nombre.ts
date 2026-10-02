/**
 * Prolija las mayúsculas del nombre de una persona.
 *
 * Mucha gente lo escribe todo en mayúsculas ("NAZAR HERNAN FERNANDO") o
 * todo en minúsculas, y así salía en la ficha, el panel y los emails.
 * Cada palabra queda con la inicial en mayúscula y el resto en minúscula.
 *
 * Solo se tocan las palabras escritas enteras en mayúsculas o enteras en
 * minúsculas. Una que ya mezcla las dos ("McAllister", "DiCaprio") se
 * respeta: alguien la escribió así a propósito. Lo mismo las partículas
 * en minúscula que no van primeras ("María de los Ángeles").
 */

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y"]);

export function normalizarNombre(entrada: string | null | undefined): string {
  const palabras = (entrada ?? "").trim().split(/\s+/).filter(Boolean);

  return palabras
    .map((palabra, i) => {
      const minus = palabra.toLocaleLowerCase("es-AR");
      const mayus = palabra.toLocaleUpperCase("es-AR");
      if (palabra !== minus && palabra !== mayus) return palabra;
      if (palabra === minus && i > 0 && PARTICULAS.has(palabra)) return palabra;
      // La inicial y lo que sigue a un guion o un apóstrofo:
      // "D'ANGELO" → "D'Angelo", "ANA-MARIA" → "Ana-Maria"
      return minus.replace(/(^|[-'’])(\p{L})/gu, (_, antes: string, letra: string) => antes + letra.toLocaleUpperCase("es-AR"));
    })
    .join(" ");
}
