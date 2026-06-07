"use server";

import { sendAsesoriaLead } from "@/lib/email";

export async function enviarConsultaAsesoria(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
}): Promise<{ ok: boolean; error?: string }> {
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
