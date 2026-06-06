import { NextResponse } from "next/server";
import { estimarPrecio } from "@/lib/estimador/engine";
import { getPreciosBarrios, getEstimadorConfig } from "@/lib/estimador/data";
import type { EstimadorInput } from "@/lib/estimador/types";

/**
 * POST /api/estimador
 * Body: EstimadorInput (JSON)
 * Respuesta: EstimadorResultado | { error }
 *
 * API REST pública para estimar el valor de un departamento en CABA.
 */
export async function POST(req: Request) {
  let input: EstimadorInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!input?.barrio) {
    return NextResponse.json({ error: "Falta el barrio." }, { status: 400 });
  }

  const [precios, config] = await Promise.all([getPreciosBarrios(), getEstimadorConfig()]);
  const resultado = estimarPrecio(input, precios, config);

  if ("error" in resultado) {
    return NextResponse.json(resultado, { status: 422 });
  }
  return NextResponse.json(resultado);
}
