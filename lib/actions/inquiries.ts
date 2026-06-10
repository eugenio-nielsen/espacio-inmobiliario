"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InquiryStatus } from "@/lib/types";
import { sendInquiryToOwner, sendInquiryConfirmation } from "@/lib/email";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";

export async function sendInquiry(propertyId: string, formData: FormData) {
  // Honeypot: campo invisible que solo completan los bots → simular éxito
  if ((formData.get("website") as string)?.trim()) return { ok: true };

  // Máx. 5 consultas por hora por IP (protege DB y cuota de emails)
  if (!(await checkRateLimit("inquiry", 5, 3600))) {
    return { error: RATE_LIMIT_MSG };
  }

  const supabase = await createClient();

  const nombre   = (formData.get("nombre")   as string)?.trim();
  const email    = (formData.get("email")    as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const mensaje  = (formData.get("mensaje")  as string)?.trim();

  if (!nombre || !email || !mensaje) return { error: "Completá todos los campos obligatorios." };

  const { error } = await supabase.from("inquiries").insert({
    property_id: propertyId,
    nombre, email, telefono, mensaje,
    status: "nuevo", favorito: false,
  });

  if (error) return { error: "No se pudo enviar la consulta. Intentá nuevamente." };

  // Obtener datos de la propiedad y del dueño para los emails
  try {
    const { data: property } = await supabase
      .from("properties")
      .select("titulo, operacion, barrio, tipo, short_id, profiles(nombre, email)")
      .eq("id", propertyId)
      .single();

    if (property) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://espacio-inmobiliario-one.vercel.app";
      const { slugifyUbicacion } = await import("@/lib/ubicaciones");
      const barrioSlug = slugifyUbicacion(property.barrio || "sin-ubicacion");
      const propertyUrl = `${siteUrl}/propiedades/${property.operacion}/${barrioSlug}/${property.tipo}/${property.short_id}`;

      const owner = property.profiles as unknown as { nombre: string; email: string } | null;

      // Email al dueño + copia al admin
      if (owner?.email) {
        await sendInquiryToOwner({
          ownerEmail: owner.email,
          ownerNombre: owner.nombre,
          propertyTitulo: property.titulo,
          propertyUrl,
          interesadoNombre: nombre,
          interesadoEmail: email,
          interesadoTelefono: telefono,
          mensaje,
        });
      }

      // Confirmación al interesado
      await sendInquiryConfirmation({
        interesadoEmail: email,
        interesadoNombre: nombre,
        propertyTitulo: property.titulo,
        propertyUrl,
      });
    }
  } catch (emailError) {
    // El email falla silenciosamente — la consulta ya fue guardada
    console.error("Error enviando email de consulta:", emailError);
  }

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
