"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dejarDeRecibirAvisos } from "@/lib/actions/foro";

export default function BajaAvisos({ token }: { token: string }) {
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, startTransition] = useTransition();

  if (estado?.ok) {
    return (
      <p className="fo-ok" role="status">
        <strong>Listo, no te mandamos más avisos.</strong> Si cambiás de idea, los volvés a activar desde{" "}
        <Link href="/foro/perfil" className="fo-enlace">tu perfil</Link>.
      </p>
    );
  }

  return (
    <div className="fo-form" style={{ gap: 16 }}>
      <button
        type="button"
        className="fo-btn"
        disabled={enviando || !token}
        onClick={() => startTransition(async () => {
          const r = await dejarDeRecibirAvisos(token);
          setEstado(r.ok ? { ok: true, texto: "" } : { ok: false, texto: r.error });
        })}
      >
        {enviando ? "Guardando…" : "Dejar de recibir avisos"}
      </button>
      {(estado && !estado.ok) || !token ? (
        <p className="fo-error" role="alert">
          {estado?.texto ?? "Falta el enlace del email."} También podés apagarlos desde <Link href="/foro/perfil">tu perfil</Link>.
        </p>
      ) : null}
    </div>
  );
}
