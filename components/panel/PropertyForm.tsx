"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Star, Sparkles } from "lucide-react";
import { createProperty, updateProperty } from "@/lib/actions/properties";
import { generarDescripcionIA } from "@/lib/actions/descripcion";
import type { CamposDescripcion } from "@/lib/ai/descripcion";
import { compressImage } from "@/lib/utils/compressImage";
import type { Property } from "@/lib/types";
import { ZONAS, UBICACIONES, type Zona } from "@/lib/ubicaciones";
import MapFormPreview from "@/components/map/MapFormPreview";

interface Props {
  mode: "crear" | "editar";
  property?: Property;
}

export default function PropertyForm({ mode, property }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fotosExistentes, setFotosExistentes] = useState<string[]>(property?.fotos || []);
  const [nuevasFiles, setNuevasFiles] = useState<File[]>([]);
  const [nuevasPreviews, setNuevasPreviews] = useState<string[]>([]);
  const [optimizando, setOptimizando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files || []);
    // reset input so the same file can be re-added if needed
    e.target.value = "";
    if (!added.length) return;

    const lugar = MAX_FOTOS - (fotosExistentes.length + nuevasFiles.length);
    if (lugar <= 0) {
      setError(`Máximo ${MAX_FOTOS} fotos por publicación.`);
      return;
    }
    setError(null);

    setOptimizando(true);
    try {
      const comprimidas = await Promise.all(added.slice(0, lugar).map(compressImage));
      setNuevasFiles(prev => [...prev, ...comprimidas]);
      setNuevasPreviews(prev => [...prev, ...comprimidas.map(f => URL.createObjectURL(f))]);
      if (added.length > lugar) {
        setError(`Solo se agregaron ${lugar} fotos: el máximo es ${MAX_FOTOS} por publicación.`);
      }
    } finally {
      setOptimizando(false);
    }
  }

  function removeFotoExistente(idx: number) {
    setFotosExistentes(prev => prev.filter((_, i) => i !== idx));
  }

  function removeNuevaFoto(idx: number) {
    setNuevasFiles(prev => prev.filter((_, i) => i !== idx));
    setNuevasPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function setPortadaExistente(idx: number) {
    if (idx === 0) return;
    setFotosExistentes(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  function setPortadaNueva(idx: number) {
    if (idx === 0 && fotosExistentes.length > 0) return; // no-op: existing always precede new
    setNuevasFiles(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
    setNuevasPreviews(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    // Fotos existentes en orden (portada = [0])
    fotosExistentes.forEach((url) => formData.append("fotos_existentes", url));
    // Fotos nuevas en orden (portada entre nuevas = [0]), usando el array de estado (no el input)
    nuevasFiles.forEach((file) => {
      formData.append(mode === "crear" ? "fotos" : "fotos_nuevas", file);
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
        else setSuccess("Cambios guardados correctamente.");
      }
    });
  }

  const v = property;
  const sel = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E2C50]";
  const inp = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E2C50]";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Datos básicos */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Datos básicos</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input name="titulo" type="text" required defaultValue={v?.titulo} maxLength={120}
            className={inp} placeholder="Ej: Departamento 3 ambientes luminoso con balcón" />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <div className="flex items-center gap-2">
              {usosIA !== null && (
                <span className="text-xs text-gray-400">
                  {usosIA > 0 ? `${usosIA} ${usosIA === 1 ? "uso" : "usos"} de IA` : "Sin usos de IA"}
                </span>
              )}
              <button
                type="button"
                onClick={handleGenerarIA}
                disabled={iaCargando || usosIA === 0}
                title={usosIA === 0 ? "Alcanzaste el límite de generaciones para esta propiedad" : "Generar la descripción con IA a partir de los datos cargados"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#B99F66]/40 text-[#0E2C50] hover:bg-[#B99F66]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={13} className="text-[#B99F66]" />
                {iaCargando ? "Generando…" : "Generar con IA"}
              </button>
            </div>
          </div>
          <textarea ref={descripcionRef} name="descripcion" rows={5} defaultValue={v?.descripcion}
            className={`${inp} resize-y`}
            placeholder="Describí tu propiedad: estado, comodidades, entorno, accesos, etc." />
          {iaError && <p className="text-xs text-red-600 mt-1.5">{iaError}</p>}
          <p className="text-[11px] text-gray-400 mt-1">
            La IA redacta a partir de los datos cargados y se agrega al final. Revisalo antes de publicar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de unidad *</label>
            <select name="tipo" required defaultValue={v?.tipo || ""} className={sel}>
              <option value="" disabled>Seleccioná</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="terreno">Terreno</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
            <input type="hidden" name="operacion" value="venta" />
            <div className={`${sel} bg-gray-50 text-gray-500 cursor-default`}>Venta</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
            <input name="precio" type="number" required min={0} step="0.01" defaultValue={v?.precio}
              className={inp} placeholder="150000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda *</label>
            <select name="moneda" defaultValue={v?.moneda || "USD"} className={sel}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Ubicación</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona *</label>
            <select
              name="provincia"
              required
              value={zona}
              onChange={(e) => {
                setZona(e.target.value as Zona);
                setBarrio("");
              }}
              className={sel}
            >
              <option value="" disabled>Seleccioná una zona</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barrio / Localidad *</label>
            <select
              name="barrio"
              required
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              disabled={!zona}
              className={`${sel} disabled:bg-gray-50 disabled:text-gray-400`}
            >
              <option value="" disabled>
                {zona ? "Seleccioná barrio/localidad" : "Primero seleccioná la zona"}
              </option>
              {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {/* Ciudad oculta — se settea igual a la zona para compatibilidad */}
            <input type="hidden" name="ciudad" value={zona} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección <span className="text-gray-400 font-normal">(opcional · solo calle y número, sin barrio)</span>
          </label>
          <input name="direccion" type="text" defaultValue={v?.direccion}
            className={inp} placeholder="Ej: Av. Corrientes 1234"
            onChange={e => setDireccion(e.target.value)} />
        </div>

        {/* Preview del mapa */}
        <MapFormPreview
          direccion={direccion}
          barrio={barrio}
          ciudad={zona}
          provincia={zona}
        />
      </section>

      {/* Características */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Lo principal</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambientes</label>
            <input name="ambientes" type="number" min={1} max={30} defaultValue={v?.ambientes ?? ""} className={inp} placeholder="Ej: 4" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dormitorios</label>
            <input name="dormitorios" type="number" min={0} max={20} defaultValue={v?.dormitorios ?? ""} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
            <input name="banos" type="number" min={0} max={10} defaultValue={v?.banos ?? ""} className={inp} />
          </div>
        </div>
        {/* Superficies: el total se calcula solo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sup. cubierta (m²)</label>
            <input name="superficie_cubierta" type="number" min={0} step="0.01" value={supCubierta}
              onChange={e => setSupCubierta(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sup. balcón (m²)</label>
            <input name="superficie_balcon" type="number" min={0} step="0.01" value={supBalcon}
              onChange={e => setSupBalcon(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sup. descub. / terraza (m²)</label>
            <input name="superficie_descubierta" type="number" min={0} step="0.01" value={supDescubierta}
              onChange={e => setSupDescubierta(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sup. total (m²) <span className="text-gray-400 font-normal">· automática</span>
            </label>
            <input name="superficie_total" type="number" readOnly value={supTotal || ""}
              className={`${inp} bg-gray-50 text-gray-600 cursor-default`} tabIndex={-1} />
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Características</h2>
        <div className="flex items-center gap-3">
          <input type="hidden" name="cochera" value="false" />
          <input id="cochera" name="cochera" type="checkbox" value="true" defaultChecked={v?.cochera}
            className="w-4 h-4 rounded border-gray-300" style={{ accentColor: "#0E2C50" }} />
          <label htmlFor="cochera" className="text-sm text-gray-700">Tiene cochera / garage</label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
            <input name="piso" type="text" maxLength={10} defaultValue={v?.piso ?? ""} className={inp} placeholder="PB, 3, 12…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antigüedad (años)</label>
            <input name="antiguedad" type="number" min={0} max={150} defaultValue={v?.antiguedad ?? ""} className={inp} placeholder="0 = a estrenar" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select name="estado" defaultValue={v?.estado || ""} className={sel}>
              <option value="">Sin especificar</option>
              <option value="A estrenar">A estrenar</option>
              <option value="Excelente">Excelente</option>
              <option value="Muy bueno">Muy bueno</option>
              <option value="Bueno">Bueno</option>
              <option value="A refaccionar">A refaccionar</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientación</label>
            <select name="orientacion" defaultValue={v?.orientacion || ""} className={sel}>
              <option value="">Sin especificar</option>
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
              <option value="Este">Este</option>
              <option value="Oeste">Oeste</option>
              <option value="Noreste">Noreste</option>
              <option value="Noroeste">Noroeste</option>
              <option value="Sureste">Sureste</option>
              <option value="Suroeste">Suroeste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disposición</label>
            <select name="disposicion" defaultValue={v?.disposicion || ""} className={sel}>
              <option value="">Sin especificar</option>
              <option value="Frente">Frente</option>
              <option value="Contrafrente">Contrafrente</option>
              <option value="Lateral">Lateral</option>
              <option value="Otra">Otra</option>
            </select>
          </div>
        </div>
      </section>

      {/* Costos y financiación */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Costos y financiación</h2>
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expensas (ARS/mes)</label>
            <input name="expensas" type="number" min={0} defaultValue={v?.expensas ?? ""} className={inp} placeholder="Ej: 180000" />
          </div>
          <div className="flex items-center gap-3 pb-2.5">
            <input type="hidden" name="apto_credito" value="false" />
            <input id="apto_credito" name="apto_credito" type="checkbox" value="true" defaultChecked={v?.apto_credito}
              className="w-4 h-4 rounded border-gray-300" style={{ accentColor: "#0E2C50" }} />
            <label htmlFor="apto_credito" className="text-sm text-gray-700">Apto crédito hipotecario</label>
          </div>
        </div>
      </section>

      {/* Estado (solo editar) */}
      {mode === "editar" && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Estado de la publicación</h2>
          <select name="status" defaultValue={v?.status || "activa"} className={sel}>
            <option value="activa">Activa · visible en el listado público</option>
            <option value="pausada">Pausada · oculta temporalmente</option>
            <option value="vendida">Vendida</option>
          </select>
        </section>
      )}

      {/* Fotos */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Fotos</h2>
          {(fotosExistentes.length + nuevasPreviews.length) > 1 && (
            <span className="text-xs text-gray-400">Hacé clic en ★ para elegir la portada</span>
          )}
        </div>

        {(fotosExistentes.length > 0 || nuevasPreviews.length > 0) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {/* Fotos existentes */}
            {fotosExistentes.map((url, idx) => {
              const isPortada = idx === 0;
              return (
                <div key={url} className="relative group aspect-square">
                  <Image src={url} alt="Foto" fill className="object-cover rounded-lg" sizes="150px" />

                  {/* Overlay oscuro al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all" />

                  {/* Badge portada */}
                  {isPortada && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#B99F66] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <Star size={9} fill="white" strokeWidth={0} /> Portada
                    </span>
                  )}

                  {/* Botón hacer portada (aparece al hover si no es portada) */}
                  {!isPortada && (
                    <button
                      type="button"
                      onClick={() => setPortadaExistente(idx)}
                      title="Hacer portada"
                      className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 hover:bg-[#B99F66] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Star size={9} strokeWidth={2} /> Portada
                    </button>
                  )}

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => removeFotoExistente(idx)}
                    title="Eliminar foto"
                    className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Fotos nuevas (pendientes de subir) */}
            {nuevasPreviews.map((previewUrl, idx) => {
              const globalIsPortada = fotosExistentes.length === 0 && idx === 0;
              return (
                <div key={previewUrl} className="relative group aspect-square">
                  <Image src={previewUrl} alt="Foto nueva" fill className="object-cover rounded-lg" sizes="150px" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all" />

                  {/* Badge nueva */}
                  {!globalIsPortada && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                      Nueva
                    </span>
                  )}

                  {/* Badge portada (solo si no hay existentes y es la primera nueva) */}
                  {globalIsPortada && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#B99F66] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <Star size={9} fill="white" strokeWidth={0} /> Portada
                    </span>
                  )}

                  {/* Hacer portada entre nuevas (solo si no hay existentes) */}
                  {!globalIsPortada && fotosExistentes.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setPortadaNueva(idx)}
                      title="Hacer portada"
                      className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 hover:bg-[#B99F66] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Star size={9} strokeWidth={2} /> Portada
                    </button>
                  )}

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => removeNuevaFoto(idx)}
                    title="Eliminar foto"
                    className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0E2C50] transition-colors"
          onClick={() => !optimizando && fileRef.current?.click()}
        >
          {optimizando ? (
            <p className="text-gray-500 text-sm">⏳ Optimizando fotos…</p>
          ) : (
            <>
              <p className="text-gray-400 text-sm">📷 Hacé clic para agregar fotos</p>
              <p className="text-gray-300 text-xs mt-1">JPG, PNG o WEBP · Máximo {MAX_FOTOS} fotos · Se optimizan automáticamente</p>
            </>
          )}
          {/* Input sin name — los files se agregan manualmente al FormData en handleSubmit */}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {/* Plano (opcional) */}
        <div className="pt-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Plano <span className="text-gray-400 font-normal">(opcional · imagen)</span>
          </h3>
          {planoPreview ? (
            <div className="relative group w-40 aspect-square">
              {/* preview puede ser blob: local, usamos img nativa */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={planoPreview} alt="Plano" className="w-full h-full object-cover rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={removePlano}
                title="Quitar plano"
                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#0E2C50] transition-colors"
              onClick={() => !optimizando && planoRef.current?.click()}
            >
              <p className="text-gray-400 text-sm">📐 Agregar plano de la propiedad</p>
            </div>
          )}
          <input ref={planoRef} type="file" accept="image/*" className="hidden" onChange={handlePlanoChange} />
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-5 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-5 py-3">{success}</div>
      )}

      <div className="flex justify-end gap-3 pb-8">
        <a href="/panel" className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          Cancelar
        </a>
        <button type="submit" disabled={isPending || optimizando}
          className="text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          style={{ background: isPending || optimizando ? "#6b8fa8" : "#0E2C50" }}>
          {isPending ? "Guardando..." : optimizando ? "Optimizando fotos…" : mode === "crear" ? "Publicar propiedad" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
