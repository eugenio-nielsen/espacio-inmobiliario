"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { generarDescripcion, type CamposDescripcion } from "@/lib/ai/descripcion";

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";
const LIMITE_POR_PROPIEDAD = 2;

type Resultado =
  | { ok: true; descripcion: string; usosRestantes: number | null }
  | { ok: false; error: string };

/**
 * Genera una descripción con IA para una propiedad.
 *
 * Control de costos:
 *  - Límite de 2 generaciones POR PROPIEDAD (columna properties.ai_usos),
 *    aplicado del lado del servidor para propiedades ya guardadas.
 *  - En el alta (propiedad todavía sin id) la generación funciona igual,
 *    protegida por un rate-limit por IP; el cap de 2 rige una vez guardada.
 *  - El admin queda exento de ambos límites.
 */
export async function generarDescripcionIA(args: {
  propertyId?: string | null;
  campos: CamposDescripcion;
}): Promise<Resultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const esAdmin = user.email === ADMIN_EMAIL;

  // Guard de costo universal: máx. 8 generaciones por hora por IP.
  if (!esAdmin && !(await checkRateLimit("ai-descripcion", 8, 3600))) {
    return { ok: false, error: RATE_LIMIT_MSG };
  }

  const admin = createAdminClient();

  // Cap por propiedad (solo aplica a propiedades ya guardadas).
  let usosRestantes: number | null = null;
  if (args.propertyId && !esAdmin) {
    const { data: prop } = await admin
      .from("properties")
      .select("ai_usos, owner_id")
      .eq("id", args.propertyId)
      .single();

    if (!prop || prop.owner_id !== user.id) {
      return { ok: false, error: "Propiedad no encontrada." };
    }
    const usados = prop.ai_usos ?? 0;
    if (usados >= LIMITE_POR_PROPIEDAD) {
      return {
        ok: false,
        error: `Ya generaste ${LIMITE_POR_PROPIEDAD} descripciones con IA para esta propiedad.`,
      };
    }
    usosRestantes = LIMITE_POR_PROPIEDAD - usados - 1;
  }

  // Generación (una sola pasada con Claude Haiku).
  let descripcion: string;
  try {
    descripcion = await generarDescripcion(args.campos);
  } catch (e) {
    console.error("Error generando descripción con IA:", e);
    return {
      ok: false,
      error: "No se pudo generar la descripción. Intentá de nuevo en un momento.",
    };
  }
  if (!descripcion) {
    return { ok: false, error: "No se pudo generar la descripción. Intentá de nuevo." };
  }

  // Registrar el uso en la propiedad (best-effort, solo si ya existe).
  if (args.propertyId && !esAdmin) {
    try {
      const { data: prop } = await admin
        .from("properties")
        .select("ai_usos")
        .eq("id", args.propertyId)
        .single();
      await admin
        .from("properties")
        .update({ ai_usos: (prop?.ai_usos ?? 0) + 1 })
        .eq("id", args.propertyId);
    } catch (e) {
      console.error("Error registrando uso de IA:", e);
    }
  }

  return { ok: true, descripcion, usosRestantes };
}
