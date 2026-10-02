"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Plus, ArrowRight } from "lucide-react";

type Modo = "comprar" | "vender";

const PESTANAS: { modo: Modo; label: string }[] = [
  { modo: "comprar", label: "Quiero comprar" },
  { modo: "vender", label: "Quiero vender" },
];

const TIPOS = [
  { v: "", t: "Todos" },
  { v: "departamento", t: "Departamento" },
  { v: "casa", t: "Casa" },
  { v: "terreno", t: "Terreno" },
  { v: "local", t: "Local" },
  { v: "oficina", t: "Oficina" },
  { v: "cochera", t: "Cochera" },
];

/**
 * La ficha de la portada: una pestaña por audiencia, con los mismos
 * nombres que el menú "Servicios".
 *
 *   · Quiero comprar: el buscador (tipo y zona; la operación es venta).
 *   · Quiero vender: publicar gratis, tasar, o delegar la venta.
 *
 * Los dos paneles ocupan la misma celda de la grilla, así la ficha
 * tiene siempre la altura del más alto y cambiar de pestaña no hace
 * saltar la página. El que no se ve queda `inert`: fuera del foco y
 * del lector de pantalla.
 */
export default function FichaHome({ logueado }: { logueado: boolean }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("comprar");
  const [tipo, setTipo] = useState("");
  const [zona, setZona] = useState("");

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ operacion: "venta" });
    if (tipo) params.set("tipo", tipo);
    if (zona.trim()) params.set("q", zona.trim());
    router.push(`/propiedades?${params.toString()}`);
  }

  // Flechas izquierda/derecha entre pestañas, como pide el patrón de ARIA
  function teclas(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const otro: Modo = modo === "comprar" ? "vender" : "comprar";
    setModo(otro);
    document.getElementById(`ap-tab-${otro}`)?.focus();
  }

  return (
    <div className="ap-ficha" data-modo={modo}>
      <div className="ap-pestanas" role="tablist" aria-label="¿Qué querés hacer?" onKeyDown={teclas}>
        {PESTANAS.map(p => (
          <button
            key={p.modo}
            id={`ap-tab-${p.modo}`}
            type="button"
            role="tab"
            aria-selected={modo === p.modo}
            aria-controls={`ap-panel-${p.modo}`}
            tabIndex={modo === p.modo ? 0 : -1}
            onClick={() => setModo(p.modo)}
            className="ap-pestana"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ap-hoja">
        {/* ── Comprar: el buscador ─────────────────────────────── */}
        <form
          id="ap-panel-comprar"
          role="tabpanel"
          aria-labelledby="ap-tab-comprar"
          className="ap-panel ap-buscar"
          data-activo={modo === "comprar"}
          inert={modo !== "comprar"}
          onSubmit={buscar}
        >
          <label className="ap-campo ap-campo-tipo">
            <span className="ap-rotulo">Tipo</span>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t.v} value={t.v}>{t.t}</option>)}
            </select>
          </label>
          <label className="ap-campo ap-campo-zona">
            <span className="ap-rotulo">Zona o barrio</span>
            <input
              value={zona}
              onChange={e => setZona(e.target.value)}
              placeholder="Palermo, San Isidro, Escobar…"
              enterKeyHint="search"
            />
          </label>
          <button type="submit" className="ap-boton">
            <Search size={15} strokeWidth={2} />
            Buscar
          </button>
        </form>

        {/* ── Vender: publicar, tasar o delegar ────────────────── */}
        <div
          id="ap-panel-vender"
          role="tabpanel"
          aria-labelledby="ap-tab-vender"
          className="ap-panel ap-vender"
          data-activo={modo === "vender"}
          inert={modo !== "vender"}
        >
          <p className="ap-vender-t">
            Publicá gratis y gestioná la venta vos, o{" "}
            <Link href="/vender">delegala con acompañamiento a precio fijo</Link>.
          </p>
          <div className="ap-vender-acciones">
            <Link href={logueado ? "/panel/propiedades/nueva" : "/auth/registro"} className="ap-boton">
              <Plus size={15} strokeWidth={2} />
              Publicar gratis
            </Link>
            <Link href="/estimador" className="ap-enlace">
              Tasar mi propiedad
              <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
