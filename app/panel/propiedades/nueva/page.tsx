import Link from "next/link";
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
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  // Llega con ?bienvenida=1 desde el alta en /propietarios: la cuenta
  // se acaba de crear y el paso siguiente es este
  const { bienvenida } = await searchParams;
  const user = bienvenida ? await getCurrentUser() : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Conversión: la cuenta se acaba de crear */}
      {bienvenida && user && (
        <EventoGA
          nombre="sign_up"
          params={{ method: "email", pagina_origen: paginaOrigen(user.user_metadata, "/propietarios/publicar") }}
          limpiar={["bienvenida"]}
        />
      )}
      {bienvenida && (
        <div
          role="status"
          style={{
            marginBottom: 20, padding: "14px 18px", borderRadius: 2,
            background: "var(--gold-50)", border: "1px solid var(--gold-300)",
            fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--navy-800)",
          }}
        >
          <strong style={{ fontWeight: 600 }}>Tu cuenta está lista.</strong>{" "}
          Ahora cargá tu propiedad: fotos, datos y ubicación. Antes de salir al portal, la revisamos.
        </div>
      )}
      <div className="mb-6">
        <Link href="/panel" className="text-sm text-gray-500 hover:text-blue-700">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Publicar nueva propiedad</h1>
        <p className="text-sm text-gray-500 mt-1">
          Completá los datos y subí fotos para publicar tu propiedad.
        </p>
      </div>
      <PropertyForm mode="crear" />
    </div>
  );
}
