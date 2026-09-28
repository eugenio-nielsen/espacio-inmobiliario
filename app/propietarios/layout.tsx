import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "@/components/propietarios/propietarios.css";

/**
 * El espacio para propietarios: /propietarios/...
 *
 * Páginas pensadas para hablarle a quien tiene una propiedad y sumarlo
 * al portal (crear la cuenta y cargar la propiedad). Comparten la barra,
 * el footer y el vocabulario visual de propietarios.css (prefijo .pr-).
 * La URL queda limpia a propósito: nada de "landing" ni "promo".
 */
export default function PropietariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pr-pagina">
      <Navbar />
      <main className="pr-main">{children}</main>
      <Footer />
    </div>
  );
}
