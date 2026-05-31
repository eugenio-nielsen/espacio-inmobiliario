"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendInquiry(propertyId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const mensaje = (formData.get("mensaje") as string)?.trim();

  if (!nombre || !email || !mensaje) return { error: "Completá todos los campos obligatorios." };

  const { error } = await supabase.from("inquiries").insert({
    property_id: propertyId,
    nombre,
    email,
    telefono,
    mensaje,
  });

  if (error) return { error: "No se pudo enviar la consulta. Intentá nuevamente." };

  revalidatePath(`/panel/consultas`);
  return { ok: true };
}
