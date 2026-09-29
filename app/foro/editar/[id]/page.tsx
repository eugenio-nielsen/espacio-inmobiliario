import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import FormTema from "@/components/foro/FormTema";
import { getCurrentUser } from "@/lib/auth/user";
import { obtenerTemaParaEditar } from "@/lib/foro/data";
import { CATEGORIAS } from "@/lib/foro/categorias";
import { urlTema } from "@/lib/foro/texto";

export const metadata: Metadata = {
  title: "Editar el tema · Tertulia Inmobiliaria",
  robots: { index: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function EditarTemaPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?volver=${encodeURIComponent(`/foro/editar/${id}`)}`);

  const tema = await obtenerTemaParaEditar(id);
  if (!tema || tema.estado === "oculto") notFound();
  if (tema.autor_id !== user.id) redirect(urlTema(tema));

  return (
    <div className="fo-in fo-dos">
      <div className="fo-papel">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Tertulia Inmobiliaria</Link>
          <span aria-hidden="true">›</span>
          <Link href={urlTema(tema)}>El tema</Link>
          <span aria-hidden="true">›</span>
          <span>Editar</span>
        </nav>
        <h1 className="fo-papel-t">Editá tu <em>tema</em></h1>
        <p className="fo-papel-sub">Los cambios se marcan como edición, para que quien ya respondió sepa que el planteo cambió.</p>
        <div className="fo-doble" />
        <FormTema
          categorias={CATEGORIAS.map(({ slug, nombre, descripcion }) => ({ slug, nombre, descripcion }))}
          inicial={{ id: tema.id, categoria: tema.categoria, titulo: tema.titulo, cuerpo: tema.cuerpo, fotos: tema.fotos ?? [] }}
        />
      </div>
      <aside className="fo-consejos">
        <p className="fo-rotulo">Al editar</p>
        <ol>
          <li><strong>Sumá, no borres</strong>Si ya te respondieron, agregá la novedad al final («Actualización: …») en vez de reescribir el planteo.</li>
          <li><strong>Categoría</strong>Si el tema quedó mal ubicado, cambiala: la dirección vieja sigue llevando al tema.</li>
        </ol>
      </aside>
    </div>
  );
}
