"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, KeyRound, AlertTriangle } from "lucide-react";
import { actualizarPerfil } from "@/lib/actions/perfil";

const inp: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: 14,
  color: "var(--ink-800)", background: "#fff",
};
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5,
  fontWeight: 600, color: "var(--ink-600)", marginBottom: 6,
};

export default function SeccionDatos({
  nombre,
  email,
  telefono,
}: {
  nombre: string;
  email: string;
  telefono: string | null;
}) {
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardado(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await actualizarPerfil(fd);
      if (r.ok) setGuardado(true);
      else setError(r.error ?? "No se pudo guardar.");
    });
  }

  return (
    <form onSubmit={enviar}>
      {!telefono && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
          borderRadius: "var(--radius-sm)", padding: "11px 13px", marginBottom: 16,
          fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
        }}>
          <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Todavía no cargaste tu teléfono. Sin él, los interesados no ven el
            botón de WhatsApp en tus publicaciones.
          </span>
        </div>
      )}

      <div className="panel-datos-grid">
        <div>
          <label style={lbl} htmlFor="perfil-nombre">Nombre completo</label>
          <input id="perfil-nombre" name="nombre" type="text" required defaultValue={nombre} style={inp} />
        </div>
        <div>
          <label style={lbl} htmlFor="perfil-tel">Teléfono / WhatsApp</label>
          <input
            id="perfil-tel" name="telefono" type="tel" inputMode="tel" required
            defaultValue={telefono ?? ""} style={inp} placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={lbl} htmlFor="perfil-email">Email</label>
        <input
          id="perfil-email" type="email" value={email} readOnly disabled
          style={{ ...inp, background: "var(--fill-100)", color: "var(--ink-500)" }}
        />
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", margin: "6px 0 0" }}>
          Es tu usuario para ingresar. Si necesitás cambiarlo, escribinos.
        </p>
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626", margin: "14px 0 0" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pendiente}
          style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5,
            padding: "11px 22px", borderRadius: "var(--radius-sm)",
            background: "var(--navy-800)", color: "#fff", border: "none",
            cursor: pendiente ? "not-allowed" : "pointer", opacity: pendiente ? .7 : 1,
          }}
        >
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>

        <Link href="/panel/clave" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
          color: "var(--ink-600)", textDecoration: "none",
          padding: "11px 18px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--line-200)",
        }}>
          <KeyRound size={14} /> Cambiar contraseña
        </Link>

        {guardado && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "#15803D",
          }}>
            <Check size={15} strokeWidth={3} /> Datos guardados
          </span>
        )}
      </div>
    </form>
  );
}
