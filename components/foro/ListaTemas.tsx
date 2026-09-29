import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronUp, CircleCheck, Eye, Pin } from "lucide-react";
import { Avatar } from "@/components/foro/Autor";
import { categoriaPorSlug } from "@/lib/foro/categorias";
import { extracto, haceCuanto, urlTema } from "@/lib/foro/texto";
import type { TemaFila } from "@/lib/foro/types";

/**
 * El índice de temas: filas separadas por filetes, como el índice de
 * una revista. Cada fila lleva la categoría, el título en serif, dos
 * renglones del planteo y quién lo abrió; a la derecha, cuántas
 * respuestas tiene (o el sello de resuelto). La fila entera es el enlace.
 */
export function FilaTema({ tema, conCategoria = true, ahora }: { tema: TemaFila; conCategoria?: boolean; ahora: Date }) {
  const cat = categoriaPorSlug(tema.categoria);
  const resuelto = !!tema.respuesta_aceptada_id;
  return (
    <li className="fo-fila">
      <div>
        {(conCategoria || tema.fijado) && (
          <div className="fo-fila-sup">
            {tema.fijado && <span className="fo-fijado"><Pin size={11} strokeWidth={2} /> Fijado</span>}
            {conCategoria && cat && <Link href={`/foro/${cat.slug}`} className="fo-fila-cat">{cat.nombre}</Link>}
          </div>
        )}
        <h3 className="fo-fila-t"><Link href={urlTema(tema)}>{tema.titulo}</Link></h3>
        <p className="fo-fila-ext">{extracto(tema.cuerpo, 220)}</p>
        <div className="fo-fila-meta">
          <Avatar miembro={tema.autor} tam={22} />
          <Link href={`/foro/miembros/${tema.autor.handle}`} className="fo-autor-nombre">{tema.autor.alias}</Link>
          <span className="fo-punto"> {haceCuanto(tema.created_at, ahora)}</span>
          {tema.votos > 0 && (
            <span className="fo-meta-dato" title="Votos"><ChevronUp size={14} strokeWidth={2} />{tema.votos}</span>
          )}
          {tema.vistas > 0 && (
            <span className="fo-meta-dato" title="Lecturas"><Eye size={13} strokeWidth={1.8} />{tema.vistas}</span>
          )}
          {tema.respuestas > 0 && tema.ultima_actividad_at !== tema.created_at && (
            <span className="fo-punto"> última actividad {haceCuanto(tema.ultima_actividad_at, ahora)}</span>
          )}
        </div>
      </div>

      {resuelto ? (
        <div className="fo-cuenta fo-cuenta-resuelto" title={`${tema.respuestas} respuestas · resuelto`}>
          <CircleCheck size={20} strokeWidth={1.7} />
          <span>Resuelto</span>
        </div>
      ) : (
        <div className={`fo-cuenta${tema.respuestas === 0 ? " fo-cuenta-cero" : ""}`}>
          <strong>{tema.respuestas}</strong>
          <span>{tema.respuestas === 1 ? "respuesta" : "respuestas"}</span>
        </div>
      )}
    </li>
  );
}

export default function ListaTemas({
  temas,
  conCategoria = true,
  pagina = 1,
  totalPaginas = 1,
  hrefPagina,
  vacio,
}: {
  temas: TemaFila[];
  conCategoria?: boolean;
  pagina?: number;
  totalPaginas?: number;
  hrefPagina?: (n: number) => string;
  vacio: React.ReactNode;
}) {
  if (temas.length === 0) return <>{vacio}</>;
  const ahora = new Date();
  return (
    <>
      <ul className="fo-filas">
        {temas.map(t => <FilaTema key={t.id} tema={t} conCategoria={conCategoria} ahora={ahora} />)}
      </ul>
      {totalPaginas > 1 && hrefPagina && (
        <nav className="fo-paginas" aria-label="Páginas">
          {pagina > 1
            ? <Link href={hrefPagina(pagina - 1)} className="fo-enlace"><ArrowLeft size={14} /> Más recientes</Link>
            : <span />}
          <span>Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas
            ? <Link href={hrefPagina(pagina + 1)} className="fo-enlace">Anteriores <ArrowRight size={14} /></Link>
            : <span />}
        </nav>
      )}
    </>
  );
}
