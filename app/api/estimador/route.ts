import { NextResponse } from "next/server";
import { after } from "next/server";
import { estimarPrecio } from "@/lib/estimador/engine";
import { getEstimadorConfig } from "@/lib/estimador/data";
import { getPreciosConFecha } from "@/lib/mercado";
import { sanearInput } from "@/lib/estimador/sanear";
import { ubicarDireccion } from "@/lib/estimador/ubicar";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMIT_MSG } from "@/lib/utils/rateLimit";
import { normalizarTelefono } from "@/lib/utils/telefono";
import { sendEstimacionLead } from "@/lib/email";

type Contacto = { nombre?: string; telefono?: string; email?: string };
type Body = Record<string, unknown> & { contacto?: Contacto };

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


  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Faltan los datos de la estimación." }, { status: 400 });
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

  // El input llega del navegador: se lleva a la forma que espera el motor
  const saneado = sanearInput(body);
  if ("error" in saneado) {
    return NextResponse.json(saneado, { status: 400 });
  }
  const input = saneado;

  // La dirección es opcional: sin ella (o si no se la ubica) se usa el promedio del barrio
  const [filas, config, ubicacion] = await Promise.all([
    getPreciosConFecha(),
    getEstimadorConfig(),
    input.direccion ? ubicarDireccion(input.direccion, input.barrio) : Promise.resolve(null),
  ]);
  const precios = Object.fromEntries(filas.map((f) => [f.barrio, f.precio]));
  const actualizado = filas.find((f) => f.barrio === input.barrio)?.actualizado;
  const resultado = estimarPrecio(input, precios, config, {
    precioActualizado: actualizado,
    ubicacion,
    direccionNoUbicada: !!input.direccion && !ubicacion,
  });

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
        input,
        resultado,
      });
    } catch (e) {
      console.error("Error enviando aviso de estimación:", e);
    }
  });

  return NextResponse.json({ ...resultado, estimacionId });
}
