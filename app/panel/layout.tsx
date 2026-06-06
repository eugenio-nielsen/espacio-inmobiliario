import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <Logo className="h-9 w-auto" />
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/panel" className="text-gray-600 hover:text-[#0E2C50] font-medium">
              Mis propiedades
            </a>
            {profile?.email === "eugenio@espacioinmobiliario.com.ar" && (
              <a href="/panel/admin" className="text-gray-600 hover:text-[#0E2C50] font-medium">
                Superadmin
              </a>
            )}
            <span className="text-gray-400 hidden sm:block">
              {profile?.nombre || profile?.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-gray-500 hover:text-red-600 text-xs border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">{children}</main>

      <Footer />
    </div>
  );
}
