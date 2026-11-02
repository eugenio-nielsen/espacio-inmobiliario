import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import PortadaNota from "@/components/blog/PortadaNota";
import { getPublishedPosts } from "@/lib/blog/data";
import { readingTime } from "@/lib/blog/markdown";
import "./bloques.css";

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "";

/** Las tres notas más recientes del blog. Si no hay ninguna, el bloque no se muestra. */
export default async function UltimasNotas() {
  const notas = (await getPublishedPosts()).slice(0, 3);
  if (!notas.length) return null;

  return (
    <section className="hb-notas" aria-labelledby="hb-notas-t">
      <div className="hb-in">
        <FadeIn direction="up">
          <div className="hb-cab">
            <div>
              <div className="es-eyebrow" style={{ marginBottom: 8 }}>Blog</div>
              <h2 id="hb-notas-t" className="section-heading">Últimas notas</h2>
            </div>
            <Link href="/blog" className="hb-ver">
              Ver el blog <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>
        </FadeIn>

        <ul className="hb-notas-grid">
          {notas.map((p, i) => (
            <li key={p.id}>
              <FadeIn delay={i * 80} direction="up" className="hb-nota-wrap">
                <Link href={`/blog/${p.slug}`} className="hb-nota">
                  <span className="hb-nota-portada"><PortadaNota post={p} tamano="card" /></span>
                  <span className="hb-nota-cuerpo">
                    {p.categoria && <span className="hb-nota-sec">{p.categoria}</span>}
                    <span className="hb-nota-t">{p.titulo}</span>
                    {p.resumen && <span className="hb-nota-res">{p.resumen}</span>}
                    <span className="hb-nota-meta">
                      {fecha(p.published_at)} · {readingTime(p.contenido)} min de lectura
                    </span>
                  </span>
                </Link>
              </FadeIn>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
