import { createClient as crearClienteSupabase } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { unirConfig, type CostosConfig } from "@/lib/catedra/costos";
import type { Profesional, ProfesionalAdmin } from "@/lib/catedra/rubros";

/**
 * Lecturas de la Cátedra.
 *
 * La configuración de la calculadora es pública (anon key, sin cookies).
 * La red de profesionales tiene datos de contacto de personas: no tiene
 * policies y se lee solo con el service role, y quien llama tiene que
 * haber comprobado antes que hay una sesión.
 */

const COLS_PUBLICAS = "id, nombre, rubro, matricula, zona, telefono, email, web, descripcion, recomendado";

function registrar(donde: string, e: unknown) {
  const msg = e && typeof e === "object" && "message" in e ? (e as { message: string }).message : String(e);
  console.error(`Cátedra · ${donde}:`, msg);
}

export async function getCostosConfig(): Promise<CostosConfig> {
  try {
    const sb = crearClienteSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await sb.from("catedra_config").select("config").eq("id", 1).maybeSingle();
    if (error) throw error;
    return unirConfig(data?.config as Partial<CostosConfig> | undefined);
  } catch (e) {
    registrar("getCostosConfig", e);
    return unirConfig(null);
  }
}

/** Profesionales aprobados. SOLO para usuarios con sesión (lo valida la página). */
export async function profesionalesAprobados(): Promise<Profesional[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("catedra_profesionales")
      .select(COLS_PUBLICAS)
      .eq("estado", "aprobado")
      .order("recomendado", { ascending: false })
      .order("nombre", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Profesional[];
  } catch (e) {
    registrar("profesionalesAprobados", e);
    return [];
  }
}

/** La ficha que cargó este usuario, si la tiene. */
export async function fichaDelUsuario(userId: string): Promise<ProfesionalAdmin | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("catedra_profesionales")
      .select(`${COLS_PUBLICAS}, estado, origen, user_id, consentimiento_at, created_at`)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as ProfesionalAdmin) ?? null;
  } catch (e) {
    registrar("fichaDelUsuario", e);
    return null;
  }
}

/** Todo, para el superadmin. */
export async function profesionalesAdmin(): Promise<ProfesionalAdmin[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("catedra_profesionales")
      .select(`${COLS_PUBLICAS}, estado, origen, user_id, consentimiento_at, created_at`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProfesionalAdmin[];
  } catch (e) {
    registrar("profesionalesAdmin", e);
    return [];
  }
}
