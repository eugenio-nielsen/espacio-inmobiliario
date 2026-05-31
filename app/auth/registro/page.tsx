import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

export default function RegistroPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Publicá tu propiedad</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Creá tu cuenta de dueño y publicá gratis en minutos.
      </p>
      <AuthForm mode="registro" />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{" "}
        <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
          Iniciá sesión
        </a>
      </p>
    </div>
  );
}
