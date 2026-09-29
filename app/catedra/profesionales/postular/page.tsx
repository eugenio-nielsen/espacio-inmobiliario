import Link from "next/link";
import type { Metadata } from "next";
import Muro from "@/components/catedra/Muro";
import FormFicha from "@/components/catedra/FormFicha";
import { getCurrentUser } from "@/lib/auth/user";
import { fichaDelUsuario } from "@/lib/catedra/data";

export const metadata: Metadata = {
  title: "Sumate a la red de profesionales · Cátedra Inmobiliaria",
  robots: { index: false },
};

export default async function PostularPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Muro
        volver="/catedra/profesionales/postular"
        titulo={<>Sumate a la red <em>de profesionales</em></>}
        texto="Para cargar tu ficha necesitás una cuenta: así podés actualizarla o darte de baja cuando quieras."
      />
    );
  }
  const ficha = await fichaDelUsuario(user.id);

  return (
    <div className="cat-in cat-dos-col">
      <div className="cat-papel">
        <nav className="cat-migas" aria-label="Estás en">
          <Link href="/catedra">Cátedra Inmobiliaria</Link>
          <span aria-hidden="true">›</span>
          <Link href="/catedra/profesionales">Profesionales</Link>
          <span aria-hidden="true">›</span>
          <span>{ficha ? "Mi ficha" : "Sumarme"}</span>
        </nav>
        <h1 className="cat-papel-t">{ficha ? <>Tu ficha <em>en la red</em></> : <>Sumate a la <em>red</em></>}</h1>
        <p className="cat-papel-sub">
          Tu ficha la ven solo usuarios registrados del sitio. La revisamos antes de publicarla, y cada
          cambio vuelve a revisión.
        </p>
        <div className="cat-doble" />
        <FormFicha modo="postulacion" ficha={ficha} />
      </div>
      <aside className="cat-lado">
        <p className="cat-rotulo">Cómo funciona</p>
        <ol>
          <li><strong>Revisión</strong>Chequeamos los datos y, si corresponde, la matrícula en el padrón del colegio.</li>
          <li><strong>Sin reseñas</strong>La red no tiene puntajes ni comentarios: es una lista curada, no un ranking.</li>
          <li><strong>Tus datos, tu decisión</strong>Podés actualizar la ficha o darte de baja desde esta misma página.</li>
        </ol>
      </aside>
    </div>
  );
}
