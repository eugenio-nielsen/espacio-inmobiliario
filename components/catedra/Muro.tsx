import Link from "next/link";

/** Para quien no ingresó: crear la cuenta gratis o ingresar, y volver acá. */
export default function Muro({ volver, titulo, texto }: { volver: string; titulo: React.ReactNode; texto: string }) {
  const v = encodeURIComponent(volver);
  return (
    <div className="cat-in">
      <div className="cat-muro">
        <p className="cat-k" style={{ position: "relative" }}>Con tu cuenta gratuita</p>
        <h2>{titulo}</h2>
        <p>{texto}</p>
        <div className="cat-muro-acciones">
          <Link href={`/catedra/unirse?volver=${v}`} className="cat-btn">Crear mi cuenta</Link>
          <Link href={`/auth/login?volver=${v}`} className="cat-enlace">Ya tengo cuenta</Link>
        </div>
      </div>
    </div>
  );
}
