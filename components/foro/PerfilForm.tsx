"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/foro/Autor";
import { actualizarMiembro, pedirVerificacionProfesional } from "@/lib/actions/foro";
import { compressImage } from "@/lib/utils/compressImage";
import { ROLES, type MiembroPrivado } from "@/lib/foro/types";

/**
 * Cómo te ven en la Tertulia: nombre visible, qué te trae, una
 * presentación corta y la foto. Más los avisos por email y, para
 * profesionales, el pedido del distintivo de verificado.
 */
export default function PerfilForm({ miembro }: { miembro: MiembroPrivado }) {
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [alias, setAlias] = useState(miembro.alias);
  const [rol, setRol] = useState(miembro.rol ?? "");
  const [foto, setFoto] = useState<{ file: File; url: string } | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<React.ReactNode>(null);
  const [enviando, startTransition] = useTransition();

  const [matricula, setMatricula] = useState(miembro.matricula ?? "");
  const [pedido, setPedido] = useState<string | null>(null);
  const [pidiendo, startPedido] = useTransition();

  const vista = { ...miembro, alias: alias || miembro.alias, avatar_url: foto?.url ?? (quitar ? null : miembro.avatar_url) };

  async function elegirFoto(files: FileList | null) {
    const f = files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const comprimida = await compressImage(f);
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto({ file: comprimida, url: URL.createObjectURL(comprimida) });
    setQuitar(false);
  }

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("avatar");
    if (foto) fd.append("avatar", foto.file);
    if (quitar) fd.set("quitar_avatar", "1");
    startTransition(async () => {
      const r = await actualizarMiembro(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOk(<>Perfil guardado. <Link href={`/foro/miembros/${r.handle}`} className="fo-enlace">Ver cómo te ven</Link></>);
      router.refresh();
    });
  }

  function pedirVerificacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startPedido(async () => {
      const r = await pedirVerificacionProfesional(fd);
      setPedido(r.ok ? "Recibimos tu pedido. Te avisamos por email cuando lo revisemos." : r.error);
      if (r.ok) router.refresh();
    });
  }

  return (
    <>
      <form className="fo-form" onSubmit={guardar}>
        <div className="fo-avatar-edit">
          <Avatar miembro={vista} tam={72} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
            <button type="button" className="fo-accion" onClick={() => archivo.current?.click()}>
              {vista.avatar_url ? "Cambiar la foto" : "Subir una foto"}
            </button>
            {vista.avatar_url && (
              <button type="button" className="fo-accion fo-accion-peligro" onClick={() => { setFoto(null); setQuitar(true); }}>
                Quitar la foto
              </button>
            )}
            <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => elegirFoto(e.target.files)} />
          </div>
        </div>

        <label className="fo-campo">
          <span>Nombre visible</span>
          <input type="text" name="alias" value={alias} onChange={e => setAlias(e.target.value)} required minLength={2} maxLength={40} />
          <small>Es lo único que ve el resto. Puede ser tu nombre, tus iniciales o un alias.</small>
        </label>

        <fieldset className="fo-campo">
          <legend>¿Qué te trae a la Tertulia?</legend>
          <div className="fo-fichas" role="radiogroup">
            {ROLES.map(r => (
              <label key={r.valor} className="fo-ficha">
                <input type="radio" name="rol" value={r.valor} checked={rol === r.valor} onChange={() => setRol(r.valor)} />
                <span>{r.opcion}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="fo-campo">
          <span>Presentación (opcional)</span>
          <textarea name="bio" defaultValue={miembro.bio ?? ""} maxLength={280} placeholder="Una o dos líneas: qué hacés, qué buscás, desde dónde escribís." />
        </label>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-700)", cursor: "pointer" }}>
          <input type="checkbox" name="avisos_email" defaultChecked={miembro.avisos_email} style={{ marginTop: 3, accentColor: "var(--navy-800)" }} />
          <span>
            Avisarme por email cuando respondan mis temas, comenten mis respuestas o elijan una como solución.
          </span>
        </label>

        {error && <p className="fo-error" role="alert">{error}</p>}
        {ok && <p className="fo-ok" role="status">{ok}</p>}

        <div className="fo-form-pie">
          <button type="submit" className="fo-btn" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar mi perfil"}
            {!enviando && <ArrowRight size={15} strokeWidth={1.8} />}
          </button>
        </div>
      </form>

      {/* Distintivo de profesional verificado */}
      {(rol === "profesional" || miembro.verificado) && (
        <section style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid var(--gold-200)" }}>
          <p className="fo-rotulo">Profesional verificado</p>
          {miembro.verificado ? (
            <p className="fo-ok"><BadgeCheck size={16} style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--gold-700)" }} />
              Tu matrícula está verificada: tus publicaciones muestran el distintivo.</p>
          ) : miembro.verificacion_estado === "pendiente" ? (
            <p className="fo-ok">Tu pedido está en revisión ({miembro.matricula}). Te avisamos por email.</p>
          ) : (
            <form className="fo-form" onSubmit={pedirVerificacion} style={{ gap: 16 }}>
              <p className="fo-papel-sub">
                Si sos corredor/a o martillero/a matriculado/a, pedí el distintivo. Lo revisamos a mano
                contra el padrón del colegio antes de otorgarlo.
                {miembro.verificacion_estado === "rechazada" && " El pedido anterior no pudo verificarse: revisá los datos y volvé a enviarlo."}
              </p>
              <label className="fo-campo">
                <span>Matrícula y colegio</span>
                <input type="text" name="matricula" value={matricula} onChange={e => setMatricula(e.target.value)} required minLength={4} maxLength={120} placeholder="Ej.: CUCICBA N.º 1234" />
              </label>
              {pedido && <p className="fo-ok" role="status">{pedido}</p>}
              <div className="fo-form-pie">
                <button type="submit" className="fo-btn fo-btn-claro fo-btn-chico" disabled={pidiendo}>
                  {pidiendo ? "Enviando…" : "Pedir la verificación"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
