"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugifyUbicacion } from "@/lib/ubicaciones";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { geocodeProperty, type GeoResult } from "@/lib/utils/geocode";
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

/**
 * Sube los archivos en orden y devuelve un array alineado con la entrada:
 * la URL de cada uno, o null si ese falló. Mantener la posición importa:
 * el orden de las fotos decide la portada, y si un fallo corriera los
 * índices, la portada elegida quedaría en otra foto.
 */
async function subirEnOrden(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, files: File[]) {
  const urls: (string | null)[] = [];
  for (const file of files) {
    if (!file.size) { urls.push(null); continue; }
    const ext = file.name.split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-photos")
      .upload(path, file, { contentType: file.type });
    if (error) { urls.push(null); continue; }
    const { data: { publicUrl } } = supabase.storage
      .from("property-photos")
      .getPublicUrl(path);
    urls.push(publicUrl);
  }
  return urls;
}

async function uploadFotos(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, files: File[]) {
  return (await subirEnOrden(supabase, userId, files)).filter((u): u is string => !!u);
}

/**
 * Ubicación marcada en el mapa del formulario (pin puesto a mano o
 * confirmado). Si viene, manda sobre la geocodificación: en islas del
 * Delta o lotes sin calle el buscador no encuentra nada, y re-geocodificar
 * en cada edición pisaba el lugar que el dueño había marcado.
 * Se descartan coordenadas fuera de Argentina.
 */
function ubicacionElegida(formData: FormData): GeoResult | null {
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!formData.get("lat") || !formData.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -56 || lat > -21 || lng < -74 || lng > -53) return null;
  return {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    aproximada: formData.get("geo_aproximada") === "true",
  };
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

  // La ubicación del mapa manda; si no hay, se geocodifica la dirección
  const geo = ubicacionElegida(formData) ?? await geocodeProperty({
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

  const subidas = await subirEnOrden(supabase, user.id, formData.getAll("fotos_nuevas") as File[]);
  const fotosExistentes = formData.getAll("fotos_existentes") as string[];
  // `fotos_orden` trae el orden final mezclando guardadas ("e:<url>") y
  // nuevas ("n:<índice>"), así cualquier foto puede ser la portada. Sin
  // él (formulario viejo en caché), las nuevas van al final.
  const orden = formData.getAll("fotos_orden") as string[];
  const fotoUrls = orden.length
    ? orden
        .map(t => (t.startsWith("n:") ? subidas[Number(t.slice(2))] ?? null : t.startsWith("e:") ? t.slice(2) : null))
        .filter((u): u is string => !!u)
    : [...fotosExistentes, ...subidas.filter((u): u is string => !!u)];

  const operacion = formData.get("operacion") as string;
  const tipo = formData.get("tipo") as string;
  const barrio = formData.get("barrio") as string;

  // La ubicación del mapa manda (el formulario manda la guardada si nadie
  // la tocó); si no hay, se geocodifica la dirección
  const geo = ubicacionElegida(formData) ?? await geocodeProperty({
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
  // Las fotos como quedaron guardadas: el formulario las toma para que las
  // recién subidas dejen de figurar como nuevas (si no, un segundo
  // "Guardar" las volvía a subir duplicadas)
  return { ok: true, publicPath, fotos: fotoUrls };
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
