"use client";

import { Building2, MessageSquare, UserRound, Eye } from "lucide-react";
import Seccion from "@/components/panel/Seccion";
import SeccionDatos from "@/components/panel/SeccionDatos";
import SeccionPropiedades from "@/components/panel/SeccionPropiedades";
import SeccionConsultas from "@/components/panel/SeccionConsultas";
import type { PropertyWithInquiries } from "@/lib/types";

export default function PanelDashboard({
  properties,
  perfil,
  showWelcome,
}: {
  properties: PropertyWithInquiries[];
  perfil: { nombre: string; email: string; telefono: string | null };
  showWelcome?: boolean;
}) {
  const activas = properties.filter(p => p.status === "activa").length;
  const vistas = properties.reduce((a, p) => a + (p.views ?? 0), 0);
  const consultas = properties.reduce((a, p) => a + p.total_inquiries, 0);
  const nuevas = properties.reduce((a, p) => a + p.new_inquiries, 0);

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
          Gestioná tus publicaciones, tus datos y las consultas que recibís.
        </p>
      </div>

      {/* Métricas */}
      <div className="panel-kpis">
        <Kpi icono={<Building2 size={15} />} valor={activas} etiqueta={activas === 1 ? "Publicación activa" : "Publicaciones activas"} />
        <Kpi icono={<Eye size={15} />} valor={vistas} etiqueta="Visitas totales" />
        <Kpi icono={<MessageSquare size={15} />} valor={consultas} etiqueta="Consultas recibidas" />
        <Kpi icono={<MessageSquare size={15} />} valor={nuevas} etiqueta="Sin responder" destacado={nuevas > 0} />
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
        icono={<UserRound size={17} />}
        titulo="Mis datos"
        resumen={perfil.telefono ? `${perfil.email} · ${perfil.telefono}` : "Falta cargar tu teléfono"}
        abiertaPorDefecto={!perfil.telefono}
      >
        <SeccionDatos nombre={perfil.nombre} email={perfil.email} telefono={perfil.telefono} />
      </Seccion>
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
