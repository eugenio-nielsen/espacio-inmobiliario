"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, MapPin } from "lucide-react";
import { ubicarParaZona } from "@/lib/actions/estimador";
import { BARRIOS_CABA } from "@/lib/ubicaciones";
import type { ZonaMicro } from "@/lib/estimador/types";
import type { Enfoque } from "@/components/map/MapaSelector";
import "@/components/panel/ubicacion.css";

const MapaSelector = dynamic(() => import("@/components/map/MapaSelector"), {
  ssr: false,
  loading: () => <div className="ub-mapa ub-cargando" style={{ height: 280 }}>Cargando mapa…</div>,
});

const inp: React.CSSProperties = {
  border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "8px 10px", fontSize: 13.5, fontFamily: "var(--font-sans)", outline: "none", width: "100%",
};
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--ink-600)", marginBottom: 5,
};
const botonSec: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
  color: "var(--navy-700)", background: "var(--navy-50)", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 12px", cursor: "pointer",
};

const CENTRO_CABA: Enfoque = { lat: -34.6037, lng: -58.4, zoom: 12, n: 0 };
const usd = (n: number) => new Intl.NumberFormat("es-AR").format(Math.round(n));

/**
 * Zonas dentro de los barrios: círculos donde el m² vale distinto del
 * promedio del barrio. Si la dirección que cargó la persona cae adentro,
 * el precio de referencia se multiplica por el coeficiente de la zona.
 * Se guardan junto con el resto de la config del estimador.
 */
export default function ZonasEditor({
  zonas,
  precios,
  onChange,
}: {
  zonas: ZonaMicro[];
  precios: { barrio: string; precio: number }[];
  onChange: (fn: (z: ZonaMicro[]) => void) => void;
}) {
  const [abierta, setAbierta] = useState<string | null>(null);

  function agregar() {
    const id = `z${Date.now().toString(36)}`;
    onChange(z => {
      z.push({ id, nombre: "Nueva zona", barrio: BARRIOS_CABA[0], lat: CENTRO_CABA.lat, lng: CENTRO_CABA.lng, radioM: 500, coef: 1, activa: true });
    });
    setAbierta(id);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,3vw,28px)", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--navy-800)", margin: "0 0 4px" }}>
        Zonas dentro de los barrios
      </h2>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "0 0 14px", lineHeight: 1.6 }}>
        Dentro de un mismo barrio el m² cambia de una zona a otra. Cada zona es un círculo: si la dirección que cargó la persona cae
        adentro, el precio del barrio se multiplica por el coeficiente. Fuera de toda zona, o sin dirección, se usa el promedio del
        barrio. Los barrios con zonas cargadas cuentan la dirección en la precisión de la estimación.
      </p>

      {zonas.length === 0 && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-400)", margin: "0 0 14px" }}>
          Todavía no hay zonas: hoy la dirección se ubica y se registra, pero no cambia el valor.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {zonas.map((z, i) => {
          const base = precios.find(p => p.barrio === z.barrio)?.precio;
          return (
            <div key={z.id} style={{ border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: 14, opacity: z.activa ? 1 : 0.55 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={lbl}>Nombre de la zona</label>
                  <input style={inp} value={z.nombre} onChange={e => onChange(l => { l[i].nombre = e.target.value; })} />
                </div>
                <div>
                  <label style={lbl}>Barrio</label>
                  <select style={inp} value={z.barrio} onChange={e => onChange(l => { l[i].barrio = e.target.value; })}>
                    {BARRIOS_CABA.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Coeficiente (1,10 = +10%)</label>
                  <input type="number" step={0.01} style={inp} value={z.coef} onChange={e => onChange(l => { l[i].coef = Number(e.target.value); })} />
                </div>
                <div>
                  <label style={lbl}>Radio (metros)</label>
                  <input type="number" step={50} style={inp} value={z.radioM} onChange={e => onChange(l => { l[i].radioM = Number(e.target.value); })} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)" }}>
                  {base
                    ? <>Valor resultante: <b>US$ {usd(base * z.coef)}/m²</b> (promedio del barrio: US$ {usd(base)})</>
                    : "Este barrio no tiene precio base cargado"}
                </span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-600)" }}>
                  <input type="checkbox" checked={z.activa} onChange={e => onChange(l => { l[i].activa = e.target.checked; })} /> Activa
                </label>
                <button type="button" onClick={() => setAbierta(abierta === z.id ? null : z.id)} style={botonSec}>
                  <MapPin size={13} /> {abierta === z.id ? "Cerrar mapa" : "Ubicar en el mapa"}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(l => { l.splice(i, 1); })}
                  title="Quitar zona"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4, marginLeft: "auto" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {abierta === z.id && (
                <ZonaMapa zona={z} onElegir={(lat, lng) => onChange(l => { l[i].lat = lat; l[i].lng = lng; })} />
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={agregar} style={{ ...botonSec, marginTop: 14 }}>
        <Plus size={13} /> Agregar zona
      </button>
    </div>
  );
}

function ZonaMapa({ zona, onElegir }: { zona: ZonaMicro; onElegir: (lat: number, lng: number) => void }) {
  const [direccion, setDireccion] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // El mapa arranca en el centro de la zona (o en la ciudad, si es nueva) y solo se mueve al buscar
  const [enfoque, setEnfoque] = useState<Enfoque>({
    lat: zona.lat, lng: zona.lng, zoom: zona.lat === CENTRO_CABA.lat ? 12 : 15, n: 0,
  });

  function buscar() {
    if (!direccion.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const r = await ubicarParaZona(direccion, zona.barrio);
      if (r.ok) {
        onElegir(r.lat, r.lng);
        setEnfoque(e => ({ lat: r.lat, lng: r.lng, zoom: 16, n: e.n + 1 }));
      } else {
        setMsg(r.error);
      }
    });
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          style={inp}
          placeholder="Buscar una dirección del centro de la zona (ej.: Honduras 5000)"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }}
        />
        <button type="button" onClick={buscar} disabled={isPending} style={botonSec}>
          {isPending ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {msg && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#DC2626", margin: "0 0 8px" }}>{msg}</p>}
      <MapaSelector
        pos={{ lat: zona.lat, lng: zona.lng }}
        aproximada={false}
        radio={zona.radioM}
        enfoque={enfoque}
        onElegir={onElegir}
        height={280}
      />
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-400)", margin: "6px 0 0" }}>
        Tocá el mapa o arrastrá el pin para marcar el centro. El círculo muestra el radio de la zona.
      </p>
    </div>
  );
}
