import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para leer datos públicos sin sesión: usa la clave
 * anónima y no toca las cookies, así que las rutas que lo usan pueden
 * cachearse (las del servidor, que sí leen cookies, no). Las políticas de
 * la base (RLS) siguen decidiendo qué se puede leer.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
