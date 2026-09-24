/**
 * Protocolo de respaldo: los cuatro controles detrás de cada operación.
 *
 * Fuente única. El documento de Respaldo de la home muestra el título y
 * el texto largo (`t`, `d`); la franja del footer, que se ve en todas las
 * páginas, la palabra clave y el corto (`clave`, `corto`), porque en
 * cuatro columnas los títulos completos se partían en dos líneas. Así la
 * promesa se lee igual en todo el sitio.
 *
 * Cada punto es algo que el sistema hace de verdad (validación de
 * identidad y de dominio, revisión previa, acompañamiento). No sumar acá
 * nada que no se pueda sostener: la confianza se pierde de una sola vez.
 */
export const PROTOCOLO = [
  {
    n: "I",
    t: "Identidad del titular",
    clave: "Identidad",
    corto: "Validada con su documento",
    d: "Validamos a quien publica contra su documento de identidad, y la ficha lo muestra con un sello.",
  },
  {
    n: "II",
    t: "Dominio de la propiedad",
    clave: "Dominio",
    corto: "Cotejado con la escritura",
    d: "Cotejamos la escritura: el sello confirma que quien vende es el titular.",
  },
  {
    n: "III",
    t: "Revisión previa",
    clave: "Revisión",
    corto: "Cada publicación, una por una",
    d: "Ninguna publicación sale al portal sin haber sido revisada, una por una.",
  },
  {
    n: "IV",
    t: "Acompañamiento",
    clave: "Acompañamiento",
    corto: "Hasta la escritura",
    d: "Del primer contacto a la escritura: valor, visitas, documentación y firma.",
  },
] as const;
