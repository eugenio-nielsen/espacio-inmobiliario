"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugifyUbicacion } from "@/lib/ubicaciones";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { geocodeProperty } from "@/lib/utils/geocode";
import { sendNewPropertyToAdmin } from "@/lib/email";
import { TOPE_SIN_VALIDAR } from "@/lib/types";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function uploadFotos(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const ext = file.name.split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-photos")
      .upload(path, file, { contentType: file.type });
    if (error) continue;
    const { data: { publicUrl } } = supabase.storage
      .from("property-photos")
      .getPublicUrl(path);
    urls.push(publicUrl);
  }
  return urls;
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // A partir de TOPE_SIN_VALIDAR publicaciones hace falta tener la
  // identidad validada. Se cuenta antes de subir las fotos para no
  // dejar archivos huérfanos si el corte aplica.
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if ((count ?? 0) >= TOPE_SIN_VALIDAR) {
    const { data: perfil } = await supabase
      .from("profiles").select("identidad_estado").eq("id", user.id).single();

    if (perfil?.identidad_estado !== "aprobada") {
      return {
        error: perfil?.identidad_estado === "pendiente"
          ? `Ya tenés ${count} publicaciones. Estamos revisando tu validación de identidad: apenas la aprobemos vas a poder seguir cargando.`
          : `Ya tenés ${count} publicaciones. Para cargar más necesitás validar tu identidad desde tu perfil.`,
        requiereValidacion: true,
      };
    }
  }

  const fotoUrls = await uploadFotos(supabase, user.id, formData.getAll("fotos") as File[]);

  const tempId = crypto.randomUUID();
  const operacion = formData.get("operacion") as string;
  const tipo = formData.get("tipo") as string;
  const barrio = formData.get("barrio") as string;

  const slug = `${slugify(barrio)}-${tipo}-${tempId.slice(0, 8)}`;

  // Geocodificar una sola vez al guardar (la ficha usa lat/lng de la DB)
  const geo = await geocodeProperty({
    direccion: formData.get("direccion") as string,
    barrio,
    ciudad: formData.get("ciudad") as string,
    provincia: formData.get("provincia") as string,
  }).catch(() => null);

  const { data, error } = await supabase
    .from("properties")
    .insert({
      id: tempId,
      owner_id: user.id,
      slug,
      titulo: formData.get("titulo"),
      descripcion: formData.get("descripcion"),
      tipo,
      operacion,
      precio: Number(formData.get("precio")),
      moneda: formData.get("moneda") || "USD",
      provincia: formData.get("provincia"),
      ciudad: formData.get("ciudad"),
      barrio,
      direccion: formData.get("direccion"),
      superficie_total: formData.get("superficie_total") ? Number(formData.get("superficie_total")) : null,
      superficie_cubierta: formData.get("superficie_cubierta") ? Number(formData.get("superficie_cubierta")) : null,
      superficie_balcon: formData.get("superficie_balcon") ? Number(formData.get("superficie_balcon")) : null,
      superficie_descubierta: formData.get("superficie_descubierta") ? Number(formData.get("superficie_descubierta")) : null,
      ambientes: formData.get("ambientes") ? Number(formData.get("ambientes")) : null,
      dormitorios: formData.get("dormitorios") ? Number(formData.get("dormitorios")) : null,
      banos: formData.get("banos") ? Number(formData.get("banos")) : null,
      cochera: formData.getAll("cochera").includes("true"),
      apto_credito: formData.getAll("apto_credito").includes("true"),
      orientacion: formData.get("orientacion") || null,
      disposicion: formData.get("disposicion") || null,
      expensas: formData.get("expensas") ? Number(formData.get("expensas")) : null,
      antiguedad: formData.get("antiguedad") !== null && formData.get("antiguedad") !== "" ? Number(formData.get("antiguedad")) : null,
      estado: formData.get("estado") || null,
      piso: (formData.get("piso") as string)?.trim() || null,
      plano: (await uploadFotos(supabase, user.id, formData.getAll("plano") as File[]))[0] || null,
      fotos: fotoUrls,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      geo_aproximada: geo?.aproximada ?? null,
    })
    .select("id, operacion, barrio, tipo, slug, titulo, precio, moneda, ciudad")
    .single();

  if (error) return { error: error.message };

  // Email al admin sobre la nueva propiedad
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, email")
      .eq("id", user.id)
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://espacio-inmobiliario-one.vercel.app";
    const publicUrl = `${siteUrl}${buildPropertyUrl({ ...data, id: tempId })}`;
    const panelUrl = `${siteUrl}/panel`;

    await sendNewPropertyToAdmin({
      titulo: data.titulo,
      tipo: formData.get("tipo") as string,
      precio: Number(formData.get("precio")),
      moneda: (formData.get("moneda") as string) || "USD",
      barrio: formData.get("barrio") as string,
      ciudad: formData.get("ciudad") as string,
      ownerNombre: profile?.nombre || "Sin nombre",
      ownerEmail: profile?.email || "",
      publicUrl,
      panelUrl,
    });
  } catch (emailError) {
    console.error("Error enviando email de nueva propiedad:", emailError);
  }

  revalidatePath("/panel");
  redirect(`/panel/propiedades/${data.slug}/editar?creada=1`);
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nuevasFotos = await uploadFotos(supabase, user.id, formData.getAll("fotos_nuevas") as File[]);
  const fotosExistentes = formData.getAll("fotos_existentes") as string[];
  const fotoUrls = [...fotosExistentes, ...nuevasFotos];

  const operacion = formData.get("operacion") as string;
  const tipo = formData.get("tipo") as string;
  const barrio = formData.get("barrio") as string;

  // Re-geocodificar al editar (la dirección puede haber cambiado)
  const geo = await geocodeProperty({
    direccion: formData.get("direccion") as string,
    barrio,
    ciudad: formData.get("ciudad") as string,
    provincia: formData.get("provincia") as string,
  }).catch(() => null);

  const { data, error } = await supabase
    .from("properties")
    .update({
      titulo: formData.get("titulo"),
      descripcion: formData.get("descripcion"),
      tipo,
      operacion,
      precio: Number(formData.get("precio")),
      moneda: formData.get("moneda") || "USD",
      provincia: formData.get("provincia"),
      ciudad: formData.get("ciudad"),
      barrio,
      direccion: formData.get("direccion"),
      superficie_total: formData.get("superficie_total") ? Number(formData.get("superficie_total")) : null,
      superficie_cubierta: formData.get("superficie_cubierta") ? Number(formData.get("superficie_cubierta")) : null,
      superficie_balcon: formData.get("superficie_balcon") ? Number(formData.get("superficie_balcon")) : null,
      superficie_descubierta: formData.get("superficie_descubierta") ? Number(formData.get("superficie_descubierta")) : null,
      ambientes: formData.get("ambientes") ? Number(formData.get("ambientes")) : null,
      dormitorios: formData.get("dormitorios") ? Number(formData.get("dormitorios")) : null,
      banos: formData.get("banos") ? Number(formData.get("banos")) : null,
      cochera: formData.getAll("cochera").includes("true"),
      apto_credito: formData.getAll("apto_credito").includes("true"),
      orientacion: formData.get("orientacion") || null,
      disposicion: formData.get("disposicion") || null,
      expensas: formData.get("expensas") ? Number(formData.get("expensas")) : null,
      antiguedad: formData.get("antiguedad") !== null && formData.get("antiguedad") !== "" ? Number(formData.get("antiguedad")) : null,
      estado: formData.get("estado") || null,
      piso: (formData.get("piso") as string)?.trim() || null,
      plano:
        (await uploadFotos(supabase, user.id, formData.getAll("plano") as File[]))[0] ||
        (formData.get("plano_existente") as string) ||
        null,
      status: formData.get("status") as string,
      fotos: fotoUrls,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      geo_aproximada: geo?.aproximada ?? null,
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, operacion, barrio, tipo, slug")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/panel");
  const publicPath = buildPropertyUrl(data);
  revalidatePath(publicPath);
  return { ok: true, publicPath };
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/panel");
  redirect("/panel");
}

// Cambio rápido de estado (activa / pausada / vendida) desde el panel
export async function setPropertyStatus(id: string, status: "activa" | "pausada" | "vendida") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (!["activa", "pausada", "vendida"].includes(status)) return { ok: false, error: "Estado inválido" };

  const { error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/panel");
  return { ok: true };
}
