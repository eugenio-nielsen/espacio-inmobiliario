import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aliasPorDefecto, slugify } from "@/lib/foro/texto";
import type { MiembroPrivado, Rol } from "@/lib/foro/types";

/**
 * Piezas de servidor que comparten las acciones del foro y las rutas de
 * los emails. Viven fuera de lib/actions a propósito: todo lo que exporta
 * un archivo "use server" queda expuesto como endpoint, y estas funciones
 * reciben ids que el llamador ya validó.
 */

export const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";
export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";
export const BUCKET = "foro-imagenes";

const COLS_PRIVADO =
  "id, alias, handle, rol, bio, avatar_url, verificado, equipo, created_at, " +
  "suspendido, avisos_email, email_verificado_at, matricula, verificacion_estado";

export async function usuarioActual(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function leerMiembro(id: string): Promise<MiembroPrivado | null> {
  const { data } = await createAdminClient().from("foro_miembros").select(COLS_PRIVADO).eq("id", id).maybeSingle();
  return (data as unknown as MiembroPrivado) ?? null;
}

/** Un handle libre para la URL del perfil, a partir del nombre visible. */
export async function handleLibre(alias: string, propio?: string): Promise<string> {
  const admin = createAdminClient();
  let raiz = slugify(alias).slice(0, 40).replace(/-+$/, "");
  if (raiz.length < 2) raiz = "miembro";
  for (let i = 0; i < 6; i++) {
    const candidato = i === 0 ? raiz : `${raiz}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin.from("foro_miembros").select("id").eq("handle", candidato).maybeSingle();
    if (!data || data.id === propio) return candidato;
  }
  return `${raiz}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * El miembro de la Tertulia de esta cuenta. Si todavía no existe (una
 * cuenta de dueño que entra por primera vez al foro) se crea con su
 * nombre abreviado: nadie tiene que completar un formulario extra para
 * participar. El superadmin entra como "equipo".
 *
 * La confirmación del email la hace Supabase al crear la cuenta (no se
 * puede ingresar sin confirmarla); acá solo se copia la fecha.
 */
export async function asegurarMiembro(user: User, extra: { rol?: Rol | null } = {}): Promise<MiembroPrivado | null> {
  const existente = await leerMiembro(user.id);
  if (existente) {
    if (!existente.email_verificado_at && user.email_confirmed_at) {
      await createAdminClient().from("foro_miembros")
        .update({ email_verificado_at: user.email_confirmed_at }).eq("id", user.id);
      return { ...existente, email_verificado_at: user.email_confirmed_at };
    }
    return existente;
  }

  const admin = createAdminClient();
  const { data: perfil } = await admin.from("profiles").select("nombre").eq("id", user.id).maybeSingle();
  let alias = aliasPorDefecto(perfil?.nombre ?? (user.user_metadata?.nombre as string | undefined), user.email);
  if (alias.length < 2) alias = "Miembro";
  const esAdmin = user.email === ADMIN_EMAIL;

  const { error } = await admin.from("foro_miembros").insert({
    id: user.id,
    alias,
    handle: await handleLibre(alias),
    rol: extra.rol ?? null,
    equipo: esAdmin,
    email_verificado_at: user.email_confirmed_at ?? (esAdmin ? new Date().toISOString() : null),
  });
  // 23505: otra pestaña lo creó en paralelo; se lee el que quedó
  if (error && error.code !== "23505") {
    console.error("Foro · asegurarMiembro:", error.message);
    return null;
  }
  return leerMiembro(user.id);
}

// ── Fotos ────────────────────────────────────────────────────

const MAX_FOTO = 5 * 1024 * 1024;
const EXTENSION: Record<string, string> = {
  "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif",
};

/** Las fotos nuevas del formulario, validadas (tipo y peso). */
export function fotosDelForm(formData: FormData, campo = "fotos"): File[] | { error: string } {
  const files = formData.getAll(campo).filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of files) {
    if (!EXTENSION[f.type]) return { error: "Las fotos tienen que ser JPG, PNG, WebP o GIF." };
    if (f.size > MAX_FOTO) return { error: "Cada foto puede pesar hasta 5 MB." };
  }
  return files;
}

export async function subirFotos(carpeta: string, files: File[]): Promise<string[]> {
  const storage = createAdminClient().storage.from(BUCKET);
  const urls: string[] = [];
  for (const f of files) {
    const path = `${carpeta}/${crypto.randomUUID()}.${EXTENSION[f.type]}`;
    const { error } = await storage.upload(path, f, { contentType: f.type });
    if (error) {
      console.error("Foro · subirFotos:", error.message);
      continue;
    }
    urls.push(storage.getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

/** Borra del bucket las fotos que ya no se usan (solo las nuestras). */
export async function borrarFotos(urls: (string | null | undefined)[]) {
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const paths = urls.map(u => (u || "").split(marca)[1]).filter(Boolean) as string[];
  if (!paths.length) return;
  try {
    await createAdminClient().storage.from(BUCKET).remove(paths);
  } catch (e) {
    console.error("Foro · borrarFotos:", e);
  }
}

// ── Texto de los formularios ─────────────────────────────────

/** Una línea: sin saltos ni espacios repetidos. */
export function linea(v: FormDataEntryValue | null): string {
  return (typeof v === "string" ? v : "").replace(/\s+/g, " ").trim();
}

/** Texto largo: normaliza saltos y recorta el exceso de líneas en blanco. */
export function texto(v: FormDataEntryValue | null): string {
  return (typeof v === "string" ? v : "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
