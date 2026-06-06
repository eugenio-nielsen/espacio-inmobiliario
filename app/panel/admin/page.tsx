import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, Inquiry } from "@/lib/types";
import SuperadminDashboard, { type OwnerData, type EstimacionRow } from "@/components/panel/SuperadminDashboard";
import { getPreciosBarrios, getEstimadorConfig } from "@/lib/estimador/data";
import type { Post } from "@/lib/blog/types";

export const metadata: Metadata = {
  title: "Superadmin",
  robots: { index: false },
};

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";

export default async function SuperadminPage() {
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

  const totals = {
    usuarios: owners.length,
    propiedades: props.length,
    consultas: inqs.length,
    vistas: props.reduce((a, p) => a + (p.views ?? 0), 0),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/panel" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", textDecoration: "none" }}>← Volver al panel</a>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--navy-800)", margin: "8px 0 2px" }}>
          Superadmin
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Vista de solo lectura de todos los usuarios, sus propiedades y consultas.
        </p>
      </div>

      <SuperadminDashboard
        owners={owners}
        totals={totals}
        estimaciones={(estimaciones || []) as EstimacionRow[]}
        precios={preciosArray}
        config={config}
        posts={posts}
      />
    </div>
  );
}
