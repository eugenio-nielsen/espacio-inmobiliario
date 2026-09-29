import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormTema from "@/components/foro/FormTema";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/user";
import { miembroPrivado } from "@/lib/foro/data";
import { CATEGORIAS, esCategoria } from "@/lib/foro/categorias";
import { aliasPorDefecto } from "@/lib/foro/texto";

export const metadata: Metadata = {
  title: "Abrir un tema · Tertulia Inmobiliaria",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ categoria?: string }> };

export default async function NuevoTemaPage({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const cat = esCategoria(categoria) ? categoria : undefined;

  const user = await getCurrentUser();
  if (!user) {
    const volver = `/foro/nuevo${cat ? `?categoria=${cat}` : ""}`;
    redirect(`/foro/unirse?volver=${encodeURIComponent(volver)}`);
  }
  const [perfil, miembro] = [await getCurrentProfile(), await miembroPrivado(user.id)];

  if (miembro?.suspendido) {
    return (
      <div className="fo-in fo-angosto" style={{ padding: "64px 24px" }}>
        <p className="fo-error">Tu participación en la Tertulia está suspendida. Si creés que es un error, escribinos.</p>
      </div>
    );
  }

  const alias = miembro?.alias ?? aliasPorDefecto(perfil?.nombre, user.email);

  return (
    <div className="fo-in fo-dos">
      <div className="fo-papel">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Tertulia Inmobiliaria</Link>
          <span aria-hidden="true">›</span>
          <span>Abrir un tema</span>
        </nav>
        <h1 className="fo-papel-t">Abrí un <em>tema</em></h1>
        <p className="fo-papel-sub">
          Publicás como <strong>{alias}</strong> · <Link href="/foro/perfil" className="fo-enlace">cambiar cómo te ven</Link>
        </p>
        <div className="fo-doble" />
        <FormTema
          categorias={CATEGORIAS.map(({ slug, nombre, descripcion }) => ({ slug, nombre, descripcion }))}
          categoriaInicial={cat}
        />
      </div>

      <aside className="fo-consejos">
        <p className="fo-rotulo">Para recibir buenas respuestas</p>
        <ol>
          <li><strong>Una pregunta por tema</strong>Si tenés dos dudas distintas, abrí dos temas: cada una va a encontrar a quien sabe.</li>
          <li><strong>Contexto concreto</strong>Barrio o partido, tipo de propiedad, precio aproximado y en qué etapa estás (buscando, con reserva, por escriturar).</li>
          <li><strong>Lo que ya sabés</strong>Contá qué averiguaste o qué te dijeron: evita respuestas que ya tenés.</li>
          <li><strong>Sin datos personales</strong>Ni DNI, ni teléfonos, ni direcciones exactas. Tampoco nombres de terceros.</li>
        </ol>
        <p className="fo-lateral-pie"><Link href="/foro/normas" className="fo-enlace">Normas de la Tertulia</Link></p>
      </aside>
    </div>
  );
}
