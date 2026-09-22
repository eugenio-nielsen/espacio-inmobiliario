"use client";

import { useState, useTransition } from "react";
import { Check, Send, MessageCircle } from "lucide-react";
import { enviarConsultaAsesoria } from "@/lib/actions/asesoria";
import { MOTIVOS, type MotivoId } from "@/lib/motivos";

const WHATSAPP = "5491164519421";

/**
 * Formulario de contacto con selector de motivo.
 *
 * El motivo no es un campo más: define el título, la bajada y el
 * ejemplo del mensaje, y viaja en el asunto del mail. Así cada consulta
 * llega ya clasificada en vez de caer toda en la misma bolsa.
 *
 * El motivo inicial llega como prop desde el servidor (leído de
 * ?motivo=) en lugar de con useSearchParams: evita tener que envolver
 * el componente en un Suspense y que el primer render quede vacío.
 */
export default function FormContacto({ motivoInicial = "otro" }: { motivoInicial?: MotivoId }) {
  const [motivo, setMotivo] = useState<MotivoId>(motivoInicial);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activo = MOTIVOS.find(m => m.id === motivo) ?? MOTIVOS[3];

  function submit() {
    if (!form.nombre || !form.email || !form.mensaje) {
      setError("Completá nombre, email y mensaje.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await enviarConsultaAsesoria({ ...form, motivo });
      if (r.ok) setSent(true);
      else setError(r.error || "No se pudo enviar.");
    });
  }

  if (sent) {
    return (
      <div className="ct-ok">
        <Check size={30} strokeWidth={2.5} />
        <h3>¡Mensaje enviado!</h3>
        <p>Gracias por escribir. Eugenio se va a poner en contacto con vos a la brevedad.</p>
      </div>
    );
  }

  const waMsg = encodeURIComponent(
    `Hola Eugenio, te escribo desde el sitio. Motivo: ${activo.label}.`
  );

  return (
    <div className="ct-form">
      {/* ── Motivo ─────────────────────────────────────────── */}
      <fieldset className="ct-motivos">
        <legend className="ct-motivos-t">¿En qué te podemos ayudar?</legend>
        <div className="ct-motivos-grid">
          {MOTIVOS.map(m => (
            <button
              key={m.id}
              type="button"
              className="ct-motivo"
              data-on={m.id === motivo}
              aria-pressed={m.id === motivo}
              onClick={() => setMotivo(m.id)}
            >
              {m.boton}
            </button>
          ))}
        </div>
      </fieldset>

      {/* El encabezado cambia con el motivo: confirma que el clic hizo algo */}
      <div className="ct-cabecera">
        <h3>{activo.titulo}</h3>
        <p>{activo.bajada}</p>
      </div>

      {/* Honeypot anti-bots: invisible para humanos, los bots lo completan */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: -9999, height: 0, overflow: "hidden" }}>
        <input
          type="text" tabIndex={-1} autoComplete="off" placeholder="Dejá este campo vacío"
          value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
        />
      </div>

      <div className="ct-fila">
        <input className="ct-inp" placeholder="Nombre *" value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <input className="ct-inp" placeholder="Email *" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <input className="ct-inp" placeholder="Teléfono / WhatsApp (opcional)" value={form.telefono}
        onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
      <textarea
        className="ct-inp ct-area"
        placeholder={activo.placeholder}
        value={form.mensaje}
        onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
      />

      {error && <p className="ct-error">{error}</p>}

      <div className="ct-acciones">
        <button type="button" onClick={submit} disabled={isPending} className="ct-enviar">
          <Send size={15} strokeWidth={2} />
          {isPending ? "Enviando…" : "Enviar consulta"}
        </button>
        <a
          className="ct-wa"
          href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={15} strokeWidth={2} />
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
