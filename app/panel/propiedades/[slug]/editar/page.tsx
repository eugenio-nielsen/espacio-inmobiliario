import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import PropertyForm from "@/components/panel/PropertyForm";
import type { Property } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

export const metadata: Metadata = {
  title: "Editar propiedad",
  robots: { index: false },
};

export default async function EditarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ creada?: string }>;
}) {
  const { slug } = await params;
  const { creada } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .single();

  if (!property) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/panel" className="text-sm text-gray-500 hover:text-blue-700">
          ← Volver al panel
        </a>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Editar propiedad</h1>
        {creada && (
          <div className="mt-3 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
            ✅ Propiedad publicada exitosamente. Podés seguir editando los datos o{" "}
            <a href={buildPropertyUrl(property as Property)} className="font-semibold underline">
              ver la publicación
            </a>
            .
          </div>
        )}
      </div>
      <PropertyForm mode="editar" property={property as Property} />
    </div>
  );
}
