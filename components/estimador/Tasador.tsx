"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { calcularConfianza } from "@/lib/estimador/engine";
import type { EstimadorInput, EstimadorResultado } from "@/lib/estimador/types";
import Guilloche from "@/components/ui/Guilloche";
import { Opciones, Marcas, Numero, Interruptor, BuscadorBarrio, RosaVientos, type Opcion } from "./controles";
import Ficha from "./Ficha";
import Informe from "./Informe";
import "./tasador.css";

/*
 * El tasador: cinco escenas cortas en lugar de un formulario largo.
 *
 *   I   Ubicación   el barrio (y la dirección, si se quiere)
 *   II  La unidad   superficie, ambientes, baños y piso
 *   III El edificio obra, antigüedad, estado, categoría, amenities
 *   IV  Detalles    opcional: lo que afina el valor
 *   V   Emisión     a nombre de quién (el contacto va antes del
 *                   resultado: toda estimación queda registrada)
 *
 * Al lado, la ficha se va escribiendo con cada respuesta y muestra la
 * precisión que va a tener la estimación (el mismo cálculo que hace el
 * servidor). Al emitir, la ficha se sella y se abre el informe.
 *
 * El cálculo no cambia: POST /api/estimador con EstimadorInput +
 * contacto, igual que antes.
 */

const ESCENAS = [
  { n: "I", t: "Ubicación", q: "¿En qué barrio está el departamento?", d: "Usamos el valor de referencia del metro cuadrado en ese barrio." },
  { n: "II", t: "La unidad", q: "¿Cómo es el departamento?", d: "Solo la superficie cubierta es obligatoria." },
  { n: "III", t: "El edificio", q: "Contanos del edificio", d: "La antigüedad, el estado y la categoría mueven el valor." },
  { n: "IV", t: "Detalles", q: "Detalles que afinan el valor", d: "Es opcional, pero cada dato ajusta el rango de la estimación." },
  { n: "V", t: "Emisión", q: "¿A nombre de quién emitimos la estimación?", d: "Te la mostramos al instante, y Eugenio la revisa con vos sin cargo." },
] as const;

const AMBIENTES: Opcion<number>[] = [
  { v: 1, l: "Mono" }, { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" }, { v: 5, l: "5 o más" },
];
const BANOS: Opcion<number>[] = [{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3 o más" }];

const CONDICION_OBRA = [
  { v: "usado", l: "Usado", d: "Ya fue habitado" },
  { v: "a_estrenar", l: "A estrenar", d: "Nuevo, sin uso" },
  { v: "pozo", l: "En pozo", d: "En construcción" },
] as const;
const ESTADOS = [
  { v: "a_reciclar", l: "A reciclar" }, { v: "bueno", l: "Bueno" },
  { v: "muy_bueno", l: "Muy bueno" }, { v: "excelente", l: "Excelente" },
] as const;
const CATEGORIAS = [
  { v: "regular", l: "Regular", d: "Construcción simple" },
  { v: "estandar", l: "Estándar", d: "Como la mayoría del barrio" },
  { v: "premium", l: "Premium", d: "Terminaciones de primera" },
] as const;
const AMENITIES = [
  { k: "pileta", l: "Piscina" }, { k: "sum", l: "SUM" }, { k: "gimnasio", l: "Gimnasio" },
  { k: "seguridad", l: "Seguridad 24 h" }, { k: "parrilla", l: "Parrilla" },
] as const;

const DISPOSICIONES = [{ v: "frente", l: "Frente" }, { v: "contrafrente", l: "Contrafrente" }, { v: "interno", l: "Interno" }] as const;
const VISTAS = [
  { v: "abierta", l: "Abierta" }, { v: "despejada", l: "Despejada" },
  { v: "a_la_calle", l: "A la calle" }, { v: "interna", l: "Interna" },
] as const;
const EXPENSAS = [{ v: "bajas", l: "Bajas" }, { v: "medias", l: "Medias" }, { v: "altas", l: "Altas" }] as const;
const COCHERAS = [
  { v: "no", l: "Sin cochera" }, { v: "descubierta", l: "Descubierta" },
  { v: "movil", l: "Cubierta móvil" }, { v: "fija", l: "Cubierta fija" },
] as const;
const CALEFACCION = [
  { v: "losa", l: "Losa radiante" }, { v: "central", l: "Central" },
  { v: "individual", l: "Individual" }, { v: "sin", l: "Sin calefacción" },
] as const;
const OCUPACION = [{ v: "libre", l: "Libre" }, { v: "alquilada", l: "Alquilada" }, { v: "ocupada", l: "Ocupada" }] as const;
const SITUACION = [
  { v: "escritura", l: "Escritura al día" }, { v: "sucesion", l: "En sucesión" }, { v: "observaciones", l: "Con observaciones" },
] as const;

/** Lo que se lee mientras el servidor calcula: lo que hace de verdad. */
const FRASES_EMISION = [
  "Tomando el valor de referencia del barrio",
  "Ponderando superficies",
  "Aplicando los ajustes de la unidad",
  "Emitiendo tu estimación",
];

const INICIAL: EstimadorInput = {
  barrio: "", direccion: "",
  m2Cubiertos: 0, m2Semicubierto: 0, m2Descubiertos: 0,
  ambientes: undefined, dormitorios: undefined, banos: 1,
  antiguedad: 0, condicionObra: "usado", estado: "bueno",
  piso: 0, ultimoPiso: false, ascensor: true,
  disposicion: "frente", orientacion: "", vista: "",
  cochera: "no", baulera: false, dependenciaServicio: false,
  calefaccion: "", expensas: "", aptoCredito: false,
  ocupacion: "libre", situacionDominial: "escritura",
  vecinosEspeciales: false,
  categoria: "estandar",
  amenities: { pileta: false, sum: false, gimnasio: false, seguridad: false, parrilla: false },
};

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function Tasador({
  barrios,
  embebido = false,
}: {
  barrios: string[];
  /** Dentro de una nota del blog: sin la ficha lateral, con la precisión arriba. */
  embebido?: boolean;
}) {
  const [paso, setPaso] = useState(1);
  const [input, setInput] = useState<EstimadorInput>(INICIAL);
  const [contacto, setContacto] = useState({ nombre: "", telefono: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const [emitiendo, setEmitiendo] = useState(false);
  const [frase, setFrase] = useState(0);
  const [resultado, setResultado] = useState<(EstimadorResultado & { estimacionId?: string | null }) | null>(null);
  const mesa = useRef<HTMLDivElement>(null);
  const montado = useRef(false);

  function set<K extends keyof EstimadorInput>(k: K, v: EstimadorInput[K]) {
    setInput(p => ({ ...p, [k]: v }));
  }

  // Al cambiar de escena, la mesa vuelve a quedar a la vista. Al montar
  // no: en una nota, el tasador está lejos y la página saltaría hasta él
  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    const el = mesa.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + top - 96, behavior: "smooth" });
    }
  }, [paso, resultado]);

  // Las frases de la emisión pasan una tras otra mientras se espera
  useEffect(() => {
    if (!emitiendo) return;
    setFrase(0);
    const t = setInterval(() => setFrase(f => Math.min(f + 1, FRASES_EMISION.length - 1)), 620);
    return () => clearInterval(t);
  }, [emitiendo]);

  function ir(n: number) {
    setError(null);
    setPaso(n);
  }

  function avanzar(e: React.FormEvent) {
    e.preventDefault();
    if (paso === 1 && !input.barrio) return setError("Elegí el barrio para seguir.");
    if (paso === 2 && !(input.m2Cubiertos > 0)) return setError("Contanos cuántos metros cubiertos tiene.");
    if (paso === 5) return emitir();
    ir(paso + 1);
  }

  async function emitir() {
    if (!contacto.nombre.trim()) return setError("Ingresá tu nombre.");
    const tel = normalizarTelefono(contacto.telefono);
    if (!tel.ok) return setError(tel.error);

    setError(null);
    setEmitiendo(true);
    try {
      // La emisión dura lo que tarde el servidor, pero nunca menos que
      // una lectura de las frases: sin eso, el sello no llega a verse
      const [res] = await Promise.all([
        fetch("/api/estimador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            contacto: { nombre: contacto.nombre.trim(), telefono: tel.valor, email: contacto.email.trim() || undefined },
          }),
        }),
        esperar(2300),
      ]);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "No se pudo calcular la estimación.");
      } else {
        setResultado(data);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    }
    setEmitiendo(false);
  }

  function otra() {
    setInput(INICIAL);
    setContacto({ nombre: "", telefono: "", email: "" });
    setResultado(null);
    setPaso(1);
    setError(null);
  }

  const confianza = input.barrio ? calcularConfianza(input, true) : null;
  const escena = ESCENAS[paso - 1];

  if (resultado) {
    return (
      <div ref={mesa} className={`ts-mesa ts-mesa-informe${embebido ? " ts-mesa-nota" : ""}`}>
        <Informe input={input} resultado={resultado} nombre={contacto.nombre.trim()} onOtra={otra} />
      </div>
    );
  }

  return (
    <div ref={mesa} className={`ts-mesa${embebido ? " ts-mesa-nota" : ""}`}>
      {embebido && <PrecisionCorta confianza={confianza} />}

      {/* ── La escena ─────────────────────────────────────────── */}
      <form className="ts-hoja" onSubmit={avanzar} noValidate>
        <Riel paso={paso} onIr={n => n < paso && ir(n)} />

        <div key={paso} className="ts-escena">
          <header className="ts-escena-cab">
            <span className="ts-escena-n">Cláusula {escena.n}</span>
            <h2 className="ts-escena-q">{escena.q}</h2>
            <p className="ts-escena-d">{escena.d}</p>
          </header>

          {paso === 1 && (
            <div className="ts-cuerpo">
              <BuscadorBarrio barrios={barrios} valor={input.barrio} onCambio={v => { set("barrio", v); setError(null); }} />
              <label className="ts-texto">
                <span className="ts-rotulo">Dirección <em>(opcional)</em></span>
                <input value={input.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Ej.: Av. Santa Fe 1234" />
              </label>
            </div>
          )}

          {paso === 2 && (
            <div className="ts-cuerpo">
              <Numero
                etiqueta="Superficie cubierta"
                unidad="m²"
                valor={input.m2Cubiertos || undefined}
                onCambio={v => set("m2Cubiertos", v ?? 0)}
                min={0}
                max={2000}
                placeholder="65"
                autoFocus
              />
              <div className="ts-par">
                <Numero chico etiqueta="Balcón" unidad="m²" valor={input.m2Semicubierto || undefined} onCambio={v => set("m2Semicubierto", v ?? 0)} placeholder="0" />
                <Numero chico etiqueta="Patio o terraza" unidad="m²" valor={input.m2Descubiertos || undefined} onCambio={v => set("m2Descubiertos", v ?? 0)} placeholder="0" />
              </div>
              <Grupo t="Ambientes">
                <Opciones nombre="Ambientes" opciones={AMBIENTES} valor={input.ambientes} onCambio={v => set("ambientes", v)} columnas={5} />
              </Grupo>
              <Grupo t="Baños">
                <Opciones nombre="Baños" opciones={BANOS} valor={input.banos} onCambio={v => set("banos", v)} columnas={3} />
              </Grupo>
              <div className="ts-par ts-par-piso">
                <Numero
                  chico
                  etiqueta="Piso"
                  valor={input.piso}
                  onCambio={v => set("piso", v ?? 0)}
                  max={80}
                  formato={v => (v === 0 ? "Planta baja" : `${v}° piso`)}
                />
                <div className="ts-sws">
                  <Interruptor etiqueta="Tiene ascensor" valor={input.ascensor} onCambio={v => set("ascensor", v)} />
                  <Interruptor etiqueta="Es el último piso" valor={input.ultimoPiso} onCambio={v => set("ultimoPiso", v)} />
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="ts-cuerpo">
              <Grupo t="Condición">
                <Opciones
                  nombre="Condición de obra"
                  opciones={CONDICION_OBRA}
                  valor={input.condicionObra}
                  onCambio={v => setInput(p => ({ ...p, condicionObra: v, antiguedad: v === "usado" ? p.antiguedad : 0 }))}
                  columnas={3}
                />
              </Grupo>
              {input.condicionObra === "usado" && (
                <>
                  <Numero
                    chico
                    etiqueta="Antigüedad"
                    unidad="años"
                    valor={input.antiguedad}
                    onCambio={v => set("antiguedad", v ?? 0)}
                    max={150}
                    formato={v => (v === 0 ? "Menos de un año" : null)}
                  />
                  <Grupo t="Estado de conservación">
                    <Opciones nombre="Estado de conservación" opciones={ESTADOS} valor={input.estado} onCambio={v => set("estado", v)} columnas={4} />
                  </Grupo>
                </>
              )}
              <Grupo t="Categoría del edificio">
                <Opciones nombre="Categoría del edificio" opciones={CATEGORIAS} valor={input.categoria} onCambio={v => set("categoria", v)} columnas={3} />
              </Grupo>
              <Grupo t="Amenities" nota="Marcá todas las que tenga">
                <Marcas
                  nombre="Amenities"
                  opciones={AMENITIES}
                  marcadas={input.amenities}
                  onCambio={(k, v) => setInput(p => ({ ...p, amenities: { ...p.amenities, [k]: v } }))}
                />
              </Grupo>
            </div>
          )}

          {paso === 4 && (
            <div className="ts-cuerpo">
              <Seccion t="Luz y vista">
                <div className="ts-luz">
                  <Grupo t="Orientación">
                    <RosaVientos valor={input.orientacion ?? ""} onCambio={v => set("orientacion", v)} />
                  </Grupo>
                  <div className="ts-luz-col">
                    <Grupo t="Disposición">
                      <Opciones nombre="Disposición" opciones={DISPOSICIONES} valor={input.disposicion} onCambio={v => set("disposicion", v)} />
                    </Grupo>
                    <Grupo t="Vista">
                      <Opciones nombre="Vista" opciones={VISTAS} valor={input.vista || undefined} onCambio={v => set("vista", v)} columnas={2} />
                    </Grupo>
                  </div>
                </div>
              </Seccion>
              <Seccion t="Gastos y comodidades">
                <Grupo t="Expensas">
                  <Opciones nombre="Expensas" opciones={EXPENSAS} valor={input.expensas || undefined} onCambio={v => set("expensas", v)} columnas={3} />
                </Grupo>
                <Grupo t="Cochera">
                  <Opciones nombre="Cochera" opciones={COCHERAS} valor={input.cochera} onCambio={v => set("cochera", v)} />
                </Grupo>
                <Grupo t="Calefacción">
                  <Opciones nombre="Calefacción" opciones={CALEFACCION} valor={input.calefaccion || undefined} onCambio={v => set("calefaccion", v)} />
                </Grupo>
                <div className="ts-sws">
                  <Interruptor etiqueta="Baulera" valor={input.baulera} onCambio={v => set("baulera", v)} />
                  <Interruptor etiqueta="Dependencia de servicio" valor={input.dependenciaServicio} onCambio={v => set("dependenciaServicio", v)} />
                  <Interruptor etiqueta="Apto crédito hipotecario" valor={input.aptoCredito} onCambio={v => set("aptoCredito", v)} />
                </div>
              </Seccion>
              <Seccion t="Situación">
                <Grupo t="Ocupación">
                  <Opciones nombre="Ocupación" opciones={OCUPACION} valor={input.ocupacion || undefined} onCambio={v => set("ocupacion", v)} columnas={3} />
                </Grupo>
                <Grupo t="Situación dominial">
                  <Opciones nombre="Situación dominial" opciones={SITUACION} valor={input.situacionDominial || undefined} onCambio={v => set("situacionDominial", v)} columnas={3} />
                </Grupo>
                <div className="ts-sws">
                  <Interruptor
                    etiqueta="Vecinos especiales"
                    detalle="A menos de 3 cuadras de bomberos, cementerios, hospitales o terminales de transporte."
                    valor={input.vecinosEspeciales}
                    onCambio={v => set("vecinosEspeciales", v)}
                  />
                </div>
              </Seccion>
            </div>
          )}

          {paso === 5 && (
            <div className="ts-cuerpo">
              <label className="ts-texto">
                <span className="ts-rotulo">Nombre</span>
                <input
                  value={contacto.nombre}
                  onChange={e => setContacto(c => ({ ...c, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  autoFocus
                />
              </label>
              <label className="ts-texto">
                <span className="ts-rotulo">Teléfono o WhatsApp</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={contacto.telefono}
                  onChange={e => setContacto(c => ({ ...c, telefono: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  autoComplete="tel"
                />
              </label>
              <label className="ts-texto">
                <span className="ts-rotulo">Email <em>(opcional)</em></span>
                <input
                  type="email"
                  value={contacto.email}
                  onChange={e => setContacto(c => ({ ...c, email: e.target.value }))}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </label>
              <p className="ts-privado">
                Usamos tus datos solo para enviarte la estimación y, si querés, revisarla
                con vos sin cargo. No compartimos tu información con terceros.
              </p>
            </div>
          )}
        </div>

        {error && <p className="ts-error" role="alert">{error}</p>}

        <footer className="ts-acciones">
          {paso > 1 ? (
            <button type="button" className="ts-atras" onClick={() => ir(paso - 1)}>
              <ArrowLeft size={15} strokeWidth={1.8} /> Atrás
            </button>
          ) : <span />}
          <div className="ts-acciones-der">
            {paso === 4 && (
              <button type="button" className="ts-saltar" onClick={() => ir(5)}>Saltear</button>
            )}
            <button type="submit" className="ts-seguir" disabled={emitiendo}>
              {paso === 5 ? "Emitir mi estimación" : "Continuar"}
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </footer>

        {/* ── La emisión: la roseta gira y las frases pasan ──── */}
        {emitiendo && (
          <div className="ts-emision" role="status" aria-live="polite">
            <Guilloche id="ts-gq-emision" className="ts-emision-gq" />
            <p className="ts-emision-n">Cláusula final</p>
            <p key={frase} className="ts-emision-t">{FRASES_EMISION[frase]}…</p>
          </div>
        )}
      </form>

      {/* ── La ficha, que se escribe con cada respuesta ───────── */}
      {!embebido && (
        <Ficha input={input} paso={paso} confianza={confianza} nombre={contacto.nombre.trim()} emitiendo={emitiendo} />
      )}
    </div>
  );
}

const PRECISION = { baja: 1, media: 2, alta: 3 } as const;

/** La precisión en una línea, para cuando la ficha no entra (en una nota). */
function PrecisionCorta({ confianza }: { confianza: ReturnType<typeof calcularConfianza> | null }) {
  const n = confianza ? PRECISION[confianza] : 0;
  return (
    <div className="ts-precision-corta" data-nivel={n}>
      <span>Precisión de la estimación</span>
      <strong>{confianza ? confianza.charAt(0).toUpperCase() + confianza.slice(1) : "—"}</strong>
      <span className="ts-precision-riel" aria-hidden="true"><span /><span /><span /></span>
    </div>
  );
}

/** El avance, como las cláusulas de un documento. */
function Riel({ paso, onIr }: { paso: number; onIr: (n: number) => void }) {
  return (
    <ol className="ts-riel" style={{ ["--avance" as string]: (paso - 1) / (ESCENAS.length - 1) }}>
      {ESCENAS.map((e, i) => {
        const n = i + 1;
        const estado = n < paso ? "hecho" : n === paso ? "actual" : "pendiente";
        return (
          <li key={e.n} data-estado={estado}>
            <button type="button" onClick={() => onIr(n)} disabled={n >= paso} aria-current={n === paso ? "step" : undefined}>
              <span className="ts-riel-n">{e.n}</span>
              <span className="ts-riel-t">{e.t}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Grupo({ t, nota, children }: { t: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="ts-grupo">
      <p className="ts-rotulo">{t}{nota && <em> · {nota}</em>}</p>
      {children}
    </div>
  );
}

function Seccion({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section className="ts-seccion">
      <h3 className="ts-seccion-t">{t}</h3>
      {children}
    </section>
  );
}
