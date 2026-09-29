import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { iniciales } from "@/lib/foro/texto";
import { etiquetaRol, type Miembro } from "@/lib/foro/types";

type MiembroMin = Pick<Miembro, "alias" | "handle" | "avatar_url" | "equipo"> & Partial<Pick<Miembro, "rol" | "verificado">>;

/**
 * Avatar del miembro: la foto si la subió; si no, sus iniciales en oro
 * sobre navy, como el monograma del sello. Sirve en servidor y cliente.
 */
export function Avatar({ miembro, tam = 36 }: { miembro: MiembroMin; tam?: number }) {
  return (
    <span
      className={`fo-av${miembro.equipo ? " fo-av-equipo" : ""}`}
      style={{ ["--s" as string]: `${tam}px` }}
      aria-hidden="true"
    >
      {miembro.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={miembro.avatar_url} alt="" loading="lazy" />
        : iniciales(miembro.alias)}
    </span>
  );
}

/** Los distintivos junto al nombre: equipo, profesional verificado, rol. */
export function Distintivos({ miembro }: { miembro: MiembroMin }) {
  if (miembro.equipo) return <span className="fo-equipo">Espacio Inmobiliario</span>;
  const rol = etiquetaRol(miembro.rol ?? null);
  return (
    <>
      {miembro.verificado && (
        <span className="fo-verif" title="Matrícula verificada por Espacio Inmobiliario">
          <BadgeCheck size={13} strokeWidth={1.8} /> Profesional verificado
        </span>
      )}
      {rol && !(miembro.verificado && miembro.rol === "profesional") && <span className="fo-rol">{rol}</span>}
    </>
  );
}

/** Firma de un tema o respuesta: avatar, nombre, distintivos y cuándo. */
export default function Autor({
  miembro,
  cuando,
  tam = 36,
}: {
  miembro: MiembroMin;
  cuando?: string;
  tam?: number;
}) {
  return (
    <div className="fo-autor">
      <Avatar miembro={miembro} tam={tam} />
      <div className="fo-autor-txt">
        <Link href={`/foro/miembros/${miembro.handle}`} className="fo-autor-nombre">{miembro.alias}</Link>
        <Distintivos miembro={miembro} />
        {cuando && <span className="fo-punto"> {cuando}</span>}
      </div>
    </div>
  );
}
