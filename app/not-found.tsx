import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/"><Logo className="h-10 w-auto" /></Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-7xl font-bold mb-4" style={{ color: "#b99f66" }}>404</p>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#0E2C50" }}>
            Esta página no existe
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            La propiedad que buscás puede haber sido eliminada, pausada o la URL no es correcta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link               href="/propiedades"
              className="inline-block text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              style={{ background: "#0E2C50" }}
            >
              Ver todas las propiedades
            </Link>
            <Link               href="/"
              className="inline-block border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
