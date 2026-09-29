/**
 * Antispam de Cloudflare Turnstile, del lado del servidor.
 *
 * Si TURNSTILE_SECRET_KEY no está configurada, deja pasar: así el sitio
 * funciona igual en desarrollo y antes de dar de alta las claves.
 * Si está configurada, un token ausente o inválido rechaza el envío.
 * Ante una falla de red con Cloudflare también deja pasar (fail-open,
 * como el rate limit): nunca bloqueamos a una persona real por un
 * problema ajeno.
 */
export async function verificarTurnstile(formData: FormData): Promise<boolean> {
  const secreto = process.env.TURNSTILE_SECRET_KEY;
  if (!secreto) return true;

  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) return false;

  try {
    const cuerpo = new URLSearchParams({ secret: secreto, response: token });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await r.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile:", e);
    return true;
  }
}

export const TURNSTILE_MSG = "No pudimos verificar que no seas un robot. Recargá la página y probá de nuevo.";
