"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugifyUbicacion } from "@/lib/ubicaciones";
import { buildPropertyUrl } from "@/lib/utils/urls";

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

  const fotoUrls = await uploadFotos(supabase, user.id, formData.getAll("fotos") as File[]);

  const tempId = crypto.randomUUID();
  const operacion = formData.get("operacion") as string;
  const tipo = formData.get("tipo") as string;
  const barrio = formData.get("barrio") as string;

  const slug = `${slugify(barrio)}-${tipo}-${tempId.slice(0, 8)}`;

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
      ambientes: formData.get("ambientes") ? Number(formData.get("ambientes")) : null,
      dormitorios: formData.get("dormitorios") ? Number(formData.get("dormitorios")) : null,
      banos: formData.get("banos") ? Number(formData.get("banos")) : null,
      cochera: formData.get("cochera") === "true",
      fotos: fotoUrls,
    })
    .select("id, operacion, barrio, tipo, slug")
    .single();

  if (error) return { error: error.message };

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
      ambientes: formData.get("ambientes") ? Number(formData.get("ambientes")) : null,
      dormitorios: formData.get("dormitorios") ? Number(formData.get("dormitorios")) : null,
      banos: formData.get("banos") ? Number(formData.get("banos")) : null,
      cochera: formData.get("cochera") === "true",
      status: formData.get("status") as string,
      fotos: fotoUrls,
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
