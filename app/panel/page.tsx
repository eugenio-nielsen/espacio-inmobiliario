import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { PropertyWithInquiries, Visita } from "@/lib/types";
import PanelDashboard from "@/components/panel/PanelDashboard";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false },
};

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; clave?: string }>;
}) {
  const { nuevo, clave } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("nombre, email, telefono").eq("id", user!.id).single();

  // Propiedades del dueño
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  // Todas las consultas y visitas de sus propiedades
  const propertyIds = (properties || []).map(p => p.id);
  const idsParaFiltro = propertyIds.length ? propertyIds : ["none"];

  const [{ data: allInquiries }, { data: allVisitas }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*")
      .in("property_id", idsParaFiltro)
      .order("created_at", { ascending: false }),
    supabase
      .from("visitas")
      .select("*")
      .in("property_id", idsParaFiltro)
      .order("inicio", { ascending: true }),
  ]);

  // Calcular stats por propiedad
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const propertiesWithInquiries: PropertyWithInquiries[] = (properties || []).map(p => {
    const inquiries = (allInquiries || []).filter(i => i.property_id === p.id);
    const weekInquiries = inquiries.filter(i => new Date(i.created_at) >= oneWeekAgo);
    const newInquiries = inquiries.filter(i => i.status === "nuevo");

    return {
      ...p,
      inquiries,
      total_inquiries: inquiries.length,
      week_inquiries: weekInquiries.length,
      new_inquiries: newInquiries.length,
    };
  });

  return (
    <>
      {clave && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4">
          ✓ Tu contraseña fue actualizada correctamente.
        </div>
      )}
      <PanelDashboard
        properties={propertiesWithInquiries}
        visitas={(allVisitas as Visita[]) || []}
        perfil={{
          nombre: profile?.nombre ?? "",
          email: profile?.email ?? user!.email ?? "",
          telefono: profile?.telefono ?? null,
        }}
        showWelcome={!!nuevo}
      />
    </>
  );
}
