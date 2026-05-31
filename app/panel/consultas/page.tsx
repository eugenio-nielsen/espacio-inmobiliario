import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Inquiry } from "@/lib/types";
import MarkReadButton from "@/components/panel/MarkReadButton";

export const metadata: Metadata = {
  title: "Consultas recibidas",
  robots: { index: false },
};

export default async function ConsultasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Traer propiedades del dueño
  const { data: myProperties } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user!.id);

  const propertyIds = (myProperties || []).map((p) => p.id);

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*, properties(titulo, slug)")
    .in("property_id", propertyIds.length ? propertyIds : ["none"])
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <a href="/panel" className="text-sm text-gray-500 hover:text-blue-700">
          ← Mis propiedades
        </a>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Consultas recibidas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mensajes de interesados en tus propiedades.
        </p>
      </div>

      {!inquiries?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Todavía no recibiste consultas
          </h2>
          <p className="text-gray-400 text-sm">
            Cuando alguien se interese en tus propiedades, sus mensajes aparecerán acá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(inquiries as Inquiry[]).map((inq) => (
            <div
              key={inq.id}
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                !inq.leida ? "border-blue-200" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {!inq.leida && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                        Nueva
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(inq.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Propiedad:{" "}
                    <a
                      href={`/propiedades/${(inq.properties as { slug: string })?.slug}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      {(inq.properties as { titulo: string })?.titulo}
                    </a>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
                    <span>
                      <span className="font-medium">Nombre:</span> {inq.nombre}
                    </span>
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inq.email}
                    </a>
                    {inq.telefono && (
                      <a
                        href={`https://wa.me/${inq.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        📱 {inq.telefono}
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
                    {inq.mensaje}
                  </p>
                </div>
                {!inq.leida && <MarkReadButton id={inq.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
