import Link from "next/link";
import type { Metadata } from "next";
import PropertyForm from "@/components/panel/PropertyForm";

export const metadata: Metadata = {
  title: "Nueva propiedad",
  robots: { index: false },
};

export default function NuevaPage() {
  return (
    <div className="max-w-3xl mx-auto">
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
