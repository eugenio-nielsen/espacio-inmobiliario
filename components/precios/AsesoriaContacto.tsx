"use client";

import { useState, useTransition } from "react";
import { Check, Send } from "lucide-react";
import { enviarConsultaAsesoria } from "@/lib/actions/asesoria";

const WHATSAPP = "5491164519421";

const inp: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "12px 14px", fontSize: 16, fontFamily: "var(--font-sans)", outline: "none", background: "#fff",
};

export default function AsesoriaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!form.nombre || !form.email || !form.mensaje) { setError("Completá nombre, email y mensaje."); return; }
    setError(null);
    startTransition(async () => {
      const r = await enviarConsultaAsesoria(form);
      if (r.ok) setSent(true); else setError(r.error || "No se pudo enviar.");
    });
  }

  const waMsg = encodeURIComponent("Hola Eugenio, me gustaría saber más sobre el acompañamiento para vender mi propiedad.");

  if (sent) {
    return (
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-lg)", padding: "36px 28px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <Check size={32} strokeWidth={2.5} color="#15803D" style={{ marginBottom: 10 }} />
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "#15803D", margin: "0 0 8px" }}>¡Mensaje enviado!</h3>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-600)", margin: 0 }}>
          Gracias por escribir. Eugenio se va a poner en contacto con vos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Honeypot anti-bots: invisible para humanos, los bots lo completan */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: -9999, height: 0, overflow: "hidden" }}>
        <input type="text" tabIndex={-1} autoComplete="off" placeholder="Dejá este campo vacío"
          value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }} className="asesoria-grid">
        <input style={inp} placeholder="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <input style={inp} placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <input style={{ ...inp, marginBottom: 12 }} placeholder="Teléfono / WhatsApp (opcional)" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
      <textarea style={{ ...inp, marginBottom: 12, resize: "vertical", minHeight: 110 }} placeholder="Contanos sobre tu propiedad y en qué te podemos ayudar *" value={form.mensaje} onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))} />

      {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626", background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", margin: "0 0 12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={submit} disabled={isPending} style={{
          flex: 1, minWidth: 180, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, padding: "14px 22px",
          borderRadius: "var(--radius-sm)", cursor: isPending ? "not-allowed" : "pointer",
          background: "var(--navy-800)", color: "#fff", border: "none",
        }}>
          <Send size={16} /> {isPending ? "Enviando…" : "Enviar mensaje"}
        </button>
        <a href={`https://wa.me/${WHATSAPP}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, minWidth: 180, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, padding: "14px 22px",
          borderRadius: "var(--radius-sm)", background: "#25D366", color: "#fff", textDecoration: "none",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
