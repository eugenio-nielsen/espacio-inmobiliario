"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Turnstile from "@/components/foro/Turnstile";
import { unirseALaTertulia } from "@/lib/actions/foro";
import { ROLES } from "@/lib/foro/types";

/**
 * Alta en la Tertulia: nombre, email, contraseña y qué te trae. Crea la
 * misma cuenta que usa todo el sitio (si después quiere publicar una
 * propiedad, ya la tiene). No pide teléfono.
 */
export default function UnirseForm({ volver }: { volver: string }) {
  const [error, setError] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);
  const [reinicio, setReinicio] = useState(0);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await unirseALaTertulia(fd);
      // Si salió bien, la acción redirige y esto no llega a ejecutarse
      if (r && !r.ok) {
        setError(r.error);
        setReinicio(n => n + 1);
      }
    });
  }

  return (
    <form className="fo-form" onSubmit={enviar} style={{ gap: 20 }}>
      <input type="hidden" name="volver" value={volver} />

      <label className="fo-campo">
        <span>Nombre y apellido</span>
        <input type="text" name="nombre" required minLength={2} maxLength={80} autoComplete="name" placeholder="Ej.: Juana Pérez" />
        <small>En la Tertulia se muestra abreviado (Juana P.). Lo podés cambiar cuando quieras.</small>
      </label>

      <label className="fo-campo">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" placeholder="tu@email.com" />
      </label>

      <label className="fo-campo">
        <span>Contraseña</span>
        <span style={{ position: "relative", display: "block" }}>
          <input
            type={verClave ? "text" : "password"}
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            style={{ paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => setVerClave(v => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={{ position: "absolute", right: 0, bottom: 8, width: 28, height: 28, display: "grid", placeItems: "center", background: "none", border: 0, cursor: "pointer", color: "var(--ink-500)" }}
          >
            {verClave ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
          </button>
        </span>
      </label>

      <fieldset className="fo-campo">
        <legend>¿Qué te trae a la Tertulia?</legend>
        <div className="fo-fichas" role="radiogroup">
          {ROLES.map(r => (
            <label key={r.valor} className="fo-ficha">
              <input type="radio" name="rol" value={r.valor} required />
              <span>{r.opcion}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Turnstile reinicio={reinicio} />
      {error && <p className="fo-error" role="alert">{error}</p>}

      <button type="submit" className="fo-btn" disabled={enviando} style={{ width: "100%" }}>
        {enviando ? "Creando tu cuenta…" : "Sumarme a la Tertulia"}
        {!enviando && <ArrowRight size={15} strokeWidth={1.8} />}
      </button>

      <p className="fo-legal" style={{ textAlign: "center" }}>
        Al sumarte aceptás los <Link href="/terminos">términos</Link>, la <Link href="/privacidad">política de privacidad</Link> y
        las <Link href="/foro/normas">normas de la Tertulia</Link>.
      </p>
      <p className="fo-legal" style={{ textAlign: "center", fontSize: 13.5, paddingTop: 14, borderTop: "1px solid var(--line-100)" }}>
        ¿Ya tenés cuenta en Espacio Inmobiliario?{" "}
        <Link href={`/auth/login?volver=${encodeURIComponent(volver)}`} style={{ fontWeight: 600 }}>Ingresá</Link>
      </p>
    </form>
  );
}
