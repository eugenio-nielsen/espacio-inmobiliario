import { createClient } from "@/lib/supabase/server";
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
