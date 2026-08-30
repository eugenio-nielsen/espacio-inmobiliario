import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UserRound, ShieldCheck } from "lucide-react";
import Seccion from "@/components/panel/Seccion";
import SeccionDatos from "@/components/panel/SeccionDatos";
import ValidacionIdentidad from "@/components/panel/ValidacionIdentidad";
import ValidacionDominio, { type PropiedadValidable } from "@/components/panel/ValidacionDominio";
import { TOPE_SIN_VALIDAR, type EstadoValidacion } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false },
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: propiedades }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, email, telefono, identidad_estado, identidad_motivo")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("properties")
      .select("id, titulo, dominio_estado, dominio_motivo")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const identidad = (profile?.identidad_estado ?? "sin_enviar") as EstadoValidacion;
  const props = (propiedades ?? []) as PropiedadValidable[];
  const dominiosOk = props.filter(p => p.dominio_estado === "aprobada").length;

  const cerca = props.length >= TOPE_SIN_VALIDAR - 1 && identidad !== "aprobada";

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(22px,3.4vw,30px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 4px",
        }}>
          Mi perfil
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Tus datos de contacto y las validaciones que dan confianza a quien te consulta.
        </p>
      </div>

      {cerca && (
        <div style={{
          display: "flex", gap: 9, alignItems: "flex-start",
          background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
          borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14,
          fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {props.length >= TOPE_SIN_VALIDAR
              ? `Llegaste a ${props.length} publicaciones. Para cargar más necesitás la validación de identidad aprobada.`
              : `Tenés ${props.length} publicaciones. A partir de ${TOPE_SIN_VALIDAR} hace falta la validación de identidad para seguir cargando.`}
          </span>
        </div>
      )}

      <Seccion
        icono={<ShieldCheck size={17} />}
        titulo="Validaciones"
        resumen={
          identidad === "aprobada"
            ? `Identidad confirmada${dominiosOk ? ` · ${dominiosOk} ${dominiosOk === 1 ? "dominio verificado" : "dominios verificados"}` : ""}`
            : identidad === "pendiente"
              ? "Identidad en revisión"
              : "Validá tu identidad y el dominio de tus propiedades"
        }
        abiertaPorDefecto
      >
        <div style={{ display: "grid", gap: 12 }}>
          <ValidacionIdentidad estado={identidad} motivo={profile?.identidad_motivo} />
          <ValidacionDominio propiedades={props} />
        </div>
      </Seccion>

      <Seccion
        icono={<UserRound size={17} />}
        titulo="Datos de contacto"
        resumen={profile?.telefono ? `${profile.email} · ${profile.telefono}` : "Falta cargar tu teléfono"}
        abiertaPorDefecto={!profile?.telefono}
      >
        <SeccionDatos
          nombre={profile?.nombre ?? ""}
          email={profile?.email ?? user!.email ?? ""}
          telefono={profile?.telefono ?? null}
        />
      </Seccion>
    </div>
  );
}
