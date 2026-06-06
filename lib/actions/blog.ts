"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyTitulo } from "@/lib/blog/markdown";
import type { Post, PostStatus } from "@/lib/blog/types";

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("No autorizado.");
}

export interface PostInput {
  id?: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  cover: string | null;
  categoria: string;
  status: PostStatus;
  meta_title: string;
  meta_description: string;
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function savePost(input: PostInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const slug = (input.slug?.trim() || slugifyTitulo(input.titulo)).trim();
    if (!input.titulo?.trim()) return { ok: false, error: "El título es obligatorio." };
    if (!slug) return { ok: false, error: "El slug es inválido." };

    const row = {
      slug,
      titulo: input.titulo.trim(),
      resumen: input.resumen?.trim() || null,
      contenido: input.contenido || "",
      cover: input.cover || null,
      categoria: input.categoria || null,
      status: input.status,
      meta_title: input.meta_title?.trim() || null,
      meta_description: input.meta_description?.trim() || null,
      // setear published_at la primera vez que se publica
      published_at: input.status === "publicado" ? new Date().toISOString() : null,
    };

    if (input.id) {
      // No pisar published_at si ya estaba publicada
      const { data: existing } = await admin.from("posts").select("published_at, status").eq("id", input.id).maybeSingle();
      const published_at =
        input.status === "publicado"
          ? (existing?.published_at || new Date().toISOString())
          : existing?.published_at || null;
      const { error } = await admin.from("posts").update({ ...row, published_at }).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
      revalidateBlog(slug);
      return { ok: true, id: input.id };
    } else {
      const { data, error } = await admin.from("posts").insert(row).select("id").single();
      if (error) return { ok: false, error: error.message };
      revalidateBlog(slug);
      return { ok: true, id: data.id };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("posts").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateBlog();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Sube una imagen (base64 data URL) al bucket blog-images y devuelve la URL pública. */
export async function uploadBlogImage(dataUrl: string, filename: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) return { ok: false, error: "Formato de imagen inválido." };
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");

    const ext = (filename.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await admin.storage.from("blog-images").upload(path, buffer, { contentType, upsert: false });
    if (error) return { ok: false, error: error.message };

    const { data } = admin.storage.from("blog-images").getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Todas las notas (admin, incluye borradores). */
export async function getAllPostsAdmin(): Promise<Post[]> {
  await assertAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("posts").select("*").order("updated_at", { ascending: false });
  return (data || []) as Post[];
}
