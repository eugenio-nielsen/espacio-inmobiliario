"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL, usuarioActual } from "@/lib/foro/servidor";

/**
 * Limpieza de leads, solo para el superadmin. Cada acción vuelve a
 * verificar el email de la sesión: no alcanza con que el botón esté
 * solo en /panel/admin.
 */

type Resultado = { ok: true; borradas: number } | { ok: false; error: string };

const noAutorizado = { ok: false as const, error: "No autorizado." };

async function esAdmin() {
  return (await usuarioActual())?.email === ADMIN_EMAIL;
}

const soloDigitos = (t?: string | null) => (t || "").replace(/\D/g, "");

/**
 * Borra todas las consultas de un contacto en todas las publicaciones.
 * Coincide por email (sin distinguir mayúsculas) o por teléfono (solo
 * dígitos, así "11 5555-1234" y "1155551234" son el mismo).
 */
export async function borrarContactoLead(email: string | null, telefono: string | null): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;

  const mail = (email || "").trim().toLowerCase();
  const tel = soloDigitos(telefono);
  // Un teléfono muy corto podría coincidir con contactos ajenos
  const usaTel = tel.length >= 8;
  if (!mail && !usaTel) return { ok: false, error: "Falta un email o teléfono para identificar al contacto." };

  const admin = createAdminClient();
  const { data, error } = await admin.from("inquiries").select("id, email, telefono");
  if (error) return { ok: false, error: error.message };

  const ids = (data || [])
    .filter(i =>
      (mail && (i.email || "").trim().toLowerCase() === mail) ||
      (usaTel && soloDigitos(i.telefono) === tel)
    )
    .map(i => i.id as string);

  if (ids.length === 0) return { ok: true, borradas: 0 };

  const { error: errBorrar } = await admin.from("inquiries").delete().in("id", ids);
  if (errBorrar) return { ok: false, error: errBorrar.message };

  revalidatePath("/panel", "layout");
  return { ok: true, borradas: ids.length };
}

/** Borra una sola consulta. */
export async function borrarConsultaAdmin(id: string): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  const { error } = await createAdminClient().from("inquiries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/panel", "layout");
  return { ok: true, borradas: 1 };
}
