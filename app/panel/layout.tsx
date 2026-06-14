import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { LogOut } from "lucide-react";

const panelNavLink: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
  color: "var(--ink-600)", textDecoration: "none",
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, email")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.email === "eugenio@espacioinmobiliario.com.ar";
  const inicial = (profile?.nombre || profile?.email || "U").trim()[0]?.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>
      {/* Topbar */}
      <header className="sticky top-0 z-20" style={{ background: "#fff", borderBottom: "1px solid var(--line-200)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 60 }}>
          <div className="flex items-center" style={{ gap: 22 }}>
            <a href="/" className="flex items-center"><Logo className="h-9 w-auto" /></a>
            <nav className="hidden sm:flex items-center" style={{ gap: 18 }}>
              <a href="/panel" style={panelNavLink}>Mis propiedades</a>
              {isAdmin && <a href="/panel/admin" style={panelNavLink}>Superadmin</a>}
            </nav>
          </div>

          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center" style={{ gap: 9 }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, background: "var(--navy-800)", color: "var(--gold-400)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>{inicial}</span>
              <span className="hidden sm:block" style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)" }}>{profile?.nombre || profile?.email}</span>
            </div>
            <form action={signOut} style={{ margin: 0 }}>
              <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-600)", border: "1px solid var(--line-200)", background: "#fff", borderRadius: "var(--radius-sm)", padding: "8px 14px", cursor: "pointer" }}>
                <LogOut size={15} strokeWidth={1.75} /> Salir
              </button>
            </form>
          </div>
        </div>
        {/* Nav mobile (debajo del logo) */}
        <nav className="sm:hidden flex items-center" style={{ gap: 18, padding: "0 16px 10px" }}>
          <a href="/panel" style={panelNavLink}>Mis propiedades</a>
          {isAdmin && <a href="/panel/admin" style={panelNavLink}>Superadmin</a>}
        </nav>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">{children}</main>

      <Footer />
    </div>
  );
}
