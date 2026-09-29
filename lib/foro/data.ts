import { cache } from "react";
import { createClient as crearClienteSupabase } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarBusqueda } from "@/lib/foro/texto";
import type {
  Comentario, Miembro, MiembroPrivado, Orden, Respuesta, Tema, TemaFila,
} from "@/lib/foro/types";

/**
 * Lecturas de la Tertulia.
 *
 * Lo público se lee con la anon key y SIN cookies: el RLS garantiza que
 * solo salga lo publicado, y al no tocar la sesión las consultas pueden
 * correr en paralelo (el cliente con cookies falla si se lo usa en un
 * Promise.all, ver lib/auth/user.ts). Lo privado (el miembro completo,
 * los votos propios, la moderación) va con el service role, siempre
 * filtrado por un id que el servidor ya validó.
 *
 * Si la migración todavía no se corrió, todo devuelve vacío en vez de
 * romper la página.
 */

function publico() {
  return crearClienteSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const COLS_MIEMBRO = "id, alias, handle, rol, bio, avatar_url, verificado, equipo, created_at";
const COLS_FILA =
  "id, slug, categoria, titulo, cuerpo, votos, respuestas, vistas, fijado, respuesta_aceptada_id, " +
  `ultima_actividad_at, created_at, autor:foro_miembros(${COLS_MIEMBRO})`;
const COLS_TEMA = `${COLS_FILA}, fotos, editado_at, autor_id`;

export const POR_PAGINA = 20;

function registrar(donde: string, e: unknown) {
  const msg = e && typeof e === "object" && "message" in e ? (e as { message: string }).message : String(e);
  console.error(`Foro · ${donde}:`, msg);
}

// ── Temas ────────────────────────────────────────────────────

export async function listarTemas({
  categoria,
  orden = "actividad",
  q,
  pagina = 1,
}: {
  categoria?: string;
  orden?: Orden;
  q?: string;
  pagina?: number;
}): Promise<{ temas: TemaFila[]; total: number }> {
  try {
    let query = publico().from("foro_temas").select(COLS_FILA, { count: "exact" });
    if (categoria) query = query.eq("categoria", categoria);

    const busqueda = q ? normalizarBusqueda(q) : "";
    if (busqueda) query = query.textSearch("busqueda", busqueda, { config: "spanish", type: "websearch" });

    switch (orden) {
      case "nuevos":
        query = query.order("created_at", { ascending: false });
        break;
      case "sin-respuesta":
        query = query.eq("respuestas", 0).order("created_at", { ascending: false });
        break;
      case "resueltos":
        query = query.not("respuesta_aceptada_id", "is", null).order("ultima_actividad_at", { ascending: false });
        break;
      case "valorados":
        query = query.order("votos", { ascending: false }).order("created_at", { ascending: false });
        break;
      default:
        // Los fijados arriba solo en la vista por defecto y sin búsqueda
        if (!busqueda) query = query.order("fijado", { ascending: false });
        query = query.order("ultima_actividad_at", { ascending: false });
    }

    const desde = (Math.max(1, pagina) - 1) * POR_PAGINA;
    const { data, count, error } = await query.range(desde, desde + POR_PAGINA - 1);
    if (error) throw error;
    return { temas: (data ?? []) as unknown as TemaFila[], total: count ?? 0 };
  } catch (e) {
    registrar("listarTemas", e);
    return { temas: [], total: 0 };
  }
}

/** Un tema publicado por slug. Cacheado por request (metadata + página). */
export const obtenerTema = cache(async (slug: string): Promise<Tema | null> => {
  try {
    const { data, error } = await publico().from("foro_temas").select(COLS_TEMA).eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data as unknown as Tema) ?? null;
  } catch (e) {
    registrar("obtenerTema", e);
    return null;
  }
});

/** Un tema por id, en cualquier estado. Para editarlo (el servidor valida al autor). */
export async function obtenerTemaParaEditar(id: string): Promise<(Tema & { estado: string }) | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("foro_temas").select(`${COLS_TEMA}, estado`).eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as unknown as Tema & { estado: string }) ?? null;
  } catch (e) {
    registrar("obtenerTemaParaEditar", e);
    return null;
  }
}

export async function temasRelacionados(categoria: string, excluir: string): Promise<TemaFila[]> {
  try {
    const { data, error } = await publico()
      .from("foro_temas").select(COLS_FILA)
      .eq("categoria", categoria).neq("id", excluir)
      .order("ultima_actividad_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return (data ?? []) as unknown as TemaFila[];
  } catch (e) {
    registrar("temasRelacionados", e);
    return [];
  }
}

// ── Respuestas y comentarios ─────────────────────────────────

/**
 * Las respuestas en el orden de lectura: primero la solución elegida,
 * después las más votadas y, a igualdad de votos, por fecha. Mientras
 * nadie vota ni elige, queda el orden cronológico de una conversación.
 */
export async function obtenerRespuestas(tema: Pick<Tema, "id" | "respuesta_aceptada_id">): Promise<Respuesta[]> {
  try {
    const { data, error } = await publico()
      .from("foro_respuestas")
      .select(`id, tema_id, autor_id, cuerpo, fotos, votos, editado_at, created_at, autor:foro_miembros(${COLS_MIEMBRO})`)
      .eq("tema_id", tema.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const lista = (data ?? []) as unknown as Respuesta[];
    return lista.sort((a, b) => {
      if (a.id === tema.respuesta_aceptada_id) return -1;
      if (b.id === tema.respuesta_aceptada_id) return 1;
      if (b.votos !== a.votos) return b.votos - a.votos;
      return a.created_at.localeCompare(b.created_at);
    });
  } catch (e) {
    registrar("obtenerRespuestas", e);
    return [];
  }
}

export async function obtenerComentarios(temaId: string): Promise<Map<string, Comentario[]>> {
  const porRespuesta = new Map<string, Comentario[]>();
  try {
    const { data, error } = await publico()
      .from("foro_comentarios")
      .select(`id, respuesta_id, autor_id, cuerpo, editado_at, created_at, autor:foro_miembros(${COLS_MIEMBRO})`)
      .eq("tema_id", temaId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    for (const c of (data ?? []) as unknown as Comentario[]) {
      const lista = porRespuesta.get(c.respuesta_id) ?? [];
      lista.push(c);
      porRespuesta.set(c.respuesta_id, lista);
    }
  } catch (e) {
    registrar("obtenerComentarios", e);
  }
  return porRespuesta;
}

/** Qué votó este miembro en el tema: el tema mismo y sus respuestas. */
export async function votosDelMiembro(
  miembroId: string,
  temaId: string,
  respuestaIds: string[]
): Promise<Set<string>> {
  const votados = new Set<string>();
  try {
    const filtro = respuestaIds.length
      ? `tema_id.eq.${temaId},respuesta_id.in.(${respuestaIds.join(",")})`
      : `tema_id.eq.${temaId}`;
    const { data, error } = await createAdminClient()
      .from("foro_votos").select("tema_id, respuesta_id")
      .eq("miembro_id", miembroId).or(filtro);
    if (error) throw error;
    for (const v of data ?? []) votados.add((v.tema_id || v.respuesta_id) as string);
  } catch (e) {
    registrar("votosDelMiembro", e);
  }
  return votados;
}

// ── Miembros ─────────────────────────────────────────────────

export const miembroPrivado = cache(async (id: string): Promise<MiembroPrivado | null> => {
  try {
    const { data, error } = await createAdminClient()
      .from("foro_miembros")
      .select(`${COLS_MIEMBRO}, suspendido, avisos_email, email_verificado_at, matricula, verificacion_estado`)
      .eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as MiembroPrivado) ?? null;
  } catch (e) {
    registrar("miembroPrivado", e);
    return null;
  }
});

export const miembroPorHandle = cache(async (handle: string): Promise<Miembro | null> => {
  try {
    const { data, error } = await publico()
      .from("foro_miembros").select(COLS_MIEMBRO).eq("handle", handle).maybeSingle();
    if (error) throw error;
    return (data as Miembro) ?? null;
  } catch (e) {
    registrar("miembroPorHandle", e);
    return null;
  }
});

export type RespuestaDeMiembro = {
  id: string;
  cuerpo: string;
  votos: number;
  created_at: string;
  tema: { slug: string; categoria: string; titulo: string; respuesta_aceptada_id: string | null } | null;
};

export async function actividadDeMiembro(id: string): Promise<{
  temas: TemaFila[];
  respuestas: RespuestaDeMiembro[];
  totalTemas: number;
  totalRespuestas: number;
  soluciones: number;
}> {
  const sb = publico();
  try {
    const [temas, respuestas] = await Promise.all([
      sb.from("foro_temas").select(COLS_FILA, { count: "exact" })
        .eq("autor_id", id).order("created_at", { ascending: false }).limit(20),
      sb.from("foro_respuestas")
        .select("id, cuerpo, votos, created_at, tema:foro_temas!foro_respuestas_tema_id_fkey(slug, categoria, titulo, respuesta_aceptada_id)", { count: "exact" })
        .eq("autor_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (temas.error) throw temas.error;
    if (respuestas.error) throw respuestas.error;

    const lista = (respuestas.data ?? []) as unknown as RespuestaDeMiembro[];
    const { count: soluciones } = await sb
      .from("foro_temas").select("id", { count: "exact", head: true })
      .in("respuesta_aceptada_id", lista.length ? lista.map(r => r.id) : ["00000000-0000-0000-0000-000000000000"]);

    return {
      temas: (temas.data ?? []) as unknown as TemaFila[],
      respuestas: lista,
      totalTemas: temas.count ?? 0,
      totalRespuestas: respuestas.count ?? 0,
      soluciones: soluciones ?? 0,
    };
  } catch (e) {
    registrar("actividadDeMiembro", e);
    return { temas: [], respuestas: [], totalTemas: 0, totalRespuestas: 0, soluciones: 0 };
  }
}

// ── Portada ──────────────────────────────────────────────────

export async function conteoCategorias(): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  try {
    const { data, error } = await publico().rpc("foro_conteo_categorias");
    if (error) throw error;
    for (const fila of (data ?? []) as { categoria: string; temas: number }[]) {
      mapa.set(fila.categoria, Number(fila.temas));
    }
  } catch (e) {
    registrar("conteoCategorias", e);
  }
  return mapa;
}

export async function estadisticas(): Promise<{ temas: number; respuestas: number; miembros: number }> {
  try {
    const sb = publico();
    const [t, r, m] = await Promise.all([
      sb.from("foro_temas").select("id", { count: "exact", head: true }),
      sb.from("foro_respuestas").select("id", { count: "exact", head: true }),
      sb.from("foro_miembros").select("id", { count: "exact", head: true }),
    ]);
    return { temas: t.count ?? 0, respuestas: r.count ?? 0, miembros: m.count ?? 0 };
  } catch (e) {
    registrar("estadisticas", e);
    return { temas: 0, respuestas: 0, miembros: 0 };
  }
}

/** Para el sitemap: todos los temas publicados. */
export async function temasParaSitemap(): Promise<{ slug: string; categoria: string; ultima_actividad_at: string }[]> {
  try {
    const { data, error } = await publico()
      .from("foro_temas").select("slug, categoria, ultima_actividad_at")
      .order("ultima_actividad_at", { ascending: false }).limit(5000);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    registrar("temasParaSitemap", e);
    return [];
  }
}

// ── Moderación (superadmin) ──────────────────────────────────

export type ReporteAdmin = {
  id: string;
  tipo: "tema" | "respuesta" | "comentario";
  objetivo_id: string;
  motivo: string;
  detalle: string | null;
  created_at: string;
  reportante: string | null;
  /** Lo reportado, para leerlo sin salir del panel. */
  texto: string;
  estadoObjetivo: string | null;
  url: string | null;
  autor: string | null;
  autorId: string | null;
};

export type TemaAdmin = {
  id: string;
  slug: string;
  categoria: string;
  titulo: string;
  estado: string;
  fijado: boolean;
  respuestas: number;
  votos: number;
  created_at: string;
  autor: { alias: string; handle: string } | null;
};

export type MiembroAdmin = MiembroPrivado & { email: string | null };

export async function datosAdminForo(): Promise<{
  reportes: ReporteAdmin[];
  temas: TemaAdmin[];
  miembros: MiembroAdmin[];
}> {
  try {
    const admin = createAdminClient();
    const [rep, temas, miembros] = await Promise.all([
      admin.from("foro_reportes")
        .select("id, tipo, objetivo_id, motivo, detalle, created_at, reportante:foro_miembros(alias)")
        .eq("estado", "abierto").order("created_at", { ascending: false }).limit(200),
      admin.from("foro_temas")
        .select("id, slug, categoria, titulo, estado, fijado, respuestas, votos, created_at, autor:foro_miembros(alias, handle)")
        .order("created_at", { ascending: false }).limit(100),
      admin.from("foro_miembros")
        .select(`${COLS_MIEMBRO}, suspendido, avisos_email, email_verificado_at, matricula, verificacion_estado, perfil:profiles(email)`)
        .order("created_at", { ascending: false }).limit(500),
    ]);
    if (rep.error) throw rep.error;

    type RepFila = {
      id: string; tipo: ReporteAdmin["tipo"]; objetivo_id: string; motivo: string;
      detalle: string | null; created_at: string; reportante: { alias: string } | null;
    };
    const filas = (rep.data ?? []) as unknown as RepFila[];
    const ids = (tipo: string) => filas.filter(f => f.tipo === tipo).map(f => f.objetivo_id);
    const nulo = ["00000000-0000-0000-0000-000000000000"];
    const conIds = (l: string[]) => (l.length ? l : nulo);

    const [t, r, c] = await Promise.all([
      admin.from("foro_temas").select("id, slug, categoria, titulo, cuerpo, estado, autor_id, autor:foro_miembros(alias)").in("id", conIds(ids("tema"))),
      admin.from("foro_respuestas").select("id, cuerpo, estado, autor_id, autor:foro_miembros(alias), tema:foro_temas!foro_respuestas_tema_id_fkey(slug, categoria)").in("id", conIds(ids("respuesta"))),
      admin.from("foro_comentarios").select("id, cuerpo, estado, autor_id, autor:foro_miembros(alias), tema:foro_temas(slug, categoria)").in("id", conIds(ids("comentario"))),
    ]);

    type Obj = {
      id: string; cuerpo: string; titulo?: string; estado: string; autor_id: string;
      slug?: string; categoria?: string; autor: { alias: string } | null;
      tema?: { slug: string; categoria: string } | null;
    };
    const objetos = new Map<string, Obj>();
    for (const o of [...(t.data ?? []), ...(r.data ?? []), ...(c.data ?? [])] as unknown as Obj[]) objetos.set(o.id, o);

    const reportes: ReporteAdmin[] = filas.map(f => {
      const o = objetos.get(f.objetivo_id);
      const base = o?.slug ? o : o?.tema;
      return {
        id: f.id,
        tipo: f.tipo,
        objetivo_id: f.objetivo_id,
        motivo: f.motivo,
        detalle: f.detalle,
        created_at: f.created_at,
        reportante: f.reportante?.alias ?? null,
        texto: o ? (o.titulo ? `${o.titulo} — ${o.cuerpo}` : o.cuerpo) : "(ya no existe)",
        estadoObjetivo: o?.estado ?? null,
        url: base?.slug ? `/foro/${base.categoria}/${base.slug}` : null,
        autor: o?.autor?.alias ?? null,
        autorId: o?.autor_id ?? null,
      };
    });

    const listaMiembros = ((miembros.data ?? []) as unknown as (MiembroPrivado & { perfil: { email: string } | null })[])
      .map(({ perfil, ...m }) => ({ ...m, email: perfil?.email ?? null }));

    return {
      reportes,
      temas: (temas.data ?? []) as unknown as TemaAdmin[],
      miembros: listaMiembros,
    };
  } catch (e) {
    registrar("datosAdminForo", e);
    return { reportes: [], temas: [], miembros: [] };
  }
}
