/**
 * Motivos de contacto. Fuente única: los usan el formulario, la página
 * de contacto y los links de la home que llegan con uno preseleccionado.
 *
 * El `id` viaja en la URL (`/contacto?motivo=vender`) y en el email, así
 * que cambiarlo rompe links ya publicados: agregar antes que renombrar.
 */
export const MOTIVOS = [
  {
    id: "vender",
    label: "Quiero vender",
    /** Versión corta: en cuatro columnas el label entero se trunca. */
    boton: "Vender",
    titulo: "Contanos sobre tu propiedad",
    bajada: "Te decimos cuánto puede valer, cómo la venderíamos y qué costaría delegarla.",
    placeholder: "Dónde está, cuántos ambientes, en qué estado. Lo que sepas alcanza para empezar.",
  },
  {
    id: "comprar",
    label: "Quiero comprar",
    /** Versión corta: en cuatro columnas el label entero se trunca. */
    boton: "Comprar",
    titulo: "Contanos qué estás buscando",
    bajada: "Si no está publicado hoy, lo buscamos. Decinos qué necesitás y en qué zona.",
    placeholder: "Zona, tipo de propiedad, ambientes y presupuesto aproximado.",
  },
  {
    id: "invertir",
    label: "Quiero invertir",
    /** Versión corta: en cuatro columnas el label entero se trunca. */
    boton: "Invertir",
    titulo: "Conversemos sobre tu inversión",
    bajada: "Analizamos cuándo conviene comprar o vender según tus objetivos y el momento del mercado.",
    placeholder: "Qué buscás lograr, en qué plazo y con qué capital estás pensando.",
  },
  {
    id: "otro",
    label: "Otra consulta",
    /** Versión corta: en cuatro columnas el label entero se trunca. */
    boton: "Otra consulta",
    titulo: "Contanos en qué te podemos ayudar",
    bajada: "Escribinos y te respondemos a la brevedad. Sin compromiso.",
    placeholder: "Contanos tu consulta.",
  },
] as const;

export type MotivoId = (typeof MOTIVOS)[number]["id"];

/** Valida lo que llega por querystring; cualquier cosa rara cae en "otro". */
export function motivoValido(v?: string | string[]): MotivoId {
  const id = Array.isArray(v) ? v[0] : v;
  return MOTIVOS.some(m => m.id === id) ? (id as MotivoId) : "otro";
}

export function etiquetaMotivo(id: string): string {
  return MOTIVOS.find(m => m.id === id)?.label ?? "Otra consulta";
}
