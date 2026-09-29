import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import Guilloche from "@/components/ui/Guilloche";
import ListaTemas from "@/components/foro/ListaTemas";
import { HerramientaSugerida, IndiceCategorias, ReglasCortas } from "@/components/foro/Lateral";
import { conteoCategorias, listarTemas, POR_PAGINA } from "@/lib/foro/data";
import { categoriaPorSlug } from "@/lib/foro/categorias";
import { esOrden, ORDENES, type Orden } from "@/lib/foro/types";
import { plural } from "@/lib/foro/texto";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ orden?: string; q?: string; pagina?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const cat = categoriaPorSlug(categoria);
  if (!cat) return { title: "Categoría no encontrada" };
  return {
    title: `${cat.nombre} · Tertulia Inmobiliaria`,
    description: `${cat.descripcion} Preguntas y respuestas sobre ${cat.nombre.toLowerCase()} en la Tertulia Inmobiliaria.`,
    alternates: { canonical: `${SITE}/foro/${cat.slug}` },
  };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const cat = categoriaPorSlug(categoria);
  if (!cat) notFound();

  const sp = await searchParams;
  const orden: Orden = esOrden(sp.orden) ? sp.orden : "actividad";
  const q = (sp.q || "").trim().slice(0, 120);
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  const [{ temas, total }, conteo] = await Promise.all([
    listarTemas({ categoria: cat.slug, orden, q, pagina }),
    conteoCategorias(),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const href = (o: Orden, p = 1) => {
    const params = new URLSearchParams();
    if (o !== "actividad") params.set("orden", o);
    if (q) params.set("q", q);
    if (p > 1) params.set("pagina", String(p));
    const s = params.toString();
    return `/foro/${cat.slug}${s ? `?${s}` : ""}`;
  };

  const Icon = cat.icon;

  return (
    <>
      <header className="fo-cab fo-cab-cat">
        <Guilloche id="gq-foro-cat" className="fo-cab-gq" />
        <div className="fo-in fo-cab-in">
          <nav className="fo-migas" aria-label="Estás en">
            <Link href="/foro">Tertulia Inmobiliaria</Link>
            <span aria-hidden="true">›</span>
            <span>{cat.nombre}</span>
          </nav>
          <h1 className="fo-cab-t" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Icon size={34} strokeWidth={1.2} color="var(--gold-600)" aria-hidden="true" />
            {cat.nombre}
          </h1>
          <p className="fo-cab-lead">{cat.descripcion}</p>
          <div className="fo-cab-acciones">
            <Link href={`/foro/nuevo?categoria=${cat.slug}`} className="fo-btn">
              Abrir un tema en {cat.nombre} <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
            <form action={`/foro/${cat.slug}`} className="fo-buscar" role="search">
              <Search size={17} strokeWidth={1.7} />
              <input type="search" name="q" defaultValue={q} placeholder={`Buscar en ${cat.nombre}`} aria-label={`Buscar en ${cat.nombre}`} />
            </form>
          </div>
        </div>
      </header>

      <div className="fo-in fo-grilla">
        <section aria-label={`Temas de ${cat.nombre}`}>
          {q && (
            <p className="fo-resultado" style={{ margin: "0 0 18px" }}>
              {total ? plural(total, "tema encontrado", "temas encontrados") : "Ningún tema"} para <strong>«{q}»</strong>
              <Link href={`/foro/${cat.slug}`} className="fo-enlace">Ver todos</Link>
            </p>
          )}
          <nav className="fo-orden" aria-label="Ordenar los temas">
            {ORDENES.map(o => (
              <Link key={o.valor} href={href(o.valor)} aria-current={orden === o.valor ? "page" : undefined} scroll={false}>
                {o.label}
              </Link>
            ))}
          </nav>

          <ListaTemas
            temas={temas}
            conCategoria={false}
            pagina={pagina}
            totalPaginas={totalPaginas}
            hrefPagina={p => href(orden, p)}
            vacio={
              <div className="fo-vacio">
                <h2>Todavía no hay temas <em>en {cat.nombre}</em></h2>
                <p>Si tenés una duda sobre {cat.nombre.toLowerCase()}, abrí el primero: otros van a llegar con la misma pregunta.</p>
                <Link href={`/foro/nuevo?categoria=${cat.slug}`} className="fo-btn">Abrir un tema <ArrowRight size={15} strokeWidth={1.8} /></Link>
              </div>
            }
          />
        </section>

        <aside className="fo-lateral">
          {cat.herramienta && <HerramientaSugerida herramienta={cat.herramienta} />}
          <IndiceCategorias conteo={conteo} actual={cat.slug} />
          <ReglasCortas />
        </aside>
      </div>
    </>
  );
}
