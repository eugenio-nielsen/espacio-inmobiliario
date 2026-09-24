"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Secuencia from "@/components/ui/Secuencia";

type Paso = { t: string; d: string };

const DUENO: Paso[] = [
  {
    t: "Creá tu cuenta",
    d: "Menos de dos minutos. Nombre, email y teléfono. Sin cargos, sin datos de tarjeta, sin letra chica.",
  },
  {
    t: "Publicá tu propiedad",
    d: "Fotos, descripción, precio y ubicación. Queda visible al instante para los interesados activos en Buenos Aires.",
  },
  {
    t: "Recibí consultas",
    d: "Los interesados te escriben a vos. Cada consulta llega a tu email y a tu panel en tiempo real.",
  },
  {
    t: "Cerrá acompañado",
    d: "Eugenio Nielsen te acompaña durante todo el proceso. No estás solo: hay alguien con nombre y apellido detrás.",
  },
];

const COMPRADOR: Paso[] = [
  {
    t: "Explorá el catálogo",
    d: "Propiedades publicadas por sus dueños. Lo que ves es el precio que pide el propietario, sin recargo de agencia.",
  },
  {
    t: "Contactá al dueño",
    d: "Cada ficha tiene un formulario que llega directo al propietario, sin filtros ni demoras en el medio.",
  },
  {
    t: "Negociá a precio real",
    d: "Sin comisiones implícitas, accedés a valores de mercado. Y si necesitás orientación, Eugenio está disponible.",
  },
];

const LADOS = [
  { id: "dueno", label: "Soy dueño", pasos: DUENO, cta: { href: "/auth/registro", txt: "Publicar mi propiedad gratis" } },
  { id: "comprador", label: "Busco comprar", pasos: COMPRADOR, cta: { href: "/propiedades", txt: "Ver propiedades" } },
] as const;

/**
 * Un solo bloque para los dos recorridos, con conmutador.
 *
 * Antes eran dos secciones apiladas (siete pasos, uno debajo del otro):
 * en móvil eso era una caminata. Al conmutar, el visitante ve solo su
 * recorrido — y de paso el bloque deja de ser algo que se mira y pasa a
 * ser algo con lo que se juega.
 */
export default function Metodo() {
  const [i, setI] = useState(0);
  const lado = LADOS[i];

  return (
    <div>
      {/* ── Conmutador ─────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "clamp(34px,5vw,52px)" }}>
        <div className="cf-switch" role="tablist" aria-label="Elegí tu recorrido">
          <span
            className="cf-switch-ind"
            aria-hidden="true"
            style={{
              width: "calc(50% - 4px)",
              left: 4,
              transform: `translateX(${i * 100}%)`,
            }}
          />
          {LADOS.map((l, idx) => (
            <button
              key={l.id}
              role="tab"
              type="button"
              aria-selected={i === idx}
              data-on={i === idx}
              className="cf-switch-btn"
              style={{ flex: 1 }}
              onClick={() => setI(idx)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pasos ──────────────────────────────────────────── */}
      {/* key fuerza el remontaje: la Secuencia vuelve a trazar su riel en
          cada cambio de recorrido */}
      <div key={lado.id} className="cf-panel">
        <Secuencia pasos={lado.pasos} tono="oscuro" />

        <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(34px,4.5vw,52px)" }}>
          <Link
            href={lado.cta.href}
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
              letterSpacing: ".02em", background: "var(--gold-500)",
              color: "var(--navy-950)", padding: "14px 28px",
              borderRadius: 2, textDecoration: "none",
              border: "1px solid var(--gold-500)",
            }}
          >
            {lado.cta.txt}
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
