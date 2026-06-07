"use client";

import { useState, useTransition } from "react";
import {
  MapPin, Home, Sparkles, ArrowRight, ArrowLeft, Loader2,
  TrendingUp, TrendingDown, Check, RefreshCw, Building2,
} from "lucide-react";
import { guardarLead } from "@/lib/actions/estimador";
import type { EstimadorInput, EstimadorResultado } from "@/lib/estimador/types";

const ESTADOS = [
  { v: "a_reciclar", l: "A reciclar" },
  { v: "bueno", l: "Bueno" },
  { v: "muy_bueno", l: "Muy bueno" },
  { v: "a_estrenar", l: "A estrenar" },
] as const;

const DISPOSICIONES = [
  { v: "frente", l: "Frente" },
  { v: "contrafrente", l: "Contrafrente" },
  { v: "interno", l: "Interno" },
] as const;

const CATEGORIAS = [
  { v: "regular", l: "Regular" },
  { v: "estandar", l: "Estándar" },
  { v: "premium", l: "Premium" },
] as const;

const ORIENTACIONES = ["", "Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];

const AMENITIES = [
  { k: "pileta", l: "Piscina" },
  { k: "sum", l: "SUM" },
  { k: "gimnasio", l: "Gimnasio" },
  { k: "seguridad", l: "Seguridad 24h" },
  { k: "parrilla", l: "Parrilla" },
] as const;

// Características especiales: cada una con su leyenda. Las claves deben ser
// campos booleanos de EstimadorInput.
const ESPECIALES: { k: "vecinosEspeciales"; label: string; legend: string }[] = [
  {
    k: "vecinosEspeciales",
    label: "Vecinos especiales",
    legend: "Marcá esta opción si la propiedad está a menos de 3 cuadras de estaciones de bomberos, cementerios, hospitales o terminales de transporte.",
  },
];

const CONFIANZA_STYLE = {
  alta:  { l: "Alta",  bg: "#F0FDF4", color: "#15803D", dot: "#22c55e" },
  media: { l: "Media", bg: "#FFFBEB", color: "#B45309", dot: "#f59e0b" },
  baja:  { l: "Baja",  bg: "#FEF2F2", color: "#B91C1C", dot: "#ef4444" },
};

const fmtUSD = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)}`;

const defaultInput: EstimadorInput = {
  barrio: "", direccion: "",
  m2Cubiertos: 0, m2Semicubierto: 0, m2Descubiertos: 0,
  ambientes: undefined, dormitorios: undefined, banos: 1,
  antiguedad: 0, estado: "bueno", piso: 0, ultimoPiso: false,
  disposicion: "frente", orientacion: "", cochera: false, baulera: false,
  vecinosEspeciales: false,
  categoria: "estandar",
  amenities: { pileta: false, sum: false, gimnasio: false, seguridad: false, parrilla: false },
};

// ── estilos compartidos ───────────────────────────────────────
const card: React.CSSProperties = {
  background: "#fff", border: "1px solid var(--line-200)",
  borderRadius: "var(--radius-lg)", padding: "clamp(24px,4vw,40px)",
  boxShadow: "var(--shadow-sm)",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 13,
  fontWeight: 600, color: "var(--ink-700)", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "11px 14px", fontSize: 14, fontFamily: "var(--font-sans)",
  outline: "none", background: "#fff", color: "var(--ink-900)",
};

export default function EstimadorWizard({ barrios }: { barrios: string[] }) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<EstimadorInput>(defaultInput);
  const [result, setResult] = useState<EstimadorResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EstimadorInput>(key: K, value: EstimadorInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }));
  }
  function setAmenity(k: keyof EstimadorInput["amenities"], v: boolean) {
    setInput(prev => ({ ...prev, amenities: { ...prev.amenities, [k]: v } }));
  }

  async function calcular() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/estimador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "No se pudo calcular la estimación.");
        setLoading(false);
        return;
      }
      setResult(data as EstimadorResultado);
      setStep(3);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    }
    setLoading(false);
  }

  function reset() {
    setInput(defaultInput);
    setResult(null);
    setStep(1);
    setError(null);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <StepIndicator step={step} />

      {/* ── Paso 1: Ubicación ─────────────────────────────────── */}
      {step === 1 && (
        <div style={card}>
          <StepTitle icon={<MapPin size={20} />} title="Ubicación" subtitle="¿Dónde está el departamento?" />
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Barrio *</label>
            <select style={inputStyle} value={input.barrio} onChange={e => set("barrio", e.target.value)}>
              <option value="">Seleccioná un barrio</option>
              {barrios.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Dirección <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>(opcional)</span></label>
            <input style={inputStyle} type="text" value={input.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Ej: Av. Santa Fe 1234" />
          </div>

          <NavRow
            onNext={() => { if (!input.barrio) { setError("Elegí un barrio para continuar."); return; } setError(null); setStep(2); }}
            nextLabel="Continuar"
            error={error}
          />
        </div>
      )}

      {/* ── Paso 2: Características ─────────────────────────────── */}
      {step === 2 && (
        <div style={card}>
          <StepTitle icon={<Home size={20} />} title="Características" subtitle="Contanos sobre el departamento" />

          {/* ── a) Características de la unidad ──────────────────── */}
          <SubHeader icon={<Home size={15} />} title="Características de la unidad" />
          <div className="est-grid2" style={{ marginBottom: 26 }}>
            <Field label="M² cubiertos *">
              <input style={inputStyle} type="number" min={1} value={input.m2Cubiertos || ""} onChange={e => set("m2Cubiertos", Number(e.target.value))} placeholder="Ej: 65" />
            </Field>
            <Field label="M² balcón (semicubierto)">
              <input style={inputStyle} type="number" min={0} value={input.m2Semicubierto || ""} onChange={e => set("m2Semicubierto", Number(e.target.value))} placeholder="Ej: 6" />
            </Field>
            <Field label="M² patio o terraza (descubiertos)">
              <input style={inputStyle} type="number" min={0} value={input.m2Descubiertos || ""} onChange={e => set("m2Descubiertos", Number(e.target.value))} placeholder="Ej: 20" />
            </Field>
            <Field label="Ambientes">
              <input style={inputStyle} type="number" min={1} value={input.ambientes || ""} onChange={e => set("ambientes", Number(e.target.value) || undefined)} placeholder="Ej: 3" />
            </Field>
            <Field label="Dormitorios">
              <input style={inputStyle} type="number" min={0} value={input.dormitorios ?? ""} onChange={e => set("dormitorios", Number(e.target.value) || undefined)} placeholder="Ej: 2" />
            </Field>
            <Field label="Baños">
              <input style={inputStyle} type="number" min={1} value={input.banos || ""} onChange={e => set("banos", Number(e.target.value))} placeholder="Ej: 1" />
            </Field>
            <Field label="Piso (0 = PB)">
              <input style={inputStyle} type="number" min={0} value={input.piso || ""} onChange={e => set("piso", Number(e.target.value))} placeholder="Ej: 5" />
            </Field>
            <Field label="Orientación">
              <select style={inputStyle} value={input.orientacion} onChange={e => set("orientacion", e.target.value)}>
                {ORIENTACIONES.map(o => <option key={o} value={o.toLowerCase()}>{o || "Sin especificar"}</option>)}
              </select>
            </Field>
            <Field label="Disposición">
              <select style={inputStyle} value={input.disposicion} onChange={e => set("disposicion", e.target.value as EstimadorInput["disposicion"])}>
                {DISPOSICIONES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
          </div>

          {/* ── b) Características del edificio ──────────────────── */}
          <SubHeader icon={<Building2 size={15} />} title="Características del edificio" />
          <div className="est-grid2" style={{ marginBottom: 18 }}>
            <Field label="Antigüedad (años)">
              <input style={inputStyle} type="number" min={0} value={input.antiguedad || ""} onChange={e => set("antiguedad", Number(e.target.value))} placeholder="0 = a estrenar" />
            </Field>
            <Field label="Estado de conservación">
              <select style={inputStyle} value={input.estado} onChange={e => set("estado", e.target.value as EstimadorInput["estado"])}>
                {ESTADOS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
            <Field label="Categoría del edificio">
              <select style={inputStyle} value={input.categoria} onChange={e => set("categoria", e.target.value as EstimadorInput["categoria"])}>
                {CATEGORIAS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <Toggle label="Cochera" on={input.cochera} onClick={() => set("cochera", !input.cochera)} />
            <Toggle label="Baulera" on={input.baulera} onClick={() => set("baulera", !input.baulera)} />
            <Toggle label="Último piso" on={input.ultimoPiso} onClick={() => set("ultimoPiso", !input.ultimoPiso)} />
          </div>

          {/* Amenities */}
          <label style={labelStyle}>Amenities</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {AMENITIES.map(a => (
              <Toggle key={a.k} label={a.l} on={input.amenities[a.k]} onClick={() => setAmenity(a.k, !input.amenities[a.k])} />
            ))}
          </div>

          {/* ── c) Características especiales ────────────────────── */}
          <div style={{ marginTop: 26 }}>
            <SubHeader icon={<Sparkles size={15} />} title="Características especiales" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ESPECIALES.map(esp => (
                <div key={esp.k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Toggle
                    label={esp.label}
                    on={input[esp.k] as boolean}
                    onClick={() => set(esp.k, !(input[esp.k] as boolean))}
                  />
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", margin: 0, lineHeight: 1.5 }}>
                    {esp.legend}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <NavRow
            onBack={() => { setError(null); setStep(1); }}
            onNext={() => { if (!input.m2Cubiertos || input.m2Cubiertos <= 0) { setError("Ingresá los metros cubiertos."); return; } setError(null); calcular(); }}
            nextLabel={loading ? "Calculando…" : "Calcular estimación"}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* ── Paso 3: Resultado ─────────────────────────────────── */}
      {step === 3 && result && (
        <ResultadoView input={input} result={result} onReset={reset} />
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ["Ubicación", "Características", "Resultado"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step, done = n < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 26, height: 26, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5,
                background: active || done ? "var(--navy-800)" : "var(--line-100)",
                color: active || done ? "#fff" : "var(--ink-400)",
                border: active ? "2px solid var(--gold-500)" : "2px solid transparent",
              }}>
                {done ? <Check size={13} strokeWidth={3} /> : n}
              </span>
              <span style={{
                fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: active ? 700 : 500,
                color: active ? "var(--navy-800)" : "var(--ink-400)",
              }} className="estimador-step-label">{label}</span>
            </div>
            {i < steps.length - 1 && <span style={{ width: 24, height: 1.5, background: "var(--line-200)" }} />}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--navy-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy-700)", flexShrink: 0 }}>
        {icon}
      </span>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--navy-800)", margin: 0 }}>{title}</h2>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

function SubHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--line-100)" }}>
      <span style={{ color: "var(--gold-600)", display: "flex" }}>{icon}</span>
      <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--navy-700)", margin: 0 }}>
        {title}
      </h3>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
      padding: "9px 16px", borderRadius: 999, cursor: "pointer",
      border: `1.5px solid ${on ? "var(--navy-800)" : "var(--line-200)"}`,
      background: on ? "var(--navy-800)" : "#fff",
      color: on ? "#fff" : "var(--ink-600)",
      transition: "all .15s",
    }}>
      {on && <Check size={13} strokeWidth={3} />}
      {label}
    </button>
  );
}

function NavRow({ onBack, onNext, nextLabel, loading, error }: {
  onBack?: () => void; onNext: () => void; nextLabel: string; loading?: boolean; error?: string | null;
}) {
  return (
    <>
      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626", background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", marginTop: 20, marginBottom: 0 }}>{error}</p>
      )}
      <div style={{ display: "flex", justifyContent: onBack ? "space-between" : "flex-end", marginTop: 24, gap: 12 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            padding: "12px 20px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: "var(--line-100)", border: "1px solid var(--line-200)", color: "var(--ink-600)",
          }}>
            <ArrowLeft size={15} /> Atrás
          </button>
        )}
        <button type="button" onClick={onNext} disabled={loading} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          padding: "12px 26px", borderRadius: "var(--radius-sm)",
          cursor: loading ? "not-allowed" : "pointer",
          background: "var(--navy-800)", color: "#fff", border: "none",
        }}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {nextLabel}
          {!loading && <ArrowRight size={15} />}
        </button>
      </div>
    </>
  );
}

// ── Resultado ──────────────────────────────────────────────────
function ResultadoView({ input, result, onReset }: { input: EstimadorInput; result: EstimadorResultado; onReset: () => void }) {
  const conf = CONFIANZA_STYLE[result.confianza];
  return (
    <div>
      {/* Card principal */}
      <div style={{ ...card, background: "var(--navy-800)", border: "none", color: "#fff", textAlign: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.7)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".08em" }}>
          Valor estimado
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(34px,7vw,52px)", color: "#fff", margin: "0 0 10px", lineHeight: 1 }}>
          {fmtUSD(result.estimado)}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--gold-300)", margin: "0 0 20px" }}>
          Rango sugerido: {fmtUSD(result.rangoMin)} — {fmtUSD(result.rangoMax)}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          <Chip label="Valor por m²" value={fmtUSD(result.precioM2Resultante)} />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
            background: conf.bg, color: conf.color, padding: "8px 14px", borderRadius: 999,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: conf.dot }} />
            Confianza {conf.l}
          </span>
        </div>
      </div>

      {/* Factores */}
      <div style={{ marginBottom: 16 }} className="estimador-factores">
        <FactoresCard title="Factores positivos" icon={<TrendingUp size={16} />} color="#15803D" factores={result.factoresPositivos} empty="Sin factores que sumen valor" />
        <FactoresCard title="Factores negativos" icon={<TrendingDown size={16} />} color="#B91C1C" factores={result.factoresNegativos} empty="Sin factores que resten valor" />
      </div>

      {/* Lead form */}
      <LeadForm input={input} result={result} />

      {/* Disclaimer */}
      <div style={{ background: "var(--cream)", border: "1px solid var(--gold-200)", borderRadius: "var(--radius-md)", padding: "16px 18px", marginTop: 16 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: "var(--ink-700)" }}>Importante:</strong> Esta estimación es orientativa y no constituye una tasación profesional.
          Los valores pueden variar según condiciones particulares del inmueble, la demanda del mercado y el momento de comercialización.
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button type="button" onClick={onReset} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
          padding: "11px 22px", borderRadius: "var(--radius-sm)", cursor: "pointer",
          background: "#fff", border: "1px solid var(--line-200)", color: "var(--navy-800)",
        }}>
          <RefreshCw size={14} /> Hacer otra estimación
        </button>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,.08)", padding: "8px 16px", borderRadius: 12 }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(255,255,255,.6)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "#fff" }}>{value}</span>
    </span>
  );
}

function FactoresCard({ title, icon, color, factores, empty }: {
  title: string; icon: React.ReactNode; color: string;
  factores: EstimadorResultado["factoresPositivos"]; empty: string;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color }}>
        {icon}
        <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--ink-800)", margin: 0 }}>{title}</h3>
      </div>
      {factores.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-400)", margin: 0 }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {factores.map((f, i) => {
            const pct = Math.round((f.coef - 1) * 100);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-700)" }}>
                  {f.label}: <span style={{ color: "var(--ink-500)" }}>{f.detalle}</span>
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color, whiteSpace: "nowrap" }}>
                  {pct > 0 ? "+" : ""}{pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeadForm({ input, result }: { input: EstimadorInput; result: EstimadorResultado }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!form.nombre || !form.email) { setError("Completá nombre y email."); return; }
    setError(null);
    startTransition(async () => {
      const r = await guardarLead({
        input, resultado: result, barrio: input.barrio,
        nombre: form.nombre, email: form.email, telefono: form.telefono,
      });
      if (r.ok) setSent(true);
      else setError(r.error || "No se pudo enviar.");
    });
  }

  if (sent) {
    return (
      <div style={{ ...card, background: "#F0FDF4", border: "1px solid #BBF7D0", textAlign: "center" }}>
        <Check size={28} strokeWidth={2.5} color="#15803D" style={{ marginBottom: 8 }} />
        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "#15803D", margin: "0 0 4px" }}>¡Solicitud enviada!</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-600)", margin: 0 }}>
          Eugenio, martillero público matriculado, va a revisar tu estimación y se va a contactar con vos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...card, background: "var(--cream)" }}>
      <div style={{ marginBottom: open ? 18 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={18} color="var(--gold-600)" style={{ flexShrink: 0 }} />
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--navy-800)", margin: 0 }}>
            ¿Querés una valuación profesional?
          </p>
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 14px", lineHeight: 1.55 }}>
          Un martillero público matriculado revisa tu estimación sin cargo.
        </p>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
            padding: "12px 22px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: "var(--navy-800)", color: "#fff", border: "none",
          }}>
            Quiero que la revisen
          </button>
        )}
      </div>

      {open && (
        <div>
          <div style={{ marginBottom: 12 }} className="estimador-lead-grid">
            <input style={inputStyle} placeholder="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <input style={inputStyle} placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Teléfono / WhatsApp (opcional)" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626", margin: "0 0 12px" }}>{error}</p>}
          <button type="button" onClick={submit} disabled={isPending} style={{
            width: "100%", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
            padding: "13px", borderRadius: "var(--radius-sm)", cursor: isPending ? "not-allowed" : "pointer",
            background: "var(--navy-800)", color: "#fff", border: "none",
          }}>
            {isPending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      )}
    </div>
  );
}
