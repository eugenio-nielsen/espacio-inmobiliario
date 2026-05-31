import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import ListadoFilters from "@/components/properties/ListadoFilters";
import Navbar from "@/components/Navbar";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Propiedades en venta",
  description: "Buscá casas, departamentos, terrenos, locales y oficinas en venta directamente de sus dueños en Buenos Aires. Sin comisiones.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/propiedades` },
};

const PAGE_SIZE = 12;

type SearchParams = {
  tipo?: string; operacion?: string; provincia?: string;
  dormitorios?: string; precio_min?: string; precio_max?: string;
  pagina?: string; q?: string;
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const from = (pagina - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (sp.tipo)       query = query.eq("tipo", sp.tipo);
  if (sp.operacion)  query = query.eq("operacion", sp.operacion);
  if (sp.provincia)  query = query.eq("provincia", sp.provincia);
  if (sp.dormitorios) query = query.gte("dormitorios", Number(sp.dormitorios));
  if (sp.precio_min) query = query.gte("precio", Number(sp.precio_min));
  if (sp.precio_max) query = query.lte("precio", Number(sp.precio_max));

  const { data: properties, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Breadcrumb */}
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: "var(--ink-500)", marginBottom: 18,
        }}>
          <a href="/" style={{ color: "var(--ink-500)", textDecoration: "none" }}>Inicio</a>
          <span style={{ color: "var(--gold-500)", margin: "0 6px" }}>/</span>
          Propiedades en venta
        </div>

        {/* Title + count */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", marginBottom: 22,
        }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 34,
            letterSpacing: "-.02em", color: "var(--navy-800)", margin: 0,
          }}>
            Propiedades en venta
          </h1>
        </div>

        {/* Filters */}
        <ListadoFilters current={sp} />

        {/* Result count + sort */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", margin: "26px 0 18px",
        }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-600)", margin: 0 }}>
            <b style={{ color: "var(--navy-800)" }}>{count ?? 0} propiedad{count !== 1 ? "es" : ""}</b> encontradas
          </p>
          <div style={{ position: "relative" }}>
            <select style={{
              fontFamily: "var(--font-sans)", fontSize: 13.5,
              background: "#fff", border: "1.5px solid var(--line-200)",
              borderRadius: "var(--radius-sm)", padding: "9px 30px 9px 12px",
              appearance: "none", cursor: "pointer",
            }}>
              <option>Ordenar: más recientes</option>
            </select>
            <span style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none", color: "var(--ink-500)", fontSize: 11 }}>▾</span>
          </div>
        </div>

        {/* Grid */}
        {!properties?.length ? (
          <div style={{
            textAlign: "center", padding: "64px 24px", background: "#fff",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)",
          }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 12 }}>
              No encontramos propiedades con esos filtros.
            </p>
            <a href="/propiedades" style={{
              fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gold-700)",
              textDecoration: "underline",
            }}>
              Ver todas las propiedades
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {(properties as Property[]).map(p => (
              <PropertyListCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
              const params = new URLSearchParams(sp as Record<string, string>);
              params.set("pagina", String(n));
              return (
                <a
                  key={n}
                  href={`/propiedades?${params.toString()}`}
                  style={{
                    width: 36, height: 36, borderRadius: "var(--radius-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500,
                    textDecoration: "none",
                    background: n === pagina ? "var(--navy-800)" : "#fff",
                    color: n === pagina ? "#fff" : "var(--ink-600)",
                    border: `1.5px solid ${n === pagina ? "var(--navy-800)" : "var(--line-200)"}`,
                  }}
                >
                  {n}
                </a>
              );
            })}
          </div>
        )}
      </main>

      <footer style={{ background: "var(--navy-800)", color: "#fff" }}>
        <div style={{ borderTop: "1px solid var(--navy-700)", padding: "18px 24px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--navy-300)" }}>
          © {new Date().getFullYear()} Espacio Inmobiliario — espacioinmobiliario.com.ar
        </div>
      </footer>
    </div>
  );
}
