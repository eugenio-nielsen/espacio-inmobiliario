import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import MenuCuenta from "@/components/MenuCuenta";
import { opcionesCuenta } from "@/lib/menu";

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
  // Pestañas: las secciones de la cuenta, de la misma lista que el menú del nombre
  const pestanas = opcionesCuenta(isAdmin).filter(o => o.tipo === "seccion");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>
      {/* Topbar */}
      <header className="sticky top-0 z-20" style={{ background: "#fff", borderBottom: "1px solid var(--line-200)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 60 }}>
          <div className="flex items-center" style={{ gap: 22 }}>
            <Link href="/" className="flex items-center"><Logo className="h-9 w-auto" /></Link>
            <nav className="hidden sm:flex items-center" style={{ gap: 18 }}>
              {pestanas.map(o => <Link key={o.href} href={o.href} style={panelNavLink}>{o.label}</Link>)}
            </nav>
          </div>

          <MenuCuenta nombre={profile?.nombre} email={profile?.email} esAdmin={isAdmin} />
        </div>
        {/* Nav mobile (debajo del logo) */}
        <nav className="sm:hidden flex items-center" style={{ gap: 18, padding: "0 16px 10px" }}>
          {pestanas.map(o => <Link key={o.href} href={o.href} style={panelNavLink}>{o.label}</Link>)}
        </nav>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">{children}</main>

      <Footer />
    </div>
  );
}
