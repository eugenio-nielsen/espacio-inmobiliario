import Logo from "@/components/Logo";
import { UserRound, Plus, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { nombre: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", user.id)
      .single();
    profile = data;
  }

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
        <a href="/" style={{ flexShrink: 0 }}>
          <Logo className="h-12 w-auto" />
        </a>

        <nav className="nav-links-desktop">
          <a href="/propiedades" style={navLink} className="nav-hide-mobile">Propiedades</a>
          <a href="#" style={navLink} className="nav-hide-mobile">Cómo funciona</a>

          {user ? (
            // — Usuario logueado —
            <>
              <a
                href="/panel"
                style={{ ...navLink, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <LayoutDashboard size={16} strokeWidth={1.75} />
                {profile?.nombre ? profile.nombre.split(" ")[0] : "Mi panel"}
              </a>
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
              <a
                href="/auth/login"
                style={{ ...navLink, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <UserRound size={16} strokeWidth={1.75} />
                Ingresar
              </a>
              <a
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
              </a>
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
