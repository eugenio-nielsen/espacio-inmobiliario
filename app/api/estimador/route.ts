import { NextResponse } from "next/server";
import { after } from "next/server";
import { estimarPrecio } from "@/lib/estimador/engine";
import { getPreciosBarrios, getEstimadorConfig } from "@/lib/estimador/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { sendEstimacionLead } from "@/lib/email";
import type { EstimadorInput } from "@/lib/estimador/types";

type Contacto = { nombre?: string; telefono?: string; email?: string };
type Body = EstimadorInput & { contacto?: Contacto };

/**
 * POST /api/estimador
 * Body: EstimadorInput + { contacto: { nombre, telefono, email? } }
 * Respuesta: EstimadorResultado | { error }
 *
 * El contacto es obligatorio: se pide antes de mostrar el resultado para que
 * toda estimación quede registrada con nombre y teléfono.
 */
export async function POST(req: Request) {
  // Máx. 60 estimaciones por hora por IP
  if (!(await checkRateLimit("api-estimador", 60, 3600))) {
    return NextResponse.json({ error: RATE_LIMIT_MSG }, { status: 429 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body?.barrio) {
    return NextResponse.json({ error: "Falta el barrio." }, { status: 400 });
  }

  const nombre = (body.contacto?.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "Ingresá tu nombre." }, { status: 400 });
  }
  const tel = normalizarTelefono(body.contacto?.telefono);
  if (!tel.ok) {
    return NextResponse.json({ error: tel.error }, { status: 400 });
  }
  const email = (body.contacto?.email ?? "").trim() || null;

  const { contacto: _contacto, ...input } = body;
  const [precios, config] = await Promise.all([getPreciosBarrios(), getEstimadorConfig()]);
  const resultado = estimarPrecio(input as EstimadorInput, precios, config);

  if ("error" in resultado) {
    return NextResponse.json(resultado, { status: 422 });
  }

  // Registrar la estimación ya con los datos de contacto
  let estimacionId: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("estimaciones")
      .insert({
        barrio: input.barrio,
        input,
        resultado,
        lead_nombre: nombre,
        lead_telefono: tel.valor,
        lead_email: email,
      })
      .select("id")
      .single();
    estimacionId = data?.id ?? null;
  } catch (e) {
    console.error("Error registrando estimación:", e);
  }

  // El aviso al admin no debe demorar la respuesta al usuario
  after(async () => {
    try {
      await sendEstimacionLead({
        nombre,
        email: email ?? "—",
        telefono: tel.valor,
        barrio: input.barrio,
        resultado,
      });
    } catch (e) {
      console.error("Error enviando aviso de estimación:", e);
    }
  });

  return NextResponse.json({ ...resultado, estimacionId });
}
