"use client";

import Link from "next/link";
import { Building2, MessageSquare, UserRound, Eye, CalendarClock, ChevronRight } from "lucide-react";
import Seccion from "@/components/panel/Seccion";
import SeccionPropiedades from "@/components/panel/SeccionPropiedades";
import SeccionConsultas from "@/components/panel/SeccionConsultas";
import SeccionVisitas from "@/components/panel/SeccionVisitas";
import type { PropertyWithInquiries, Visita } from "@/lib/types";

export default function PanelDashboard({
  properties,
  visitas,
  perfil,
  showWelcome,
}: {
  properties: PropertyWithInquiries[];
  visitas: Visita[];
  perfil: { nombre: string; email: string; telefono: string | null };
  showWelcome?: boolean;
}) {
  const activas = properties.filter(p => p.status === "activa").length;
  const vistas = properties.reduce((a, p) => a + (p.views ?? 0), 0);
  const consultas = properties.reduce((a, p) => a + p.total_inquiries, 0);
  const nuevas = properties.reduce((a, p) => a + p.new_inquiries, 0);

  const ahora = Date.now();
  const visitasPendientes = visitas.filter(v => v.status === "pendiente").length;
  const visitasProximas = visitas.filter(
    v => v.status === "confirmada" && new Date(v.inicio).getTime() >= ahora
  ).length;
  const conAgenda = properties.filter(
    p => p.status === "activa" && (p.visitas_config as { activa?: boolean } | null)?.activa
  ).length;

  const primerNombre = perfil.nombre?.split(" ")[0] || "";

  return (
    <div style={{ paddingBottom: 40 }}>
      {showWelcome && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D",
          borderRadius: "var(--radius-sm)", padding: "12px 15px", marginBottom: 14,
          fontFamily: "var(--font-sans)", fontSize: 13.5,
        }}>
          ¡Bienvenido! Ya podés publicar tu primera propiedad.
        </div>
      )}

      {/* Encabezado */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(22px,3.4vw,30px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 4px",
        }}>
          {primerNombre ? `Hola, ${primerNombre}` : "Mi panel"}
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Gestioná tus publicaciones, tus visitas y las consultas que recibís.
        </p>
      </div>

      {/* Métricas */}
      <div className="panel-kpis">
        <Kpi icono={<Building2 size={15} />} valor={activas} etiqueta={activas === 1 ? "Publicación activa" : "Publicaciones activas"} />
        <Kpi icono={<Eye size={15} />} valor={vistas} etiqueta="Vistas de tus avisos" />
        <Kpi icono={<MessageSquare size={15} />} valor={consultas} etiqueta="Consultas recibidas" />
        <Kpi icono={<MessageSquare size={15} />} valor={nuevas} etiqueta="Sin responder" destacado={nuevas > 0} />
        <Kpi icono={<CalendarClock size={15} />} valor={visitasPendientes} etiqueta="Visitas a confirmar" destacado={visitasPendientes > 0} />
      </div>

      <Seccion
        icono={<Building2 size={17} />}
        titulo="Mis propiedades"
        resumen={`${properties.length} ${properties.length === 1 ? "publicación" : "publicaciones"} · ${activas} ${activas === 1 ? "activa" : "activas"}`}
        abiertaPorDefecto
      >
        <SeccionPropiedades properties={properties} />
      </Seccion>

      <Seccion
        icono={<MessageSquare size={17} />}
        titulo="Consultas recibidas"
        resumen={consultas ? `${consultas} en total` : "Todavía no recibiste consultas"}
        insignia={nuevas}
      >
        <SeccionConsultas properties={properties} />
      </Seccion>

      <Seccion
        icono={<CalendarClock size={17} />}
        titulo="Agenda de visitas"
        resumen={
          visitasPendientes
            ? `${visitasPendientes} ${visitasPendientes === 1 ? "pedido" : "pedidos"} esperando tu confirmación`
            : visitasProximas
              ? `${visitasProximas} ${visitasProximas === 1 ? "visita confirmada" : "visitas confirmadas"}`
              : conAgenda
                ? "Sin pedidos por ahora"
                : "Cargá tus horarios para recibir visitas"
        }
        insignia={visitasPendientes}
        abiertaPorDefecto={visitasPendientes > 0}
      >
        <SeccionVisitas properties={properties} visitas={visitas} />
      </Seccion>

      {/* Los datos y las validaciones viven en /panel/perfil */}
      <Link
        href="/panel/perfil"
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", border: "1px solid var(--line-200)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)",
          padding: "16px 18px", textDecoration: "none",
        }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: "var(--radius-sm)", flexShrink: 0,
          background: "var(--navy-50)", color: "var(--navy-700)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <UserRound size={17} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: "block", fontFamily: "var(--font-sans)", fontWeight: 700,
            fontSize: 15, color: "var(--navy-800)",
          }}>
            Mi perfil y validaciones
          </span>
          <span style={{
            display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5,
            color: "var(--ink-500)", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {perfil.telefono ? `${perfil.email} · ${perfil.telefono}` : "Falta cargar tu teléfono"}
          </span>
        </span>
        <ChevronRight size={18} color="var(--ink-400)" style={{ flexShrink: 0 }} />
      </Link>
    </div>
  );
}

function Kpi({
  icono, valor, etiqueta, destacado,
}: {
  icono: React.ReactNode; valor: number; etiqueta: string; destacado?: boolean;
}) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${destacado ? "#BFDBFE" : "var(--line-200)"}`,
      borderRadius: "var(--radius-md)", padding: "13px 15px",
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600,
        color: destacado ? "#1D4ED8" : "var(--ink-500)",
        textTransform: "uppercase", letterSpacing: ".05em",
      }}>
        {icono}
      </span>
      <p style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24,
        color: destacado ? "#1D4ED8" : "var(--navy-800)", margin: "6px 0 2px", lineHeight: 1,
      }}>
        {new Intl.NumberFormat("es-AR").format(valor)}
      </p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-500)", margin: 0 }}>
        {etiqueta}
      </p>
    </div>
  );
}
