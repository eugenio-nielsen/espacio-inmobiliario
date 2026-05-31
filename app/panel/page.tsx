import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyCard from "@/components/panel/PropertyCard";

export const metadata: Metadata = {
  title: "Mis propiedades",
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  activa: "Activa",
  pausada: "Pausada",
  vendida: "Vendida / Alquilada",
};

const STATUS_COLOR: Record<string, string> = {
  activa: "bg-green-100 text-green-700",
  pausada: "bg-yellow-100 text-yellow-700",
  vendida: "bg-gray-100 text-gray-500",
};

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { nuevo } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const { count: inquiriesCount } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("leida", false)
    .in(
      "property_id",
      (properties || []).map((p) => p.id)
    );

  return (
    <div>
      {nuevo && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg px-5 py-3 text-sm">
          🎉 ¡Tu cuenta fue creada exitosamente! Ya podés publicar tu primera propiedad.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis propiedades</h1>
          {inquiriesCount ? (
            <p className="text-sm text-blue-600 mt-0.5">
              Tenés{" "}
              <a href="/panel/consultas" className="font-semibold hover:underline">
                {inquiriesCount} consulta{inquiriesCount > 1 ? "s" : ""} sin leer
              </a>
            </p>
          ) : null}
        </div>
        <a
          href="/panel/propiedades/nueva"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nueva propiedad
        </a>
      </div>

      {!properties?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Todavía no publicaste ninguna propiedad
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Publicá tu primera propiedad gratis y empezá a recibir consultas.
          </p>
          <a
            href="/panel/propiedades/nueva"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Publicar propiedad
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(properties as Property[]).map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              statusLabel={STATUS_LABEL[p.status]}
              statusColor={STATUS_COLOR[p.status]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
