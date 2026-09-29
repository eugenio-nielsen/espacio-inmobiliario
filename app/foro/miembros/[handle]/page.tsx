import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronUp, CircleCheck, MessageSquare } from "lucide-react";
import { Avatar, Distintivos } from "@/components/foro/Autor";
import { actividadDeMiembro, miembroPorHandle } from "@/lib/foro/data";
import { categoriaPorSlug } from "@/lib/foro/categorias";
import { extracto, fechaLarga, haceCuanto, plural, urlTema } from "@/lib/foro/texto";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const m = await miembroPorHandle(handle);
  if (!m) return { title: "Miembro no encontrado" };
  // Los perfiles no se indexan: son de personas, no contenido para buscadores
  return { title: `${m.alias} · Tertulia Inmobiliaria`, robots: { index: false, follow: true } };
}

/** El perfil público: quién es, qué preguntó y qué respondió. */
export default async function MiembroPage({ params }: Props) {
  const { handle } = await params;
  const miembro = await miembroPorHandle(handle);
  if (!miembro) notFound();

  const act = await actividadDeMiembro(miembro.id);
  const ahora = new Date();

  return (
    <div className="fo-in fo-angosto" style={{ maxWidth: 1000 }}>
      <nav className="fo-migas" aria-label="Estás en" style={{ paddingTop: 32 }}>
        <Link href="/foro">Tertulia Inmobiliaria</Link>
        <span aria-hidden="true">›</span>
        <span>Miembros</span>
      </nav>

      <header className="fo-perfil-cab">
        <Avatar miembro={miembro} tam={96} />
        <div>
          <h1 className="fo-perfil-t">{miembro.alias}</h1>
          <div className="fo-perfil-marcas">
            <Distintivos miembro={miembro} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)" }}>
              En la Tertulia desde {fechaLarga(miembro.created_at)}
            </span>
          </div>
          {miembro.bio && <p className="fo-perfil-bio">{miembro.bio}</p>}
        </div>
      </header>

      <ul className="fo-perfil-cifras">
        <li><strong>{act.totalTemas}</strong>{act.totalTemas === 1 ? "tema" : "temas"}</li>
        <li><strong>{act.totalRespuestas}</strong>{act.totalRespuestas === 1 ? "respuesta" : "respuestas"}</li>
        <li><strong>{act.soluciones}</strong>{act.soluciones === 1 ? "solución elegida" : "soluciones elegidas"}</li>
      </ul>

      <div className="fo-perfil-cols">
        <section>
          <h2>Temas</h2>
          {act.temas.length === 0 ? (
            <p className="fo-lista-vacia">Todavía no abrió temas.</p>
          ) : (
            <ul className="fo-lista-simple">
              {act.temas.map(t => (
                <li key={t.id}>
                  <Link href={urlTema(t)}>{t.titulo}</Link>
                  <br />
                  <small>
                    {categoriaPorSlug(t.categoria)?.nombre} · {haceCuanto(t.created_at, ahora)} ·{" "}
                    {t.respuesta_aceptada_id
                      ? <><CircleCheck size={12} /> Resuelto</>
                      : <><MessageSquare size={12} /> {plural(t.respuestas, "respuesta", "respuestas")}</>}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Respuestas</h2>
          {act.respuestas.length === 0 ? (
            <p className="fo-lista-vacia">Todavía no respondió temas.</p>
          ) : (
            <ul className="fo-lista-simple">
              {act.respuestas.filter(r => r.tema).map(r => (
                <li key={r.id}>
                  <Link href={`${urlTema(r.tema!)}#r-${r.id}`}>{r.tema!.titulo}</Link>
                  <p>{extracto(r.cuerpo, 140)}</p>
                  <small>
                    {haceCuanto(r.created_at, ahora)}
                    {r.votos > 0 && <> · <ChevronUp size={12} /> {r.votos}</>}
                    {r.tema!.respuesta_aceptada_id === r.id && <> · <CircleCheck size={12} /> Solución elegida</>}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
