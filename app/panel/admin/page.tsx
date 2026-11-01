import { ADMIN_EMAIL } from "@/lib/admin";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, Inquiry } from "@/lib/types";
import SuperadminDashboard, { type OwnerData, type EstimacionRow } from "@/components/panel/SuperadminDashboard";
import type { ConsultaRow, BloqueadoRow } from "@/components/panel/ConsultasAdmin";
import type { AuditoriaRow } from "@/components/panel/AuditoriaAdmin";
import type { Pendiente } from "@/components/panel/ValidacionesAdmin";
import { getPreciosBarrios, getEstimadorConfig } from "@/lib/estimador/data";
import type { Post } from "@/lib/blog/types";
import { datosAdminForo } from "@/lib/foro/data";
import { getCostosConfig, profesionalesAdmin } from "@/lib/catedra/data";

export const metadata: Metadata = {
  title: "Superadmin",
  robots: { index: false },
};


type Props = { searchParams: Promise<{ tab?: string }> };

export default async function SuperadminPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (user.email !== ADMIN_EMAIL) redirect("/panel");

  // Service role → ve TODO, sin RLS
  const admin = createAdminClient();
  const [{ data: profiles }, { data: properties }, { data: inquiries }, { data: estimaciones }, { data: postsData }, precios, config] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: true }),
    admin.from("properties").select("*").order("created_at", { ascending: false }),
    admin.from("inquiries").select("*").order("created_at", { ascending: false }),
    admin.from("estimaciones").select("*").order("created_at", { ascending: false }),
    admin.from("posts").select("*").order("updated_at", { ascending: false }),
    getPreciosBarrios(),
    getEstimadorConfig(),
  ]);
  const [foro, costos, profesionales] = await Promise.all([datosAdminForo(), getCostosConfig(), profesionalesAdmin()]);

  const preciosArray = Object.entries(precios)
    .map(([barrio, precio]) => ({ barrio, precio }))
    .sort((a, b) => a.barrio.localeCompare(b.barrio, "es"));
  const posts = (postsData || []) as Post[];

  const props = (properties || []) as Property[];
  const inqs = (inquiries || []) as Inquiry[];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Agrupar por dueño
  const owners: OwnerData[] = (profiles || []).map(profile => {
    const myProps = props.filter(p => p.owner_id === profile.id);
    const propsWithInq = myProps.map(p => {
      const propInqs = inqs.filter(i => i.property_id === p.id);
      return { ...p, inquiries: propInqs };
    });
    const allInq = propsWithInq.flatMap(p => p.inquiries);
    return {
      id: profile.id,
      nombre: profile.nombre,
      email: profile.email,
      telefono: profile.telefono ?? null,
      created_at: profile.created_at,
      propiedades: propsWithInq,
      totalProps: myProps.length,
      totalViews: myProps.reduce((a, p) => a + (p.views ?? 0), 0),
      totalInquiries: allInq.length,
      nuevos: allInq.filter(i => i.status === "nuevo").length,
      semana: allInq.filter(i => new Date(i.created_at) >= oneWeekAgo).length,
    };
  })
  // dueños con más actividad primero
  .sort((a, b) => (b.totalProps - a.totalProps) || (b.totalInquiries - a.totalInquiries));

  // Validaciones enviadas: identidad (perfiles) + dominio (propiedades).
  // Se arma de lo que ya trajimos arriba, sin consultas extra.
  const nombrePorId = new Map((profiles || []).map(pr => [pr.id, pr.nombre || pr.email]));

  const validaciones: Pendiente[] = [
    ...(profiles || [])
      .filter(pr => pr.identidad_estado && pr.identidad_estado !== "sin_enviar")
      .map(pr => ({
        tipo: "identidad" as const,
        id: pr.id,
        titulo: pr.nombre || pr.email,
        subtitulo: pr.email,
        detalle: pr.identidad_tipo_doc || "documento",
        estado: pr.identidad_estado,
        enviada_at: pr.identidad_enviada_at ?? null,
        archivos: [pr.identidad_frente, pr.identidad_dorso].filter(Boolean) as string[],
      })),
    ...props
      .filter(pr => pr.dominio_estado && pr.dominio_estado !== "sin_enviar")
      .map(pr => ({
        tipo: "dominio" as const,
        id: pr.id,
        titulo: pr.titulo,
        subtitulo: nombrePorId.get(pr.owner_id) || "—",
        detalle: "escritura",
        estado: pr.dominio_estado,
        enviada_at: pr.dominio_enviada_at ?? null,
        archivos: [pr.dominio_archivo].filter(Boolean) as string[],
      })),
  ].sort((a, b) => {
    // Lo que espera revisión primero, y dentro de eso lo más viejo
    if (a.estado !== b.estado) return a.estado === "pendiente" ? -1 : 1;
    return (a.enviada_at || "").localeCompare(b.enviada_at || "");
  });

  // Bandeja global de consultas, con propiedad y propietario resueltos
  const propPorId = new Map(props.map(p => [p.id, p]));
  const consultas: ConsultaRow[] = inqs.map(i => {
    const p = propPorId.get(i.property_id);
    return {
      id: i.id,
      created_at: i.created_at,
      nombre: i.nombre,
      email: i.email,
      telefono: i.telefono ?? null,
      mensaje: i.mensaje,
      status: i.status,
      propiedad: p?.titulo ?? "Publicación eliminada",
      propietario: (p && nombrePorId.get(p.owner_id)) || "—",
    };
  });

  // Tablas nuevas (migración add_admin_auditoria_bloqueos.sql): si faltan, quedan vacías
  const [{ data: bloqData }, { data: audData }] = await Promise.all([
    admin.from("contactos_bloqueados").select("*").order("created_at", { ascending: false }),
    admin.from("admin_auditoria").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  const bloqueados = (bloqData || []) as BloqueadoRow[];
  const auditoria = (audData || []) as AuditoriaRow[];

  const totals = {
    usuarios: owners.length,
    propiedades: props.length,
    consultas: inqs.length,
    vistas: props.reduce((a, p) => a + (p.views ?? 0), 0),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/panel" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", textDecoration: "none" }}>← Volver al panel</Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--navy-800)", margin: "8px 0 2px" }}>
          Superadmin
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Usuarios, propiedades, consultas, validaciones y moderación de toda la plataforma.
        </p>
      </div>

      <SuperadminDashboard
        owners={owners}
        consultas={consultas}
        bloqueados={bloqueados}
        auditoria={auditoria}
        totals={totals}
        estimaciones={(estimaciones || []) as EstimacionRow[]}
        precios={preciosArray}
        config={config}
        posts={posts}
        validaciones={validaciones}
        foro={foro}
        catedra={{ config: costos, profesionales }}
        tabInicial={tab}
      />
    </div>
  );
}
