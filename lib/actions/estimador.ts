"use server";

import { ADMIN_EMAIL } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEstimacionLead } from "@/lib/email";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import type { EstimadorConfig } from "@/lib/estimador/types";
import { ubicarDireccion } from "@/lib/estimador/ubicar";


async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error("No autorizado.");
  }
  return user;
}

// ── Lead: guardar estimación + contacto y avisar al admin ──────
export async function guardarLead(data: {
  estimacionId?: string | null;
  input: unknown;
  resultado: unknown;
  barrio: string;
  nombre: string;
  email: string;
  telefono?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!data.nombre || !data.email) {
    return { ok: false, error: "Nombre y email son obligatorios." };
  }

  // Máx. 5 leads por hora por IP (protege DB y cuota de emails)
  if (!(await checkRateLimit("estimador-lead", 5, 3600))) {
    return { ok: false, error: RATE_LIMIT_MSG };
  }

  try {
    const admin = createAdminClient();
    const lead = {
      lead_nombre: data.nombre,
      lead_email: data.email,
      lead_telefono: data.telefono || null,
    };
    if (data.estimacionId) {
      // Enlazar el contacto a la estimación ya registrada (sin duplicar)
      await admin.from("estimaciones").update(lead).eq("id", data.estimacionId);
    } else {
      await admin.from("estimaciones").insert({
        barrio: data.barrio,
        input: data.input,
        resultado: data.resultado,
        ...lead,
      });
    }

    await sendEstimacionLead({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      barrio: data.barrio,
      input: data.input,
      resultado: data.resultado as { estimado: number; rangoMin: number; rangoMax: number },
    });

    return { ok: true };
  } catch (e) {
    console.error("Error guardando lead del estimador:", e);
    return { ok: false, error: "No se pudo enviar la solicitud. Intentá de nuevo." };
  }
}

// ── Admin: actualizar precio de un barrio ──────────────────────
export async function updatePrecioBarrio(barrio: string, precio: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    if (!Number.isFinite(precio) || precio <= 0) return { ok: false, error: "Precio inválido." };
    const admin = createAdminClient();
    const { error } = await admin
      .from("barrio_precios")
      .upsert({ barrio, precio_m2_usd: Math.round(precio), updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ── Admin: guardar la config completa de coeficientes ──────────
export async function saveConfig(config: EstimadorConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    for (const z of config.zonas ?? []) {
      const ok = z.nombre?.trim() && z.barrio
        && Number.isFinite(z.lat) && z.lat < -34.4 && z.lat > -34.8
        && Number.isFinite(z.lng) && z.lng < -58.2 && z.lng > -58.7
        && z.radioM >= 50 && z.radioM <= 3000
        && z.coef >= 0.6 && z.coef <= 1.6;
      if (!ok) {
        return { ok: false, error: `La zona "${z.nombre || "sin nombre"}" tiene datos fuera de rango (ubicación en CABA, radio de 50 a 3.000 m, coeficiente de 0,6 a 1,6).` };
      }
    }
    const admin = createAdminClient();
    const { error } = await admin
      .from("estimador_config")
      .upsert({ id: 1, config, updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ── Admin: ubicar una dirección para marcar el centro de una zona ──
export async function ubicarParaZona(direccion: string, barrio: string): Promise<{ ok: true; lat: number; lng: number } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const u = await ubicarDireccion(direccion, barrio);
    return u ? { ok: true, lat: u.lat, lng: u.lng } : { ok: false, error: "No se encontró esa dirección. Marcala en el mapa." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
