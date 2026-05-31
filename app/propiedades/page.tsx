import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Property } from "@/lib/types";
import PropertyListCard from "@/components/properties/PropertyListCard";
import ListadoFilters from "@/components/properties/ListadoFilters";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Propiedades en venta y alquiler",
  description: "Buscá casas, departamentos, terrenos, locales y oficinas directamente de sus dueños en Argentina. Sin comisiones ni intermediarios.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/propiedades` },
};

const PAGE_SIZE = 12;

type SearchParams = {
  tipo?: string;
  operacion?: string;
  provincia?: string;
  dormitorios?: string;
  precio_min?: string;
  precio_max?: string;
  pagina?: string;
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

  if (sp.tipo) query = query.eq("tipo", sp.tipo);
  if (sp.operacion) query = query.eq("operacion", sp.operacion);
  if (sp.provincia) query = query.eq("provincia", sp.provincia);
  if (sp.dormitorios) query = query.gte("dormitorios", Number(sp.dormitorios));
  if (sp.precio_min) query = query.gte("precio", Number(sp.precio_min));
  if (sp.precio_max) query = query.lte("precio", Number(sp.precio_max));

  const { data: properties, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="font-semibold text-gray-800 text-sm hidden sm:block">Nielsen Espacio Inmobiliario</span>
          </a>
          <span className="text-gray-300 hidden sm:block">›</span>
          <span className="text-sm text-gray-600 hidden sm:block">Propiedades</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Propiedades</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {count ?? 0} resultado{count !== 1 ? "s" : ""}
            </p>
          </div>
          <a
            href="/auth/registro"
            className="text-sm text-blue-700 hover:underline font-medium hidden sm:block"
          >
            ¿Querés publicar? →
          </a>
        </div>

        {/* Filtros */}
        <ListadoFilters current={sp} />

        {/* Grilla */}
        {!properties?.length ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 mt-6">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">No encontramos propiedades con esos filtros.</p>
            <a href="/propiedades" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Ver todas las propiedades
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {(properties as Property[]).map((p) => (
              <PropertyListCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
              const params = new URLSearchParams(sp as Record<string, string>);
              params.set("pagina", String(n));
              return (
                <a
                  key={n}
                  href={`/propiedades?${params.toString()}`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    n === pagina
                      ? "bg-blue-700 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {n}
                </a>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 text-sm text-center py-6 px-4 mt-12">
        <p>© {new Date().getFullYear()} Nielsen Espacio Inmobiliario — Argentina</p>
      </footer>
    </div>
  );
}
