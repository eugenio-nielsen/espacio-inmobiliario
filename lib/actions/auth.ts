"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { enviarBienvenidaUnaVez } from "@/lib/bienvenida";
import { createClient } from "@/lib/supabase/server";
import { errorDeAuth, YA_EXISTE } from "@/lib/auth/errores";
import { checkRateLimit, checkRateLimitClave, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { normalizarNombre } from "@/lib/utils/nombre";
import { volverSeguro } from "@/lib/foro/texto";

/** Lo que devuelven signUp y signIn cuando no redirigen. */
type Fallo = { error: string; sinConfirmar?: boolean };
/** La cuenta se creó pero falta confirmar el email: no hay sesión todavía. */
type AltaPendiente = { pendiente: true; email: string };

/**
 * Parámetros de campaña que se guardan con la cuenta, si llegaron. `referrer`
 * es el dominio desde el que llegó (sin ruta): sirve cuando no había utm.
 */
const CAMPOS_ORIGEN = ["pagina", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"] as const;

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
function destinoTrasRegistro(formData: FormData, porEnlace = false): string {
  const destino = formData.get("destino") === "publicar"
    ? "/panel/propiedades/nueva?bienvenida=1"
    : "/panel?nuevo=1";
  // El enlace del mail de confirmación lleva confirmada=1: la página de
  // llegada mide la confirmación (cuenta_confirmada) y no cuenta de nuevo
  // el alta, que ya se midió al crear la cuenta
  return porEnlace ? `${destino}&confirmada=1` : destino;
}

/**
 * El enlace del mail de confirmación pasa por el callback: ahí se confirma
 * la cuenta y sale la bienvenida. Si la URL no está permitida en Supabase,
 * cae en la Site URL como hasta ahora.
 */
function enlaceDeConfirmacion(formData: FormData): string {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${sitio}/auth/callback?next=${encodeURIComponent(destinoTrasRegistro(formData, true))}`;
}

export async function signUp(formData: FormData): Promise<Fallo | AltaPendiente> {
  const supabase = await createClient();
  const nombre = normalizarNombre(formData.get("nombre") as string);
  const email = ((formData.get("email") as string) || "").trim();
  const password = (formData.get("password") as string) || "";

  if (!nombre) return { error: "Ingresá tu nombre." };

  // El teléfono es obligatorio: es la vía para contactar al dueño (no se muestra
  // en la ficha, las consultas entran por el sitio). Se valida acá, no solo en el formulario,
  // para que no se pueda saltear.
  const tel = normalizarTelefono(formData.get("telefono") as string);
  if (!tel.ok) return { error: tel.error };

  // Sin tope, el formulario serviría para llenar casillas ajenas con mails de
  // confirmación. Va después de validar: un formulario mal cargado no cuenta.
  if (!(await checkRateLimit("alta-dueno", 10, 3600))) return { error: RATE_LIMIT_MSG };

  const origen = leerOrigen(formData);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // El trigger handle_new_user copia nombre y teléfono al perfil;
    // el origen queda solo en los metadatos del usuario
    options: {
      data: { nombre, telefono: tel.valor, ...(origen ? { origen } : {}) },
      emailRedirectTo: enlaceDeConfirmacion(formData),
    },
  });

  if (error) return { error: errorDeAuth(error) };
  if (!data.user) return { error: "No pudimos crear tu cuenta. Probá de nuevo en un momento." };

  // Con la confirmación de email activada, si ese email ya tiene una cuenta
  // Supabase no da error: devuelve un usuario sin identidades, no crea nada y
  // no manda ningún mail. Sin este aviso la persona esperaría uno que no llega.
  if (!data.user.identities?.length) return { error: YA_EXISTE };

  // Sin confirmación de email la sesión ya existe: se da la bienvenida acá.
  // Con confirmación, sale cuando la persona confirma (auth/callback).
  if (data.session) {
    after(() => enviarBienvenidaUnaVez(data.user!));
  }

  // Defensivo: si el trigger todavía no fue migrado, dejamos el perfil completo igual.
  await supabase
    .from("profiles")
    .update({ telefono: tel.valor, nombre })
    .eq("id", data.user.id);

  // Con confirmación de email todavía no hay sesión: ir al panel rebotaría al
  // ingreso sin explicar nada. Se le avisa a la persona que revise su mail.
  if (!data.session) return { pendiente: true, email };

  redirect(destinoTrasRegistro(formData));
}

/**
 * Vuelve a mandar el mail de confirmación de una cuenta que todavía no lo
 * confirmó (desde el aviso de "revisá tu mail" o desde el ingreso).
 *
 * Responde igual exista o no la cuenta: no revela qué emails están
 * registrados. Está limitada por conexión y por email, para que el botón no
 * sirva para llenar de mails una casilla ajena.
 */
export async function reenviarConfirmacion(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) return { error: "Falta el email al que mandar el enlace." };

  if (!(await checkRateLimit("alta-reenvio", 5, 3600))) return { error: RATE_LIMIT_MSG };
  // El email no se guarda tal cual en la tabla de límites: va como huella
  const huella = createHash("sha256").update(email).digest("hex").slice(0, 32);
  if (!(await checkRateLimitClave(`alta-reenvio-email:${huella}`, 3, 3600))) {
    return { error: "Ya te mandamos varios mails. Esperá un rato antes de pedir otro y revisá la carpeta de spam." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: enlaceDeConfirmacion(formData) },
  });
  if (error) return { error: errorDeAuth(error) };
  return { ok: true };
}

export async function signIn(formData: FormData): Promise<Fallo> {
  const supabase = await createClient();
  // Los teclados del celular suelen dejar un espacio al final del email
  const email = ((formData.get("email") as string) || "").trim();
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Cuenta creada pero sin confirmar: la pantalla ofrece pedir el mail de nuevo
    return {
      error: errorDeAuth(error),
      ...(error.code === "email_not_confirmed" ? { sinConfirmar: true } : {}),
    };
  }

  // Si confirmó el email en otro navegador, el callback no pudo darle la
  // bienvenida: sale en su primer ingreso. La marca de "ya enviada" y el tope
  // de antigüedad evitan repetirla o mandársela a una cuenta vieja.
  after(() => enviarBienvenidaUnaVez(data.user));

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
