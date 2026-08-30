"use client";

import { useState, useTransition } from "react";
import { FileCheck2, ShieldAlert } from "lucide-react";
import { enviarValidacionDominio } from "@/lib/actions/validaciones";
import EstadoValidacionChip from "@/components/panel/EstadoValidacionChip";
import {
  Caja, CampoArchivo, texto, textoError, nota, boton, avisoRechazo,
} from "@/components/panel/ValidacionIdentidad";
import type { EstadoValidacion } from "@/lib/types";

export type PropiedadValidable = {
  id: string;
  titulo: string;
  dominio_estado: EstadoValidacion;
  dominio_motivo?: string | null;
};

/**
 * La escritura es de una propiedad concreta, así que la validación de
 * dominio se pide una por publicación: el badge de "dominio verificado"
 * tiene que significar que revisamos el título DE ESA propiedad.
 */
export default function ValidacionDominio({ propiedades }: { propiedades: PropiedadValidable[] }) {
  if (!propiedades.length) {
    return (
      <Caja>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
          <span style={iconoCaja}><FileCheck2 size={17} /></span>
          <span style={tituloCaja}>Dominio de tus propiedades</span>
        </div>
        <p style={{ ...texto, margin: 0 }}>
          Cuando publiques una propiedad vas a poder subir acá la escritura para validarla.
        </p>
      </Caja>
    );
  }

  return (
    <Caja>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <span style={iconoCaja}><FileCheck2 size={17} /></span>
        <span style={tituloCaja}>Dominio de tus propiedades</span>
      </div>
      <p style={texto}>
        Subí la <strong>escritura donde figure tu nombre</strong>, una por propiedad. La que
        aprobemos muestra el sello de <strong>dominio verificado</strong> en su publicación.
      </p>

      <div style={{ display: "grid", gap: 9 }}>
        {propiedades.map(p => <FilaPropiedad key={p.id} p={p} />)}
      </div>

      <p style={nota}>
        Podés tachar los datos que no hagan falta: solo necesitamos ver tu nombre y la
        identificación del inmueble.
      </p>
    </Caja>
  );
}

function FilaPropiedad({ p }: { p: PropiedadValidable }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<EstadoValidacion>(p.dominio_estado);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const cerrada = estado === "aprobada" || estado === "pendiente";

  function enviar() {
    setError(null);
    if (!archivo) { setError("Adjuntá la escritura."); return; }
    const fd = new FormData();
    fd.set("escritura", archivo);
    startTransition(async () => {
      const r = await enviarValidacionDominio(p.id, fd);
      if (r?.error) setError(r.error);
      else { setEstado("pendiente"); setAbierto(false); setArchivo(null); }
    });
  }

  return (
    <div style={{
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
      padding: "10px 12px", background: "var(--cream)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{
          flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600,
          fontSize: 13, color: "var(--ink-800)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {p.titulo}
        </span>
        <EstadoValidacionChip estado={estado} />
        {!cerrada && !abierto && (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              padding: "5px 11px", borderRadius: "var(--radius-xs)", cursor: "pointer",
              border: "1px solid var(--line-200)", background: "#fff", color: "var(--ink-600)",
            }}
          >
            {estado === "rechazada" ? "Reenviar" : "Subir escritura"}
          </button>
        )}
      </div>

      {estado === "rechazada" && p.dominio_motivo && (
        <div style={{ ...avisoRechazo, marginTop: 9, marginBottom: 0 }}>
          <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>No pudimos aprobarla:</strong> {p.dominio_motivo}</span>
        </div>
      )}

      {abierto && !cerrada && (
        <div style={{ marginTop: 10 }}>
          <CampoArchivo etiqueta="Escritura" archivo={archivo} onElegir={setArchivo} />
          {error && <p style={textoError}>{error}</p>}
          <div style={{ display: "flex", gap: 7 }}>
            <button type="button" onClick={enviar} disabled={pendiente} style={{ ...boton, opacity: pendiente ? 0.6 : 1 }}>
              {pendiente ? "Enviando…" : "Enviar para validar"}
            </button>
            <button
              type="button"
              onClick={() => { setAbierto(false); setArchivo(null); setError(null); }}
              style={{
                marginTop: 14, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
                padding: "10px 16px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                border: "1px solid var(--line-200)", background: "#fff", color: "var(--ink-600)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const iconoCaja: React.CSSProperties = {
  width: 32, height: 32, borderRadius: "var(--radius-sm)", flexShrink: 0,
  background: "var(--navy-50)", color: "var(--navy-700)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const tituloCaja: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--navy-800)",
};
