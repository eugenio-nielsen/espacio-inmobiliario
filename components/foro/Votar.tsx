"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { votar } from "@/lib/actions/foro";

/**
 * La flechita arriba. Responde al instante (optimista) y, si el servidor
 * rechaza el voto, vuelve atrás y dice por qué. Sin sesión, lleva a
 * sumarse y volver a este mismo tema.
 */
export default function Votar({
  tipo,
  id,
  votos,
  votado,
  sesion,
  propio,
  volver,
}: {
  tipo: "tema" | "respuesta";
  id: string;
  votos: number;
  votado: boolean;
  sesion: boolean;
  propio: boolean;
  volver: string;
}) {
  const [estado, setEstado] = useState({ votos, votado });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const etiqueta = tipo === "tema" ? "este tema" : "esta respuesta";

  if (!sesion) {
    return (
      <Link
        href={`/foro/unirse?volver=${encodeURIComponent(volver)}`}
        className="fo-voto"
        title="Sumate a la Tertulia para votar"
        aria-label={`Votar ${etiqueta} (requiere cuenta). ${votos} votos`}
      >
        <ChevronUp size={20} strokeWidth={2} />
        <strong>{votos}</strong>
      </Link>
    );
  }

  function alternar() {
    setError(null);
    const previo = estado;
    setEstado({ votos: previo.votos + (previo.votado ? -1 : 1), votado: !previo.votado });
    startTransition(async () => {
      const r = await votar(tipo, id);
      if (!r.ok) {
        setEstado(previo);
        setError(r.error);
        setTimeout(() => setError(null), 5000);
        return;
      }
      setEstado({ votos: r.votos, votado: r.votado });
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="fo-voto"
        onClick={alternar}
        disabled={propio}
        aria-pressed={estado.votado}
        title={propio ? "No podés votar lo que escribiste" : estado.votado ? "Quitar mi voto" : `Me sirvió ${etiqueta}`}
        aria-label={`${estado.votado ? "Quitar el voto de" : "Votar"} ${etiqueta}. ${estado.votos} votos`}
      >
        <ChevronUp size={20} strokeWidth={2} />
        <strong>{estado.votos}</strong>
      </button>
      {error && <p className="fo-voto-error" role="alert">{error}</p>}
    </div>
  );
}
