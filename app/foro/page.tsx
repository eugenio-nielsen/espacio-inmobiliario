import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search } from "lucide-react";
import Guilloche from "@/components/ui/Guilloche";
import ListaTemas from "@/components/foro/ListaTemas";
import { IndiceCategorias, ReglasCortas } from "@/components/foro/Lateral";
import { conteoCategorias, estadisticas, listarTemas, POR_PAGINA } from "@/lib/foro/data";
import { esOrden, ORDENES, type Orden } from "@/lib/foro/types";
import { plural } from "@/lib/foro/texto";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  title: "Tertulia Inmobiliaria · El foro para comprar, vender y resolver dudas",
  description:
    "Preguntá, compartí lo que sabés y resolvé dudas sobre comprar, vender, escriturar, créditos hipotecarios, expensas y reformas. El foro de Espacio Inmobiliario.",
  alternates: { canonical: `${SITE}/foro` },
  openGraph: {
    title: "Tertulia Inmobiliaria · Espacio Inmobiliario",
    description: "El foro para comprar, vender y resolver dudas inmobiliarias.",
    type: "website",
  },
};

type Props = { searchParams: Promise<{ orden?: string; q?: string; pagina?: string }> };

/** Las cifras aparecen recién cuando dicen algo: "3 temas" espanta más de lo que invita. */
const CIFRAS_DESDE = 25;

export default async function ForoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orden: Orden = esOrden(sp.orden) ? sp.orden : "actividad";
  const q = (sp.q || "").trim().slice(0, 120);
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  const [{ temas, total }, conteo, cifras] = await Promise.all([
    listarTemas({ orden, q, pagina }),
    conteoCategorias(),
    estadisticas(),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const href = (o: Orden, p = 1) => {
    const params = new URLSearchParams();
    if (o !== "actividad") params.set("orden", o);
    if (q) params.set("q", q);
    if (p > 1) params.set("pagina", String(p));
    const s = params.toString();
    return s ? `/foro?${s}` : "/foro";
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tertulia Inmobiliaria",
    url: `${SITE}/foro`,
    description: "El foro de Espacio Inmobiliario para resolver dudas sobre comprar y vender propiedades.",
    isPartOf: { "@type": "WebSite", name: "Espacio Inmobiliario", url: SITE },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="fo-cab">
        <Guilloche id="gq-foro" className="fo-cab-gq" />
        <div className="fo-in fo-cab-in">
          <p className="fo-k">El foro de Espacio Inmobiliario</p>
          <h1 className="fo-cab-t">Tertulia <em>Inmobiliaria</em></h1>
          <p className="fo-cab-lead">
            Preguntá, compartí lo que sabés y resolvé dudas sobre comprar, vender y todo lo que
            pasa en el medio. Con gente que ya pasó por lo mismo.
          </p>
          <div className="fo-cab-acciones">
            <Link href="/foro/nuevo" className="fo-btn">
              Abrir un tema <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
            <form action="/foro" className="fo-buscar" role="search">
              <Search size={17} strokeWidth={1.7} />
              <input type="search" name="q" defaultValue={q} placeholder="Buscar en la Tertulia" aria-label="Buscar en la Tertulia" />
            </form>
          </div>
          {cifras.temas >= CIFRAS_DESDE && (
            <ul className="fo-cifras">
              <li><strong>{cifras.temas.toLocaleString("es-AR")}</strong>temas</li>
              <li><strong>{cifras.respuestas.toLocaleString("es-AR")}</strong>respuestas</li>
              <li><strong>{cifras.miembros.toLocaleString("es-AR")}</strong>miembros</li>
            </ul>
          )}
        </div>
      </header>

      <div className="fo-in fo-grilla">
        <section aria-label="Temas">
          {q ? (
            <p className="fo-resultado" style={{ margin: "0 0 18px" }}>
              {total ? plural(total, "tema encontrado", "temas encontrados") : "Ningún tema"} para <strong>«{q}»</strong>
              <Link href="/foro" className="fo-enlace">Ver todos</Link>
            </p>
          ) : null}

          <nav className="fo-orden" aria-label="Ordenar los temas">
            {ORDENES.map(o => (
              <Link key={o.valor} href={href(o.valor)} aria-current={orden === o.valor ? "page" : undefined} scroll={false}>
                {o.label}
              </Link>
            ))}
          </nav>

          <ListaTemas
            temas={temas}
            pagina={pagina}
            totalPaginas={totalPaginas}
            hrefPagina={p => href(orden, p)}
            vacio={
              <div className="fo-vacio">
                {q ? (
                  <>
                    <h2>No encontramos <em>ese tema</em></h2>
                    <p>Probá con otras palabras, o abrí el tema vos: si te lo preguntás, seguro que a alguien más le sirve.</p>
                  </>
                ) : orden === "actividad" ? (
                  <>
                    <h2>La Tertulia <em>abre sus puertas</em></h2>
                    <p>Todavía no hay temas. Contá tu caso o tu duda y empezá la primera conversación.</p>
                  </>
                ) : (
                  <>
                    <h2>Nada por <em>acá</em>, todavía</h2>
                    <p>No hay temas en esta vista. Mirá la actividad reciente o abrí uno nuevo.</p>
                  </>
                )}
                <Link href="/foro/nuevo" className="fo-btn">Abrir un tema <ArrowRight size={15} strokeWidth={1.8} /></Link>
              </div>
            }
          />
        </section>

        <aside className="fo-lateral">
          <IndiceCategorias conteo={conteo} />
          <ReglasCortas />
        </aside>
      </div>
    </>
  );
}
