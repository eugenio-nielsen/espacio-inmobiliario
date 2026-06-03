"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { createProperty, updateProperty } from "@/lib/actions/properties";
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
  const fileRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files || []);
    if (!added.length) return;
    setNuevasFiles(prev => [...prev, ...added]);
    setNuevasPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))]);
    // reset input so the same file can be re-added if needed
    e.target.value = "";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos básicos */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Datos básicos</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input name="titulo" type="text" required defaultValue={v?.titulo} maxLength={120}
            className={inp} placeholder="Ej: Departamento 3 ambientes luminoso con balcón" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="descripcion" rows={5} defaultValue={v?.descripcion}
            className={`${inp} resize-y`}
            placeholder="Describí tu propiedad: estado, comodidades, entorno, accesos, etc." />
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
            Dirección <span className="text-gray-400 font-normal">(opcional — solo calle y número, sin barrio)</span>
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
        <h2 className="font-semibold text-[#0E2C50] text-sm uppercase tracking-wide">Características</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambientes</label>
            <input name="ambientes" type="number" min={1} max={30} defaultValue={v?.ambientes ?? ""} className={inp} placeholder="Ej: 4" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dormitorios</label>
            <input name="dormitorios" type="number" min={0} max={20} defaultValue={v?.dormitorios ?? ""} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sup. total (m²)</label>
            <input name="superficie_total" type="number" min={0} step="0.01" defaultValue={v?.superficie_total ?? ""} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sup. cubierta (m²)</label>
            <input name="superficie_cubierta" type="number" min={0} step="0.01" defaultValue={v?.superficie_cubierta ?? ""} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
            <input name="banos" type="number" min={0} max={10} defaultValue={v?.banos ?? ""} className={inp} />
          </div>
        </div>
        {/* Orientación y Disposición */}
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

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <input type="hidden" name="cochera" value="false" />
            <input id="cochera" name="cochera" type="checkbox" value="true" defaultChecked={v?.cochera}
              className="w-4 h-4 rounded border-gray-300" style={{ accentColor: "#0E2C50" }} />
            <label htmlFor="cochera" className="text-sm text-gray-700">Tiene cochera / garage</label>
          </div>
          <div className="flex items-center gap-3">
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
            <option value="activa">Activa — visible en el listado público</option>
            <option value="pausada">Pausada — oculta temporalmente</option>
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
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-gray-400 text-sm">📷 Hacé clic para agregar fotos</p>
          <p className="text-gray-300 text-xs mt-1">JPG, PNG o WEBP · Máximo 10 fotos</p>
          {/* Input sin name — los files se agregan manualmente al FormData en handleSubmit */}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
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
        <button type="submit" disabled={isPending}
          className="text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          style={{ background: isPending ? "#6b8fa8" : "#0E2C50" }}>
          {isPending ? "Guardando..." : mode === "crear" ? "Publicar propiedad" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
