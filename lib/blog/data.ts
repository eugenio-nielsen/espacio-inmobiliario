import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Post } from "./types";

/** Notas publicadas (público), más recientes primero. */
export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "publicado")
    .order("published_at", { ascending: false });
  return (data || []) as Post[];
}

/** Una nota publicada por slug (público). */
export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  return (data as Post) || null;
}

/**
 * Una nota por slug, publicada o no. Solo para la vista previa del
 * admin: usa el service role porque el RLS deja leer únicamente las
 * publicadas. Quien llama tiene que haber verificado que es el admin.
 */
export async function getPostParaVistaPrevia(slug: string): Promise<Post | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("posts").select("*").eq("slug", slug).maybeSingle();
  return (data as Post) || null;
}
