"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL, SITE, borrarFotos, usuarioActual } from "@/lib/foro/servidor";
import { sendForoAviso } from "@/lib/email";
import { crearToken } from "@/lib/foro/firma";
import type { Resultado } from "@/lib/foro/types";

/**
 * Moderación de la Tertulia, solo para el superadmin. Cada acción vuelve
 * a verificar el email de la sesión: no alcanza con que el botón esté
 * solo en /panel/admin.
 */

type Tipo = "tema" | "respuesta" | "comentario";
const TABLA: Record<Tipo, string> = { tema: "foro_temas", respuesta: "foro_respuestas", comentario: "foro_comentarios" };

async function esAdmin() {
  return (await usuarioActual())?.email === ADMIN_EMAIL;
}

const noAutorizado = { ok: false as const, error: "No autorizado." };

function refrescar() {
  revalidatePath("/foro", "layout");
  revalidatePath("/panel/admin");
}

/** Ocultar, restaurar o borrar un tema, respuesta o comentario. */
export async function moderarContenido(tipo: Tipo, id: string, accion: "ocultar" | "restaurar" | "borrar"): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  if (!TABLA[tipo]) return { ok: false, error: "Tipo inválido." };
  const admin = createAdminClient();

  if (accion === "borrar") {
    const { data } = await admin.from(TABLA[tipo]).select("*").eq("id", id).maybeSingle();
    const { error } = await admin.from(TABLA[tipo]).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (data && Array.isArray((data as { fotos?: string[] }).fotos)) await borrarFotos((data as { fotos: string[] }).fotos);
  } else {
    const { error } = await admin.from(TABLA[tipo])
      .update({ estado: accion === "ocultar" ? "oculto" : "publicado" }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  }

  // Lo que se moderó deja de estar "abierto" en la bandeja de reportes
  await admin.from("foro_reportes").update({ estado: "resuelto" })
    .eq("tipo", tipo).eq("objetivo_id", id).eq("estado", "abierto");

  refrescar();
  return { ok: true };
}

export async function cerrarReporte(id: string, estado: "resuelto" | "descartado"): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  const { error } = await createAdminClient().from("foro_reportes").update({ estado }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

export async function fijarTema(id: string, fijado: boolean): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  const { error } = await createAdminClient().from("foro_temas").update({ fijado }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

export async function suspenderMiembro(id: string, suspendido: boolean): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  const { error } = await createAdminClient().from("foro_miembros").update({ suspendido }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}

/** Otorga o quita el distintivo "Profesional verificado". */
export async function resolverVerificacion(id: string, aprobar: boolean): Promise<Resultado> {
  if (!(await esAdmin())) return noAutorizado;
  const admin = createAdminClient();
  const { data, error } = await admin.from("foro_miembros")
    .update({ verificado: aprobar, verificacion_estado: aprobar ? "aprobada" : "rechazada" })
    .eq("id", id)
    .select("id, alias, handle, avisos_email, perfil:profiles(email)")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  const m = data as unknown as { id: string; alias: string; handle: string; perfil: { email: string } | null } | null;
  if (aprobar && m?.perfil?.email) {
    try {
      await sendForoAviso({
        para: m.perfil.email,
        alias: m.alias,
        asunto: "Ya sos Profesional verificado en la Tertulia",
        titulo: "Distintivo de profesional verificado",
        lead: "revisamos tu matrícula y desde ahora tus temas y respuestas muestran el distintivo de Profesional verificado.",
        url: `${SITE}/foro/miembros/${m.handle}`,
        cta: "Ver mi perfil",
        bajaUrl: `${SITE}/foro/avisos?t=${crearToken("avisos", m.id, 365)}`,
      });
    } catch (e) {
      console.error("Foro · aviso de verificación:", e);
    }
  }

  refrescar();
  return { ok: true };
}
