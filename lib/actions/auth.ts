"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { normalizarNombre } from "@/lib/utils/nombre";
import { volverSeguro } from "@/lib/foro/texto";

/** Parámetros de campaña que se guardan con la cuenta, si llegaron. */
const CAMPOS_ORIGEN = ["pagina", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * De dónde vino la cuenta: la página de alta y los utm de la campaña.
 * Queda en los metadatos del usuario para medir qué página o anuncio
 * trae dueños. Solo texto corto: lo manda el navegador.
 */
function leerOrigen(formData: FormData): Record<string, string> | null {
  const origen: Record<string, string> = {};
  for (const k of CAMPOS_ORIGEN) {
    const v = ((formData.get(k) as string) || "").trim().slice(0, 120);
    if (v) origen[k] = v;
  }
  return Object.keys(origen).length ? origen : null;
}

/**
 * A dónde va la cuenta recién creada. "publicar" (las páginas para
 * propietarios) lleva directo a cargar la propiedad; si no, al panel.
 * Es una lista cerrada a propósito: nada que llegue del formulario se
 * usa como URL.
 */
function destinoTrasRegistro(formData: FormData): string {
  return formData.get("destino") === "publicar"
    ? "/panel/propiedades/nueva?bienvenida=1"
    : "/panel?nuevo=1";
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const nombre = normalizarNombre(formData.get("nombre") as string);
  const email = ((formData.get("email") as string) || "").trim();
  const password = (formData.get("password") as string) || "";

  if (!nombre) return { error: "Ingresá tu nombre." };

  // El teléfono es obligatorio: es la vía de contacto que ven los interesados
  // (botón de WhatsApp en la ficha). Se valida acá, no solo en el formulario,
  // para que no se pueda saltear.
  const tel = normalizarTelefono(formData.get("telefono") as string);
  if (!tel.ok) return { error: tel.error };

  const origen = leerOrigen(formData);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // El trigger handle_new_user copia nombre y teléfono al perfil;
    // el origen queda solo en los metadatos del usuario
    options: { data: { nombre, telefono: tel.valor, ...(origen ? { origen } : {}) } },
  });

  if (error) return { error: error.message };

  // Defensivo: si el trigger todavía no fue migrado, dejamos el perfil completo igual.
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ telefono: tel.valor, nombre })
      .eq("id", data.user.id);
  }

  redirect(destinoTrasRegistro(formData));
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Si llegó desde una página que pidió ingresar (p. ej. responder en la
  // Tertulia), vuelve ahí. Solo rutas internas.
  const volver = formData.get("volver");
  redirect(volver ? volverSeguro(volver, "/panel") : "/panel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Ingresá tu email." };

  // Máx. 3 pedidos por 15 minutos por IP
  if (!(await checkRateLimit("pwd-reset", 3, 900))) {
    return { error: RATE_LIMIT_MSG };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/panel/clave`,
  });

  // No revelamos si el email existe o no (evita enumeración de cuentas)
  if (error) console.error("Error en resetPasswordForEmail:", error.message);
  return { ok: true };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "La sesión expiró. Pedí un nuevo enlace de recuperación." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/panel?clave=1");
}
