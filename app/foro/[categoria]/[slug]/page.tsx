import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { CircleCheck, Eye, MessageSquare } from "lucide-react";
import Autor from "@/components/foro/Autor";
import Votar from "@/components/foro/Votar";
import Comentarios, { type ComentarioVista } from "@/components/foro/Comentarios";
import FormRespuesta from "@/components/foro/FormRespuesta";
import { AccionesTema, BloqueRespuesta } from "@/components/foro/Acciones";
import { Fotos, HerramientaSugerida, InvitarUnirse, ReglasCortas } from "@/components/foro/Lateral";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  miembroPrivado, obtenerComentarios, obtenerRespuestas, obtenerTema, temasRelacionados, votosDelMiembro,
} from "@/lib/foro/data";
import { categoriaPorSlug } from "@/lib/foro/categorias";
import { renderForo } from "@/lib/foro/markdown";
import { aliasPorDefecto, extracto, fechaLarga, haceCuanto, plural, urlTema } from "@/lib/foro/texto";
import type { Comentario, Respuesta, Tema } from "@/lib/foro/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

type Props = { params: Promise<{ categoria: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tema = await obtenerTema(slug);
  if (!tema) return { title: "Tema no encontrado" };
  const description = extracto(tema.cuerpo, 158);
  const url = `${SITE}${urlTema(tema)}`;
  return {
    title: `${tema.titulo} · Tertulia Inmobiliaria`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: tema.titulo,
      description,
      url,
      type: "article",
      images: tema.fotos?.[0] ? [{ url: tema.fotos[0] }] : undefined,
    },
  };
}

/** JSON-LD dentro de <script>: un "</script>" en el texto de alguien no puede cerrar la etiqueta. */
const jsonSeguro = (datos: unknown) => JSON.stringify(datos).replace(/</g, "\\u003c");

/**
 * Un tema de la Tertulia: el planteo, las respuestas (primero la
 * solución elegida, después las más votadas, si no por orden de
 * llegada), los comentarios de cada una y el formulario para responder.
 */
export default async function TemaPage({ params }: Props) {
  const { categoria, slug } = await params;
  const tema = await obtenerTema(slug);
  if (!tema) notFound();
  // Si cambió de categoría, la URL vieja lleva a la nueva
  if (tema.categoria !== categoria) permanentRedirect(urlTema(tema));
  const cat = categoriaPorSlug(tema.categoria);

  // La sesión primero y sola (el cliente con cookies no tolera consultas en paralelo)
  const user = await getCurrentUser();
  const perfil = user ? await getCurrentProfile() : null;

  const [respuestas, comentarios, relacionados, miembro] = await Promise.all([
    obtenerRespuestas(tema),
    obtenerComentarios(tema.id),
    temasRelacionados(tema.categoria, tema.id),
    user ? miembroPrivado(user.id) : Promise.resolve(null),
  ]);
  const votados = user
    ? await votosDelMiembro(user.id, tema.id, respuestas.map(r => r.id))
    : new Set<string>();

  // Lecturas: después de responder, y sin contar las del propio autor
  if (user?.id !== tema.autor_id) {
    after(async () => {
      try {
        await createAdminClient().rpc("foro_sumar_vista", { p_tema: tema.id });
      } catch (e) {
        console.error("Foro · vista:", e);
      }
    });
  }

  const url = urlTema(tema);
  const sesion = !!user;
  const esAutorTema = user?.id === tema.autor_id;
  const ahora = new Date();
  const n = respuestas.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: tema.titulo,
    text: extracto(tema.cuerpo, 5000),
    url: `${SITE}${url}`,
    datePublished: tema.created_at,
    ...(tema.editado_at ? { dateModified: tema.editado_at } : {}),
    ...(tema.fotos?.length ? { image: tema.fotos } : {}),
    author: { "@type": "Person", name: tema.autor.alias, url: `${SITE}/foro/miembros/${tema.autor.handle}` },
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: tema.votos },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: n },
    ],
    comment: respuestas.slice(0, 50).map(r => ({
      "@type": "Comment",
      text: extracto(r.cuerpo, 3000),
      datePublished: r.created_at,
      url: `${SITE}${url}#r-${r.id}`,
      author: { "@type": "Person", name: r.autor.alias, url: `${SITE}/foro/miembros/${r.autor.handle}` },
      interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: r.votos },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(jsonLd) }} />

      <div className="fo-in fo-grilla" style={{ paddingTop: 0 }}>
        <article className="fo-tema">
          <header className="fo-tema-cab">
            <nav className="fo-migas" aria-label="Estás en">
              <Link href="/foro">Tertulia Inmobiliaria</Link>
              <span aria-hidden="true">›</span>
              {cat && <Link href={`/foro/${cat.slug}`}>{cat.nombre}</Link>}
            </nav>
            <h1 className="fo-tema-t">{tema.titulo}</h1>
            <div className="fo-tema-meta">
              <Autor miembro={tema.autor} cuando={fechaLarga(tema.created_at)} />
              <div className="fo-tema-datos">
                {tema.vistas > 0 && <span><Eye size={13} strokeWidth={1.8} /> {plural(tema.vistas, "lectura", "lecturas")}</span>}
                <span><MessageSquare size={13} strokeWidth={1.8} /> {plural(n, "respuesta", "respuestas")}</span>
                {tema.respuesta_aceptada_id && <span><CircleCheck size={13} strokeWidth={1.8} /> Resuelto</span>}
              </div>
            </div>
            <div className="fo-doble" />
          </header>

          <div className="fo-post">
            <Votar
              tipo="tema"
              id={tema.id}
              votos={tema.votos}
              votado={votados.has(tema.id)}
              sesion={sesion}
              propio={esAutorTema}
              volver={url}
            />
            <div style={{ minWidth: 0 }}>
              <div className="fo-texto" dangerouslySetInnerHTML={{ __html: renderForo(tema.cuerpo) }} />
              <Fotos fotos={tema.fotos} />
              {tema.editado_at && <p className="fo-editado">Editado {haceCuanto(tema.editado_at, ahora)}</p>}
              <AccionesTema id={tema.id} titulo={tema.titulo} propio={esAutorTema} borrable={n === 0} sesion={sesion} />
            </div>
          </div>

          <section aria-labelledby="fo-respuestas-t">
            <div className="fo-resps-cab">
              <h2 className="fo-resps-t" id="fo-respuestas-t">
                {n === 0 ? <>Sin respuestas <em>todavía</em></> : <>{n} <em>{n === 1 ? "respuesta" : "respuestas"}</em></>}
              </h2>
              {n > 1 && (
                <p className="fo-resps-nota">
                  {tema.respuesta_aceptada_id
                    ? "Primero la solución elegida; después, las más votadas."
                    : "Las más votadas primero; si no, por orden de llegada."}
                </p>
              )}
            </div>

            {respuestas.map(r => (
              <RespuestaVista
                key={r.id}
                r={r}
                tema={tema}
                comentarios={comentarios.get(r.id) ?? []}
                miId={user?.id ?? null}
                votado={votados.has(r.id)}
                esAutorTema={esAutorTema}
                ahora={ahora}
              />
            ))}
          </section>

          <section className="fo-responder" id="responder" aria-labelledby="fo-responder-t">
            <h2 className="fo-responder-t" id="fo-responder-t">
              {esAutorTema ? "Sumar algo al tema" : n === 0 ? "Sé quien responde primero" : "Tu respuesta"}
            </h2>
            {!user ? (
              <InvitarUnirse
                volver={`${url}#responder`}
                titulo={<>Sumate para <em>responder</em></>}
                texto="Con tu cuenta de Espacio Inmobiliario podés responder, votar y abrir temas. Es gratis y lleva un minuto."
              />
            ) : miembro?.suspendido ? (
              <p className="fo-error">Tu participación en la Tertulia está suspendida. Si creés que es un error, escribinos.</p>
            ) : (
              <>
                <FormRespuesta temaId={tema.id} />
                <p className="fo-como">
                  Publicás como <strong>{miembro?.alias ?? aliasPorDefecto(perfil?.nombre, user.email)}</strong>
                  {" · "}<Link href="/foro/perfil">cambiar cómo te ven</Link>
                </p>
              </>
            )}
            <p className="fo-aviso-legal">
              Lo que se comparte en la Tertulia son opiniones y experiencias de la comunidad: orientan, pero no
              reemplazan el asesoramiento de un profesional matriculado, un escribano o un abogado para tu caso.
            </p>
          </section>
        </article>

        <aside className="fo-lateral" style={{ paddingTop: "clamp(30px, 4vw, 48px)" }}>
          {cat?.herramienta && <HerramientaSugerida herramienta={cat.herramienta} />}
          {relacionados.length > 0 && cat && (
            <section className="fo-lateral-bloque" aria-labelledby="fo-rel-t">
              <h2 className="fo-rotulo" id="fo-rel-t">Más en {cat.nombre}</h2>
              <ul className="fo-rel">
                {relacionados.map(t => (
                  <li key={t.id}>
                    <Link href={urlTema(t)}>{t.titulo}</Link>
                    <small>
                      {t.respuesta_aceptada_id ? "Resuelto" : plural(t.respuestas, "respuesta", "respuestas")}
                      {" · "}{haceCuanto(t.ultima_actividad_at, ahora)}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ReglasCortas />
        </aside>
      </div>
    </>
  );
}

function RespuestaVista({
  r,
  tema,
  comentarios,
  miId,
  votado,
  esAutorTema,
  ahora,
}: {
  r: Respuesta;
  tema: Tema;
  comentarios: Comentario[];
  miId: string | null;
  votado: boolean;
  esAutorTema: boolean;
  ahora: Date;
}) {
  const esSolucion = tema.respuesta_aceptada_id === r.id;
  const propio = miId === r.autor_id;
  const url = urlTema(tema);
  const vista: ComentarioVista[] = comentarios.map(c => ({
    id: c.id,
    cuerpo: c.cuerpo,
    cuando: haceCuanto(c.created_at, ahora),
    editado: !!c.editado_at,
    propio: miId === c.autor_id,
    autor: { alias: c.autor.alias, handle: c.autor.handle, equipo: c.autor.equipo },
  }));

  return (
    <article id={`r-${r.id}`} className={`fo-resp${esSolucion ? " fo-resp-sol" : ""}`}>
      {esSolucion && (
        <span className="fo-sello-sol"><CircleCheck size={12} strokeWidth={2} /> Solución elegida por quien preguntó</span>
      )}
      <Votar
        tipo="respuesta"
        id={r.id}
        votos={r.votos}
        votado={votado}
        sesion={!!miId}
        propio={propio}
        volver={`${url}#r-${r.id}`}
      />
      <div style={{ minWidth: 0 }}>
        {r.autor.equipo && <p className="fo-firma-equipo">Respuesta de Espacio Inmobiliario</p>}
        <div className="fo-resp-cabeza">
          <Autor miembro={r.autor} cuando={haceCuanto(r.created_at, ahora)} />
        </div>
        <BloqueRespuesta
          id={r.id}
          temaId={tema.id}
          cuerpo={r.cuerpo}
          fotos={r.fotos ?? []}
          propio={propio}
          borrable={!esSolucion && comentarios.length === 0}
          sesion={!!miId}
          esAutorTema={esAutorTema}
          esSolucion={esSolucion}
        >
          <div className="fo-texto" dangerouslySetInnerHTML={{ __html: renderForo(r.cuerpo) }} />
          <Fotos fotos={r.fotos ?? []} />
          {r.editado_at && <p className="fo-editado">Editada {haceCuanto(r.editado_at, ahora)}</p>}
        </BloqueRespuesta>
        <Comentarios respuestaId={r.id} comentarios={vista} sesion={!!miId} volver={`${url}#r-${r.id}`} />
      </div>
    </article>
  );
}
