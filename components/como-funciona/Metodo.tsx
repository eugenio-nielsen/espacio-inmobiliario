"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserRound, Camera, MessageSquare, Handshake,
  Search, Phone, BadgeCheck, ArrowRight, MoveRight,
} from "lucide-react";
import TarjetaViva from "./TarjetaViva";

type Paso = { icon: React.ElementType; titulo: string; texto: string };

const DUENO: Paso[] = [
  {
    icon: UserRound,
    titulo: "Creá tu cuenta",
    texto: "Menos de dos minutos. Nombre, email y teléfono. Sin cargos, sin datos de tarjeta, sin letra chica.",
  },
  {
    icon: Camera,
    titulo: "Publicá tu propiedad",
    texto: "Fotos, descripción, precio y ubicación. Queda visible al instante para los interesados activos en Buenos Aires.",
  },
  {
    icon: MessageSquare,
    titulo: "Recibí consultas",
    texto: "Los interesados te escriben a vos. Cada consulta llega a tu email y a tu panel en tiempo real.",
  },
  {
    icon: Handshake,
    titulo: "Cerrá acompañado",
    texto: "Eugenio Nielsen te acompaña durante todo el proceso. No estás solo: hay alguien con nombre y apellido detrás.",
  },
];

const COMPRADOR: Paso[] = [
  {
    icon: Search,
    titulo: "Explorá el catálogo",
    texto: "Propiedades publicadas por sus dueños. Lo que ves es el precio que pide el propietario, sin recargo de agencia.",
  },
  {
    icon: Phone,
    titulo: "Contactá al dueño",
    texto: "Cada ficha tiene un formulario que llega directo al propietario. Sin intermediarios que filtren o demoren.",
  },
  {
    icon: BadgeCheck,
    titulo: "Negociá a precio real",
    texto: "Sin comisiones implícitas, accedés a valores de mercado. Y si necesitás orientación, Eugenio está disponible.",
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
      {/* key fuerza el remontaje para que la entrada se reproduzca en cada cambio */}
      <div key={lado.id} className="cf-panel">
        <div className={lado.pasos.length === 3 ? "cf-steps-3" : "cf-steps"}>
          {lado.pasos.map((p, n) => {
            const Icon = p.icon;
            return (
              <TarjetaViva key={p.titulo} sheenDelay={n * 900}>
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: 12, marginBottom: 22,
                }}>
                  <span className="cf-card-icon" style={{ ["--sheen" as string]: `${n * 900}ms` }}>
                    <Icon size={19} strokeWidth={1.5} />
                  </span>
                  <span className="cf-card-num" aria-hidden="true">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 600,
                  fontSize: "clamp(19px,2.2vw,23px)", lineHeight: 1.2,
                  letterSpacing: "-.02em", color: "#fff", margin: "0 0 10px",
                }}>
                  {p.titulo}
                </h3>
                <p style={{
                  fontFamily: "var(--font-sans)", fontWeight: 300,
                  fontSize: 14.5, lineHeight: 1.7,
                  color: "rgba(255,255,255,.6)", margin: 0,
                }}>
                  {p.texto}
                </p>
              </TarjetaViva>
            );
          })}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap", marginTop: "clamp(26px,4vw,40px)",
        }}>
          <span className="cf-swipe-hint" style={{ color: "var(--gold-400)" }}>
            Deslizá <MoveRight size={14} strokeWidth={1.6} />
          </span>
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
