"use client";

import Link from "next/link";
import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { Star, Sparkles, Info, ArrowLeft, ArrowRight, ImagePlus } from "lucide-react";
import { createProperty, updateProperty } from "@/lib/actions/properties";
import { generarDescripcionIA } from "@/lib/actions/descripcion";
import type { CamposDescripcion } from "@/lib/ai/descripcion";
import { compressImage } from "@/lib/utils/compressImage";
import type { Property } from "@/lib/types";
import { ZONAS, UBICACIONES, type Zona } from "@/lib/ubicaciones";
import UbicacionEnMapa from "@/components/panel/UbicacionEnMapa";
import FichaPublicacion from "@/components/panel/FichaPublicacion";
import Guilloche from "@/components/ui/Guilloche";
import { Opciones, Numero, Interruptor, BuscadorBarrio, RosaVientos } from "@/components/estimador/controles";
import "@/components/estimador/tasador.css";
import "./fotos-form.css";
import "./publicar.css";

interface Props {
  mode: "crear" | "editar";
  property?: Property;
  /** A dónde lleva "Volver al panel". */
  volverA?: string;
  /** Avisos de la página (cuenta lista, recién publicada, superadmin). */
  avisos?: React.ReactNode;
}

/*
 * La carga de una propiedad en cinco escenas, con la estética del
 * estimador. Las cinco quedan siempre montadas (solo se ocultan): así el
 * formulario junta todos los campos al enviar y el mapa no pierde el pin.
 *
 * Al crear se avanza en orden; al editar se salta a cualquier paso y
 * "Guardar cambios" está siempre a mano.
 */
const PASOS = [
  { n: "I", t: "Ubicación", seguir: "Seguir con la unidad" },
  { n: "II", t: "La unidad", seguir: "Seguir con las fotos" },
  { n: "III", t: "Fotos", seguir: "Seguir con el precio" },
  { n: "IV", t: "Precio", seguir: "Último paso" },
  { n: "V", t: "El aviso", seguir: "" },
] as const;
const ULTIMO = PASOS.length - 1;

const TIPOS = [
  { v: "departamento", l: "Departamento" }, { v: "casa", l: "Casa" }, { v: "terreno", l: "Terreno" },
  { v: "local", l: "Local" }, { v: "oficina", l: "Oficina" }, { v: "cochera", l: "Cochera" },
];
const OPCIONES_ZONA: { v: Zona; l: string }[] = ZONAS.map(z => ({
  v: z, l: z === "Ciudad Autónoma de Buenos Aires" ? "Ciudad de Buenos Aires" : z,
}));
const conVacio = (valores: string[]) => [{ v: "", l: "Sin especificar" }, ...valores.map(x => ({ v: x, l: x }))];
const ESTADOS = conVacio(["A estrenar", "Excelente", "Muy bueno", "Bueno", "A refaccionar"]);
const DISPOSICIONES = conVacio(["Frente", "Contrafrente", "Lateral", "Otra"]);
const MONEDAS = [{ v: "USD", l: "USD" }, { v: "ARS", l: "ARS" }];
const STATUS = [
  { v: "activa", l: "Activa", d: "Visible en el listado" },
  { v: "pausada", l: "Pausada", d: "Oculta por un tiempo" },
  { v: "vendida", l: "Vendida", d: "Operación cerrada" },
];

const num = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
const texto = (n: number | null | undefined) => (n != null ? String(n) : "");

function tituloSugerido(tipo: string, ambientes: number | undefined, barrio: string) {
  const nombre = TIPOS.find(t => t.v === tipo)?.l;
  if (!nombre) return "";
  let base = nombre;
  if (ambientes && tipo !== "cochera" && tipo !== "terreno") {
    if (ambientes === 1) base = tipo === "departamento" ? "Monoambiente" : `${nombre} de 1 ambiente`;
    else base = `${nombre} de ${ambientes} ambientes`;
  }
  return barrio ? `${base} en ${barrio}` : base;
}

/** Foto en el formulario: guardada (solo url) o nueva (url de vista previa + archivo). */
type FotoForm = { url: string; file?: File };

export default function PropertyForm({ mode, property, volverA = "/panel", avisos }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Una sola lista en el orden final: guardadas (url) y nuevas (url de
  // vista previa + archivo). La primera es la portada, sea guardada o nueva.
  const [fotos, setFotos] = useState<FotoForm[]>(() => (property?.fotos || []).map(url => ({ url })));
  const [optimizando, setOptimizando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Orientación de cada foto (true = vertical), medida al cargar la vista
  // previa. La portada se muestra apaisada en los listados: si es vertical
  // sale recortada, y conviene avisarlo sin trabar la carga.
  const [verticales, setVerticales] = useState<Record<string, boolean>>({});
  const portadaVertical = fotos.length > 0 && verticales[fotos[0].url] === true;
  const hayHorizontal = fotos.some(f => verticales[f.url] === false);

  // Descripción con IA
  const formRef = useRef<HTMLFormElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const [iaCargando, setIaCargando] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [usosIA, setUsosIA] = useState<number | null>(
    mode === "editar" ? Math.max(0, 2 - (property?.ai_usos ?? 0)) : null
  );

  function camposDesdeForm(): CamposDescripcion {
    const fd = new FormData(formRef.current!);
    const num = (k: string) => {
      const v = fd.get(k);
      return v !== null && v !== "" ? Number(v) : undefined;
    };
    const str = (k: string) => ((fd.get(k) as string)?.trim() || undefined);
    return {
      tipo: str("tipo"),
      barrio: str("barrio"),
      ciudad: str("ciudad"),
      direccion: str("direccion"),
      superficie_total: num("superficie_total"),
      superficie_cubierta: num("superficie_cubierta"),
      superficie_balcon: num("superficie_balcon"),
      superficie_descubierta: num("superficie_descubierta"),
      ambientes: num("ambientes"),
      dormitorios: num("dormitorios"),
      banos: num("banos"),
      cochera: fd.getAll("cochera").includes("true"),
      apto_credito: fd.getAll("apto_credito").includes("true"),
      orientacion: str("orientacion"),
      disposicion: str("disposicion"),
      antiguedad: num("antiguedad"),
      estado: str("estado"),
      piso: str("piso"),
    };
  }

  async function handleGenerarIA() {
    setIaError(null);
    const campos = camposDesdeForm();
    if (!campos.tipo || !campos.barrio) {
      setIaError("Completá al menos el tipo de unidad y el barrio antes de generar.");
      return;
    }
    setIaCargando(true);
    try {
      const res = await generarDescripcionIA({
        propertyId: mode === "editar" ? property?.id : null,
        campos,
      });
      if (!res.ok) {
        setIaError(res.error);
        return;
      }
      const ta = descripcionRef.current;
      if (ta) {
        const sep = ta.value.trim() ? "\n\n" : "";
        ta.value = ta.value + sep + res.descripcion;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
      if (res.usosRestantes !== null) setUsosIA(res.usosRestantes);
    } finally {
      setIaCargando(false);
    }
  }

  // Plano (imagen única, opcional)
  const [planoFile, setPlanoFile] = useState<File | null>(null);
  const [planoPreview, setPlanoPreview] = useState<string | null>(property?.plano || null);
  const [planoExistente, setPlanoExistente] = useState<string | null>(property?.plano || null);
  const planoRef = useRef<HTMLInputElement>(null);

  const MAX_FOTOS = 10;

  async function handlePlanoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOptimizando(true);
    try {
      const comprimido = await compressImage(file);
      setPlanoFile(comprimido);
      setPlanoPreview(URL.createObjectURL(comprimido));
      setPlanoExistente(null); // el nuevo reemplaza al guardado
    } finally {
      setOptimizando(false);
    }
  }

  function removePlano() {
    setPlanoFile(null);
    setPlanoPreview(null);
    setPlanoExistente(null);
  }

  // Superficies — el total es la suma automática de las tres
  const [supCubierta, setSupCubierta] = useState<string>(
    property?.superficie_cubierta != null ? String(property.superficie_cubierta) : ""
  );
  const [supBalcon, setSupBalcon] = useState<string>(
    property?.superficie_balcon != null ? String(property.superficie_balcon) : ""
  );
  const [supDescubierta, setSupDescubierta] = useState<string>(() => {
    if (property?.superficie_descubierta != null) return String(property.superficie_descubierta);
    // Propiedad cargada antes del desglose: preservar el total existente
    if (property?.superficie_total != null && property?.superficie_balcon == null) {
      const resto = property.superficie_total - (property.superficie_cubierta ?? 0);
      if (resto > 0) return String(Math.round(resto * 100) / 100);
    }
    return "";
  });
  const supTotal = Math.round(
    ((parseFloat(supCubierta) || 0) + (parseFloat(supBalcon) || 0) + (parseFloat(supDescubierta) || 0)) * 100
  ) / 100;

  // Ubicación
  const [zona, setZona] = useState<Zona | "">(() => {
    if (!property?.provincia) return "";
    if (property.provincia === "Ciudad Autónoma de Buenos Aires" || property.provincia === "CABA") {
      return "Ciudad Autónoma de Buenos Aires";
    }
    return "Provincia de Buenos Aires";
  });
  const [barrio, setBarrio] = useState(property?.barrio || "");
  const [direccion, setDireccion] = useState(property?.direccion || "");
  const barrios = zona ? UBICACIONES[zona as Zona] : [];

  // Una cochera no tiene ambientes, dormitorios ni baños, ni "incluye
  // cochera": esos campos no se piden (y se guardan vacíos).
  const [tipo, setTipo] = useState<string>(property?.tipo || "");
  const esCochera = tipo === "cochera";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files || []);
    // reset input so the same file can be re-added if needed
    e.target.value = "";
    await agregarFotos(added);
  }

  /** Suma fotos, vengan del selector o arrastradas sobre la zona de carga. */
  async function agregarFotos(added: File[]) {
    if (!added.length || optimizando) return;

    const lugar = MAX_FOTOS - fotos.length;
    if (lugar <= 0) {
      setError(`Máximo ${MAX_FOTOS} fotos por publicación.`);
      return;
    }
    setError(null);

    setOptimizando(true);
    try {
      const comprimidas = await Promise.all(added.slice(0, lugar).map(compressImage));
      setFotos(prev => [...prev, ...comprimidas.map(file => ({ url: URL.createObjectURL(file), file }))]);
      if (added.length > lugar) {
        setError(`Solo se agregaron ${lugar} fotos: el máximo es ${MAX_FOTOS} por publicación.`);
      }
    } finally {
      setOptimizando(false);
    }
  }

  function quitarFoto(idx: number) {
    setFotos(prev => {
      const quitada = prev[idx];
      if (quitada?.file) URL.revokeObjectURL(quitada.url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  /** Lleva la foto al primer lugar: la portada de la publicación. */
  function hacerPortada(idx: number) {
    if (idx === 0) return;
    setFotos(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending || optimizando) return;
    // Nada sale sin los obligatorios: se abre el paso donde falta algo
    for (let i = 0; i <= ULTIMO; i++) {
      if (!validar(i)) return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    // Fotos en el orden elegido (portada = [0]). Al editar, `fotos_orden`
    // le dice al servidor dónde va cada una: "e:<url>" para las guardadas
    // y "n:<índice>" para las nuevas, así cualquiera puede ser la portada.
    let nuevas = 0;
    fotos.forEach(f => {
      if (mode === "crear") {
        if (f.file) formData.append("fotos", f.file);
      } else if (f.file) {
        formData.append("fotos_nuevas", f.file);
        formData.append("fotos_orden", `n:${nuevas++}`);
      } else {
        formData.append("fotos_existentes", f.url);
        formData.append("fotos_orden", `e:${f.url}`);
      }
    });
    // Plano: archivo nuevo o URL existente (vacío = se quita)
    if (planoFile) formData.append("plano", planoFile);
    if (planoExistente) formData.append("plano_existente", planoExistente);

    startTransition(async () => {
      if (mode === "crear") {
        const result = await createProperty(formData);
        if (result?.error) setError(result.error);
      } else {
        const result = await updateProperty(property!.id, formData);
        if (result?.error) setError(result.error);
        else {
          setSuccess("Cambios guardados correctamente.");
          // Las recién subidas pasan a ser guardadas: un segundo "Guardar"
          // ya no las vuelve a subir
          if (result && "fotos" in result && result.fotos) {
            fotos.forEach(f => f.file && URL.revokeObjectURL(f.url));
            setFotos(result.fotos.map(url => ({ url })));
          }
        }
      }
    });
  }

  // ── Pasos ──────────────────────────────────────────────────────
  const [paso, setPaso] = useState(0);
  // Hasta dónde se llegó: al crear, el riel permite volver y rehacer lo andado
  const [alcanzado, setAlcanzado] = useState(mode === "editar" ? ULTIMO : 0);
  const mesa = useRef<HTMLDivElement>(null);
  const montado = useRef(false);
  const campoInvalido = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    // El aviso del navegador necesita que el campo ya esté a la vista
    if (campoInvalido.current) {
      campoInvalido.current.reportValidity();
      campoInvalido.current = null;
      return;
    }
    const el = mesa.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + top - 110, behavior: "smooth" });
    }
  }, [paso]);

  function ir(n: number) {
    setError(null);
    setSuccess(null);
    setPaso(n);
    setAlcanzado(a => Math.max(a, n));
  }

  /** ¿Está completo el paso? Si no, lo abre y dice qué falta. */
  function validar(i: number): boolean {
    let falta: string | null = null;
    if (i === 0) {
      if (!tipo) falta = "Elegí qué tipo de unidad es.";
      else if (!zona) falta = "Elegí la zona.";
      else if (!barrio) falta = "Elegí el barrio o la localidad.";
    }
    if (i === 3 && precio === "") falta = "Poné el precio para seguir.";
    if (i === ULTIMO && !titulo.trim()) falta = "La publicación necesita un título.";

    // Números fuera de rango (negativos, decimales de más)
    const campos = formRef.current?.querySelectorAll<HTMLInputElement>(`[data-paso="${i}"] input`);
    const malo = Array.from(campos ?? []).find(c => !c.checkValidity());

    if (!falta && !malo) return true;
    if (malo) {
      if (paso === i) malo.reportValidity();
      else campoInvalido.current = malo;
    }
    setPaso(i);
    setAlcanzado(a => Math.max(a, i));
    setError(falta ?? "Revisá el valor marcado.");
    return false;
  }

  function avanzar() {
    if (validar(paso)) ir(Math.min(ULTIMO, paso + 1));
  }

  // Enter en un campo no publica ni guarda por accidente: al crear, avanza
  function alPresionar(e: React.KeyboardEvent<HTMLFormElement>) {
    const t = e.target as HTMLElement;
    if (e.key !== "Enter" || t.tagName !== "INPUT" || e.defaultPrevented) return;
    e.preventDefault();
    if (mode === "crear" && paso < ULTIMO && (t as HTMLInputElement).type !== "search") avanzar();
  }

  // ── Datos que la ficha muestra mientras se cargan ──────────────
  const [precio, setPrecio] = useState(texto(property?.precio));
  const [moneda, setMoneda] = useState<string>(property?.moneda || "USD");
  const [expensas, setExpensas] = useState(texto(property?.expensas));
  const [ambientes, setAmbientes] = useState<number | undefined>(property?.ambientes ?? undefined);
  const [dormitorios, setDormitorios] = useState<number | undefined>(property?.dormitorios ?? undefined);
  const [banos, setBanos] = useState<number | undefined>(property?.banos ?? undefined);
  const [antiguedad, setAntiguedad] = useState<number | undefined>(property?.antiguedad ?? undefined);
  const [cochera, setCochera] = useState(!!property?.cochera);
  const [aptoCredito, setAptoCredito] = useState(!!property?.apto_credito);
  const [estado, setEstado] = useState<string>(property?.estado || "");
  const [orientacion, setOrientacion] = useState<string>(property?.orientacion || "");
  const [disposicion, setDisposicion] = useState<string>(property?.disposicion || "");
  const [status, setStatus] = useState<string>(property?.status || "activa");
  const [conDescripcion, setConDescripcion] = useState(!!property?.descripcion?.trim());
  const [arrastrando, setArrastrando] = useState(false);

  // El título se propone solo hasta que alguien lo escribe
  const [tituloPropio, setTituloPropio] = useState<string | null>(property?.titulo ?? null);
  const titulo = tituloPropio ?? tituloSugerido(tipo, ambientes, barrio);

  const listaBarrios = barrio && !barrios.includes(barrio) ? [barrio, ...barrios] : barrios;
  const precioTxt = precio !== "" && Number(precio) > 0 ? `${moneda} ${num(Number(precio))}` : null;
  const distribucion = esCochera ? null : [
    ambientes != null ? `${ambientes} amb.` : null,
    dormitorios != null ? `${dormitorios} dorm.` : null,
    banos != null ? `${banos} ${banos === 1 ? "baño" : "baños"}` : null,
  ].filter(Boolean).join(" · ") || null;

  // Lo que falta para que el aviso rinda más. Sugiere, no traba.
  const pendientes = [
    fotos.length < 3 && { paso: 2, t: fotos.length === 0 ? "Sumar fotos" : "Sumar más fotos" },
    !direccion.trim() && { paso: 0, t: "Escribir la dirección" },
    !supTotal && { paso: 1, t: "Cargar la superficie" },
    !conDescripcion && { paso: ULTIMO, t: "Contar cómo es en la descripción" },
  ].filter((x): x is { paso: number; t: string } => !!x);

  const escenas = [
    { q: "¿Qué vendés y dónde está?", d: "El tipo de unidad y el barrio son lo primero que filtra quien busca." },
    esCochera
      ? { q: "¿Cómo es la cochera?", d: "Las medidas y algunos datos ayudan a compararla." }
      : tipo === "terreno"
        ? { q: "¿Cuánto mide el terreno?", d: "Los metros ordenan las comparaciones." }
        : { q: "¿Cómo es por dentro?", d: "Nada de esto es obligatorio, pero los metros y los ambientes ordenan las comparaciones." },
    { q: "Mostrala como la querés ver", d: "Las fotos son lo primero que mira un interesado." },
    { q: "¿Cuánto pedís?", d: "Podés cambiarlo cuando quieras desde tu panel." },
    mode === "crear"
      ? { q: "Las últimas palabras", d: "Un título claro y una buena descripción. Revisá la ficha y publicá." }
      : { q: "El aviso", d: "El título, la descripción y el estado de la publicación." },
  ];

  const campoNumero = (nombre: string, etiqueta: string, valor: string, cambiar: (v: string) => void) => (
    <label className="pf-metros">
      <span>{etiqueta}</span>
      <input name={nombre} type="number" inputMode="decimal" min={0} step="0.01" value={valor}
        onChange={e => cambiar(e.target.value)} placeholder="0" />
    </label>
  );

  const ocupado = isPending || optimizando;
  const textoEnviar = isPending
    ? (mode === "crear" ? "Publicando…" : "Guardando…")
    : optimizando ? "Optimizando fotos…"
    : mode === "crear" ? "Publicar propiedad" : "Guardar cambios";

  return (
    <div className="pf">
      <section className="ts-escenario pf-escenario" aria-labelledby="pf-titulo">
        <div className="ts-escenario-luz" aria-hidden="true" />
        <Guilloche id="pf-gq" className="ts-escenario-gq" />
        <Link href={volverA} className="pf-volver"><ArrowLeft size={14} strokeWidth={1.8} /> Volver al panel</Link>
        <div className="ts-apertura">
          <p className="ts-eyebrow">{mode === "crear" ? "Nueva publicación · sin comisión" : "Tu publicación"}</p>
          <h1 id="pf-titulo" className="ts-titulo pf-titulo">
            {mode === "crear" ? <>Presentemos <em>tu propiedad</em></> : <>Editar <em>tu propiedad</em></>}
          </h1>
          <p className="ts-lead">
            {mode === "crear"
              ? "Cinco pasos cortos. Cada respuesta va completando la ficha de tu publicación."
              : "Elegí el paso que querés cambiar y guardá cuando termines."}
          </p>
        </div>
        {avisos && <div className="pf-avisos">{avisos}</div>}
      </section>

      <div className="ts-principal pf-principal">
        <div ref={mesa} className="ts-mesa">
          <form ref={formRef} onSubmit={handleSubmit} onKeyDown={alPresionar} noValidate className="ts-hoja pf-hoja">
            {/* El avance: un rombo por paso sobre el riel */}
            <ol className="ts-riel" style={{ "--avance": paso / ULTIMO } as React.CSSProperties} aria-label="Pasos">
              {PASOS.map((p, i) => {
                const abierto = i <= alcanzado;
                return (
                  <li key={p.n} data-estado={i === paso ? "actual" : abierto ? "hecho" : "pendiente"}>
                    <button type="button" disabled={!abierto} onClick={() => ir(i)}
                      aria-current={i === paso ? "step" : undefined}>
                      <span className="ts-riel-n">{p.n}</span>
                      <span className="ts-riel-t">{p.t}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <header key={paso} className="ts-escena">
              <span className="ts-escena-n">Paso {PASOS[paso].n} de {PASOS[ULTIMO].n}</span>
              <h2 className="ts-escena-q">{escenas[paso].q}</h2>
              <p className="ts-escena-d">{escenas[paso].d}</p>
            </header>

            {/* ── I · Ubicación ─────────────────────────────── */}
            <div className="ts-cuerpo" data-paso="0" hidden={paso !== 0}>
              <div className="ts-grupo">
                <p className="ts-rotulo">Tipo de unidad</p>
                <Opciones nombre="Tipo de unidad" opciones={TIPOS} valor={tipo || undefined}
                  onCambio={t => { setTipo(t); setError(null); }} columnas={3} />
                <input type="hidden" name="tipo" value={tipo} />
                <input type="hidden" name="operacion" value="venta" />
              </div>
              <div className="ts-grupo">
                <p className="ts-rotulo">Zona</p>
                <Opciones nombre="Zona" opciones={OPCIONES_ZONA} valor={zona || undefined}
                  onCambio={z => { if (z !== zona) { setZona(z); setBarrio(""); } setError(null); }} columnas={2} />
                <input type="hidden" name="provincia" value={zona} />
                {/* Ciudad oculta — se settea igual a la zona para compatibilidad */}
                <input type="hidden" name="ciudad" value={zona} />
              </div>
              {zona && (
                <div className="ts-grupo">
                  <p className="ts-rotulo">
                    Barrio o localidad {barrio && <em>· elegido: <strong>{barrio}</strong></em>}
                  </p>
                  <BuscadorBarrio key={zona} barrios={listaBarrios} valor={barrio}
                    onCambio={b => { setBarrio(b); setError(null); }}
                    placeholder="Buscá el barrio o la localidad"
                    vacio="No encontramos ese nombre en la lista." />
                </div>
              )}
              <input type="hidden" name="barrio" value={barrio} />
              <label className="ts-texto">
                <span className="ts-rotulo">Dirección <em>(opcional · solo calle y número)</em></span>
                <input name="direccion" type="text" value={direccion} placeholder="Ej.: Av. Corrientes 1234"
                  onChange={e => setDireccion(e.target.value)} />
              </label>
              {/* Ubicación: sigue a la dirección o se marca a mano en el mapa */}
              <UbicacionEnMapa
                direccion={direccion}
                barrio={barrio}
                zona={zona}
                inicial={
                  property?.lat != null && property?.lng != null
                    ? { lat: property.lat, lng: property.lng, aproximada: !!property.geo_aproximada }
                    : null
                }
              />
            </div>

            {/* ── II · La unidad ────────────────────────────── */}
            <div className="ts-cuerpo" data-paso="1" hidden={paso !== 1}>
              {!esCochera && (
                <div className="pf-contadores">
                  <Numero chico etiqueta="Ambientes" valor={ambientes} onCambio={setAmbientes} min={1} max={30} placeholder="—" />
                  <Numero chico etiqueta="Dormitorios" valor={dormitorios} onCambio={setDormitorios} max={20} placeholder="—" />
                  <Numero chico etiqueta="Baños" valor={banos} onCambio={setBanos} max={10} placeholder="—" />
                  <input type="hidden" name="ambientes" value={ambientes ?? ""} />
                  <input type="hidden" name="dormitorios" value={dormitorios ?? ""} />
                  <input type="hidden" name="banos" value={banos ?? ""} />
                </div>
              )}

              {/* Superficies: el total se calcula solo */}
              <div className="ts-grupo">
                <p className="ts-rotulo">Superficies <em>en m²</em></p>
                <div className="pf-superficies">
                  {campoNumero("superficie_cubierta", "Cubierta", supCubierta, setSupCubierta)}
                  {campoNumero("superficie_balcon", "Balcón", supBalcon, setSupBalcon)}
                  {campoNumero("superficie_descubierta", "Descubierta o terraza", supDescubierta, setSupDescubierta)}
                  <div className="pf-total" aria-live="polite">
                    <span>Total · se suma solo</span>
                    <strong>{supTotal ? `${num(supTotal)} m²` : "—"}</strong>
                  </div>
                </div>
                <input name="superficie_total" type="hidden" value={supTotal || ""} />
              </div>

              <div className="ts-seccion">
                <h3 className="ts-seccion-t">Detalles</h3>
                {!esCochera && (
                  <div className="ts-sws">
                    <Interruptor etiqueta="Tiene cochera o garage" valor={cochera} onCambio={setCochera} />
                    <input type="hidden" name="cochera" value={String(cochera)} />
                  </div>
                )}
                <div className="ts-par ts-par-piso">
                  <Numero chico etiqueta="Antigüedad" unidad="años" valor={antiguedad} onCambio={setAntiguedad}
                    max={150} placeholder="—" formato={a => (a === 0 ? "A estrenar" : null)} />
                  <input type="hidden" name="antiguedad" value={antiguedad ?? ""} />
                  <label className="ts-texto">
                    <span className="ts-rotulo">Piso</span>
                    <input name="piso" type="text" maxLength={10} defaultValue={property?.piso ?? ""} placeholder="PB, 3, 12…" />
                  </label>
                </div>
                <div className="ts-grupo">
                  <p className="ts-rotulo">Estado</p>
                  <Opciones nombre="Estado" opciones={ESTADOS} valor={estado} onCambio={setEstado} columnas={3} />
                  <input type="hidden" name="estado" value={estado} />
                </div>
                <div className="ts-luz">
                  <div className="ts-grupo">
                    <p className="ts-rotulo">Orientación</p>
                    {/* La rosa trabaja en minúsculas; se guarda con mayúscula inicial */}
                    <RosaVientos valor={orientacion.toLowerCase()}
                      onCambio={o => setOrientacion(o ? o[0].toUpperCase() + o.slice(1) : "")} />
                    <input type="hidden" name="orientacion" value={orientacion} />
                  </div>
                  <div className="ts-grupo">
                    <p className="ts-rotulo">Disposición</p>
                    <Opciones nombre="Disposición" opciones={DISPOSICIONES} valor={disposicion} onCambio={setDisposicion} columnas={2} />
                    <input type="hidden" name="disposicion" value={disposicion} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── III · Fotos ───────────────────────────────── */}
            <div className="ts-cuerpo" data-paso="2" hidden={paso !== 2}>
              <button
                type="button"
                className={`pf-soltar${arrastrando ? " is-encima" : ""}`}
                disabled={optimizando || fotos.length >= MAX_FOTOS}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={e => {
                  e.preventDefault();
                  setArrastrando(false);
                  void agregarFotos(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
                }}
              >
                <ImagePlus size={26} strokeWidth={1.4} aria-hidden="true" />
                <strong>
                  {optimizando ? "Optimizando fotos…"
                    : fotos.length >= MAX_FOTOS ? "Llegaste al máximo de fotos"
                    : fotos.length ? "Sumar más fotos" : "Sumá tus fotos"}
                </strong>
                <span>
                  {fotos.length
                    ? `${fotos.length} de ${MAX_FOTOS}`
                    : `Arrastralas o elegilas del teléfono · hasta ${MAX_FOTOS} · se optimizan solas`}
                </span>
              </button>
              {/* Input sin name — los files se agregan manualmente al FormData en handleSubmit */}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />

              {fotos.length > 0 && (
                <div className="ff-grilla">
                  {fotos.map((f, idx) => {
                    const esPortada = idx === 0;
                    return (
                      <div key={f.url} className={`ff-foto${esPortada ? " ff-foto-portada" : ""}`}>
                        <Image
                          src={f.url}
                          alt={esPortada ? "Portada" : `Foto ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 260px"
                          onLoad={e => {
                            const { naturalWidth: ancho, naturalHeight: alto } = e.currentTarget;
                            if (!ancho || !alto) return;
                            const vertical = alto > ancho;
                            setVerticales(prev => (prev[f.url] === vertical ? prev : { ...prev, [f.url]: vertical }));
                          }}
                        />

                        {esPortada ? (
                          <span className="ff-marca-portada">
                            <Star size={10} fill="currentColor" strokeWidth={0} /> Portada
                          </span>
                        ) : (
                          // Siempre visible: en celular no hay "pasar el mouse"
                          <button
                            type="button"
                            onClick={() => hacerPortada(idx)}
                            className="ff-hacer-portada"
                            aria-label={`Usar la foto ${idx + 1} como portada`}
                            title="Usar como portada"
                          >
                            <Star size={12} strokeWidth={2} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => quitarFoto(idx)}
                          className="ff-quitar"
                          aria-label={`Quitar la foto ${idx + 1}`}
                          title="Quitar foto"
                        >
                          ×
                        </button>

                        {f.file && <span className="ff-nueva">Sin guardar</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {portadaVertical && (
                <p className="ff-aviso" role="status">
                  <Info size={13} strokeWidth={2} aria-hidden="true" />
                  <span>
                    La portada es una foto vertical: en los listados se va a ver recortada.{" "}
                    {hayHorizontal
                      ? <>Si querés, tocá <Star size={11} strokeWidth={2.2} className="ff-estrella-txt" /> en una horizontal para usarla de portada.</>
                      : "Si podés, sumá una sacada con el celular acostado."}
                  </span>
                </p>
              )}

              <p className="pf-nota">
                {fotos.length > 1
                  ? <>La primera es la <strong>portada</strong>: la que se ve en los listados y al compartir. Tocá <Star size={11} strokeWidth={2.2} className="ff-estrella-txt" /> en otra foto para cambiarla.</>
                  : <><strong>Una buena secuencia:</strong> living, cocina, dormitorios, baño, balcón y frente. La primera es la portada y conviene que sea horizontal.</>}
              </p>

              {/* Plano (opcional) */}
              <div className="ts-seccion">
                <h3 className="ts-seccion-t">Plano <small>opcional</small></h3>
                {planoPreview ? (
                  <div className="pf-plano">
                    {/* preview puede ser blob: local, usamos img nativa */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={planoPreview} alt="Plano" />
                    <button type="button" onClick={removePlano} className="ff-quitar" aria-label="Quitar plano" title="Quitar plano">×</button>
                  </div>
                ) : (
                  <button type="button" className="pf-secundario" disabled={optimizando} onClick={() => planoRef.current?.click()}>
                    Agregar el plano
                  </button>
                )}
                <input ref={planoRef} type="file" accept="image/*" hidden onChange={handlePlanoChange} />
              </div>
            </div>

            {/* ── IV · Precio ───────────────────────────────── */}
            <div className="ts-cuerpo" data-paso="3" hidden={paso !== 3}>
              <div className="ts-grupo">
                <p className="ts-rotulo">Precio de venta</p>
                <div className="pf-precio">
                  <div className="pf-moneda">
                    <Opciones nombre="Moneda" opciones={MONEDAS} valor={moneda} onCambio={setMoneda} columnas={2} />
                  </div>
                  <input name="precio" type="number" inputMode="decimal" min={0} step="0.01" value={precio}
                    onChange={e => { setPrecio(e.target.value); setError(null); }}
                    placeholder="150000" aria-label="Precio" />
                </div>
                <input type="hidden" name="moneda" value={moneda} />
                {precioTxt && <span className="ts-num-leyenda">{precioTxt}</span>}
              </div>
              {tipo === "departamento" && zona === "Ciudad Autónoma de Buenos Aires" && (
                <p className="ts-dir-nota">
                  <strong>¿Dudás del precio?</strong>{" "}
                  <a href="/estimador" target="_blank" rel="noopener">Consultá el Estimador</a>: se abre en otra pestaña
                  y no perdés lo que cargaste.
                </p>
              )}
              <label className="ts-texto">
                <span className="ts-rotulo">Expensas <em>(opcional · pesos por mes)</em></span>
                <input name="expensas" type="number" inputMode="numeric" min={0} value={expensas}
                  onChange={e => setExpensas(e.target.value)} placeholder="Ej.: 180000" />
              </label>
              <div className="ts-sws">
                <Interruptor etiqueta="Apto crédito hipotecario" valor={aptoCredito} onCambio={setAptoCredito} />
                <input type="hidden" name="apto_credito" value={String(aptoCredito)} />
              </div>
            </div>

            {/* ── V · El aviso ──────────────────────────────── */}
            <div className="ts-cuerpo" data-paso="4" hidden={paso !== 4}>
              <label className="ts-texto">
                <span className="ts-rotulo">
                  Título {tituloPropio === null && <em>· te proponemos uno, podés cambiarlo</em>}
                </span>
                <input name="titulo" type="text" maxLength={120} value={titulo}
                  onChange={e => { setTituloPropio(e.target.value); setError(null); }}
                  placeholder="Ej.: Departamento 3 ambientes luminoso con balcón" />
              </label>

              <div className="ts-grupo">
                <div className="pf-desc-cab">
                  <label htmlFor="pf-descripcion" className="ts-rotulo">Descripción</label>
                  <div className="pf-ia">
                    {usosIA !== null && (
                      <span>{usosIA > 0 ? `${usosIA} ${usosIA === 1 ? "uso" : "usos"} de IA` : "Sin usos de IA"}</span>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerarIA}
                      disabled={iaCargando || usosIA === 0}
                      title={usosIA === 0 ? "Alcanzaste el límite de generaciones para esta propiedad" : "Generar la descripción con IA a partir de los datos cargados"}
                      className="pf-secundario"
                    >
                      <Sparkles size={13} aria-hidden="true" />
                      {iaCargando ? "Generando…" : "Redactar con IA"}
                    </button>
                  </div>
                </div>
                <textarea id="pf-descripcion" ref={descripcionRef} name="descripcion" rows={7}
                  defaultValue={property?.descripcion} className="pf-area"
                  onChange={e => setConDescripcion(!!e.target.value.trim())}
                  placeholder="Estado, luz, comodidades, entorno, accesos…" />
                {iaError && <p className="pf-ia-error">{iaError}</p>}
                <p className="ts-privado">La IA redacta a partir de los datos cargados y se agrega al final. Revisalo antes de publicar.</p>
              </div>

              {/* Estado (solo editar) */}
              {mode === "editar" && (
                <div className="ts-grupo">
                  <p className="ts-rotulo">Estado de la publicación</p>
                  <Opciones nombre="Estado de la publicación" opciones={STATUS} valor={status} onCambio={setStatus} columnas={3} />
                  <input type="hidden" name="status" value={status} />
                </div>
              )}

              {pendientes.length > 0 && (
                <div className="pf-pendientes">
                  <p>Para que tu aviso rinda más <em>(opcional)</em></p>
                  <ul>
                    {pendientes.map(p => (
                      <li key={p.t}>
                        <button type="button" onClick={() => {
                          if (p.paso === ULTIMO) descripcionRef.current?.focus();
                          else ir(p.paso);
                        }}>
                          {p.t} <ArrowRight size={13} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && <p className="ts-error" role="alert">{error}</p>}
            {success && <p className="pf-exito" role="status">{success}</p>}

            <div className="ts-acciones">
              {paso > 0 ? (
                <button type="button" className="ts-atras" onClick={() => ir(paso - 1)}>
                  <ArrowLeft size={14} strokeWidth={1.8} /> Anterior
                </button>
              ) : (
                <Link href={volverA} className="ts-atras">Cancelar</Link>
              )}
              {/* Las keys evitan que "Seguir" se convierta en el botón de envío durante el mismo clic */}
              <div className="ts-acciones-der">
                {paso < ULTIMO && (
                  <button key="seguir" type="button" onClick={avanzar}
                    className={mode === "crear" ? "ts-seguir" : "ts-saltar"}>
                    {mode === "crear" ? PASOS[paso].seguir : "Siguiente"}
                    {mode === "crear" && <ArrowRight size={14} strokeWidth={1.8} />}
                  </button>
                )}
                {(mode === "editar" || paso === ULTIMO) && (
                  <button key="enviar" type="submit" className="ts-seguir" disabled={ocupado}>
                    {textoEnviar}
                  </button>
                )}
              </div>
            </div>
          </form>

          <FichaPublicacion
            portada={fotos[0]?.url}
            titulo={titulo}
            precio={precioTxt}
            lineas={[
              { k: "Barrio", v: barrio || null },
              { k: "Dirección", v: direccion.trim() || null },
              { k: "Superficie", v: supTotal ? `${num(supTotal)} m²` : null },
              { k: "Distribución", v: distribucion },
              { k: "Expensas", v: expensas !== "" ? `ARS ${num(Number(expensas))}` : null },
              { k: "Fotos", v: fotos.length ? String(fotos.length) : null },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
