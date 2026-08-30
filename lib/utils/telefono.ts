/**
 * Normalización de teléfonos para que los enlaces de WhatsApp funcionen.
 *
 * wa.me necesita el número en formato internacional y sin separadores.
 * Guardamos el teléfono ya normalizado (+54…) para no tener que adivinar
 * el código de país cada vez que se arma un enlace.
 */

export type ResultadoTelefono =
  | { ok: true; valor: string }
  | { ok: false; error: string };

const AYUDA = "Escribilo con código de área, por ejemplo: +54 9 11 1234-5678.";

export function normalizarTelefono(entrada: string | null | undefined): ResultadoTelefono {
  const crudo = (entrada ?? "").trim();
  if (!crudo) {
    return { ok: false, error: `Ingresá tu teléfono de WhatsApp. ${AYUDA}` };
  }

  // Un "+" al principio significa que la persona ya puso el código de país:
  // en ese caso lo respetamos en lugar de asumir Argentina.
  const traeCodigoPais = crudo.startsWith("+");
  let digitos = crudo.replace(/\D/g, "");

  if (!digitos) {
    return { ok: false, error: `El teléfono solo puede tener números. ${AYUDA}` };
  }

  // 0054… → 54…
  if (digitos.startsWith("00")) digitos = digitos.slice(2);

  const yaTiene54 = digitos.startsWith("54");
  let asumimosArgentina = false;

  if (!traeCodigoPais && !yaTiene54) {
    // Formato nacional: 011 4444-5555 → 11 4444-5555
    digitos = digitos.replace(/^0+/, "");
    digitos = "54" + digitos;
    asumimosArgentina = true;
  }

  // Un número argentino completo son 10 dígitos (área + abonado): 54 + 10 = 12.
  const minimo = asumimosArgentina || yaTiene54 ? 12 : 10;
  if (digitos.length < minimo || digitos.length > 15) {
    return { ok: false, error: `Ese teléfono no parece completo. ${AYUDA}` };
  }

  return { ok: true, valor: "+" + digitos };
}
