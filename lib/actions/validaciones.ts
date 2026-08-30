"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendValidacionPendiente, sendValidacionResuelta } from "@/lib/email";
import type { EstadoValidacion, TipoDocumento } from "@/lib/types";

const BUCKET = "documentos";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "eugenio@espacioinmobiliario.com.ar";

/** 8 MB por archivo: una foto de documento no necesita más. */
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/**
 * Sube un archivo al bucket privado, bajo la carpeta del usuario.
 * La ruta empieza con el id del usuario porque las policies de storage
 * comparan esa primera carpeta contra auth.uid().
 */
async function subirDocumento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  carpeta: string,
  file: File
): Promise<{ ok: true; ruta: string } | { ok: false; error: string }> {
  if (!file || !file.size) return { ok: false, error: "Falta adjuntar el archivo." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Cada archivo tiene que pesar menos de 8 MB." };
  }
  if (!TIPOS_OK.includes(file.type)) {
    return { ok: false, error: "Se aceptan imágenes (JPG, PNG, WEBP) o PDF." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${userId}/${carpeta}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Error subiendo documento:", error.message);
    return { ok: false, error: "No se pudo subir el archivo. Probá de nuevo." };
  }
  return { ok: true, ruta };
}

/** Borra archivos viejos para no acumular documentos sensibles de más. */
async function borrarDocumentos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rutas: (string | null | undefined)[]
) {
  const limpias = rutas.filter((r): r is string => !!r);
  if (!limpias.length) return;
  await supabase.storage.from(BUCKET).remove(limpias);
}

/* ────────────────────────────────────────────────────────────
   Validación de identidad (del titular)
   ──────────────────────────────────────────────────────────── */

export async function enviarValidacionIdentidad(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const tipoDoc = formData.get("tipo_doc") as TipoDocumento;
  if (!["dni", "pasaporte", "registro"].includes(tipoDoc)) {
    return { error: "Elegí qué documento vas a subir." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("identidad_estado, identidad_frente, identidad_dorso")
    .eq("id", user.id)
    .single();

  if (perfil?.identidad_estado === "pendiente") {
    return { error: "Ya tenés un envío en revisión." };
  }
  if (perfil?.identidad_estado === "aprobada") {
    return { error: "Tu identidad ya está validada." };
  }

  const frente = await subirDocumento(supabase, user.id, "identidad", formData.get("frente") as File);
  if (!frente.ok) return { error: frente.error };

  const dorso = await subirDocumento(supabase, user.id, "identidad", formData.get("dorso") as File);
  if (!dorso.ok) {
    // No dejamos el frente huérfano si el dorso falla
    await borrarDocumentos(supabase, [frente.ruta]);
    return { error: dorso.error };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      identidad_estado: "pendiente",
      identidad_tipo_doc: tipoDoc,
      identidad_frente: frente.ruta,
      identidad_dorso: dorso.ruta,
      identidad_enviada_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    await borrarDocumentos(supabase, [frente.ruta, dorso.ruta]);
    console.error("Error guardando validación de identidad:", error.message);
    return { error: "No se pudo registrar el envío. Probá de nuevo." };
  }

  // Los archivos del intento anterior ya no sirven
  await borrarDocumentos(supabase, [perfil?.identidad_frente, perfil?.identidad_dorso]);

  try {
    await sendValidacionPendiente({
      tipo: "identidad",
      adminEmail: ADMIN_EMAIL,
      quien: user.email || "un usuario",
      detalle: `Documento: ${tipoDoc}`,
    });
  } catch (e) {
    console.error("Error avisando validación pendiente:", e);
  }

  revalidatePath("/panel/perfil");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────
   Validación de dominio (de una propiedad concreta)
   ──────────────────────────────────────────────────────────── */

export async function enviarValidacionDominio(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: propiedad } = await supabase
    .from("properties")
    .select("id, titulo, owner_id, dominio_estado, dominio_archivo")
    .eq("id", propertyId)
    .single();

  if (!propiedad || propiedad.owner_id !== user.id) {
    return { error: "No autorizado" };
  }
  if (propiedad.dominio_estado === "pendiente") {
    return { error: "Ya tenés un envío en revisión para esta propiedad." };
  }
  if (propiedad.dominio_estado === "aprobada") {
    return { error: "Esta propiedad ya tiene el dominio validado." };
  }

  const escritura = await subirDocumento(supabase, user.id, "dominio", formData.get("escritura") as File);
  if (!escritura.ok) return { error: escritura.error };

  const { error } = await supabase
    .from("properties")
    .update({
      dominio_estado: "pendiente",
      dominio_archivo: escritura.ruta,
      dominio_enviada_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) {
    await borrarDocumentos(supabase, [escritura.ruta]);
    console.error("Error guardando validación de dominio:", error.message);
    return { error: "No se pudo registrar el envío. Probá de nuevo." };
  }

  await borrarDocumentos(supabase, [propiedad.dominio_archivo]);

  try {
    await sendValidacionPendiente({
      tipo: "dominio",
      adminEmail: ADMIN_EMAIL,
      quien: user.email || "un usuario",
      detalle: `Propiedad: "${propiedad.titulo}"`,
    });
  } catch (e) {
    console.error("Error avisando validación pendiente:", e);
  }

  revalidatePath("/panel/perfil");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────
   Resolución manual (solo superadmin)
   ──────────────────────────────────────────────────────────── */

async function esAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === ADMIN_EMAIL;
}

export async function resolverValidacion(
  tipo: "identidad" | "dominio",
  id: string,
  decision: Extract<EstadoValidacion, "aprobada" | "rechazada">,
  motivo?: string
) {
  if (!(await esAdmin())) return { error: "No autorizado" };
  if (decision === "rechazada" && !motivo?.trim()) {
    return { error: "Poné el motivo del rechazo: la persona lo va a recibir por mail." };
  }

  // El trigger de la base solo deja cambiar el estado al service role
  const admin = createAdminClient();
  const ahora = new Date().toISOString();

  if (tipo === "identidad") {
    const { data: perfil } = await admin
      .from("profiles").select("email, nombre").eq("id", id).single();

    const { error } = await admin
      .from("profiles")
      .update({
        identidad_estado: decision,
        identidad_revisada_at: ahora,
        identidad_motivo: motivo?.trim() || null,
      })
      .eq("id", id);
    if (error) return { error: "No se pudo actualizar la validación." };

    if (perfil?.email) {
      try {
        await sendValidacionResuelta({
          para: perfil.email,
          nombre: perfil.nombre || "",
          tipo: "identidad",
          aprobada: decision === "aprobada",
          motivo: motivo?.trim() || null,
        });
      } catch (e) { console.error("Error avisando resolución:", e); }
    }
  } else {
    const { data: prop } = await admin
      .from("properties")
      .select("titulo, profiles(email, nombre)")
      .eq("id", id)
      .single();

    const { error } = await admin
      .from("properties")
      .update({
        dominio_estado: decision,
        dominio_revisada_at: ahora,
        dominio_motivo: motivo?.trim() || null,
      })
      .eq("id", id);
    if (error) return { error: "No se pudo actualizar la validación." };

    const dueno = prop?.profiles as unknown as { email: string; nombre: string } | null;
    if (dueno?.email) {
      try {
        await sendValidacionResuelta({
          para: dueno.email,
          nombre: dueno.nombre || "",
          tipo: "dominio",
          aprobada: decision === "aprobada",
          motivo: motivo?.trim() || null,
          propiedad: prop?.titulo,
        });
      } catch (e) { console.error("Error avisando resolución:", e); }
    }
  }

  revalidatePath("/panel/admin");
  revalidatePath("/panel/perfil");
  revalidatePath("/propiedades", "layout");
  return { ok: true };
}

/**
 * URLs firmadas para que el superadmin pueda mirar los documentos.
 * Duran poco a propósito: son documentos de identidad y escrituras.
 */
export async function verDocumentos(rutas: string[]) {
  if (!(await esAdmin())) return { error: "No autorizado" };

  const admin = createAdminClient();
  const urls: Record<string, string> = {};
  for (const ruta of rutas.filter(Boolean)) {
    const { data } = await admin.storage.from(BUCKET).createSignedUrl(ruta, 300);
    if (data?.signedUrl) urls[ruta] = data.signedUrl;
  }
  return { ok: true, urls };
}
