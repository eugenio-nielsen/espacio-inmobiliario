import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Enlaces firmados para los emails de la Tertulia: dejar de recibir
 * avisos sin tener que ingresar. El token lleva el id del miembro, el para qué
 * y el vencimiento, firmados con HMAC: no hace falta guardarlo en la base
 * y nadie puede fabricar uno para otra cuenta.
 *
 * La clave es FORO_SECRET; si no está configurada se usa la service key
 * de Supabase, que ya es secreta y existe en todos los entornos.
 * Solo servidor.
 */
type Proposito = "avisos";

function clave(): string {
  const k = process.env.FORO_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Falta FORO_SECRET o SUPABASE_SERVICE_ROLE_KEY");
  return k;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const firmar = (datos: string) => createHmac("sha256", clave()).update(datos).digest("base64url");

export function crearToken(proposito: Proposito, miembroId: string, dias: number): string {
  const vence = Math.floor(Date.now() / 1000) + dias * 86400;
  const datos = b64(`${proposito}.${miembroId}.${vence}`);
  return `${datos}.${firmar(datos)}`;
}

/** El id del miembro si el token es válido, vigente y para este propósito. */
export function leerToken(proposito: Proposito, token: string | null | undefined): string | null {
  if (!token) return null;
  const [datos, firma] = token.split(".");
  if (!datos || !firma) return null;

  const esperada = Buffer.from(firmar(datos));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  const [p, id, vence] = Buffer.from(datos, "base64url").toString().split(".");
  if (p !== proposito || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!Number(vence) || Number(vence) < Date.now() / 1000) return null;
  return id;
}
