import type { AuthError } from "@supabase/supabase-js";

/**
 * Los errores de Supabase Auth llegan en inglés. Acá se traducen los que
 * puede ver una persona al crear la cuenta, ingresar o pedir de nuevo el
 * mail de confirmación. Se leen por `code` (estable), no por el texto.
 */

export const YA_EXISTE =
  "Ya existe una cuenta con ese email. Ingresá con tu contraseña (o recuperala si no te acordás).";

export const SIN_CONFIRMAR =
  "Todavía no confirmaste tu email. Abrí el enlace del mail que te mandamos o pedí que te lo mandemos de nuevo.";

/** Supabase deja pedir un mail por minuto a cada cuenta. */
export const MAIL_RECIENTE = "Ya te mandamos un mail hace instantes. Esperá un minuto y probá de nuevo.";

export function errorDeAuth(error: Pick<AuthError, "code" | "message">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "El email o la contraseña no son correctos.";
    case "email_not_confirmed":
      return SIN_CONFIRMAR;
    case "email_exists":
    case "user_already_exists":
      return YA_EXISTE;
    case "weak_password":
      return "La contraseña es muy débil. Usá al menos 6 caracteres.";
    case "email_address_invalid":
      return "Revisá el email: no parece válido.";
    case "over_email_send_rate_limit":
      return MAIL_RECIENTE;
    case "over_request_rate_limit":
      return "Hubo demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.";
  }
  // Cualquier otro: se deja el rastro para quien mire los logs y la persona
  // ve un mensaje en castellano
  console.error("Auth:", error.code, error.message);
  return "No pudimos completar el paso. Probá de nuevo en un momento.";
}
