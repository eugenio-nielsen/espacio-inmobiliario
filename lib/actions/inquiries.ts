"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InquiryStatus } from "@/lib/types";

export async function sendInquiry(propertyId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre  = (formData.get("nombre")  as string)?.trim();
  const email   = (formData.get("email")   as string)?.trim();
  const telefono= (formData.get("telefono") as string)?.trim() || null;
  const mensaje = (formData.get("mensaje") as string)?.trim();

  if (!nombre || !email || !mensaje) return { error: "Completá todos los campos obligatorios." };

  const { error } = await supabase.from("inquiries").insert({
    property_id: propertyId,
    nombre, email, telefono, mensaje,
    status: "nuevo",
    favorito: false,
  });

  if (error) return { error: "No se pudo enviar la consulta. Intentá nuevamente." };

  revalidatePath("/panel");
  return { ok: true };
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verificar que la consulta pertenece a una propiedad del usuario
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("property_id, properties(owner_id)")
    .eq("id", id)
    .single();

  if (!inquiry) return { error: "Consulta no encontrada" };

  await supabase
    .from("inquiries")
    .update({ status, leida: status !== "nuevo" })
    .eq("id", id);

  revalidatePath("/panel");
  return { ok: true };
}

export async function toggleFavorito(id: string, current: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await supabase
    .from("inquiries")
    .update({ favorito: !current })
    .eq("id", id);

  revalidatePath("/panel");
  return { ok: true };
}

export async function markPropertyInquiriesVisto(propertyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("inquiries")
    .update({ status: "visto", leida: true })
    .eq("property_id", propertyId)
    .eq("status", "nuevo");

  revalidatePath("/panel");
}
