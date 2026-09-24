import Link from "next/link";
import Logo from "@/components/Logo";
import { UserRound, Plus } from "lucide-react";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/user";
import MobileMenu from "@/components/MobileMenu";
import NavHerramientas from "@/components/NavHerramientas";
import MenuCuenta from "@/components/MenuCuenta";

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";

export default async function Navbar() {
  // Cacheados por request: si la página también los pide, no se repite la consulta
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const esAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid var(--line-200)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{
        maxWidth: "var(--container)", margin: "0 auto",
        padding: "14px 24px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ flexShrink: 0 }}>
          <Logo className="h-12 w-auto" />
        </Link>

        <MobileMenu loggedIn={!!user} nombre={profile?.nombre} email={user?.email} esAdmin={esAdmin} />

        <nav className="nav-links-desktop">
          <Link href="/propiedades" className="nav-hide-mobile" style={{
            ...navLink, color: "var(--navy-800)", fontWeight: 700,
            background: "rgba(185,159,102,.16)", padding: "8px 16px", borderRadius: 999,
          }}>Propiedades</Link>
          {/* Comprar, Vender y Blog viven adentro de Herramientas (lib/menu.ts) */}
          <div className="nav-hide-mobile">
            <NavHerramientas style={navLink} />
          </div>
          <Link href="/como-funciona" style={navLink} className="nav-hide-mobile">Cómo funciona</Link>
          <Link href="/contacto" style={navLink} className="nav-hide-mobile">Contacto</Link>

          {user ? (
            // — Usuario logueado: su cuenta, separada del menú del sitio —
            <MenuCuenta nombre={profile?.nombre} email={user.email} esAdmin={esAdmin} />
          ) : (
            // — Usuario no logueado —
            <>
              <Link
                href="/auth/login"
                style={{ ...navLink, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <UserRound size={16} strokeWidth={1.75} />
                Ingresar
              </Link>
              <Link
                href="/auth/registro"
                className="esbtn esbtn-primary"
                style={{
                  fontFamily: "var(--font-sans)", fontWeight: 600,
                  borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
                  cursor: "pointer", display: "inline-flex", alignItems: "center",
                  justifyContent: "center", gap: 8, fontSize: 13.5,
                  padding: "9px 18px", background: "var(--navy-800)", color: "#fff",
                  transition: "all var(--dur) var(--ease-out)",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                <Plus size={15} strokeWidth={2} />
                Publicar propiedad
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const navLink: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 500,
  color: "var(--ink-600)", cursor: "pointer", textDecoration: "none",
  whiteSpace: "nowrap",
};
