import Link from "next/link";
import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ volver?: string; confirmada?: string; enlace?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { volver, confirmada, enlace } = await searchParams;
  const vieneDelForo = volver?.startsWith("/foro");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido de vuelta</h1>
      <p className="text-gray-500 mb-6 text-sm">
        {vieneDelForo
          ? "Ingresá con tu cuenta para participar en la Tertulia."
          : "Ingresá con tu cuenta para gestionar tus propiedades."}
      </p>

      {/* Llegan desde /auth/callback cuando el enlace del mail no pudo abrir la sesión */}
      {confirmada && (
        <div role="status" className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4">
          Tu email quedó confirmado. Ingresá con tu contraseña para seguir.
        </div>
      )}
      {enlace === "vencido" && (
        <div role="status" className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
          Ese enlace ya se usó o venció. Ingresá con tu email y contraseña: si todavía no
          confirmaste la cuenta, desde acá podés pedir que te mandemos otro mail.
        </div>
      )}

      <AuthForm mode="login" volver={volver} />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{" "}
        <Link
          href={vieneDelForo ? `/foro/unirse?volver=${encodeURIComponent(volver!)}` : "/auth/registro"}
          className="text-blue-600 hover:underline font-medium"
        >
          Registrate gratis
        </Link>
      </p>
    </div>
  );
}
