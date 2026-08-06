import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Usuario actual, cacheado por request.
 *
 * El Navbar y la página que lo contiene necesitaban el usuario por separado,
 * lo que provocaba dos llamadas de auth por render. Con cache() se hace una sola.
 *
 * Ojo: getUser() no debe ir dentro de un Promise.all junto a otras consultas
 * de Supabase — el adaptador de cookies falla si corren en paralelo.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/** Perfil del usuario actual (nombre), cacheado por request. */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles").select("nombre").eq("id", user.id).single();
  return data;
});
