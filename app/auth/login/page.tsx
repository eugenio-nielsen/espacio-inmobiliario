import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido de vuelta</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Ingresá con tu cuenta para gestionar tus propiedades.
      </p>
      <AuthForm mode="login" />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{" "}
        <a href="/auth/registro" className="text-blue-600 hover:underline font-medium">
          Registrate gratis
        </a>
      </p>
    </div>
  );
}
