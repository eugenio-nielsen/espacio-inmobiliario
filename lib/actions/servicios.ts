"use server";

import { createClient } from "@/lib/supabase/server";
import { sendServiceInterest } from "@/lib/email";

export async function requestServiceConnection(servicio: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Tenés que iniciar sesión para hacer esta solicitud." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, email")
    .eq("id", user.id)
    .single();

  const nombre = profile?.nombre || user.email || "Sin nombre";
  const email  = profile?.email  || user.email || "";

  await sendServiceInterest({ nombre, email, servicio });

  return { ok: true };
}
