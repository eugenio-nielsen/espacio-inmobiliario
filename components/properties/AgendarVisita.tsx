"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { solicitarVisita } from "@/lib/actions/visitas";
import { formatearVisita } from "@/lib/utils/agenda";
import type { DiaConSlots } from "@/lib/utils/agenda";

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "11px 13px", fontFamily: "var(--font-sans)",
  fontSize: 14, color: "var(--ink-800)", marginBottom: 10,
  background: "#fff",
};

/** "Sábado 6 de septiembre" → "Sáb 6 sep" para los chips */
function corta(etiqueta: string): string {
  const [dia, num, , mes] = etiqueta.replace(",", "").split(" ");
  return `${dia.slice(0, 3)} ${num} ${mes.slice(0, 3)}`;
}

export default function AgendarVisita({
  propertyId,
  dias,
}: {
  propertyId: string;
  dias: DiaConSlots[];
}) {
  const [diaActivo, setDiaActivo] = useState(dias[0]?.dia ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const dia = dias.find(d => d.dia === diaActivo) ?? dias[0];

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await solicitarVisita(propertyId, formData);
      if (r?.error) setError(r.error);
      else setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div style={{
        textAlign: "center", padding: "26px 16px",
        background: "var(--success-bg)", border: "1px solid var(--success-line)",
        borderRadius: "var(--radius-md)",
      }}>
        <CheckCircle2 size={32} color="var(--success)" strokeWidth={1.75} style={{ margin: "0 auto" }} />
        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--success)", margin: "10px 0 4px" }}>
          Pedido enviado
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-600)", margin: 0, lineHeight: 1.5 }}>
          {slot ? `Pediste el ${formatearVisita(slot).toLowerCase()}. ` : ""}
          Te avisamos por mail apenas el dueño lo confirme.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <p style={{
        display: "flex", alignItems: "center", gap: 7,
        fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
        color: "var(--ink-900)", margin: "0 0 3px",
      }}>
        <CalendarDays size={16} strokeWidth={2} color="var(--gold-700)" />
        Agendá una visita
      </p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 12px", lineHeight: 1.45 }}>
        Elegí el día y el horario que te queden cómodos. El dueño confirma y te avisamos.
      </p>

      {/* Días */}
      <div className="agenda-dias">
        {dias.map(d => (
          <button
            key={d.dia}
            type="button"
            onClick={() => { setDiaActivo(d.dia); setSlot(null); }}
            className={`agenda-dia${d.dia === dia?.dia ? " agenda-dia-on" : ""}`}
          >
            {corta(d.etiqueta)}
          </button>
        ))}
      </div>

      {/* Horarios del día elegido */}
      <div className="agenda-horas">
        {dia?.slots.map(s => (
          <button
            key={s.inicio}
            type="button"
            onClick={() => setSlot(s.inicio)}
            className={`agenda-hora${s.inicio === slot ? " agenda-hora-on" : ""}`}
          >
            {s.hora}
          </button>
        ))}
      </div>

      {/* Datos de contacto — aparecen recién cuando eligió horario */}
      {slot && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7, marginBottom: 12,
            padding: "9px 12px", borderRadius: "var(--radius-sm)",
            background: "var(--navy-50)", border: "1px solid var(--navy-100)",
          }}>
            <Clock size={14} color="var(--navy-700)" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--navy-800)" }}>
              {formatearVisita(slot)}
            </span>
          </div>

          <input type="hidden" name="inicio" value={slot} />

          {/* Honeypot anti-bots */}
          <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: -9999, height: 0, overflow: "hidden" }}>
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <input name="nombre" type="text" required placeholder="Tu nombre" style={inp} />
          <input name="telefono" type="tel" required placeholder="Tu WhatsApp" style={inp} />
          <input name="email" type="email" required placeholder="Tu email" style={inp} />
          <textarea
            name="mensaje" rows={2}
            placeholder="Algo que quieras aclarar (opcional)"
            style={{ ...inp, resize: "none" }}
          />

          {error && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="esbtn esbtn-gold"
            style={{
              width: "100%", fontFamily: "var(--font-sans)", fontWeight: 600,
              borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
              cursor: pendiente ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontSize: 14.5, padding: "13px 24px",
              background: pendiente ? "var(--gold-400)" : "var(--gold-500)",
              color: "#26200f", transition: "all var(--dur) var(--ease-out)",
            }}
          >
            <CalendarDays size={16} strokeWidth={2} />
            {pendiente ? "Enviando…" : "Pedir esta visita"}
          </button>

          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", textAlign: "center", margin: "10px 0 0", lineHeight: 1.45 }}>
            Queda a la espera de que el dueño confirme. No es una reserva en firme.
          </p>
        </div>
      )}

      {!slot && (
        <p style={{
          display: "flex", alignItems: "center", gap: 5,
          fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-400)",
          margin: "12px 0 0",
        }}>
          <ChevronRight size={13} /> Elegí un horario para continuar
        </p>
      )}
    </form>
  );
}
