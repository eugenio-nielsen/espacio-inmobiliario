import type { Metadata } from "next";
import PropertyForm from "@/components/panel/PropertyForm";
import EventoGA from "@/components/analytics/EventoGA";
import { getCurrentUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Nueva propiedad",
  robots: { index: false },
};

/** La página donde se creó la cuenta (la guarda signUp en los metadatos). */
function paginaOrigen(meta: Record<string, unknown> | undefined, porDefecto: string): string {
  const origen = meta?.origen as { pagina?: string } | undefined;
  return origen?.pagina || porDefecto;
}

export default async function NuevaPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; confirmada?: string }>;
}) {
  // Llega con ?bienvenida=1 desde el alta en /propietarios: la cuenta
  // se acaba de crear y el paso siguiente es este
  const { bienvenida, confirmada } = await searchParams;
  const user = bienvenida ? await getCurrentUser() : null;

  return (
    <>
      {/* Conversión: la cuenta se acaba de crear. Si llegó por el enlace del mail de
          confirmación (confirmada=1), el alta ya se contó al crear la cuenta: acá se
          cuenta la confirmación. */}
      {bienvenida && user && (
        <EventoGA
          nombre={confirmada ? "cuenta_confirmada" : "sign_up"}
          params={{ method: "email", pagina_origen: paginaOrigen(user.user_metadata, "/propietarios/publicar") }}
          limpiar={["bienvenida", "confirmada"]}
        />
      )}
      <PropertyForm
        mode="crear"
        avisos={bienvenida ? (
          <p role="status" className="pf-aviso">
            <strong>Tu cuenta está lista.</strong>{" "}
            Ahora cargá tu propiedad: fotos, datos y ubicación. Antes de salir al portal, la revisamos.
          </p>
        ) : null}
      />
    </>
  );
}
