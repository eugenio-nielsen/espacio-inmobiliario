/**
 * Protocolo de respaldo: los cuatro controles detrás de cada operación.
 * Los muestra el documento de Respaldo de la home (título y texto).
 *
 * Cada punto es algo que el sistema hace de verdad (validación de
 * identidad y de dominio, revisión previa, acompañamiento). No sumar acá
 * nada que no se pueda sostener: la confianza se pierde de una sola vez.
 */
export const PROTOCOLO = [
  {
    n: "I",
    t: "Identidad del titular",
    d: "Validamos a quien publica contra su documento de identidad, y la ficha lo muestra con un sello.",
  },
  {
    n: "II",
    t: "Dominio de la propiedad",
    d: "Cotejamos la escritura: el sello confirma que quien vende es el titular.",
  },
  {
    n: "III",
    t: "Revisión previa",
    d: "Ninguna publicación sale al portal sin haber sido revisada, una por una.",
  },
  {
    n: "IV",
    t: "Acompañamiento",
    d: "Del primer contacto a la escritura: valor, visitas, documentación y firma.",
  },
] as const;
