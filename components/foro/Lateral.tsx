import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIAS, type Herramienta } from "@/lib/foro/categorias";

/** Índice de categorías con cuántos temas tiene cada una. */
export function IndiceCategorias({ conteo, actual }: { conteo: Map<string, number>; actual?: string }) {
  return (
    <section className="fo-lateral-bloque" aria-labelledby="fo-cats-t">
      <h2 className="fo-rotulo" id="fo-cats-t">Categorías</h2>
      <ul className="fo-cats">
        {CATEGORIAS.map(({ slug, nombre, icon: Icon }) => (
          <li key={slug}>
            <Link href={`/foro/${slug}`} aria-current={actual === slug ? "page" : undefined}>
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>{nombre}</span>
              <small>{conteo.get(slug) ?? 0}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Las normas en tres renglones; el detalle está en /foro/normas. */
export function ReglasCortas() {
  return (
    <section className="fo-lateral-bloque" aria-labelledby="fo-reglas-t">
      <h2 className="fo-rotulo" id="fo-reglas-t">Cómo conversamos</h2>
      <ol className="fo-reglas">
        <li>Contá tu caso con detalle: barrio, tipo de propiedad y en qué etapa estás.</li>
        <li>Respondé desde lo que sabés o viviste, y decí de dónde sale un dato.</li>
        <li>Sin publicidad, sin datos personales de terceros y con respeto siempre.</li>
      </ol>
      <p className="fo-lateral-pie"><Link href="/foro/normas" className="fo-enlace">Leer las normas completas</Link></p>
    </section>
  );
}

/** La herramienta del sitio que sirve para el tema de la categoría. */
export function HerramientaSugerida({ herramienta }: { herramienta: Herramienta }) {
  return (
    <Link href={herramienta.href} className="fo-herr">
      <small>Herramienta relacionada</small>
      <strong>{herramienta.label}</strong>
      <span>{herramienta.detalle}</span>
      <em>Usar la herramienta <ArrowRight size={13} strokeWidth={1.8} /></em>
    </Link>
  );
}

/** Para quien todavía no tiene cuenta: sumarse o ingresar, y volver acá. */
export function InvitarUnirse({ volver, titulo, texto }: { volver: string; titulo: React.ReactNode; texto: string }) {
  const v = encodeURIComponent(volver);
  return (
    <div className="fo-invita">
      <div>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
      <div className="fo-invita-acciones">
        <Link href={`/foro/unirse?volver=${v}`} className="fo-btn fo-btn-chico">Sumarme gratis</Link>
        <Link href={`/auth/login?volver=${v}`} className="fo-enlace">Ya tengo cuenta</Link>
      </div>
    </div>
  );
}

/** Fotos de un tema o respuesta. Cada una abre en su tamaño real. */
export function Fotos({ fotos }: { fotos: string[] }) {
  if (!fotos?.length) return null;
  return (
    <div className="fo-fotos">
      {fotos.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noopener" className="fo-foto" aria-label={`Ver la foto ${i + 1} en tamaño completo`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" loading="lazy" />
        </a>
      ))}
    </div>
  );
}
