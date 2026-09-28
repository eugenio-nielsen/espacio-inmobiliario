"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { signUp } from "@/lib/actions/auth";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * El alta de propietario, en la misma página donde se lo invita: una
 * ficha de papel con cuatro campos y un solo botón. Usa la misma acción
 * que /auth/registro (signUp) con dos datos más:
 *
 *   · destino="publicar": al crear la cuenta va directo a cargar la
 *     propiedad, que es el objetivo de estas páginas.
 *   · pagina y utm_*: de dónde vino, para medir qué página o anuncio
 *     trae dueños (queda en los metadatos del usuario).
 */
export default function RegistroDueno({ pagina }: { pagina: string }) {
  const [error, setError] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [enviando, startTransition] = useTransition();

  // Los utm llegan en la URL del anuncio; se leen una vez al cargar
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const leidos: Record<string, string> = {};
    for (const k of UTM) {
      const v = q.get(k);
      if (v) leidos[k] = v;
    }
    setUtm(leidos);
  }, []);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const datos = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await signUp(datos);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <form className="pr-alta" onSubmit={enviar} id="registro">
      <input type="hidden" name="destino" value="publicar" />
      <input type="hidden" name="pagina" value={pagina} />
      {Object.entries(utm).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      <header className="pr-alta-cab">
        <span className="pr-alta-k">Alta de propietario</span>
        <h2 className="pr-alta-t">Creá tu cuenta <em>y publicá</em></h2>
        <p className="pr-alta-sub">Lleva un minuto. Después cargás tu propiedad.</p>
      </header>
      <div className="pr-doble" aria-hidden="true" />

      <label className="pr-campo">
        <span>Nombre completo</span>
        <input name="nombre" required autoComplete="name" placeholder="Ej.: Juan García" />
      </label>
      <label className="pr-campo">
        <span>Teléfono o WhatsApp</span>
        <input name="telefono" type="tel" inputMode="tel" required autoComplete="tel" placeholder="+54 9 11 1234-5678" />
        <small>Es el número al que te van a escribir los interesados.</small>
      </label>
      <label className="pr-campo">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
      </label>
      <label className="pr-campo">
        <span>Contraseña</span>
        <span className="pr-clave">
          <input
            name="password"
            type={verClave ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setVerClave(v => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
          </button>
        </span>
      </label>

      {error && <p className="pr-error" role="alert">{error}</p>}

      <button type="submit" className="pr-boton" disabled={enviando}>
        {enviando ? "Creando tu cuenta…" : "Crear cuenta y publicar"}
        {!enviando && <ArrowRight size={16} strokeWidth={1.8} />}
      </button>

      <p className="pr-legal">
        Al crear tu cuenta aceptás los <Link href="/terminos">términos y condiciones</Link> y
        la <Link href="/privacidad">política de privacidad</Link>.
      </p>
      <p className="pr-ya">
        ¿Ya tenés cuenta? <Link href="/auth/login">Iniciá sesión</Link>
      </p>
    </form>
  );
}
