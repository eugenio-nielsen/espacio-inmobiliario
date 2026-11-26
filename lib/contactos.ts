import { Resend } from "resend";

/**
 * Carga a una persona como contacto en Resend, para poder escribirle más
 * adelante (newsletters, segmentos por origen).
 *
 * Usa una clave PROPIA con acceso completo (RESEND_CONTACTS_API_KEY): la de
 * envío (RESEND_API_KEY) es de solo envío y no puede tocar contactos. Si no
 * está definida, no hace nada: el sitio funciona igual.
 *
 * Variables:
 *   RESEND_CONTACTS_API_KEY  clave con acceso completo (obligatoria para que funcione)
 *   RESEND_SEGMENT_ID        segmento donde se agrega el contacto (opcional)
 *
 * Reglas:
 *   - Si el contacto ya existe, NO se toca: se conserva su origen original y,
 *     sobre todo, no se vuelve a suscribir a quien se dio de baja.
 *   - `origen` es una propiedad interna del contacto ("registro" | "tasador").
 *   - Nunca lanza: un fallo de Resend no puede romper el alta ni la tasación.
 */
export type OrigenContacto = "registro" | "tasador";

let faltaClaveAvisada = false;

export async function agregarContacto(data: { email: string; nombre?: string; origen: OrigenContacto }) {
  const key = process.env.RESEND_CONTACTS_API_KEY;
  if (!key) {
    // Que la audiencia no se esté cargando tiene que verse en los logs (una vez por instancia)
    if (!faltaClaveAvisada) {
      faltaClaveAvisada = true;
      console.warn("Resend: falta RESEND_CONTACTS_API_KEY; los contactos no se están cargando en la audiencia.");
    }
    return;
  }

  try {
    const resend = new Resend(key);
    const partes = (data.nombre ?? "").trim().split(/\s+/).filter(Boolean);
    const base = {
      email: data.email.trim().toLowerCase(),
      firstName: partes[0],
      lastName: partes.slice(1).join(" ") || undefined,
      unsubscribed: false,
      ...(process.env.RESEND_SEGMENT_ID ? { segments: [{ id: process.env.RESEND_SEGMENT_ID }] } : {}),
    };

    let { error } = await resend.contacts.create({ ...base, properties: { origen: data.origen } });

    // La propiedad "origen" todavía no existe en Resend: se carga el contacto sin ella
    if (error && /propert/i.test(error.message)) {
      console.error("Resend: falta crear la propiedad de contacto «origen».");
      ({ error } = await resend.contacts.create(base));
    }

    // Ya existía: está bien, no se pisa nada
    if (error && !/exist|already|duplicate/i.test(error.message)) {
      console.error("Resend · contacto:", error.message);
    }
  } catch (e) {
    console.error("Error agregando el contacto a Resend:", e);
  }
}
