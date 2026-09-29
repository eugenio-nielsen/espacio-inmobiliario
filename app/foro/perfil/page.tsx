import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PerfilForm from "@/components/foro/PerfilForm";
import { getCurrentUser } from "@/lib/auth/user";
import { asegurarMiembro } from "@/lib/foro/servidor";

export const metadata: Metadata = {
  title: "Mi perfil · Tertulia Inmobiliaria",
  robots: { index: false },
};

/** Cómo te ven en la Tertulia. Si la cuenta nunca entró al foro, el perfil se crea acá. */
export default async function PerfilForoPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/foro/unirse?volver=${encodeURIComponent("/foro/perfil")}`);

  const miembro = await asegurarMiembro(user);
  if (!miembro) {
    return (
      <div className="fo-in fo-angosto" style={{ padding: "64px 24px" }}>
        <p className="fo-error">No pudimos cargar tu perfil de la Tertulia. Probá de nuevo en un momento.</p>
      </div>
    );
  }

  return (
    <div className="fo-in fo-dos">
      <div className="fo-papel">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Tertulia Inmobiliaria</Link>
          <span aria-hidden="true">›</span>
          <span>Mi perfil</span>
        </nav>
        <h1 className="fo-papel-t">Cómo te ven <em>en la Tertulia</em></h1>
        <p className="fo-papel-sub">
          Tu email y tu teléfono nunca se muestran. <Link href={`/foro/miembros/${miembro.handle}`} className="fo-enlace">Ver mi perfil público</Link>
        </p>
        <div className="fo-doble" />
        <PerfilForm miembro={miembro} />
      </div>
      <aside className="fo-consejos">
        <p className="fo-rotulo">Tu cuenta</p>
        <ol>
          <li><strong>Una sola cuenta</strong>Es la misma de Espacio Inmobiliario: con ella también publicás propiedades y ves tus consultas.</li>
          <li><strong>Tus datos</strong>El nombre de tu cuenta y tu teléfono se cambian en <Link href="/panel/perfil" className="fo-enlace">Mis datos</Link>.</li>
        </ol>
      </aside>
    </div>
  );
}
