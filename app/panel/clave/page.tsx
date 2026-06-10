import type { Metadata } from "next";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
  robots: { index: false },
};

export default function ClavePage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Crear contraseña nueva</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Elegí una contraseña nueva para tu cuenta. La vas a usar la próxima vez
          que inicies sesión.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
