"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import FormFicha from "@/components/catedra/FormFicha";
import {
  alternarRecomendado, borrarProfesional, cambiarEstadoProfesional, guardarCostosConfig,
} from "@/lib/actions/catedra";
import { COSTOS_DEFAULT, type CostosConfig } from "@/lib/catedra/costos";
import { rubroPorValor, type ProfesionalAdmin } from "@/lib/catedra/rubros";
import "@/components/catedra/catedra.css";

const caja: React.CSSProperties = { background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "18px 20px" };
const titulo: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--navy-800)", margin: "28px 0 12px" };
const meta: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)" };
const etiqueta: React.CSSProperties = { display: "grid", gap: 4, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)" };
const input: React.CSSProperties = { padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: 14, border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)", width: "100%" };

function Boton({ onClick, children, peligro, disabled }: { onClick: () => void; children: React.ReactNode; peligro?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
      fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      color: peligro ? "var(--danger)" : "var(--navy-800)", background: "#fff",
      border: `1px solid ${peligro ? "var(--danger-line)" : "var(--line-200)"}`,
      borderRadius: "var(--radius-sm)", opacity: disabled ? .5 : 1,
    }}>{children}</button>
  );
}

/** Un número del config: se edita como texto para aceptar coma decimal. */
function Campo({ label, valor, onCambio, ayuda }: { label: string; valor: number; onCambio: (n: number) => void; ayuda?: string }) {
  const [t, setT] = useState(String(valor).replace(".", ","));
  return (
    <label style={etiqueta}>
      {label}
      <input
        style={input}
        inputMode="decimal"
        value={t}
        onChange={e => {
          setT(e.target.value);
          const n = Number(e.target.value.replace(/\./g, "").replace(",", "."));
          if (Number.isFinite(n)) onCambio(n);
        }}
      />
      {ayuda && <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{ayuda}</span>}
    </label>
  );
}

/**
 * La Cátedra en el superadmin: los parámetros de la calculadora (se
 * actualizan cuando cambia la ley tarifaria o el dólar) y la red de
 * profesionales (postulaciones, altas curadas, pausar, recomendar).
 */
export default function CatedraAdmin({ config, profesionales }: { config: CostosConfig; profesionales: ProfesionalAdmin[] }) {
  const router = useRouter();
  const [c, setC] = useState<CostosConfig>(config);
  const [msg, setMsg] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [ocupado, startTransition] = useTransition();

  const set = (fn: (prev: CostosConfig) => CostosConfig) => setC(prev => fn(structuredClone(prev)));

  function guardar() {
    setMsg(null);
    startTransition(async () => {
      const r = await guardarCostosConfig(c);
      setMsg(r.ok ? "Guardado. La calculadora ya usa estos valores." : r.error);
      router.refresh();
    });
  }

  function hacer(fn: () => Promise<{ ok: boolean; error?: string }>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setMsg(r.error ?? "Error");
      router.refresh();
    });
  }

  const postulados = profesionales.filter(p => p.estado === "postulado");
  const resto = profesionales.filter(p => p.estado !== "postulado");

  return (
    <div>
      {/* ── Parámetros de la calculadora ── */}
      <h3 style={{ ...titulo, marginTop: 0 }}>Calculadora de costos · parámetros</h3>
      <div style={{ ...caja, display: "grid", gap: 18 }}>
        <p style={{ ...meta, margin: 0 }}>
          Actualizalos cuando cambie la Ley Tarifaria o el dólar. Los porcentajes van sin el signo (2,7 = 2,7 %).
          La fuente de referencia es el cuadro de montos del Colegio de Escribanos de la Ciudad.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
          <label style={etiqueta}>
            Vigencia (texto)
            <input style={input} value={c.vigencia} onChange={e => { const v = e.target.value; set(p => ({ ...p, vigencia: v })); }} />
          </label>
          <Campo label="Dólar de referencia ($)" valor={c.tipoCambio} onCambio={n => set(p => ({ ...p, tipoCambio: n }))} ayuda="BNA vendedor" />
          <Campo label="IVA (%)" valor={c.iva} onCambio={n => set(p => ({ ...p, iva: n }))} />
          <Campo label="Sellos · umbral ($)" valor={c.sellos.umbral} onCambio={n => set(p => ({ ...p, sellos: { ...p.sellos, umbral: n } }))} ayuda="Tope de exención de vivienda única" />
          <Campo label="Sellos · hasta el umbral (%)" valor={c.sellos.alicuotaGeneral} onCambio={n => set(p => ({ ...p, sellos: { ...p.sellos, alicuotaGeneral: n } }))} />
          <Campo label="Sellos · sobre el umbral (%)" valor={c.sellos.alicuotaAlta} onCambio={n => set(p => ({ ...p, sellos: { ...p.sellos, alicuotaAlta: n } }))} />
          <Campo label="Sellos · parte del comprador (%)" valor={c.sellos.parteComprador} onCambio={n => set(p => ({ ...p, sellos: { ...p.sellos, parteComprador: n } }))} />
          <Campo label="Sellos · Provincia de Bs. As. (%)" valor={c.sellos.alicuotaPBA} onCambio={n => set(p => ({ ...p, sellos: { ...p.sellos, alicuotaPBA: n } }))} ayuda="Se usa en la ficha de propiedades de PBA" />
          <Campo label="Escribano · honorarios (%)" valor={c.escribania.honorarios} onCambio={n => set(p => ({ ...p, escribania: { ...p.escribania, honorarios: n } }))} />
          <Campo label="Gastos de escritura (%)" valor={c.escribania.gastos} onCambio={n => set(p => ({ ...p, escribania: { ...p.escribania, gastos: n } }))} ayuda="Aportes, folios, inscripción" />
          <Campo label="Certificados del vendedor (%)" valor={c.escribania.certificadosVendedor} onCambio={n => set(p => ({ ...p, escribania: { ...p.escribania, certificadosVendedor: n } }))} />
          <Campo label="Escritura de hipoteca (% del crédito)" valor={c.escribania.hipoteca} onCambio={n => set(p => ({ ...p, escribania: { ...p.escribania, hipoteca: n } }))} />
          <Campo label="Inmobiliaria · comprador (%)" valor={c.inmobiliaria.comprador} onCambio={n => set(p => ({ ...p, inmobiliaria: { ...p.inmobiliaria, comprador: n } }))} />
          <Campo label="Inmobiliaria · vendedor (%)" valor={c.inmobiliaria.vendedor} onCambio={n => set(p => ({ ...p, inmobiliaria: { ...p.inmobiliaria, vendedor: n } }))} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Boton onClick={guardar} disabled={ocupado}><Save size={13} /> Guardar parámetros</Boton>
          <Boton onClick={() => setC(COSTOS_DEFAULT)} disabled={ocupado}>Volver a los valores de fábrica</Boton>
          {msg && <span style={meta}>{msg}</span>}
        </div>
      </div>

      {/* ── Postulaciones ── */}
      <h3 style={titulo}>Postulaciones a la red ({postulados.length})</h3>
      {postulados.length === 0 ? <p style={{ ...meta, fontStyle: "italic" }}>No hay postulaciones pendientes.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {postulados.map(p => <FilaProfesional key={p.id} p={p} ocupado={ocupado} hacer={hacer} />)}
        </div>
      )}

      {/* ── La red ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h3 style={titulo}>La red ({resto.length})</h3>
        <Boton onClick={() => setAgregando(a => !a)}><Plus size={13} /> {agregando ? "Cerrar" : "Agregar un profesional"}</Boton>
      </div>
      {agregando && (
        <div style={{ ...caja, marginBottom: 14 }}>
          <FormFicha modo="curado" alTerminar={() => setAgregando(false)} />
        </div>
      )}
      {resto.length === 0 ? <p style={{ ...meta, fontStyle: "italic" }}>Todavía no hay profesionales en la red.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {resto.map(p => <FilaProfesional key={p.id} p={p} ocupado={ocupado} hacer={hacer} />)}
        </div>
      )}
    </div>
  );
}

function FilaProfesional({ p, ocupado, hacer }: {
  p: ProfesionalAdmin;
  ocupado: boolean;
  hacer: (fn: () => Promise<{ ok: boolean; error?: string }>, confirmar?: string) => void;
}) {
  const colores: Record<string, [string, string]> = {
    postulado: ["var(--gold-100)", "var(--gold-700)"],
    aprobado: ["var(--success-bg)", "var(--success)"],
    rechazado: ["var(--danger-bg)", "var(--danger)"],
    oculto: ["var(--fill-100)", "var(--ink-600)"],
  };
  const [bg, color] = colores[p.estado];
  return (
    <div style={{ ...caja, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--font-sans)", color: "var(--navy-800)" }}>{p.nombre}</strong>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: bg, color, marginLeft: 8 }}>{p.estado}</span>
        {p.recomendado && <span style={{ ...meta, marginLeft: 8, color: "var(--gold-700)" }}>★ recomendado</span>}
        <div style={meta}>
          {rubroPorValor(p.rubro)?.nombre} · {p.zona}{p.matricula ? ` · Mat. ${p.matricula}` : ""} · {p.origen === "curado" ? "alta curada" : "postulación"}
        </div>
        <div style={meta}>{[p.telefono, p.email, p.web].filter(Boolean).join(" · ")}</div>
        {p.descripcion && <div style={{ ...meta, marginTop: 4, fontStyle: "italic" }}>«{p.descripcion}»</div>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {p.estado !== "aprobado" && (
          <Boton disabled={ocupado} onClick={() => hacer(() => cambiarEstadoProfesional(p.id, "aprobado"))}><BadgeCheck size={13} /> Aprobar</Boton>
        )}
        {p.estado === "postulado" && (
          <Boton peligro disabled={ocupado} onClick={() => hacer(() => cambiarEstadoProfesional(p.id, "rechazado"))}>Rechazar</Boton>
        )}
        {p.estado === "aprobado" && (
          <>
            <Boton disabled={ocupado} onClick={() => hacer(() => alternarRecomendado(p.id, !p.recomendado))}>
              {p.recomendado ? "Quitar recomendado" : "Recomendar"}
            </Boton>
            <Boton disabled={ocupado} onClick={() => hacer(() => cambiarEstadoProfesional(p.id, "oculto"))}><EyeOff size={13} /> Pausar</Boton>
          </>
        )}
        <Boton peligro disabled={ocupado} onClick={() => hacer(() => borrarProfesional(p.id), `¿Borrar a ${p.nombre} de la red?`)}><Trash2 size={13} /></Boton>
      </div>
    </div>
  );
}
