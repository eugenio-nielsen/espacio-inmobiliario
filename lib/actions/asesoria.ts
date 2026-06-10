"use server";

import { sendAsesoriaLead } from "@/lib/email";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";

export async function enviarConsultaAsesoria(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
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
    });
    return { ok: true };
  } catch (e) {
    console.error("Error enviando consulta de asesoría:", e);
    return { ok: false, error: "No se pudo enviar el mensaje. Probá de nuevo." };
  }
}
