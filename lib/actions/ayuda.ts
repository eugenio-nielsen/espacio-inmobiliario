"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAyudaVenta } from "@/lib/email";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";

/**
 * El dueño pide acompañamiento profesional para vender una propiedad puntual.
 * Llega como aviso al admin para ofrecerle el servicio.
 */
export async function solicitarAyudaVenta(propertyId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  if (!(await checkRateLimit("ayuda-venta", 10, 3600))) {
    return { ok: false, error: RATE_LIMIT_MSG };
  }

  // Solo puede pedir ayuda para una propiedad propia
  const { data: prop } = await supabase
    .from("properties")
    .select("id, titulo, precio, moneda, barrio, ciudad, slug, owner_id")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!prop) return { ok: false, error: "Propiedad no encontrada." };

  const { data: perfil } = await supabase
    .from("profiles").select("nombre, email, telefono").eq("id", user.id).single();

  try {
    await sendAyudaVenta({
      propiedadTitulo: prop.titulo,
      propiedadPrecio: prop.precio,
      propiedadMoneda: prop.moneda,
      propiedadZona: [prop.barrio, prop.ciudad].filter(Boolean).join(", "),
      ownerNombre: perfil?.nombre || "Sin nombre",
      ownerEmail: perfil?.email || "",
      ownerTelefono: perfil?.telefono || null,
    });
  } catch (e) {
    console.error("Error enviando solicitud de ayuda:", e);
    return { ok: false, error: "No se pudo enviar la solicitud. Intentá de nuevo." };
  }

  return { ok: true };
}
