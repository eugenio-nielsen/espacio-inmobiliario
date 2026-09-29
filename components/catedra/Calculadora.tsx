"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Link2, Printer } from "lucide-react";
import { calcularCostos, type CostosConfig, type EntradaCostos, type Linea, type Moneda } from "@/lib/catedra/costos";

/**
 * Calculadora de costos de una compraventa en CABA, para las dos partes.
 *
 * A la izquierda, los datos de la operación; a la derecha, la
 * "liquidación": cada línea con su cálculo y, al tocar la (i), de dónde
 * sale (la norma o la costumbre de plaza). Es material de estudio y
 * también de trabajo: se imprime o se guarda en PDF con membrete para
 * dárselo a un cliente, y el enlace guarda los datos cargados.
 */

const nf = (max = 0) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: max });
const dinero = (n: number, m: Moneda) => `${m === "USD" ? "US$" : "$"} ${nf().format(Math.round(n))}`;

/** Entero con separadores de miles mientras se escribe. */
function CampoNumero({
  valor,
  onCambio,
  prefijo,
  grande,
  etiqueta,
  placeholder,
}: {
  valor: number | null;
  onCambio: (n: number | null) => void;
  prefijo: string;
  grande?: boolean;
  etiqueta: string;
  placeholder?: string;
}) {
  return (
    <span className={`cat-input${grande ? " cat-input-grande" : ""}`}>
      <span>{prefijo}</span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={etiqueta}
        placeholder={placeholder}
        value={valor === null ? "" : nf().format(valor)}
        onChange={e => {
          const digitos = e.target.value.replace(/\D/g, "").slice(0, 13);
          onCambio(digitos ? Number(digitos) : null);
        }}
      />
    </span>
  );
}

/** Porcentaje con coma decimal ("3,5"). */
function CampoPorcentaje({ valor, onCambio, etiqueta }: { valor: number; onCambio: (n: number) => void; etiqueta: string }) {
  const [texto, setTexto] = useState(String(valor).replace(".", ","));
  useEffect(() => { setTexto(t => (Number(t.replace(",", ".")) === valor ? t : String(valor).replace(".", ","))); }, [valor]);
  return (
    <span className="cat-input">
      <input
        type="text"
        inputMode="decimal"
        aria-label={etiqueta}
        value={texto}
        onChange={e => {
          const limpio = e.target.value.replace(/[^\d,.]/g, "").replace(".", ",").slice(0, 5);
          setTexto(limpio);
          const n = Number(limpio.replace(",", "."));
          if (Number.isFinite(n) && n >= 0 && n <= 20) onCambio(n);
        }}
      />
      <span>%</span>
    </span>
  );
}

function Opciones<T extends string | boolean>({ valor, opciones, onCambio, etiqueta }: {
  valor: T;
  opciones: [T, string][];
  onCambio: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div className="cat-opciones" role="group" aria-label={etiqueta}>
      {opciones.map(([v, l]) => (
        <button key={String(v)} type="button" aria-pressed={valor === v} onClick={() => onCambio(v)}>{l}</button>
      ))}
    </div>
  );
}

type Estado = {
  precio: number | null;
  moneda: Moneda;
  tipoCambio: number | null;
  viviendaUnica: boolean;
  vir: number | null;
  conInmobiliaria: boolean;
  honorariosComprador: number;
  honorariosVendedor: number;
  ivaHonorarios: boolean;
  honorariosEscribano: number;
  conCredito: boolean;
  credito: number | null;
};

function inicial(c: CostosConfig): Estado {
  return {
    precio: 150000,
    moneda: "USD",
    tipoCambio: c.tipoCambio,
    viviendaUnica: true,
    vir: null,
    conInmobiliaria: true,
    honorariosComprador: c.inmobiliaria.comprador,
    honorariosVendedor: c.inmobiliaria.vendedor,
    ivaHonorarios: true,
    honorariosEscribano: c.escribania.honorarios,
    conCredito: false,
    credito: null,
  };
}

// El estado viaja en la URL: el enlace copiado reabre la misma cuenta
const CLAVES: Record<keyof Estado, string> = {
  precio: "p", moneda: "m", tipoCambio: "tc", viviendaUnica: "vu", vir: "vir", conInmobiliaria: "inmo",
  honorariosComprador: "hc", honorariosVendedor: "hv", ivaHonorarios: "iva", honorariosEscribano: "esc",
  conCredito: "cc", credito: "cr",
};

/** El estado desde la consulta de la URL. Corre igual en el servidor y en el cliente. */
function leerConsulta(base: Estado, consulta: string): Estado {
  const q = new URLSearchParams(consulta);
  if (!q.has("p")) return base;
  const num = (k: string, def: number | null) => {
    const v = q.get(k);
    if (v === null || v === "") return def;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : def;
  };
  const bool = (k: string, def: boolean) => (q.has(k) ? q.get(k) === "1" : def);
  const porc = (k: string, def: number) => Math.min(20, num(k, def) ?? def);
  return {
    precio: num("p", base.precio),
    moneda: q.get("m") === "ARS" ? "ARS" : "USD",
    tipoCambio: num("tc", base.tipoCambio),
    viviendaUnica: bool("vu", base.viviendaUnica),
    vir: num("vir", null),
    conInmobiliaria: bool("inmo", base.conInmobiliaria),
    honorariosComprador: porc("hc", base.honorariosComprador),
    honorariosVendedor: porc("hv", base.honorariosVendedor),
    ivaHonorarios: bool("iva", base.ivaHonorarios),
    honorariosEscribano: porc("esc", base.honorariosEscribano),
    conCredito: bool("cc", false),
    credito: num("cr", null),
  };
}

function escribirURL(e: Estado) {
  const q = new URLSearchParams();
  for (const [k, clave] of Object.entries(CLAVES) as [keyof Estado, string][]) {
    const v = e[k];
    if (v === null || v === undefined) continue;
    q.set(clave, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  window.history.replaceState(window.history.state, "", `${window.location.pathname}?${q}`);
}

function LineaVista({ l, moneda, abierta, alternar }: { l: Linea; moneda: Moneda; abierta: boolean; alternar: () => void }) {
  return (
    <li className="cat-linea">
      <div className="cat-linea-fila">
        <span className="cat-linea-concepto">
          {l.concepto}
          <button
            type="button"
            className="cat-linea-info"
            onClick={alternar}
            aria-expanded={abierta}
            aria-label={`De dónde sale: ${l.concepto}`}
            title="¿De dónde sale?"
          >
            <Info size={13} strokeWidth={1.8} />
          </button>
        </span>
        <span className="cat-linea-guia" aria-hidden="true" />
        {l.etiqueta
          ? <span className="cat-linea-etiqueta">{l.etiqueta}</span>
          : <span className="cat-linea-monto">{dinero(l.monto, moneda)}</span>}
      </div>
      {l.calculo && <p className="cat-linea-calc">{l.calculo}</p>}
      {abierta && <p className="cat-linea-fuente">{l.fuente}</p>}
    </li>
  );
}

export default function Calculadora({ config, consulta = "" }: { config: CostosConfig; consulta?: string }) {
  const base = useMemo(() => inicial(config), [config]);
  // La página pasa la consulta de la URL: un enlace compartido llega ya con sus datos
  const [e, setE] = useState<Estado>(() => leerConsulta(base, consulta));
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const t = setTimeout(() => escribirURL(e), 300);
    return () => clearTimeout(t);
  }, [e]);

  const cambiar = <K extends keyof Estado>(k: K, v: Estado[K]) => setE(prev => ({ ...prev, [k]: v }));

  const entrada: EntradaCostos = {
    precio: e.precio ?? 0,
    moneda: e.moneda,
    tipoCambio: e.tipoCambio ?? config.tipoCambio,
    vir: e.vir,
    viviendaUnica: e.viviendaUnica,
    conInmobiliaria: e.conInmobiliaria,
    honorariosComprador: e.honorariosComprador,
    honorariosVendedor: e.honorariosVendedor,
    ivaHonorarios: e.ivaHonorarios,
    honorariosEscribano: e.honorariosEscribano,
    credito: e.conCredito ? e.credito ?? 0 : 0,
  };
  const r = calcularCostos(entrada, config);
  const precio = entrada.precio;
  const m = e.moneda;
  const porcentaje = (n: number) => (precio > 0 ? `${nf(1).format((n / precio) * 100)} % del precio` : "");

  const alternar = (id: string) =>
    setAbiertas(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {}
  }

  const casoSellos = {
    exento: "Vivienda única por debajo del umbral: la operación no paga Sellos.",
    excedente: `Vivienda única por encima del umbral: se paga ${nf(1).format(r.sellos.alicuota)} % solo sobre lo que lo excede.`,
    general: `No es vivienda única y está por debajo del umbral: ${nf(1).format(r.sellos.alicuota)} % sobre el total.`,
    alta: `Por encima del umbral: ${nf(1).format(r.sellos.alicuota)} % sobre el total.`,
    pba: `Provincia de Buenos Aires: ${nf(1).format(r.sellos.alicuota)} % sobre el total.`,
  }[r.sellos.caso];

  return (
    <div className="cat-in cat-calc">
      {/* ── Datos de la operación ── */}
      <form className="cat-datos" onSubmit={ev => ev.preventDefault()} aria-labelledby="cat-datos-t">
        <h2 id="cat-datos-t">La operación</h2>

        <div className="cat-campo">
          <span>Precio de venta</span>
          <Opciones etiqueta="Moneda" valor={m} opciones={[["USD", "Dólares"], ["ARS", "Pesos"]]} onCambio={v => cambiar("moneda", v)} />
          <CampoNumero grande etiqueta="Precio de venta" prefijo={m === "USD" ? "US$" : "$"} valor={e.precio} onCambio={v => cambiar("precio", v)} placeholder="0" />
        </div>

        {m === "USD" && (
          <label className="cat-campo">
            <span>Tipo de cambio</span>
            <CampoNumero etiqueta="Pesos por dólar" prefijo="$ por US$" valor={e.tipoCambio} onCambio={v => cambiar("tipoCambio", v)} />
            <small>Dólar BNA vendedor. Sellos se liquida en pesos.</small>
          </label>
        )}

        <fieldset className="cat-campo">
          <legend>¿Es la vivienda única del comprador?</legend>
          <Opciones etiqueta="Vivienda única" valor={e.viviendaUnica} opciones={[[true, "Sí"], [false, "No"]]} onCambio={v => cambiar("viviendaUnica", v)} />
          <small>Única, familiar y de ocupación permanente: define si hay exención de Sellos.</small>
        </fieldset>

        <label className="cat-campo">
          <span>VIR o valuación fiscal (opcional)</span>
          <CampoNumero etiqueta="Valor Inmobiliario de Referencia" prefijo="$" valor={e.vir} onCambio={v => cambiar("vir", v)} placeholder="Si lo conocés" />
          <small>Si supera al precio en pesos, Sellos se calcula sobre este valor.</small>
        </label>

        <div className="cat-campo">
          <label className="cat-check">
            <input type="checkbox" checked={e.conInmobiliaria} onChange={ev => cambiar("conInmobiliaria", ev.target.checked)} />
            Interviene una inmobiliaria
          </label>
          {e.conInmobiliaria && (
            <div className="cat-bloque-opc">
              <div className="cat-dos">
                <label className="cat-campo"><span>Comprador</span><CampoPorcentaje etiqueta="Honorarios del comprador" valor={e.honorariosComprador} onCambio={v => cambiar("honorariosComprador", v)} /></label>
                <label className="cat-campo"><span>Vendedor</span><CampoPorcentaje etiqueta="Honorarios del vendedor" valor={e.honorariosVendedor} onCambio={v => cambiar("honorariosVendedor", v)} /></label>
              </div>
              <label className="cat-check">
                <input type="checkbox" checked={e.ivaHonorarios} onChange={ev => cambiar("ivaHonorarios", ev.target.checked)} />
                Factura IVA (responsable inscripto)
              </label>
            </div>
          )}
        </div>

        <label className="cat-campo">
          <span>Honorarios del escribano</span>
          <CampoPorcentaje etiqueta="Honorarios del escribano" valor={e.honorariosEscribano} onCambio={v => cambiar("honorariosEscribano", v)} />
        </label>

        <div className="cat-campo">
          <label className="cat-check">
            <input type="checkbox" checked={e.conCredito} onChange={ev => cambiar("conCredito", ev.target.checked)} />
            Compra con crédito hipotecario
          </label>
          {e.conCredito && (
            <div className="cat-bloque-opc">
              <label className="cat-campo">
                <span>Monto del crédito</span>
                <CampoNumero etiqueta="Monto del crédito" prefijo={m === "USD" ? "US$" : "$"} valor={e.credito} onCambio={v => cambiar("credito", v)} placeholder="0" />
              </label>
            </div>
          )}
        </div>

        <button type="button" className="cat-enlace cat-restablecer" onClick={() => setE(base)}>Volver a los valores de referencia</button>
      </form>

      {/* ── La liquidación ── */}
      <section className="cat-liq" aria-labelledby="cat-liq-t">
        <div className="cat-membrete">
          <span><strong>Espacio Inmobiliario</strong> · Cátedra Inmobiliaria</span>
          <span suppressHydrationWarning>espacioinmobiliario.com.ar · {new Date().toLocaleDateString("es-AR")}</span>
        </div>

        <header className="cat-liq-cab">
          <div>
            <p className="cat-rotulo">Liquidación estimada · CABA</p>
            <h2 className="cat-liq-t" id="cat-liq-t">Las dos <em>puntas</em></h2>
          </div>
          <div className="cat-liq-meta">
            Precio<br /><strong>{dinero(precio, m)}</strong>
            {m === "USD" && <><br />a $ {nf().format(entrada.tipoCambio)} por dólar</>}
          </div>
        </header>
        <div className="cat-doble" />

        <div className="cat-partes">
          <div className="cat-parte">
            <h3>Comprador <span>lo que desembolsa</span></h3>
            <ul className="cat-lineas">
              <li className="cat-linea cat-linea-precio">
                <div className="cat-linea-fila"><span>Precio</span><span className="cat-linea-guia" aria-hidden="true" /><span className="cat-linea-monto">{dinero(precio, m)}</span></div>
              </li>
              {r.comprador.lineas.map(l => (
                <LineaVista key={l.id} l={l} moneda={m} abierta={abiertas.has(l.id)} alternar={() => alternar(l.id)} />
              ))}
            </ul>
            <div className="cat-total">
              <div className="cat-total-fila"><span>Total</span><strong>{dinero(r.comprador.total, m)}</strong></div>
              <small>Gastos: <b>{dinero(r.comprador.costos, m)}</b> · {porcentaje(r.comprador.costos)}</small>
              {entrada.credito > 0 && (
                <small>Con el crédito, el desembolso propio es <b>{dinero(r.comprador.desembolsoPropio, m)}</b>.</small>
              )}
            </div>
          </div>

          <div className="cat-parte">
            <h3>Vendedor <span>lo que le queda</span></h3>
            <ul className="cat-lineas">
              <li className="cat-linea cat-linea-precio">
                <div className="cat-linea-fila"><span>Precio</span><span className="cat-linea-guia" aria-hidden="true" /><span className="cat-linea-monto">{dinero(precio, m)}</span></div>
              </li>
              {r.vendedor.lineas.map(l => (
                <LineaVista key={l.id} l={l} moneda={m} abierta={abiertas.has(l.id)} alternar={() => alternar(l.id)} />
              ))}
            </ul>
            <div className="cat-total">
              <div className="cat-total-fila"><span>Neto</span><strong>{dinero(r.vendedor.neto, m)}</strong></div>
              <small>Gastos: <b>{dinero(r.vendedor.costos, m)}</b> · {porcentaje(r.vendedor.costos)}</small>
            </div>
          </div>
        </div>

        <p className="cat-sellos-nota">
          <strong>Impuesto de Sellos.</strong> {casoSellos} Base: $ {nf().format(Math.round(r.sellos.baseARS))}
          {" "}(umbral $ {nf().format(config.sellos.umbral)}). Total del impuesto: $ {nf().format(Math.round(r.sellos.totalARS))}, mitad y mitad.
        </p>

        <div className="cat-liq-pie">
          <p>
            Estimación orientativa con valores de CABA del {config.vigencia}. No reemplaza la liquidación
            del escribano ni el asesoramiento profesional; cada caso puede tener particularidades.
          </p>
          <div className="cat-liq-acciones">
            <button type="button" className="cat-btn cat-btn-chico" onClick={() => window.print()}>
              <Printer size={14} strokeWidth={1.8} /> Imprimir o guardar PDF
            </button>
            <button type="button" className="cat-enlace" onClick={copiarEnlace} style={{ fontSize: 13 }}>
              <Link2 size={13} strokeWidth={1.8} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
              {copiado ? "Enlace copiado" : "Copiar el enlace"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
