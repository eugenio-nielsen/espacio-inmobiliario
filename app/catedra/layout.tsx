import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "@/components/catedra/catedra.css";

/**
 * Cátedra Inmobiliaria (/catedra/...): herramientas para estudiantes de
 * corredor y martillero y para quienes recién se matriculan. Comparten
 * la barra, el footer y el vocabulario de catedra.css (prefijo .cat-).
 */
export default function CatedraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cat-pagina">
      <Navbar />
      <main className="cat-main">{children}</main>
      <Footer />
    </div>
  );
}
