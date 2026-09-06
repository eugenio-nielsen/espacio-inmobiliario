import Link from "next/link";
import Logo from "@/components/Logo";
import { UserRound, Plus, LayoutDashboard, LogOut } from "lucide-react";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/user";
import { signOut } from "@/lib/actions/auth";
import MobileMenu from "@/components/MobileMenu";
import NavHerramientas from "@/components/NavHerramientas";

export default async function Navbar() {
  // Cacheados por request: si la página también los pide, no se repite la consulta
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

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

        <MobileMenu loggedIn={!!user} nombre={profile?.nombre} />

        <nav className="nav-links-desktop">
          <Link href="/propiedades" className="nav-hide-mobile" style={{
            ...navLink, color: "var(--navy-800)", fontWeight: 700,
            background: "rgba(185,159,102,.16)", padding: "8px 16px", borderRadius: 999,
          }}>Propiedades</Link>
          <div className="nav-hide-mobile">
            <NavHerramientas style={navLink} />
          </div>
          <Link href="/blog" style={navLink} className="nav-hide-mobile">Blog</Link>
          <Link href="/como-funciona" style={navLink} className="nav-hide-mobile">Cómo funciona</Link>

          {user ? (
            // — Usuario logueado —
            <>
              <Link
                href="/panel"
                style={{ ...navLink, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <LayoutDashboard size={16} strokeWidth={1.75} />
                {profile?.nombre ? profile.nombre.split(" ")[0] : "Mi panel"}
              </Link>
              <form action={signOut} style={{ margin: 0 }}>
                <button
                  type="submit"
                  style={{
                    ...navLink,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "none", border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--radius-sm)", padding: "8px 14px",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  Salir
                </button>
              </form>
            </>
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
};
