import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPreciosBarrios, getEstimadorConfig } from "@/lib/estimador/data";
import EstimadorAdmin from "@/components/panel/EstimadorAdmin";

export const metadata: Metadata = {
  title: "Admin — Estimador",
  robots: { index: false },
};

const ADMIN_EMAIL = "eugenio@espacioinmobiliario.com.ar";

export default async function EstimadorAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (user.email !== ADMIN_EMAIL) redirect("/panel");

  const [precios, config] = await Promise.all([getPreciosBarrios(), getEstimadorConfig()]);
  const preciosArray = Object.entries(precios)
    .map(([barrio, precio]) => ({ barrio, precio }))
    .sort((a, b) => a.barrio.localeCompare(b.barrio, "es"));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/panel" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", textDecoration: "none" }}>← Volver al panel</a>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--navy-800)", margin: "8px 0 2px" }}>
          Estimador — Configuración
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          Editá los precios por m² de cada barrio y los coeficientes del modelo.
        </p>
      </div>

      <EstimadorAdmin initialPrecios={preciosArray} initialConfig={config} />
    </div>
  );
}
