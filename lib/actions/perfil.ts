"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizarTelefono } from "@/lib/utils/telefono";

/**
 * Actualiza los datos del propio usuario desde el panel.
 * El email no se toca acá: cambiarlo implica reverificar la cuenta.
 */
export async function actualizarPerfil(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const nombre = ((formData.get("nombre") as string) || "").trim();
  if (!nombre) return { ok: false, error: "Ingresá tu nombre." };

  // El teléfono es la vía de contacto que ven los interesados en la ficha
  const tel = normalizarTelefono(formData.get("telefono") as string);
  if (!tel.ok) return { ok: false, error: tel.error };

  const { error } = await supabase
    .from("profiles")
    .update({ nombre, telefono: tel.valor })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/panel");
  return { ok: true };
}
