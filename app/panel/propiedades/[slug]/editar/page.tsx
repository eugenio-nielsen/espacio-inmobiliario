import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import PropertyForm from "@/components/panel/PropertyForm";
import EventoGA from "@/components/analytics/EventoGA";
import type { Property } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";

export const metadata: Metadata = {
  title: "Editar propiedad",
  robots: { index: false },
};

/** La página donde se creó la cuenta (la guarda signUp en los metadatos). */
function paginaOrigen(meta: Record<string, unknown> | undefined, porDefecto: string): string {
  const origen = meta?.origen as { pagina?: string } | undefined;
  return origen?.pagina || porDefecto;
}

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

  // Si viene de publicarla: cuántas tiene el dueño (la primera es la
  // conversión que buscan las páginas para propietarios)
  let cantidad = 0;
  if (creada) {
    const { count } = await supabase
      .from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
    cantidad = count ?? 0;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Conversión: la propiedad se acaba de publicar */}
      {creada && (
        <EventoGA
          nombre="publicar_propiedad"
          params={{
            tipo_propiedad: property.tipo,
            primera_propiedad: cantidad === 1 ? "si" : "no",
            pagina_origen: paginaOrigen(user.user_metadata, "desconocida"),
          }}
          limpiar={["creada"]}
        />
      )}
      <div className="mb-6">
        <Link href="/panel" className="text-sm text-gray-500 hover:text-blue-700">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Editar propiedad</h1>
        {creada && (
          <div className="mt-3 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
            ✅ Propiedad publicada exitosamente. Podés seguir editando los datos o{" "}
            <Link href={buildPropertyUrl(property as Property)} className="font-semibold underline">
              ver la publicación
            </Link>
            .
          </div>
        )}
      </div>
      <PropertyForm mode="editar" property={property as Property} />
    </div>
  );
}
