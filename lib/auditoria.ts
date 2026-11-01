import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Deja constancia de una acción del superadmin. Nunca rompe la acción
 * que la llama: si la tabla todavía no existe, solo avisa por consola.
 */
export async function registrarAuditoria(
  adminEmail: string,
  accion: string,
  objetivo?: string | null,
  detalle?: Record<string, unknown>
) {
  try {
    const { error } = await createAdminClient()
      .from("admin_auditoria")
      .insert({ admin_email: adminEmail, accion, objetivo: objetivo ?? null, detalle: detalle ?? null });
    if (error) console.error("Auditoría no registrada:", error.message);
  } catch (e) {
    console.error("Auditoría no registrada:", e);
  }
}

const soloDigitos = (t?: string | null) => (t || "").replace(/\D/g, "");

/** ¿Este contacto está en la lista negra? Falla "abierto": ante un error, deja pasar. */
export async function contactoBloqueado(email: string, telefono?: string | null): Promise<boolean> {
  try {
    const mail = email.trim().toLowerCase();
    const tel = soloDigitos(telefono);
    const { data, error } = await createAdminClient()
      .from("contactos_bloqueados").select("email, telefono");
    if (error || !data) return false;
    return data.some(b =>
      (b.email && b.email.trim().toLowerCase() === mail) ||
      (tel.length >= 8 && b.telefono && b.telefono === tel)
    );
  } catch {
    return false;
  }
}
