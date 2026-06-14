"use client";

import { useState, useTransition } from "react";
import { Save, Check, Plus, Trash2, Search } from "lucide-react";
import { updatePrecioBarrio, saveConfig } from "@/lib/actions/estimador";
import type { EstimadorConfig, Factor } from "@/lib/estimador/types";

const inp: React.CSSProperties = {
  border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "8px 10px", fontSize: 13.5, fontFamily: "var(--font-sans)", outline: "none", width: "100%",
};
const sectionCard: React.CSSProperties = {
  background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)",
  padding: "clamp(18px,3vw,28px)", marginBottom: 20,
};
const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--navy-800)", margin: "0 0 4px",
};

type PrecioRow = { barrio: string; precio: number };

export default function EstimadorAdmin({ initialPrecios, initialConfig }: {
  initialPrecios: PrecioRow[]; initialConfig: EstimadorConfig;
}) {
  const [tab, setTab] = useState<"precios" | "coeficientes">("precios");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([["precios", "Precios por barrio"], ["coeficientes", "Coeficientes"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
            padding: "9px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: tab === k ? "var(--navy-800)" : "#fff",
            color: tab === k ? "#fff" : "var(--ink-600)",
            border: `1px solid ${tab === k ? "var(--navy-800)" : "var(--line-200)"}`,
          }}>{l}</button>
        ))}
      </div>

      {tab === "precios" ? <PreciosEditor rows={initialPrecios} /> : <ConfigEditor config={initialConfig} />}
    </div>
  );
}

// ── Precios por barrio ─────────────────────────────────────────
function PreciosEditor({ rows }: { rows: PrecioRow[] }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(rows.map(r => [r.barrio, r.precio]))
  );
  const [saved, setSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function save(barrio: string) {
    startTransition(async () => {
      const r = await updatePrecioBarrio(barrio, values[barrio]);
      if (r.ok) { setSaved(barrio); setTimeout(() => setSaved(null), 1500); }
    });
  }

  const filtered = rows.filter(r => r.barrio.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={sectionCard}>
      <h2 style={h2}>Precios base por m² (USD)</h2>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 16px" }}>
        Editá el valor y guardá cada barrio. Estos precios son la base del cálculo.
      </p>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }} />
        <input style={{ ...inp, paddingLeft: 34 }} placeholder="Buscar barrio…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
        {filtered.map(r => (
          <div key={r.barrio} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-700)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.barrio}</span>
            <input
              type="number"
              style={{ ...inp, width: 90 }}
              value={values[r.barrio]}
              onChange={e => setValues(v => ({ ...v, [r.barrio]: Number(e.target.value) }))}
            />
            <button onClick={() => save(r.barrio)} disabled={isPending} title="Guardar" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: "var(--radius-sm)", cursor: "pointer", flexShrink: 0,
              background: saved === r.barrio ? "#15803D" : "var(--navy-800)", color: "#fff", border: "none",
            }}>
              {saved === r.barrio ? <Check size={15} /> : <Save size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editor de coeficientes ─────────────────────────────────────
function ConfigEditor({ config: initial }: { config: EstimadorConfig }) {
  const [config, setConfig] = useState<EstimadorConfig>(structuredClone(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(fn: (c: EstimadorConfig) => void) {
    setConfig(prev => { const next = structuredClone(prev); fn(next); return next; });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveConfig(config);
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else setError(r.error || "Error al guardar.");
    });
  }

  return (
    <div>
      {/* Globales */}
      <div style={sectionCard}>
        <h2 style={h2}>Parámetros generales</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14, marginTop: 14 }}>
          <NumField label="Factor m² balcón (semicubierto)" value={config.superficieSemicubiertaFactor ?? 0.5} step={0.05}
            onChange={v => update(c => { c.superficieSemicubiertaFactor = v; })} />
          <NumField label="Factor m² patio/terraza (descubiertos)" value={config.superficieDescubiertaFactor} step={0.05}
            onChange={v => update(c => { c.superficieDescubiertaFactor = v; })} />
          <NumField label="Tope mínimo del índice" value={config.topeMin} step={0.05}
            onChange={v => update(c => { c.topeMin = v; })} />
          <NumField label="Tope máximo del índice" value={config.topeMax} step={0.05}
            onChange={v => update(c => { c.topeMax = v; })} />
          <NumField label="Rango confianza alta (±)" value={config.rango.alta} step={0.01}
            onChange={v => update(c => { c.rango.alta = v; })} />
          <NumField label="Rango confianza media (±)" value={config.rango.media} step={0.01}
            onChange={v => update(c => { c.rango.media = v; })} />
          <NumField label="Rango confianza baja (±)" value={config.rango.baja} step={0.01}
            onChange={v => update(c => { c.rango.baja = v; })} />
        </div>

        <h2 style={{ ...h2, marginTop: 22 }}>Condición de obra (multiplica el $/m²)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginTop: 14 }}>
          <NumField label="Usado" value={config.estadoObra?.usado ?? 1} step={0.01}
            onChange={v => update(c => { c.estadoObra = { ...(c.estadoObra ?? { usado: 1, a_estrenar: 1.28, pozo: 1.18 }), usado: v }; })} />
          <NumField label="A estrenar" value={config.estadoObra?.a_estrenar ?? 1.28} step={0.01}
            onChange={v => update(c => { c.estadoObra = { ...(c.estadoObra ?? { usado: 1, a_estrenar: 1.28, pozo: 1.18 }), a_estrenar: v }; })} />
          <NumField label="En pozo" value={config.estadoObra?.pozo ?? 1.18} step={0.01}
            onChange={v => update(c => { c.estadoObra = { ...(c.estadoObra ?? { usado: 1, a_estrenar: 1.28, pozo: 1.18 }), pozo: v }; })} />
        </div>
      </div>

      {/* Factores */}
      {config.factores.map((factor, fi) => (
        <FactorEditor key={factor.id} factor={factor}
          onChange={(fn) => update(c => fn(c.factores[fi]))}
          onRemove={() => update(c => { c.factores.splice(fi, 1); })}
        />
      ))}

      {/* Guardar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--cream)", padding: "16px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={save} disabled={isPending} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          padding: "13px 28px", borderRadius: "var(--radius-sm)", cursor: "pointer",
          background: saved ? "#15803D" : "var(--navy-800)", color: "#fff", border: "none",
        }}>
          {saved ? <Check size={16} /> : <Save size={15} />}
          {saved ? "Guardado" : isPending ? "Guardando…" : "Guardar configuración"}
        </button>
        {error && <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626" }}>{error}</span>}
      </div>
    </div>
  );
}

function FactorEditor({ factor, onChange, onRemove }: {
  factor: Factor; onChange: (fn: (f: Factor) => void) => void; onRemove: () => void;
}) {
  return (
    <div style={{ ...sectionCard, opacity: factor.activo ? 1 : 0.55 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h2 style={{ ...h2, margin: 0 }}>{factor.label}</h2>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)" }}>{factor.tipo} · {factor.input}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)" }}>
            <input type="checkbox" checked={factor.activo} onChange={e => onChange(f => { f.activo = e.target.checked; })} />
            Activo
          </label>
          <button onClick={onRemove} title="Quitar factor" style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Booleano */}
      {factor.tipo === "booleano" && (
        <div style={{ display: "flex", gap: 14 }}>
          <NumField label="Coef. si tiene" value={factor.coefTrue ?? 1} step={0.01} onChange={v => onChange(f => { f.coefTrue = v; })} />
          <NumField label="Coef. si no" value={factor.coefFalse ?? 1} step={0.01} onChange={v => onChange(f => { f.coefFalse = v; })} />
        </div>
      )}

      {/* Opción */}
      {factor.tipo === "opcion" && factor.opciones && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(factor.opciones).map(([key, opt]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-600)", flex: 1 }}>{opt.label} <span style={{ color: "var(--ink-400)" }}>({key})</span></span>
              <input type="number" step={0.01} style={{ ...inp, width: 90 }} value={opt.coef}
                onChange={e => onChange(f => { f.opciones![key].coef = Number(e.target.value); })} />
            </div>
          ))}
        </div>
      )}

      {/* Rango */}
      {factor.tipo === "rango" && factor.rangos && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {factor.rangos.map((r, ri) => (
            <div key={ri} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...inp, width: 70 }} type="number" placeholder="min" value={r.min ?? ""} onChange={e => onChange(f => { f.rangos![ri].min = e.target.value === "" ? undefined : Number(e.target.value); })} />
              <input style={{ ...inp, width: 70 }} type="number" placeholder="max" value={r.max ?? ""} onChange={e => onChange(f => { f.rangos![ri].max = e.target.value === "" ? undefined : Number(e.target.value); })} />
              <input style={{ ...inp, flex: 1, minWidth: 120 }} placeholder="etiqueta" value={r.label} onChange={e => onChange(f => { f.rangos![ri].label = e.target.value; })} />
              <input style={{ ...inp, width: 80 }} type="number" step={0.01} placeholder="coef" value={r.coef} onChange={e => onChange(f => { f.rangos![ri].coef = Number(e.target.value); })} />
              <button onClick={() => onChange(f => { f.rangos!.splice(ri, 1); })} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={() => onChange(f => { f.rangos!.push({ coef: 1, label: "Nuevo tramo" }); })} style={{
            alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--navy-700)",
            background: "var(--navy-50)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 12px", cursor: "pointer",
          }}><Plus size={13} /> Agregar tramo</button>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, step = 0.01 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--ink-600)", marginBottom: 5 }}>{label}</label>
      <input type="number" step={step} style={inp} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}
