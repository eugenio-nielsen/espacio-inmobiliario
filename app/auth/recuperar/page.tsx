import Link from "next/link";
import type { Metadata } from "next";
import RecuperarForm from "@/components/auth/RecuperarForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false },
};

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar contraseña</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Ingresá el email de tu cuenta y te enviamos un enlace para crear una
        contraseña nueva.
      </p>

      {sp.error === "enlace" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
          El enlace expiró o ya fue usado. Pedí uno nuevo.
        </div>
      )}

      <RecuperarForm />

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿La recordaste?{" "}
        <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
