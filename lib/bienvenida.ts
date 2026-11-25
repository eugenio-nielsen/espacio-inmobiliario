import { createAdminClient } from "@/lib/supabase/admin";
import { sendBienvenida } from "@/lib/email";
import { agregarContacto } from "@/lib/contactos";

type Usuario = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
};

const TRES_DIAS = 3 * 24 * 3600 * 1000;

/**
 * Manda la bienvenida una sola vez por cuenta, y solo con el email ya
 * confirmado: si no, cualquiera podría registrarse con un correo ajeno y
 * hacernos escribirle. La marca queda en los metadatos del usuario.
 *
 * Se llama desde dos lugares (el alta, si no pide confirmación, y el enlace
 * de confirmación): la marca evita el doble envío. El tope de antigüedad
 * evita "dar la bienvenida" a una cuenta vieja que solo recupera su clave.
 *
 * Nunca lanza: un fallo del mail no puede romper el registro.
 */
export async function enviarBienvenidaUnaVez(user: Usuario) {
  try {
    if (!user.email || !user.email_confirmed_at) return;
    if (user.user_metadata?.bienvenida_enviada) return;
    if (user.created_at && Date.now() - new Date(user.created_at).getTime() > TRES_DIAS) return;

    const nombre = typeof user.user_metadata?.nombre === "string" ? user.user_metadata.nombre : "";

    // Va a la audiencia de Resend junto con la bienvenida: ya confirmó el email,
    // así que la dirección es suya. Es idempotente, no pisa a un contacto existente.
    await agregarContacto({ email: user.email, nombre, origen: "registro" });
    await sendBienvenida({ para: user.email, nombre });

    await createAdminClient().auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, bienvenida_enviada: true },
    });
  } catch (e) {
    console.error("Error enviando la bienvenida:", e);
  }
}
