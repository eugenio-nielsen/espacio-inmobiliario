"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, checkRateLimitClave, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarNombre } from "@/lib/utils/nombre";
import { verificarTurnstile, TURNSTILE_MSG } from "@/lib/foro/turnstile";
import { leerToken } from "@/lib/foro/firma";
import { esCategoria } from "@/lib/foro/categorias";
import { slugify, urlTema, volverSeguro } from "@/lib/foro/texto";
import { esRol, MOTIVOS_REPORTE, type MiembroPrivado, type Resultado } from "@/lib/foro/types";
import {
  SITE, asegurarMiembro, borrarFotos, fotosDelForm, handleLibre, leerMiembro, linea,
  subirFotos, texto, usuarioActual,
} from "@/lib/foro/servidor";
import {
  avisarAdmin, avisarNuevaRespuesta, avisarNuevoComentario, avisarSolucion, avisarTemaNuevo,
} from "@/lib/foro/avisos";

/**
 * Acciones de la Tertulia. Cada una valida la sesión, el miembro y los
 * datos por su cuenta: una Server Action se puede invocar con un POST
 * directo, sin pasar por la interfaz.
 *
 * Escriben con el service role (el RLS no deja escribir con la anon
 * key), así que el control de quién puede tocar qué está acá.
 *
 * El email lo confirma Supabase al crear la cuenta: sin confirmarlo no
 * se puede ingresar, así que toda sesión llega con el email validado.
 */

const LIMITE_MSG = "Vas muy rápido. Esperá un rato antes de publicar de nuevo.";

const fallo = (error: string) => ({ ok: false as const, error });

type Contexto = { user: User; miembro: MiembroPrivado };

async function paraEscribir(): Promise<Contexto | { error: string }> {
  const user = await usuarioActual();
  if (!user) return { error: "Tenés que ingresar para participar." };
  if (!user.email_confirmed_at) return { error: "Confirmá tu email con el enlace que te mandamos al crear la cuenta." };
  const miembro = await asegurarMiembro(user);
  if (!miembro) return { error: "No pudimos preparar tu perfil de la Tertulia. Probá de nuevo en un momento." };
  if (miembro.suspendido) {
    return { error: "Tu participación en la Tertulia está suspendida. Si creés que es un error, escribinos." };
  }
  return { user, miembro };
}

/** Límite por hora (el equipo no tiene límite). */
async function dentroDelLimite(m: MiembroPrivado, que: string, max: number): Promise<boolean> {
  if (m.equipo) return true;
  return checkRateLimitClave(`foro-${que}:${m.id}`, max, 3600);
}

function refrescar(url?: string) {
  if (url) revalidatePath(url);
  revalidatePath("/foro", "layout");
}

function slugNuevo(titulo: string): string {
  const base = slugify(titulo).slice(0, 70).replace(/-+$/, "") || "tema";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Temas ────────────────────────────────────────────────────

function validarTema(formData: FormData) {
  const categoria = formData.get("categoria");
  if (!esCategoria(categoria)) return { error: "Elegí una categoría." };
  const titulo = linea(formData.get("titulo"));
  if (titulo.length < 10) return { error: "El título necesita al menos 10 caracteres: contá la duda en una frase." };
  if (titulo.length > 140) return { error: "El título puede tener hasta 140 caracteres." };
  const cuerpo = texto(formData.get("cuerpo"));
  if (cuerpo.length < 20) return { error: "Contá un poco más en el detalle (al menos 20 caracteres)." };
  if (cuerpo.length > 10000) return { error: "El detalle puede tener hasta 10.000 caracteres." };
  return { categoria, titulo, cuerpo };
}

export async function crearTema(formData: FormData): Promise<Resultado<{ url: string }>> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { user, miembro } = ctx;

  const datos = validarTema(formData);
  if ("error" in datos) return fallo(datos.error!);
  const fotos = fotosDelForm(formData);
  if ("error" in fotos) return fallo(fotos.error);
  if (fotos.length > 4) return fallo("Podés sumar hasta 4 fotos.");

  if (!(await verificarTurnstile(formData))) return fallo(TURNSTILE_MSG);
  if (!(await dentroDelLimite(miembro, "tema", 5))) return fallo(LIMITE_MSG);

  const urls = await subirFotos(user.id, fotos);
  const admin = createAdminClient();

  let creado: { id: string; slug: string; categoria: string } | null = null;
  for (let intento = 0; intento < 2 && !creado; intento++) {
    const { data, error } = await admin.from("foro_temas").insert({
      slug: slugNuevo(datos.titulo),
      categoria: datos.categoria,
      autor_id: miembro.id,
      titulo: datos.titulo,
      cuerpo: datos.cuerpo,
      fotos: urls,
    }).select("id, slug, categoria").single();
    if (data) creado = data;
    else if (error?.code !== "23505") {
      console.error("Foro · crearTema:", error?.message);
      break;
    }
  }
  if (!creado) {
    await borrarFotos(urls);
    return fallo("No pudimos publicar el tema. Probá de nuevo en un momento.");
  }

  const tema = creado;
  after(() => avisarTemaNuevo(tema.id));
  refrescar();
  return { ok: true, url: urlTema(tema) };
}

export async function editarTema(formData: FormData): Promise<Resultado<{ url: string }>> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { user, miembro } = ctx;

  const id = linea(formData.get("id"));
  const admin = createAdminClient();
  const { data: actual } = await admin
    .from("foro_temas").select("id, slug, categoria, autor_id, fotos").eq("id", id).maybeSingle();
  if (!actual || actual.autor_id !== miembro.id) return fallo("Solo quien abrió el tema puede editarlo.");

  const datos = validarTema(formData);
  if ("error" in datos) return fallo(datos.error!);

  // Solo se conservan fotos que ya eran del tema: nadie cuela una URL ajena
  const previas = (actual.fotos ?? []) as string[];
  const conservar = formData.getAll("conservar").filter((u): u is string => typeof u === "string" && previas.includes(u));
  const nuevas = fotosDelForm(formData);
  if ("error" in nuevas) return fallo(nuevas.error);
  if (conservar.length + nuevas.length > 4) return fallo("Podés tener hasta 4 fotos.");

  const subidas = await subirFotos(user.id, nuevas);
  const { error } = await admin.from("foro_temas").update({
    categoria: datos.categoria,
    titulo: datos.titulo,
    cuerpo: datos.cuerpo,
    fotos: [...conservar, ...subidas],
    editado_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) {
    await borrarFotos(subidas);
    return fallo("No pudimos guardar los cambios. Probá de nuevo.");
  }

  await borrarFotos(previas.filter(u => !conservar.includes(u)));
  const url = urlTema({ categoria: datos.categoria, slug: actual.slug });
  refrescar(url);
  return { ok: true, url };
}

/** Se puede borrar mientras nadie haya respondido. */
export async function borrarTema(id: string): Promise<Resultado<{ url: string }>> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);

  const admin = createAdminClient();
  const { data: tema } = await admin
    .from("foro_temas").select("id, categoria, autor_id, fotos").eq("id", id).maybeSingle();
  if (!tema || tema.autor_id !== ctx.miembro.id) return fallo("Solo quien abrió el tema puede borrarlo.");

  const { count } = await admin.from("foro_respuestas").select("id", { count: "exact", head: true }).eq("tema_id", id);
  if (count) return fallo("El tema ya tiene respuestas: no se puede borrar, pero sí podés editarlo.");

  const { error } = await admin.from("foro_temas").delete().eq("id", id);
  if (error) return fallo("No pudimos borrar el tema. Probá de nuevo.");
  await borrarFotos(tema.fotos ?? []);
  refrescar();
  return { ok: true, url: `/foro/${tema.categoria}` };
}

// ── Respuestas ───────────────────────────────────────────────

export async function responder(formData: FormData): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { user, miembro } = ctx;

  const temaId = linea(formData.get("tema_id"));
  const cuerpo = texto(formData.get("cuerpo"));
  if (cuerpo.length < 2) return fallo("Escribí tu respuesta.");
  if (cuerpo.length > 10000) return fallo("La respuesta puede tener hasta 10.000 caracteres.");
  const fotos = fotosDelForm(formData);
  if ("error" in fotos) return fallo(fotos.error);
  if (fotos.length > 4) return fallo("Podés sumar hasta 4 fotos.");

  const admin = createAdminClient();
  const { data: tema } = await admin
    .from("foro_temas").select("id, slug, categoria, estado").eq("id", temaId).maybeSingle();
  if (!tema || tema.estado !== "publicado") return fallo("Este tema ya no está disponible.");

  if (!(await dentroDelLimite(miembro, "respuesta", 20))) return fallo(LIMITE_MSG);

  const urls = await subirFotos(user.id, fotos);
  const { data, error } = await admin.from("foro_respuestas").insert({
    tema_id: tema.id, autor_id: miembro.id, cuerpo, fotos: urls,
  }).select("id").single();
  if (error || !data) {
    await borrarFotos(urls);
    return fallo("No pudimos publicar la respuesta. Probá de nuevo.");
  }

  after(() => avisarNuevaRespuesta(data.id));
  refrescar(urlTema(tema));
  return { ok: true };
}

export async function editarRespuesta(formData: FormData): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { user, miembro } = ctx;

  const id = linea(formData.get("id"));
  const admin = createAdminClient();
  const { data: actual } = await admin
    .from("foro_respuestas")
    .select("id, autor_id, fotos, tema:foro_temas!foro_respuestas_tema_id_fkey(slug, categoria)")
    .eq("id", id).maybeSingle();
  const r = actual as unknown as { autor_id: string; fotos: string[]; tema: { slug: string; categoria: string } } | null;
  if (!r || r.autor_id !== miembro.id) return fallo("Solo quien escribió la respuesta puede editarla.");

  const cuerpo = texto(formData.get("cuerpo"));
  if (cuerpo.length < 2) return fallo("La respuesta no puede quedar vacía.");
  if (cuerpo.length > 10000) return fallo("La respuesta puede tener hasta 10.000 caracteres.");

  const previas = r.fotos ?? [];
  const conservar = formData.getAll("conservar").filter((u): u is string => typeof u === "string" && previas.includes(u));
  const nuevas = fotosDelForm(formData);
  if ("error" in nuevas) return fallo(nuevas.error);
  if (conservar.length + nuevas.length > 4) return fallo("Podés tener hasta 4 fotos.");

  const subidas = await subirFotos(user.id, nuevas);
  const { error } = await admin.from("foro_respuestas").update({
    cuerpo, fotos: [...conservar, ...subidas], editado_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) {
    await borrarFotos(subidas);
    return fallo("No pudimos guardar los cambios. Probá de nuevo.");
  }
  await borrarFotos(previas.filter(u => !conservar.includes(u)));
  refrescar(urlTema(r.tema));
  return { ok: true };
}

/** Se puede borrar si no es la solución elegida y nadie la comentó. */
export async function borrarRespuesta(id: string): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);

  const admin = createAdminClient();
  const { data } = await admin
    .from("foro_respuestas")
    .select("id, autor_id, fotos, tema:foro_temas!foro_respuestas_tema_id_fkey(slug, categoria, respuesta_aceptada_id)")
    .eq("id", id).maybeSingle();
  const r = data as unknown as {
    autor_id: string; fotos: string[]; tema: { slug: string; categoria: string; respuesta_aceptada_id: string | null };
  } | null;
  if (!r || r.autor_id !== ctx.miembro.id) return fallo("Solo quien escribió la respuesta puede borrarla.");
  if (r.tema.respuesta_aceptada_id === id) return fallo("Es la solución elegida del tema: no se puede borrar.");

  const { count } = await admin.from("foro_comentarios").select("id", { count: "exact", head: true }).eq("respuesta_id", id);
  if (count) return fallo("La respuesta ya tiene comentarios: no se puede borrar, pero sí podés editarla.");

  const { error } = await admin.from("foro_respuestas").delete().eq("id", id);
  if (error) return fallo("No pudimos borrar la respuesta. Probá de nuevo.");
  await borrarFotos(r.fotos ?? []);
  refrescar(urlTema(r.tema));
  return { ok: true };
}

/** Quien abrió el tema elige la respuesta que le resolvió la duda (o la desmarca). */
export async function marcarSolucion(temaId: string, respuestaId: string | null): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);

  const admin = createAdminClient();
  const { data: tema } = await admin
    .from("foro_temas").select("id, slug, categoria, autor_id, respuesta_aceptada_id").eq("id", temaId).maybeSingle();
  if (!tema || tema.autor_id !== ctx.miembro.id) return fallo("Solo quien abrió el tema puede elegir la solución.");

  if (respuestaId) {
    const { data: r } = await admin
      .from("foro_respuestas").select("id, tema_id, estado").eq("id", respuestaId).maybeSingle();
    if (!r || r.tema_id !== temaId || r.estado !== "publicado") return fallo("Esa respuesta ya no está disponible.");
  }

  const { error } = await admin.from("foro_temas").update({ respuesta_aceptada_id: respuestaId }).eq("id", temaId);
  if (error) return fallo("No pudimos guardar la solución. Probá de nuevo.");

  if (respuestaId && respuestaId !== tema.respuesta_aceptada_id) {
    after(() => avisarSolucion(respuestaId));
  }
  refrescar(urlTema(tema));
  return { ok: true };
}

// ── Comentarios ──────────────────────────────────────────────

export async function comentar(formData: FormData): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { miembro } = ctx;

  const respuestaId = linea(formData.get("respuesta_id"));
  const cuerpo = texto(formData.get("cuerpo"));
  if (cuerpo.length < 2) return fallo("Escribí tu comentario.");
  if (cuerpo.length > 800) return fallo("El comentario puede tener hasta 800 caracteres. Si necesitás más, escribí una respuesta.");

  const admin = createAdminClient();
  const { data } = await admin
    .from("foro_respuestas")
    .select("id, estado, tema:foro_temas!foro_respuestas_tema_id_fkey(id, slug, categoria, estado)")
    .eq("id", respuestaId).maybeSingle();
  const r = data as unknown as { id: string; estado: string; tema: { id: string; slug: string; categoria: string; estado: string } } | null;
  if (!r || r.estado !== "publicado" || r.tema.estado !== "publicado") return fallo("Esta respuesta ya no está disponible.");

  if (!(await dentroDelLimite(miembro, "comentario", 30))) return fallo(LIMITE_MSG);

  const { data: creado, error } = await admin.from("foro_comentarios").insert({
    respuesta_id: r.id, tema_id: r.tema.id, autor_id: miembro.id, cuerpo,
  }).select("id").single();
  if (error || !creado) return fallo("No pudimos publicar el comentario. Probá de nuevo.");
  after(() => avisarNuevoComentario(creado.id));
  refrescar(urlTema(r.tema));
  return { ok: true };
}

export async function editarComentario(formData: FormData): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);

  const id = linea(formData.get("id"));
  const cuerpo = texto(formData.get("cuerpo"));
  if (cuerpo.length < 2) return fallo("El comentario no puede quedar vacío.");
  if (cuerpo.length > 800) return fallo("El comentario puede tener hasta 800 caracteres.");

  const admin = createAdminClient();
  const { data } = await admin
    .from("foro_comentarios").select("id, autor_id, tema:foro_temas(slug, categoria)").eq("id", id).maybeSingle();
  const c = data as unknown as { autor_id: string; tema: { slug: string; categoria: string } } | null;
  if (!c || c.autor_id !== ctx.miembro.id) return fallo("Solo quien escribió el comentario puede editarlo.");

  const { error } = await admin.from("foro_comentarios")
    .update({ cuerpo, editado_at: new Date().toISOString() }).eq("id", id);
  if (error) return fallo("No pudimos guardar el comentario. Probá de nuevo.");
  refrescar(urlTema(c.tema));
  return { ok: true };
}

export async function borrarComentario(id: string): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);

  const admin = createAdminClient();
  const { data } = await admin
    .from("foro_comentarios").select("id, autor_id, tema:foro_temas(slug, categoria)").eq("id", id).maybeSingle();
  const c = data as unknown as { autor_id: string; tema: { slug: string; categoria: string } } | null;
  if (!c || c.autor_id !== ctx.miembro.id) return fallo("Solo quien escribió el comentario puede borrarlo.");

  const { error } = await admin.from("foro_comentarios").delete().eq("id", id);
  if (error) return fallo("No pudimos borrar el comentario. Probá de nuevo.");
  refrescar(urlTema(c.tema));
  return { ok: true };
}

// ── Votos ────────────────────────────────────────────────────

/** Flechita arriba: pone o saca el voto. Devuelve el total actualizado. */
export async function votar(tipo: "tema" | "respuesta", id: string): Promise<Resultado<{ votos: number; votado: boolean }>> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { miembro } = ctx;

  if (!(await dentroDelLimite(miembro, "voto", 200))) return fallo(LIMITE_MSG);

  const admin = createAdminClient();
  const tabla = tipo === "tema" ? "foro_temas" : "foro_respuestas";
  const columna = tipo === "tema" ? "tema_id" : "respuesta_id";

  const { data: objetivo } = await admin.from(tabla).select("id, autor_id, estado").eq("id", id).maybeSingle();
  if (!objetivo || objetivo.estado !== "publicado") return fallo("Ya no está disponible.");
  if (objetivo.autor_id === miembro.id) return fallo("No podés votar lo que escribiste.");

  const { data: previo } = await admin
    .from("foro_votos").select("miembro_id").eq("miembro_id", miembro.id).eq(columna, id).maybeSingle();

  if (previo) {
    await admin.from("foro_votos").delete().eq("miembro_id", miembro.id).eq(columna, id);
  } else {
    const { error } = await admin.from("foro_votos").insert({ miembro_id: miembro.id, [columna]: id });
    if (error && error.code !== "23505") return fallo("No pudimos registrar el voto. Probá de nuevo.");
  }

  const { data: actualizado } = await admin.from(tabla).select("votos").eq("id", id).single();
  revalidatePath("/foro", "layout");
  return { ok: true, votos: actualizado?.votos ?? 0, votado: !previo };
}

// ── Reportes ─────────────────────────────────────────────────

/** Con tres reportes de personas distintas, el contenido se oculta hasta que el admin lo revise. */
const REPORTES_PARA_OCULTAR = 3;

export async function reportar(formData: FormData): Promise<Resultado> {
  const ctx = await paraEscribir();
  if ("error" in ctx) return fallo(ctx.error);
  const { miembro } = ctx;

  const tipo = formData.get("tipo");
  const id = linea(formData.get("id"));
  const motivo = formData.get("motivo");
  const detalle = texto(formData.get("detalle")).slice(0, 500) || null;
  if (tipo !== "tema" && tipo !== "respuesta" && tipo !== "comentario") return fallo("Reporte inválido.");
  if (!MOTIVOS_REPORTE.some(m => m.valor === motivo)) return fallo("Elegí un motivo.");
  if (!(await dentroDelLimite(miembro, "reporte", 20))) return fallo(LIMITE_MSG);

  const admin = createAdminClient();
  const tabla = tipo === "tema" ? "foro_temas" : tipo === "respuesta" ? "foro_respuestas" : "foro_comentarios";
  const { data: objetivo } = await admin.from(tabla).select("id, autor_id, estado").eq("id", id).maybeSingle();
  if (!objetivo) return fallo("Ya no está disponible.");
  if (objetivo.autor_id === miembro.id) return fallo("No podés reportar lo que escribiste.");

  const { error } = await admin.from("foro_reportes").insert({
    reportante_id: miembro.id, tipo, objetivo_id: id, motivo, detalle,
  });
  if (error?.code === "23505") return { ok: true };
  if (error) return fallo("No pudimos enviar el reporte. Probá de nuevo.");

  const { count } = await admin.from("foro_reportes")
    .select("id", { count: "exact", head: true })
    .eq("tipo", tipo).eq("objetivo_id", id).eq("estado", "abierto");

  const motivoLabel = MOTIVOS_REPORTE.find(m => m.valor === motivo)?.label ?? String(motivo);
  if ((count ?? 0) >= REPORTES_PARA_OCULTAR && objetivo.estado === "publicado") {
    await admin.from(tabla).update({ estado: "oculto" }).eq("id", id);
    refrescar();
    after(() => avisarAdmin(
      "Tertulia · contenido ocultado por reportes",
      "Se ocultó un contenido reportado",
      [["Tipo", String(tipo)], ["Reportes", String(count)], ["Último motivo", motivoLabel]],
    ));
  } else if (count === 1) {
    after(() => avisarAdmin(
      "Tertulia · nuevo reporte",
      "Reportaron un contenido",
      [["Tipo", String(tipo)], ["Motivo", motivoLabel], ["Detalle", detalle ?? "—"], ["Reportó", miembro.alias]],
    ));
  }
  return { ok: true };
}

// ── Perfil del miembro ───────────────────────────────────────

export async function actualizarMiembro(formData: FormData): Promise<Resultado<{ handle: string }>> {
  const user = await usuarioActual();
  if (!user) return fallo("Tenés que ingresar para editar tu perfil.");
  const miembro = await asegurarMiembro(user);
  if (!miembro) return fallo("No pudimos cargar tu perfil. Probá de nuevo.");

  const alias = linea(formData.get("alias"));
  if (alias.length < 2 || alias.length > 40) return fallo("El nombre visible tiene que tener entre 2 y 40 caracteres.");
  if (/(https?:|www\.|@)/i.test(alias)) return fallo("El nombre visible no puede tener enlaces ni emails.");
  const rol = formData.get("rol");
  if (rol && !esRol(rol)) return fallo("Elegí qué te trae a la Tertulia.");
  const bio = texto(formData.get("bio"));
  if (bio.length > 280) return fallo("La presentación puede tener hasta 280 caracteres.");
  const avisos = formData.get("avisos_email") === "on";

  const cambios: Record<string, unknown> = {
    alias, rol: rol || null, bio: bio || null, avisos_email: avisos,
  };
  // El handle sigue al nombre visible: si alguien pasa a un alias, su
  // nombre real deja de estar en la URL del perfil
  if (alias !== miembro.alias) cambios.handle = await handleLibre(alias, miembro.id);

  const avatar = fotosDelForm(formData, "avatar");
  if ("error" in avatar) return fallo(avatar.error);
  if (avatar.length) {
    const [url] = await subirFotos(`avatares/${user.id}`, avatar.slice(0, 1));
    if (url) cambios.avatar_url = url;
  } else if (formData.get("quitar_avatar") === "1") {
    cambios.avatar_url = null;
  }

  const { error } = await createAdminClient().from("foro_miembros").update(cambios).eq("id", miembro.id);
  if (error) return fallo("No pudimos guardar tu perfil. Probá de nuevo.");
  if ("avatar_url" in cambios && miembro.avatar_url) await borrarFotos([miembro.avatar_url]);

  refrescar();
  return { ok: true, handle: (cambios.handle as string) ?? miembro.handle };
}

/** Pedido del distintivo "Profesional verificado": lo revisa el superadmin. */
export async function pedirVerificacionProfesional(formData: FormData): Promise<Resultado> {
  const user = await usuarioActual();
  if (!user) return fallo("Tenés que ingresar.");
  const miembro = await leerMiembro(user.id);
  if (!miembro) return fallo("Primero completá tu perfil.");
  if (miembro.verificado) return { ok: true };

  const matricula = linea(formData.get("matricula"));
  if (matricula.length < 4 || matricula.length > 120) {
    return fallo("Indicá tu matrícula y el colegio que la otorgó (por ejemplo: CUCICBA N.º 1234).");
  }
  if (!(await checkRateLimitClave(`foro-matricula:${miembro.id}`, 3, 86400))) return fallo(RATE_LIMIT_MSG);

  const { error } = await createAdminClient().from("foro_miembros").update({
    matricula, verificacion_estado: "pendiente", rol: "profesional",
  }).eq("id", miembro.id);
  if (error) return fallo("No pudimos enviar el pedido. Probá de nuevo.");

  after(() => avisarAdmin(
    "Tertulia · pedido de verificación profesional",
    "Un miembro pidió el distintivo de profesional",
    [["Miembro", miembro.alias], ["Email", user.email ?? "—"], ["Matrícula", matricula]],
  ));
  refrescar();
  return { ok: true };
}

/** Desde el enlace del email: no pide sesión, el token identifica al miembro. */
export async function dejarDeRecibirAvisos(token: string): Promise<Resultado> {
  const id = leerToken("avisos", token);
  if (!id) return fallo("El enlace no es válido o venció. Podés apagar los avisos desde tu perfil.");
  const { error } = await createAdminClient().from("foro_miembros").update({ avisos_email: false }).eq("id", id);
  if (error) return fallo("No pudimos guardar el cambio. Probá de nuevo.");
  return { ok: true };
}

// ── Alta en la Tertulia ──────────────────────────────────────

/** Los errores de Supabase Auth llegan en inglés. */
function errorDeAlta(mensaje: string): string {
  if (/already registered|already exists/i.test(mensaje)) return YA_EXISTE;
  if (/password/i.test(mensaje)) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (/rate limit|too many/i.test(mensaje)) return "Hubo demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.";
  if (/email/i.test(mensaje)) return "Revisá el email: no parece válido.";
  return "No pudimos crear tu cuenta. Probá de nuevo en un momento.";
}

const YA_EXISTE = "Ya existe una cuenta con ese email. Ingresá con tu contraseña (o recuperala si no te acordás).";

/**
 * Crea la cuenta del sitio (la misma que usan los dueños) y el perfil
 * de la Tertulia en un solo paso. A diferencia del alta de propietario
 * no pide teléfono: acá nadie tiene que contactar a nadie por WhatsApp.
 *
 * Supabase tiene activada la confirmación de email: el alta no deja la
 * sesión abierta, manda su email de confirmación, y el enlace vuelve por
 * /auth/callback al tema donde la persona quería participar, ya con la
 * sesión iniciada.
 */
export async function unirseALaTertulia(formData: FormData): Promise<Resultado> {
  const nombre = normalizarNombre(linea(formData.get("nombre")));
  const email = linea(formData.get("email")).toLowerCase();
  const password = (formData.get("password") as string) || "";
  const rol = formData.get("rol");
  const volver = volverSeguro(formData.get("volver"));

  if (nombre.length < 2) return fallo("Ingresá tu nombre.");
  if (!esRol(rol)) return fallo("Contanos qué te trae a la Tertulia.");
  if (password.length < 6) return fallo("La contraseña tiene que tener al menos 6 caracteres.");
  if (!(await checkRateLimit("foro-alta", 5, 3600))) return fallo(RATE_LIMIT_MSG);
  if (!(await verificarTurnstile(formData))) return fallo(TURNSTILE_MSG);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, origen: { pagina: "foro" } },
      emailRedirectTo: `${SITE}/auth/callback?next=${encodeURIComponent(volver)}`,
    },
  });
  if (error || !data.user) return fallo(errorDeAlta(error?.message ?? ""));

  // Con la confirmación activada, si el email ya tiene cuenta Supabase no
  // da error: devuelve un usuario sin identidades y no crea nada.
  if (!data.user.identities?.length) return fallo(YA_EXISTE);

  // Defensivo, como en signUp: el perfil queda con el nombre aunque el trigger falle
  await createAdminClient().from("profiles").update({ nombre }).eq("id", data.user.id);
  await asegurarMiembro(data.user, { rol });

  redirect(`/foro/bienvenida?nuevo=1&volver=${encodeURIComponent(volver)}`);
}
