"use client";

import { useRef, useState, useTransition } from "react";
import { BadgeCheck, Clock, ShieldAlert, ShieldCheck, Upload, X } from "lucide-react";
import { enviarValidacionIdentidad } from "@/lib/actions/validaciones";
import { TIPOS_DOCUMENTO } from "@/lib/types";
import type { EstadoValidacion, TipoDocumento } from "@/lib/types";
import EstadoValidacionChip from "@/components/panel/EstadoValidacionChip";

export default function ValidacionIdentidad({
  estado,
  motivo,
}: {
  estado: EstadoValidacion;
  motivo?: string | null;
}) {
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>("dni");
  const [frente, setFrente] = useState<File | null>(null);
  const [dorso, setDorso] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(estado === "pendiente");
  const [pendiente, startTransition] = useTransition();

  const aprobada = estado === "aprobada";

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!frente || !dorso) {
      setError("Subí las dos caras del documento.");
      return;
    }
    const fd = new FormData();
    fd.set("tipo_doc", tipoDoc);
    fd.set("frente", frente);
    fd.set("dorso", dorso);
    startTransition(async () => {
      const r = await enviarValidacionIdentidad(fd);
      if (r?.error) setError(r.error);
      else setListo(true);
    });
  }

  if (aprobada) {
    return (
      <Caja>
        <Encabezado
          icono={<ShieldCheck size={17} />}
          titulo="Identidad confirmada"
          estado={estado}
        />
        <p style={texto}>
          Tus publicaciones muestran el sello de <strong>Propietario verificado</strong> y
          ya no tenés límite para cargar propiedades.
        </p>
      </Caja>
    );
  }

  if (listo) {
    return (
      <Caja>
        <Encabezado icono={<Clock size={17} />} titulo="Identidad" estado="pendiente" />
        <p style={texto}>
          Recibimos tu documentación. La revisamos a mano, normalmente en menos de 48 horas,
          y te avisamos por mail.
        </p>
      </Caja>
    );
  }

  return (
    <Caja>
      <Encabezado icono={<BadgeCheck size={17} />} titulo="Identidad" estado={estado} />

      {estado === "rechazada" && motivo && (
        <div style={avisoRechazo}>
          <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>No pudimos aprobarla:</strong> {motivo}</span>
        </div>
      )}

      <p style={texto}>
        Subí el <strong>frente y el dorso</strong> de tu DNI, pasaporte o registro de conducir.
        Con esto mostramos a los interesados que sos una persona real.
      </p>

      <form onSubmit={enviar}>
        <p style={etiqueta}>¿Qué documento vas a subir?</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {TIPOS_DOCUMENTO.map(t => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTipoDoc(t.valor)}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
                padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${tipoDoc === t.valor ? "var(--navy-800)" : "var(--line-200)"}`,
                background: tipoDoc === t.valor ? "var(--navy-800)" : "#fff",
                color: tipoDoc === t.valor ? "#fff" : "var(--ink-600)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="valida-archivos">
          <CampoArchivo etiqueta="Frente" archivo={frente} onElegir={setFrente} />
          <CampoArchivo etiqueta="Dorso"  archivo={dorso}  onElegir={setDorso} />
        </div>

        {error && <p style={textoError}>{error}</p>}

        <button type="submit" disabled={pendiente} style={{ ...boton, opacity: pendiente ? 0.6 : 1 }}>
          {pendiente ? "Enviando…" : "Enviar para validar"}
        </button>
      </form>

      <p style={nota}>
        Tus documentos se guardan en un espacio privado, los mira solo el equipo de
        Espacio Inmobiliario para esta verificación, y nunca se muestran en el sitio.
      </p>
    </Caja>
  );
}

/* ── Piezas compartidas ─────────────────────────────────────── */

export function Caja({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-md)", padding: "16px 17px",
    }}>
      {children}
    </div>
  );
}

export function Encabezado({
  icono, titulo, estado,
}: {
  icono: React.ReactNode; titulo: string; estado: EstadoValidacion;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, flexWrap: "wrap" }}>
      <span style={{
        width: 32, height: 32, borderRadius: "var(--radius-sm)", flexShrink: 0,
        background: "var(--navy-50)", color: "var(--navy-700)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icono}
      </span>
      <span style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5,
        color: "var(--navy-800)", flex: 1, minWidth: 0,
      }}>
        {titulo}
      </span>
      <EstadoValidacionChip estado={estado} />
    </div>
  );
}

export function CampoArchivo({
  etiqueta, archivo, onElegir,
}: {
  etiqueta: string; archivo: File | null; onElegir: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p style={etiquetaChica}>{etiqueta}</p>
      {archivo ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 11px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--success-line)", background: "var(--success-bg)",
        }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-800)",
            flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {archivo.name}
          </span>
          <button
            type="button"
            onClick={() => { onElegir(null); if (ref.current) ref.current.value = ""; }}
            aria-label={`Quitar ${etiqueta}`}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-500)", lineHeight: 0, padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "11px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            border: "1px dashed var(--line-200)", background: "var(--cream)",
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-600)",
          }}
        >
          <Upload size={14} /> Elegir archivo
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={e => onElegir(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export const texto: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-600)",
  lineHeight: 1.55, margin: "0 0 14px",
};
export const etiqueta: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
  color: "var(--ink-600)", margin: "0 0 7px",
};
export const etiquetaChica: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".06em",
  color: "var(--ink-500)", margin: "0 0 5px",
};
export const textoError: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--danger)", margin: "12px 0 0",
};
export const nota: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)",
  lineHeight: 1.5, margin: "12px 0 0",
};
export const boton: React.CSSProperties = {
  marginTop: 14, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
  padding: "10px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer",
  border: "none", background: "var(--navy-800)", color: "#fff",
};
export const avisoRechazo: React.CSSProperties = {
  display: "flex", gap: 7, alignItems: "flex-start",
  padding: "9px 11px", borderRadius: "var(--radius-sm)", marginBottom: 12,
  background: "var(--danger-bg)", border: "1px solid var(--danger-line)",
  fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5,
};
