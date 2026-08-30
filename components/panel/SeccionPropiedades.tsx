"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Edit2, ExternalLink, Eye, MessageSquare, Plus,
  PlayCircle, PauseCircle, CheckCircle2, HandHeart, Check,
} from "lucide-react";
import { setPropertyStatus } from "@/lib/actions/properties";
import { solicitarAyudaVenta } from "@/lib/actions/ayuda";
import { buildPropertyUrl } from "@/lib/utils/urls";
import type { PropertyWithInquiries } from "@/lib/types";

type PropStatus = "activa" | "pausada" | "vendida";

const ESTADO: Record<PropStatus, { label: string; bg: string; color: string; icono: React.ReactNode }> = {
  activa:  { label: "Activa",  bg: "#F0FDF4", color: "#15803D", icono: <PlayCircle size={12} /> },
  pausada: { label: "Pausada", bg: "#FFFBEB", color: "#B45309", icono: <PauseCircle size={12} /> },
  vendida: { label: "Vendida", bg: "#F1F5F9", color: "#475569", icono: <CheckCircle2 size={12} /> },
};

const fmtPrecio = (p: number, m: string) =>
  `${m === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(p))}`;

export default function SeccionPropiedades({ properties }: { properties: PropertyWithInquiries[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todas" | PropStatus>("todas");

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return properties.filter(p => {
      if (filtro !== "todas" && p.status !== filtro) return false;
      if (!q) return true;
      return [p.titulo, p.barrio, p.ciudad, p.direccion].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [properties, busqueda, filtro]);

  const conteo = (s: PropStatus) => properties.filter(p => p.status === s).length;

  if (!properties.length) {
    return (
      <div style={{ textAlign: "center", padding: "28px 16px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", margin: "0 0 16px" }}>
          Todavía no publicaste ninguna propiedad.
        </p>
        <Link href="/panel/propiedades/nueva" style={botonPrimario}>
          <Plus size={15} strokeWidth={2.5} /> Publicar mi primera propiedad
        </Link>
      </div>
    );
  }

  const filtros: [string, string][] = [
    ["todas", `Todas (${properties.length})`],
    ["activa", `Activas (${conteo("activa")})`],
    ["pausada", `Pausadas (${conteo("pausada")})`],
    ["vendida", `Vendidas (${conteo("vendida")})`],
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={15} color="var(--ink-400)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por título o zona…"
            style={{
              width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
              padding: "9px 12px 9px 34px", fontFamily: "var(--font-sans)", fontSize: 13.5,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filtros.map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor as "todas" | PropStatus)}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
                padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${filtro === valor ? "var(--navy-800)" : "var(--line-200)"}`,
                background: filtro === valor ? "var(--navy-800)" : "#fff",
                color: filtro === valor ? "#fff" : "var(--ink-600)",
              }}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <Link href="/panel/propiedades/nueva" style={{ ...botonPrimario, marginLeft: "auto" }}>
          <Plus size={15} strokeWidth={2.5} /> Nueva
        </Link>
      </div>

      {!visibles.length ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", textAlign: "center", padding: "20px 0" }}>
          No hay propiedades que coincidan con el filtro.
        </p>
      ) : (
        <div className="panel-props-grid">
          {visibles.map(p => <Tarjeta key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function Tarjeta({ p }: { p: PropertyWithInquiries }) {
  const [estado, setEstado] = useState(p.status as PropStatus);
  const [pendiente, startTransition] = useTransition();
  const e = ESTADO[estado];

  function cambiarEstado(nuevo: PropStatus) {
    const previo = estado;
    setEstado(nuevo); // optimista: se revierte si falla
    startTransition(async () => {
      const r = await setPropertyStatus(p.id, nuevo);
      if (!r.ok) setEstado(previo);
    });
  }

  return (
    <article style={{
      border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)",
      overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--fill-100)" }}>
        {p.fotos?.[0] ? (
          <Image src={p.fotos[0]} alt="" fill className="object-cover" sizes="280px" />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-400)", fontFamily: "var(--font-sans)", fontSize: 12 }}>
            Sin foto
          </div>
        )}
        <span style={{
          position: "absolute", top: 8, left: 8,
          display: "inline-flex", alignItems: "center", gap: 4,
          fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
          padding: "4px 9px", borderRadius: 999,
          background: e.bg, color: e.color,
        }}>
          {e.icono} {e.label}
        </span>
      </div>

      <div style={{ padding: "11px 12px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <p style={{
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, lineHeight: 1.35,
          color: "var(--ink-900)", margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.titulo}
        </p>

        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--navy-800)", margin: 0 }}>
          {fmtPrecio(p.precio, p.moneda)}
        </p>

        <div style={{
          display: "flex", gap: 12, fontFamily: "var(--font-sans)", fontSize: 12,
          color: "var(--ink-500)", paddingTop: 8, borderTop: "1px solid var(--line-100)",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Eye size={12.5} /> {p.views ?? 0}
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            color: p.new_inquiries ? "#1D4ED8" : "var(--ink-500)",
            fontWeight: p.new_inquiries ? 700 : 400,
          }}>
            <MessageSquare size={12.5} /> {p.total_inquiries}
            {p.new_inquiries > 0 ? ` · ${p.new_inquiries} nuevas` : ""}
          </span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {(["activa", "pausada", "vendida"] as PropStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => cambiarEstado(s)}
              disabled={pendiente || estado === s}
              title={`Marcar como ${ESTADO[s].label.toLowerCase()}`}
              style={{
                flex: 1, fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 600,
                padding: "5px 2px", borderRadius: "var(--radius-xs)",
                cursor: estado === s ? "default" : "pointer",
                border: `1px solid ${estado === s ? ESTADO[s].color : "var(--line-200)"}`,
                background: estado === s ? ESTADO[s].bg : "#fff",
                color: estado === s ? ESTADO[s].color : "var(--ink-500)",
              }}
            >
              {ESTADO[s].label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <Link href={`/panel/propiedades/${p.slug}/editar`} style={botonChico}>
            <Edit2 size={12.5} /> Editar
          </Link>
          <a
            href={buildPropertyUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...botonChico, flex: "0 0 auto", padding: "7px 9px" }}
            title="Ver publicación"
          >
            <ExternalLink size={12.5} />
          </a>
        </div>

        <div style={{ marginTop: "auto" }}>
          <BotonAyuda propertyId={p.id} />
        </div>
      </div>
    </article>
  );
}

function BotonAyuda({ propertyId }: { propertyId: string }) {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  if (enviado) {
    return (
      <p style={{
        display: "inline-flex", alignItems: "center", gap: 6, margin: 0,
        fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "#15803D",
      }}>
        <Check size={13} strokeWidth={3} /> Pedido enviado, te contactamos
      </p>
    );
  }

  function pedir() {
    startTransition(async () => {
      setError(null);
      const r = await solicitarAyudaVenta(propertyId);
      if (r.ok) setEnviado(true);
      else setError(r.error ?? "No se pudo enviar.");
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pendiente}
        onClick={pedir}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
          padding: "8px", borderRadius: "var(--radius-xs)",
          cursor: pendiente ? "wait" : "pointer",
          background: "rgba(185,159,102,.12)", color: "var(--gold-700)",
          border: "1px solid var(--gold-300)",
        }}
      >
        <HandHeart size={13} /> {pendiente ? "Enviando…" : "Solicitar ayuda para la venta"}
      </button>
      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#DC2626", margin: "6px 0 0" }}>
          {error}
        </p>
      )}
    </>
  );
}

const botonPrimario: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
  background: "var(--navy-800)", color: "#fff", padding: "9px 16px",
  borderRadius: "var(--radius-sm)", textDecoration: "none", whiteSpace: "nowrap",
};

const botonChico: React.CSSProperties = {
  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
  padding: "7px 10px", borderRadius: "var(--radius-xs)",
  border: "1px solid var(--line-200)", color: "var(--ink-700)",
  textDecoration: "none", background: "#fff",
};
