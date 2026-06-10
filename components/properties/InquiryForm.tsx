"use client";

import { useState, useTransition } from "react";
import { sendInquiry } from "@/lib/actions/inquiries";
import { MessageCircle, CheckCircle2 } from "lucide-react";

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "11px 13px", fontFamily: "var(--font-sans)",
  fontSize: 14, color: "var(--ink-800)", marginBottom: 10,
  background: "#fff",
};

export default function InquiryForm({ propertyId }: { propertyId: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendInquiry(propertyId, formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) return (
    <div style={{
      textAlign: "center", padding: "26px 16px",
      background: "var(--success-bg)", border: "1px solid var(--success-line)",
      borderRadius: "var(--radius-md)",
    }}>
      <CheckCircle2 size={32} color="var(--success)" strokeWidth={1.75} style={{ margin: "0 auto" }} />
      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--success)", margin: "10px 0 4px" }}>
        ¡Consulta enviada!
      </p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-600)", margin: 0 }}>
        El dueño se comunicará con vos a la brevedad.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--ink-900)", margin: "0 0 12px" }}>
        Consultá al dueño
      </p>
      {/* Honeypot anti-bots: invisible para humanos, los bots lo completan */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: -9999, height: 0, overflow: "hidden" }}>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" placeholder="Dejá este campo vacío" />
      </div>
      <input name="nombre" type="text" required placeholder="Tu nombre" style={inp} />
      <input name="email" type="email" required placeholder="Tu email" style={inp} />
      <input name="telefono" type="tel" placeholder="Tu teléfono (opcional)" style={inp} />
      <textarea
        name="mensaje" required rows={3}
        style={{ ...inp, resize: "none" }}
        defaultValue="Hola, me interesa la propiedad. ¿Podemos coordinar una visita?"
      />
      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="esbtn esbtn-gold"
        style={{
          width: "100%", fontFamily: "var(--font-sans)", fontWeight: 600,
          borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
          cursor: isPending ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, fontSize: 14.5, padding: "13px 24px",
          background: isPending ? "var(--gold-400)" : "var(--gold-500)",
          color: "#26200f", transition: "all var(--dur) var(--ease-out)",
        }}
      >
        <MessageCircle size={16} strokeWidth={2} />
        {isPending ? "Enviando…" : "Enviar consulta"}
      </button>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", textAlign: "center", margin: "12px 0 0" }}>
        Tu consulta va directamente al dueño. Sin intermediarios.
      </p>
    </form>
  );
}
