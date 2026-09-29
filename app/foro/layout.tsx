import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "@/components/foro/foro.css";

/**
 * Tertulia Inmobiliaria: el foro del sitio (/foro/...).
 * Comparten la barra, el footer y el vocabulario visual de foro.css
 * (prefijo .fo-). La cuenta es la misma de todo el sitio.
 */
export default function ForoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fo-pagina">
      <Navbar />
      <main className="fo-main">{children}</main>
      <Footer />
    </div>
  );
}
