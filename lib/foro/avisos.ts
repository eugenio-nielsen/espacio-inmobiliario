import { createAdminClient } from "@/lib/supabase/admin";
import { crearToken } from "@/lib/foro/firma";
import { extracto, urlTema } from "@/lib/foro/texto";
import { categoriaPorSlug } from "@/lib/foro/categorias";
import { sendForoAviso, sendForoAdmin } from "@/lib/email";
import { SITE } from "@/lib/foro/servidor";

/**
 * Avisos por email de la Tertulia. Corren en after(): la persona ve su
 * respuesta publicada sin esperar a que salga el email, y si Resend
 * falla, la publicación no se entera.
 *
 * Nunca se avisa a alguien de lo que escribió él mismo, ni a quien
 * apagó los avisos.
 */

type Destinatario = { email: string; alias: string };

async function destinatario(miembroId: string): Promise<Destinatario | null> {
  const { data } = await createAdminClient()
    .from("foro_miembros")
    .select("alias, avisos_email, suspendido, perfil:profiles(email)")
    .eq("id", miembroId).maybeSingle();
  const m = data as unknown as { alias: string; avisos_email: boolean; suspendido: boolean; perfil: { email: string } | null } | null;
  if (!m || !m.avisos_email || m.suspendido || !m.perfil?.email) return null;
  return { email: m.perfil.email, alias: m.alias };
}

const bajaUrl = (miembroId: string) => `${SITE}/foro/avisos?t=${crearToken("avisos", miembroId, 365)}`;
const corto = (t: string) => (t.length > 60 ? `${t.slice(0, 57).trimEnd()}…` : t);

async function seguro(donde: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error(`Foro · aviso ${donde}:`, e);
  }
}

type TemaMin = { id: string; slug: string; categoria: string; titulo: string; autor_id: string };

/** Nueva respuesta → a quien abrió el tema. */
export function avisarNuevaRespuesta(respuestaId: string) {
  return seguro("respuesta", async () => {
    const { data } = await createAdminClient()
      .from("foro_respuestas")
      .select("id, cuerpo, autor_id, autor:foro_miembros(alias), tema:foro_temas!foro_respuestas_tema_id_fkey(id, slug, categoria, titulo, autor_id)")
      .eq("id", respuestaId).maybeSingle();
    const r = data as unknown as { id: string; cuerpo: string; autor_id: string; autor: { alias: string }; tema: TemaMin } | null;
    if (!r?.tema || r.tema.autor_id === r.autor_id) return;
    const para = await destinatario(r.tema.autor_id);
    if (!para) return;
    await sendForoAviso({
      para: para.email,
      alias: para.alias,
      asunto: `Nueva respuesta en "${corto(r.tema.titulo)}"`,
      titulo: "Respondieron tu tema",
      lead: `${r.autor.alias} respondió en "${r.tema.titulo}".`,
      cita: extracto(r.cuerpo, 280),
      url: `${SITE}${urlTema(r.tema)}#r-${r.id}`,
      cta: "Leer la respuesta",
      bajaUrl: bajaUrl(r.tema.autor_id),
    });
  });
}

/** Nuevo comentario → a quien escribió la respuesta comentada. */
export function avisarNuevoComentario(comentarioId: string) {
  return seguro("comentario", async () => {
    const { data } = await createAdminClient()
      .from("foro_comentarios")
      .select("id, cuerpo, autor_id, respuesta_id, autor:foro_miembros(alias), respuesta:foro_respuestas(autor_id), tema:foro_temas(id, slug, categoria, titulo, autor_id)")
      .eq("id", comentarioId).maybeSingle();
    const c = data as unknown as {
      cuerpo: string; autor_id: string; respuesta_id: string; autor: { alias: string };
      respuesta: { autor_id: string } | null; tema: TemaMin | null;
    } | null;
    if (!c?.respuesta || !c.tema || c.respuesta.autor_id === c.autor_id) return;
    const para = await destinatario(c.respuesta.autor_id);
    if (!para) return;
    await sendForoAviso({
      para: para.email,
      alias: para.alias,
      asunto: `Comentaron tu respuesta en "${corto(c.tema.titulo)}"`,
      titulo: "Comentaron tu respuesta",
      lead: `${c.autor.alias} comentó tu respuesta en "${c.tema.titulo}".`,
      cita: c.cuerpo.slice(0, 280),
      url: `${SITE}${urlTema(c.tema)}#r-${c.respuesta_id}`,
      cta: "Ver el comentario",
      bajaUrl: bajaUrl(c.respuesta.autor_id),
    });
  });
}

/** La respuesta fue elegida como solución → a quien la escribió. */
export function avisarSolucion(respuestaId: string) {
  return seguro("solucion", async () => {
    const { data } = await createAdminClient()
      .from("foro_respuestas")
      .select("id, autor_id, tema:foro_temas!foro_respuestas_tema_id_fkey(id, slug, categoria, titulo, autor_id)")
      .eq("id", respuestaId).maybeSingle();
    const r = data as unknown as { id: string; autor_id: string; tema: TemaMin } | null;
    if (!r?.tema || r.tema.autor_id === r.autor_id) return;
    const para = await destinatario(r.autor_id);
    if (!para) return;
    await sendForoAviso({
      para: para.email,
      alias: para.alias,
      asunto: "Tu respuesta fue elegida como solución",
      titulo: "Tu respuesta resolvió la duda",
      lead: `quien preguntó "${r.tema.titulo}" marcó tu respuesta como la solución. Gracias por compartir lo que sabés.`,
      url: `${SITE}${urlTema(r.tema)}#r-${r.id}`,
      cta: "Ver el tema",
      bajaUrl: bajaUrl(r.autor_id),
    });
  });
}

/** Tema nuevo → al superadmin, para responder rápido mientras la Tertulia arranca. */
export function avisarTemaNuevo(temaId: string) {
  return seguro("tema", async () => {
    const { data } = await createAdminClient()
      .from("foro_temas")
      .select("slug, categoria, titulo, cuerpo, autor:foro_miembros(alias, equipo)")
      .eq("id", temaId).maybeSingle();
    const t = data as unknown as { slug: string; categoria: string; titulo: string; cuerpo: string; autor: { alias: string; equipo: boolean } | null } | null;
    if (!t || t.autor?.equipo) return;
    await sendForoAdmin({
      asunto: `Tertulia · nuevo tema: ${corto(t.titulo)}`,
      titulo: "Nuevo tema en la Tertulia",
      lineas: [
        ["Categoría", categoriaPorSlug(t.categoria)?.nombre ?? t.categoria],
        ["Autor", t.autor?.alias ?? "—"],
        ["Título", t.titulo],
        ["Detalle", extracto(t.cuerpo, 400)],
      ],
      url: `${SITE}${urlTema(t)}`,
      cta: "Ir al tema",
    });
  });
}

/** Aviso genérico al superadmin (reportes, pedidos de verificación). */
export function avisarAdmin(asunto: string, titulo: string, lineas: [string, string][]) {
  return seguro("admin", () =>
    sendForoAdmin({ asunto, titulo, lineas, url: `${SITE}/panel/admin?tab=foro`, cta: "Revisar en el panel" })
  );
}
