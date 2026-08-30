"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { esSlotValido, formatearVisita, leerConfig } from "@/lib/utils/agenda";
import { buildPropertyUrl } from "@/lib/utils/urls";
import {
  sendVisitaToOwner, sendVisitaPendiente, sendVisitaRespuesta,
} from "@/lib/email";
import type { VisitasConfig, VisitaStatus } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

/* ────────────────────────────────────────────────────────────
   Público: pedir una visita
   ──────────────────────────────────────────────────────────── */

export async function solicitarVisita(propertyId: string, formData: FormData) {
  // Honeypot: campo invisible que solo completan los bots
  if ((formData.get("website") as string)?.trim()) return { ok: true };

  if (!(await checkRateLimit("visita", 5, 3600))) {
    return { error: RATE_LIMIT_MSG };
  }

  const nombre  = (formData.get("nombre")  as string)?.trim();
  const email   = (formData.get("email")   as string)?.trim();
  const mensaje = (formData.get("mensaje") as string)?.trim() || null;
  const inicio  = (formData.get("inicio")  as string)?.trim();

  if (!nombre || !email) return { error: "Completá tu nombre y tu email." };
  if (!inicio) return { error: "Elegí un horario para la visita." };

  const tel = normalizarTelefono(formData.get("telefono") as string);
  if (!tel.ok) return { error: tel.error };

  // El horario que manda el cliente nunca se toma como válido sin verificar:
  // se compara contra la disponibilidad real del dueño.
  const admin = createAdminClient();
  const { data: property } = await admin
    .from("properties")
    .select("id, titulo, tipo, operacion, barrio, status, visitas_config, owner_id, profiles(nombre, email)")
    .eq("id", propertyId)
    .single();

  if (!property || property.status !== "activa") {
    return { error: "Esta propiedad ya no está disponible." };
  }

  const config = leerConfig(property.visitas_config);
  if (!config.activa) {
    return { error: "El dueño no está recibiendo visitas por agenda en este momento." };
  }
  if (!esSlotValido(config, inicio)) {
    return { error: "Ese horario ya no está disponible. Elegí otro de la lista." };
  }

  // ¿Alguien más lo tiene confirmado?
  const { data: yaConfirmada } = await admin
    .from("visitas")
    .select("id")
    .eq("property_id", propertyId)
    .eq("inicio", new Date(inicio).toISOString())
    .eq("status", "confirmada")
    .maybeSingle();

  if (yaConfirmada) {
    return { error: "Ese horario acaba de ocuparse. Elegí otro de la lista." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("visitas").insert({
    property_id: propertyId,
    nombre,
    email,
    telefono: tel.valor,
    mensaje,
    inicio: new Date(inicio).toISOString(),
    duracion: config.duracion,
    status: "pendiente",
  });

  if (error) {
    console.error("Error guardando visita:", error.message);
    return { error: "No pudimos registrar el pedido. Intentá nuevamente." };
  }

  // Los emails nunca hacen fallar el pedido: ya quedó guardado.
  try {
    const propertyUrl = SITE + buildPropertyUrl(property);
    const cuando = formatearVisita(inicio);
    const owner = property.profiles as unknown as { nombre: string; email: string } | null;

    if (owner?.email) {
      await sendVisitaToOwner({
        ownerEmail: owner.email,
        ownerNombre: owner.nombre,
        propertyTitulo: property.titulo,
        propertyUrl,
        cuando,
        interesadoNombre: nombre,
        interesadoEmail: email,
        interesadoTelefono: tel.valor,
        mensaje,
      });
    }

    await sendVisitaPendiente({
      interesadoEmail: email,
      interesadoNombre: nombre,
      propertyTitulo: property.titulo,
      propertyUrl,
      cuando,
    });
  } catch (e) {
    console.error("Error enviando emails de visita:", e);
  }

  revalidatePath("/panel");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────
   Dueño: disponibilidad
   ──────────────────────────────────────────────────────────── */

export async function guardarDisponibilidad(propertyId: string, config: VisitasConfig) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const limpia = leerConfig(config);

  // Guardamos las franjas aunque la agenda esté apagada, para que
  // el dueño pueda volver a encenderla sin recargar todo de nuevo.
  const { error } = await supabase
    .from("properties")
    .update({ visitas_config: { ...limpia, activa: config.activa === true && limpia.franjas.length > 0 } })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Error guardando disponibilidad:", error.message);
    return { error: "No se pudo guardar la disponibilidad." };
  }

  revalidatePath("/panel");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────
   Dueño: responder un pedido
   ──────────────────────────────────────────────────────────── */

export async function responderVisita(
  id: string,
  status: VisitaStatus,
  nota?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // RLS ya limita el UPDATE a las propiedades del usuario, pero
  // necesitamos los datos igual para avisarle al interesado.
  const { data: visita } = await supabase
    .from("visitas")
    .select("id, inicio, nombre, email, property_id, properties(id, titulo, direccion, tipo, operacion, barrio, owner_id, profiles(nombre, telefono))")
    .eq("id", id)
    .single();

  if (!visita) return { error: "Pedido de visita no encontrado." };

  const propiedad = visita.properties as unknown as {
    id: string; titulo: string; direccion: string | null; tipo: string; operacion: string;
    barrio: string | null; owner_id: string;
    profiles: { nombre: string; telefono: string | null } | null;
  } | null;

  if (!propiedad || propiedad.owner_id !== user.id) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("visitas")
    .update({ status, nota_dueno: nota?.trim() || null })
    .eq("id", id);

  if (error) {
    // El índice único salta si ya hay otra visita confirmada en ese horario
    if (error.code === "23505") {
      return { error: "Ya tenés otra visita confirmada en ese horario." };
    }
    console.error("Error actualizando visita:", error.message);
    return { error: "No se pudo actualizar el pedido." };
  }

  if (status === "confirmada" || status === "rechazada") {
    try {
      await sendVisitaRespuesta({
        interesadoEmail: visita.email,
        interesadoNombre: visita.nombre,
        propertyTitulo: propiedad.titulo,
        propertyUrl: SITE + buildPropertyUrl(propiedad),
        cuando: formatearVisita(visita.inicio),
        confirmada: status === "confirmada",
        direccion: propiedad.direccion,
        ownerNombre: propiedad.profiles?.nombre || "El dueño",
        ownerTelefono: propiedad.profiles?.telefono,
        nota: nota?.trim() || null,
      });
    } catch (e) {
      console.error("Error enviando respuesta de visita:", e);
    }
  }

  revalidatePath("/panel");
  return { ok: true };
}
