import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limit por IP respaldado en Supabase (función check_rate_limit).
 * Devuelve true si la acción está permitida.
 * Fail-open: ante cualquier error deja pasar — nunca bloquea usuarios
 * reales por una falla nuestra.
 */
export async function checkRateLimit(
  scope: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "unknown";

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${scope}:${ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limit RPC error:", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("Rate limit error:", e);
    return true;
  }
}

/** Mensaje genérico para respuestas de rate limit. */
export const RATE_LIMIT_MSG =
  "Recibimos demasiadas solicitudes desde tu conexión. Esperá unos minutos y volvé a intentar.";
