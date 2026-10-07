import Link from "next/link";
import Logo from "@/components/Logo";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/user";
import MobileMenu from "@/components/MobileMenu";
import NavDesplegables from "@/components/NavDesplegables";
import NavLink from "@/components/NavLink";
import MenuCuenta from "@/components/MenuCuenta";
import "./nav.css";

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";

/**
 * La barra del sitio. Estilos en nav.css (prefijo .nv-).
 *
 * De izquierda a derecha: las secciones (Propiedades, y los desplegables de
 * lib/menu.ts: Sobre nosotros y Herramientas), Contacto, un filete vertical
 * y, aparte, lo de la cuenta: Ingresar o el menú del usuario, y la acción
 * principal, Publicar propiedad.
 */
export default async function Navbar() {
  // Cacheados por request: si la página también los pide, no se repite la consulta
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const esAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="nv">
      <div className="nv-in">
        <Link href="/" className="nv-logo">
          <Logo className="h-12 w-auto" />
        </Link>

        <MobileMenu loggedIn={!!user} nombre={profile?.nombre} email={user?.email} esAdmin={esAdmin} />

        <nav className="nav-links-desktop nv-nav" aria-label="Principal">
          <NavLink href="/propiedades" className="nv-link-principal nav-hide-mobile">Propiedades</NavLink>
          <NavDesplegables />
          <NavLink href="/contacto" className="nav-hide-mobile">Contacto</NavLink>

          <span className="nv-sep" aria-hidden="true" />

          {user ? (
            // — Usuario logueado: su cuenta, separada del menú del sitio —
            <MenuCuenta nombre={profile?.nombre} email={user.email} esAdmin={esAdmin} />
          ) : (
            <>
              <NavLink href="/auth/login" className="nv-link-suave">Ingresar</NavLink>
              <Link href="/auth/registro" className="nv-cta">
                <span className="nv-cta-mas" aria-hidden="true">+</span>
                Publicar propiedad
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
