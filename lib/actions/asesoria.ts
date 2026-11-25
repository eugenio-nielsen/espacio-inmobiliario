"use server";

import { sendAsesoriaLead, sendAsesoriaAcuse } from "@/lib/email";
import { checkRateLimit, checkRateLimitClave, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { etiquetaMotivo } from "@/lib/motivos";

export async function enviarConsultaAsesoria(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
  /** Id del motivo (ver lib/motivos.ts). Opcional: los formularios
      viejos siguen enviando sin él. */
  motivo?: string;
  website?: string; // honeypot
}): Promise<{ ok: boolean; error?: string }> {
  // Honeypot: solo los bots lo completan → simular éxito
  if (data.website?.trim()) return { ok: true };

  if (!(await checkRateLimit("asesoria", 3, 3600))) {
    return { ok: false, error: RATE_LIMIT_MSG };
  }

  if (!data.nombre?.trim() || !data.email?.trim() || !data.mensaje?.trim()) {
    return { ok: false, error: "Completá nombre, email y mensaje." };
  }
  try {
    await sendAsesoriaLead({
      nombre: data.nombre.trim(),
      email: data.email.trim(),
      telefono: data.telefono?.trim() || undefined,
      mensaje: data.mensaje.trim(),
      // Se traduce a etiqueta acá y no en el cliente: lo que llega del
      // navegador no es de fiar, y etiquetaMotivo cae en "Otra consulta"
      // ante cualquier valor inventado.
      motivo: data.motivo ? etiquetaMotivo(data.motivo) : undefined,
    });
    // Acuse a quien escribió. El email lo tipea cualquiera: tope por dirección
    // para que el formulario no sirva para mandarle mails a un tercero.
    const email = data.email.trim().toLowerCase();
    if (/^[^s@<>]+@[^s@<>]+.[^s@<>]{2,}$/.test(email) && (await checkRateLimitClave(`asesoria-mail:${email}`, 2, 86400))) {
      try {
        await sendAsesoriaAcuse({
          para: email,
          nombre: data.nombre.trim(),
          mensaje: data.mensaje.trim(),
          motivo: data.motivo ? etiquetaMotivo(data.motivo) : undefined,
        });
      } catch (e) {
        console.error("Error enviando el acuse de asesoría:", e);
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("Error enviando consulta de asesoría:", e);
    return { ok: false, error: "No se pudo enviar el mensaje. Probá de nuevo." };
  }
}
