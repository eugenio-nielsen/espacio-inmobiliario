import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { PropertyWithInquiries } from "@/lib/types";
import CRMPanel from "@/components/panel/CRMPanel";

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

  // Propiedades del dueño
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  // Todas las consultas de sus propiedades
  const propertyIds = (properties || []).map(p => p.id);
  const { data: allInquiries } = await supabase
    .from("inquiries")
    .select("*")
    .in("property_id", propertyIds.length ? propertyIds : ["none"])
    .order("created_at", { ascending: false });

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
      <CRMPanel
        properties={propertiesWithInquiries}
        showWelcome={!!nuevo}
      />
    </>
  );
}
