import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/foro/servidor";
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

  // El superadmin puede abrir cualquier publicación para corregirla
  const esAdmin = user.email === ADMIN_EMAIL;
  let consulta = (esAdmin ? createAdminClient() : supabase)
    .from("properties").select("*").eq("slug", slug);
  if (!esAdmin) consulta = consulta.eq("owner_id", user.id);
  const { data: property } = await consulta.single();

  if (!property) notFound();

  // Si viene de publicarla: cuántas tiene el dueño (la primera es la
  // conversión que buscan las páginas para propietarios)
  let cantidad = 0;
  if (creada) {
    const { count } = await supabase
      .from("properties").select("id", { count: "exact", head: true }).eq("owner_id", property.owner_id);
    cantidad = count ?? 0;
  }

  const ajena = esAdmin && property.owner_id !== user.id;

  return (
    <>
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
      <PropertyForm
        mode="editar"
        property={property as Property}
        volverA={ajena ? "/panel/admin" : "/panel"}
        avisos={(ajena || creada) ? (
          <>
            {ajena && (
              <p className="pf-aviso">Estás editando como superadmin una publicación de otro usuario.</p>
            )}
            {creada && (
              <p className="pf-aviso" role="status">
                <strong>Propiedad publicada.</strong> Podés seguir editando los datos o{" "}
                <Link href={buildPropertyUrl(property as Property)}>ver la publicación</Link>.
              </p>
            )}
          </>
        ) : null}
      />
    </>
  );
}
