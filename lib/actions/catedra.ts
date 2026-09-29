"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimitClave, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { ADMIN_EMAIL, SITE, linea, texto, usuarioActual } from "@/lib/foro/servidor";
import { sendForoAdmin } from "@/lib/email";
import { esRubro, rubroPorValor } from "@/lib/catedra/rubros";
import { COSTOS_DEFAULT, unirConfig, type CostosConfig } from "@/lib/catedra/costos";

/**
 * Acciones de la Cátedra. La red de profesionales tiene datos de
 * contacto de personas: se escribe solo con el service role y siempre
 * con el consentimiento registrado (consentimiento_at).
 */

type Resultado = { ok: true } | { ok: false; error: string };
const fallo = (error: string) => ({ ok: false as const, error });

async function esAdmin() {
  return (await usuarioActual())?.email === ADMIN_EMAIL;
}

function refrescar() {
  revalidatePath("/catedra", "layout");
  revalidatePath("/panel/admin");
}

/** Los datos de una ficha, validados. Sirve para la postulación y para el alta curada. */
function leerFicha(formData: FormData) {
  const nombre = linea(formData.get("nombre"));
  if (nombre.length < 2 || nombre.length > 80) return { error: "Indicá el nombre (o el del estudio), hasta 80 caracteres." };
  const rubro = formData.get("rubro");
  if (!esRubro(rubro)) return { error: "Elegí el rubro." };
  const matricula = linea(formData.get("matricula")).slice(0, 120) || null;
  const zona = linea(formData.get("zona"));
  if (zona.length < 2 || zona.length > 80) return { error: "Indicá en qué zona trabaja." };

  let telefono: string | null = null;
  const telCrudo = linea(formData.get("telefono"));
  if (telCrudo) {
    const t = normalizarTelefono(telCrudo);
    if (!t.ok) return { error: t.error };
    telefono = t.valor;
  }
  const email = linea(formData.get("email")).toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Revisá el email: no parece válido." };
  let web = linea(formData.get("web")) || null;
  if (web && !/^https?:\/\//i.test(web)) web = `https://${web}`;
  if (web && !/^https?:\/\/[^\s"'<>]+\.[^\s"'<>]+$/i.test(web)) return { error: "Revisá la web: no parece una dirección válida." };
  if (!telefono && !email && !web) return { error: "Dejá al menos una vía de contacto: teléfono, email o web." };

  const descripcion = texto(formData.get("descripcion")).slice(0, 400) || null;
  return { nombre, rubro, matricula, zona, telefono, email, web, descripcion };
}

// ── Postulación (el propio profesional) ──────────────────────

export async function postularProfesional(formData: FormData): Promise<Resultado> {
  const user = await usuarioActual();
  if (!user) return fallo("Tenés que ingresar para postularte.");
  if (formData.get("consentimiento") !== "on") {
    return fallo("Para publicar tu ficha necesitamos tu autorización (la casilla del final).");
  }
  const ficha = leerFicha(formData);
  if ("error" in ficha) return fallo(ficha.error!);
  if (!(await checkRateLimitClave(`catedra-postulacion:${user.id}`, 5, 86400))) return fallo(RATE_LIMIT_MSG);

  const admin = createAdminClient();
  const { data: previa } = await admin
    .from("catedra_profesionales").select("id, estado").eq("user_id", user.id).maybeSingle();

  // Un cambio en una ficha aprobada vuelve a revisión: lo publicado lo aprueba una persona
  const fila = { ...ficha, estado: "postulado", consentimiento_at: new Date().toISOString() };
  const { error } = previa
    ? await admin.from("catedra_profesionales").update(fila).eq("id", previa.id)
    : await admin.from("catedra_profesionales").insert({ ...fila, origen: "postulacion", user_id: user.id });
  if (error) {
    console.error("Cátedra · postular:", error.message);
    return fallo("No pudimos enviar tu postulación. Probá de nuevo en un momento.");
  }

  after(async () => {
    try {
      await sendForoAdmin({
        asunto: `Cátedra · ${previa ? "ficha actualizada" : "nueva postulación"}: ${ficha.nombre}`,
        titulo: previa ? "Un profesional actualizó su ficha" : "Nueva postulación a la red de profesionales",
        lineas: [
          ["Nombre", ficha.nombre],
          ["Rubro", rubroPorValor(ficha.rubro)?.nombre ?? ficha.rubro],
          ["Matrícula", ficha.matricula ?? "—"],
          ["Zona", ficha.zona],
          ["Cuenta", user.email ?? "—"],
        ],
        url: `${SITE}/panel/admin?tab=catedra`,
        cta: "Revisar en el panel",
      });
    } catch (e) {
      console.error("Cátedra · aviso de postulación:", e);
    }
  });
  refrescar();
  return { ok: true };
}

/** El profesional retira su ficha (y con eso, su consentimiento). */
export async function bajaDeMiFicha(): Promise<Resultado> {
  const user = await usuarioActual();
  if (!user) return fallo("Tenés que ingresar.");
  const { error } = await createAdminClient().from("catedra_profesionales").delete().eq("user_id", user.id);
  if (error) return fallo("No pudimos dar de baja tu ficha. Escribinos y lo hacemos a mano.");
  refrescar();
  return { ok: true };
}

// ── Superadmin ───────────────────────────────────────────────

/** Alta curada: el superadmin carga a alguien que conoce, con su consentimiento. */
export async function crearProfesionalCurado(formData: FormData): Promise<Resultado> {
  if (!(await esAdmin())) return fallo("No autorizado.");
  if (formData.get("consentimiento") !== "on") {
    return fallo("Confirmá que el profesional autorizó publicar sus datos.");
  }
  const ficha = leerFicha(formData);
  if ("error" in ficha) return fallo(ficha.error!);
  const { error } = await createAdminClient().from("catedra_profesionales").insert({
    ...ficha,
    estado: "aprobado",
    origen: "curado",
    recomendado: formData.get("recomendado") === "on",
    consentimiento_at: new Date().toISOString(),
  });
  if (error) return fallo(error.message);
  refrescar();
  return { ok: true };
}

export async function cambiarEstadoProfesional(id: string, estado: "aprobado" | "rechazado" | "oculto"): Promise<Resultado> {
  if (!(await esAdmin())) return fallo("No autorizado.");
  if (!["aprobado", "rechazado", "oculto"].includes(estado)) return fallo("Estado inválido.");
  const { error } = await createAdminClient().from("catedra_profesionales").update({ estado }).eq("id", id);
  if (error) return fallo(error.message);
  refrescar();
  return { ok: true };
}

export async function alternarRecomendado(id: string, recomendado: boolean): Promise<Resultado> {
  if (!(await esAdmin())) return fallo("No autorizado.");
  const { error } = await createAdminClient().from("catedra_profesionales").update({ recomendado }).eq("id", id);
  if (error) return fallo(error.message);
  refrescar();
  return { ok: true };
}

export async function borrarProfesional(id: string): Promise<Resultado> {
  if (!(await esAdmin())) return fallo("No autorizado.");
  const { error } = await createAdminClient().from("catedra_profesionales").delete().eq("id", id);
  if (error) return fallo(error.message);
  refrescar();
  return { ok: true };
}

/** Guarda los parámetros de la calculadora, validando rangos razonables. */
export async function guardarCostosConfig(config: CostosConfig): Promise<Resultado> {
  if (!(await esAdmin())) return fallo("No autorizado.");
  const c = unirConfig(config);
  const enRango = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;
  const porcentajes = [
    c.iva, c.sellos.alicuotaGeneral, c.sellos.alicuotaAlta, c.sellos.parteComprador, c.sellos.alicuotaPBA,
    c.escribania.honorarios, c.escribania.gastos, c.escribania.certificadosVendedor, c.escribania.hipoteca,
    c.inmobiliaria.comprador, c.inmobiliaria.vendedor,
  ];
  if (!porcentajes.every(n => enRango(n, 0, 100))) return fallo("Los porcentajes tienen que estar entre 0 y 100.");
  if (!enRango(c.tipoCambio, 1, 1e7)) return fallo("Revisá el tipo de cambio.");
  if (!enRango(c.sellos.umbral, 0, 1e13)) return fallo("Revisá el umbral de Sellos.");
  const vigencia = (c.vigencia || COSTOS_DEFAULT.vigencia).slice(0, 60);

  const { error } = await createAdminClient()
    .from("catedra_config")
    .upsert({ id: 1, config: { ...c, vigencia } });
  if (error) return fallo(error.message);
  refrescar();
  return { ok: true };
}
