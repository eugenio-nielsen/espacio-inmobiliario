"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { bajaDeMiFicha, crearProfesionalCurado, postularProfesional } from "@/lib/actions/catedra";
import { RUBROS, ZONAS_SUGERIDAS, type ProfesionalAdmin } from "@/lib/catedra/rubros";

const ESTADO: Record<ProfesionalAdmin["estado"], string> = {
  postulado: "En revisión: te avisamos cuando esté publicada.",
  aprobado: "Publicada en la red.",
  rechazado: "No pudimos aprobarla. Revisá los datos y volvé a enviarla.",
  oculto: "Pausada por el equipo. Escribinos si querés reactivarla.",
};

/**
 * La ficha de un profesional. Dos usos:
 *   · "postulacion": el propio profesional se postula (o actualiza su
 *     ficha, que vuelve a revisión) y puede darse de baja.
 *   · "curado": el superadmin carga a alguien que conoce.
 * En los dos, el consentimiento es obligatorio: son datos de contacto
 * de una persona.
 */
export default function FormFicha({
  modo,
  ficha,
  alTerminar,
}: {
  modo: "postulacion" | "curado";
  ficha?: ProfesionalAdmin | null;
  alTerminar?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const r = modo === "curado" ? await crearProfesionalCurado(fd) : await postularProfesional(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (modo === "curado") {
        form.reset();
        setOk("Profesional agregado y publicado.");
        alTerminar?.();
      } else {
        setOk("Recibimos tu ficha. La revisamos y te avisamos cuando esté publicada.");
      }
      router.refresh();
    });
  }

  function baja() {
    if (!window.confirm("¿Dar de baja tu ficha de la red? Se borra y deja de verse.")) return;
    startTransition(async () => {
      const r = await bajaDeMiFicha();
      if (!r.ok) setError(r.error);
      else {
        setOk("Tu ficha se dio de baja.");
        router.refresh();
      }
    });
  }

  return (
    <form className="cat-form" onSubmit={enviar}>
      {modo === "postulacion" && ficha && (
        <p className="cat-ok"><strong>Tu ficha:</strong> {ESTADO[ficha.estado]}</p>
      )}

      <label className="cat-campo">
        <span>Nombre o estudio</span>
        <input type="text" name="nombre" required minLength={2} maxLength={80} defaultValue={ficha?.nombre} placeholder="Ej.: Escribanía Pérez" />
      </label>

      <div className="cat-dos">
        <label className="cat-campo">
          <span>Rubro</span>
          <select name="rubro" required defaultValue={ficha?.rubro ?? ""}>
            <option value="" disabled>Elegí uno</option>
            {RUBROS.map(r => <option key={r.valor} value={r.valor}>{r.nombre}</option>)}
          </select>
        </label>
        <label className="cat-campo">
          <span>Zona</span>
          <input type="text" name="zona" required minLength={2} maxLength={80} list="cat-zonas" defaultValue={ficha?.zona} placeholder="Ej.: CABA" />
          <datalist id="cat-zonas">{ZONAS_SUGERIDAS.map(z => <option key={z} value={z} />)}</datalist>
        </label>
      </div>

      <label className="cat-campo">
        <span>Matrícula (si corresponde)</span>
        <input type="text" name="matricula" maxLength={120} defaultValue={ficha?.matricula ?? ""} placeholder="Ej.: Registro N.º 1234 · CUCICBA N.º 5678" />
      </label>

      <div className="cat-dos">
        <label className="cat-campo">
          <span>WhatsApp o teléfono</span>
          <input type="tel" name="telefono" maxLength={40} defaultValue={ficha?.telefono ?? ""} placeholder="+54 9 11 1234-5678" />
        </label>
        <label className="cat-campo">
          <span>Email</span>
          <input type="email" name="email" maxLength={120} defaultValue={ficha?.email ?? ""} placeholder="contacto@estudio.com" />
        </label>
      </div>

      <label className="cat-campo">
        <span>Web o red profesional (opcional)</span>
        <input type="text" name="web" maxLength={200} defaultValue={ficha?.web ?? ""} placeholder="estudio.com.ar" />
      </label>

      <label className="cat-campo">
        <span>En qué te especializás (opcional)</span>
        <textarea name="descripcion" maxLength={400} defaultValue={ficha?.descripcion ?? ""} placeholder="Dos o tres líneas: tipo de trabajos, zona, idiomas, tiempos de respuesta." />
      </label>

      {modo === "curado" && (
        <label className="cat-check">
          <input type="checkbox" name="recomendado" />
          Marcar como «Recomendado por Espacio»
        </label>
      )}

      <label className="cat-check">
        <input type="checkbox" name="consentimiento" required />
        {modo === "curado"
          ? "El profesional me autorizó a publicar estos datos en la red de la Cátedra."
          : "Autorizo a Espacio Inmobiliario a publicar estos datos en la red de profesionales de la Cátedra, visibles para usuarios registrados. Puedo darme de baja cuando quiera."}
      </label>

      {error && <p className="cat-error" role="alert">{error}</p>}
      {ok && <p className="cat-ok" role="status">{ok}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 24px" }}>
        <button type="submit" className="cat-btn" disabled={enviando}>
          {enviando ? "Enviando…" : modo === "curado" ? "Agregar a la red" : ficha ? "Actualizar mi ficha" : "Enviar mi ficha"}
          {!enviando && <ArrowRight size={15} strokeWidth={1.8} />}
        </button>
        {modo === "postulacion" && ficha && (
          <button type="button" className="cat-enlace" onClick={baja} disabled={enviando} style={{ fontSize: 13, color: "var(--danger)" }}>
            Dar de baja mi ficha
          </button>
        )}
      </div>
    </form>
  );
}
