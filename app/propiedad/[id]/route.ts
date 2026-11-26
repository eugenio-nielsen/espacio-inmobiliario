import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/publico";
import { buildPropertyUrl } from "@/lib/utils/urls";

const ID_COMPLETO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_CORTO = /^[0-9a-f]{8}$/i;

/**
 * GET /propiedad/<id>: la dirección vieja de las fichas, que Google todavía
 * conoce. Si la propiedad sigue publicada lleva a su ficha actual (permanente);
 * si no, al listado (temporal, por si vuelve a publicarse).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const columna = ID_COMPLETO.test(id) ? "id" : ID_CORTO.test(id) ? "short_id" : null;

  if (columna) {
    const { data, error } = await createPublicClient()
      .from("properties")
      .select("id, operacion, barrio, ciudad, tipo")
      .eq(columna, id.toLowerCase())
      .eq("status", "activa")
      .maybeSingle();
    if (error) console.error("Dirección vieja de ficha:", error.message);
    if (data) return NextResponse.redirect(new URL(buildPropertyUrl(data), request.url), 308);
  }

  return NextResponse.redirect(new URL("/propiedades", request.url), 307);
}
