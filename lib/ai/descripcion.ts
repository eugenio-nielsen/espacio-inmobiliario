import Anthropic from "@anthropic-ai/sdk";

/**
 * Generador de descripciones de propiedades con Claude (Haiku).
 * Server-only: la API key vive en ANTHROPIC_API_KEY y nunca llega al cliente.
 */

export interface CamposDescripcion {
  tipo?: string;
  barrio?: string;
  ciudad?: string;
  direccion?: string;
  superficie_total?: number;
  superficie_cubierta?: number;
  superficie_balcon?: number;
  superficie_descubierta?: number;
  ambientes?: number;
  dormitorios?: number;
  banos?: number;
  cochera?: boolean;
  apto_credito?: boolean;
  orientacion?: string;
  disposicion?: string;
  antiguedad?: number;
  estado?: string;
  piso?: string;
}

// Claude Haiku 4.5 — rápido y económico para una generación de una sola pasada.
const MODELO = "claude-haiku-4-5";

const SYSTEM_PROMPT = `Sos un redactor inmobiliario profesional de Argentina. Escribís descripciones para avisos de propiedades en español rioplatense (usá voseo), con un tono profesional y cálido a la vez.

Reglas:
- Extensión: alrededor de 150 palabras (entre 130 y 170). Un único texto corrido, en 1 a 3 párrafos cortos.
- Usá ÚNICAMENTE los datos que te paso. No inventes ni supongas características, amenities, materiales, estado, ubicación, vistas ni servicios que no aparezcan en los datos.
- No infieras ni describas la distribución interna, cómo es la cocina, las terminaciones, el living/comedor ni ningún detalle que no esté explícito en los datos. Por ejemplo: no digas "cocina integrada", "amplio living", "pisos de madera" ni nada parecido si no figura. Mencioná solo lo que te paso, con sus propias palabras.
- Si un dato no está, simplemente no lo menciones. Nunca escribas "no especificado" ni dejes huecos para completar.
- No menciones precios ni cifras de dinero. Sí podés mencionar que es apto crédito hipotecario, pero solo si ese dato está presente.
- Destacá con naturalidad los puntos fuertes reales (cantidad y distribución de ambientes, superficies, orientación, disposición, estado, cochera, etc.) sin exagerar ni caer en clichés vacíos.
- No uses viñetas, listas, markdown, títulos ni emojis. Solo texto plano corrido.
- Cerrá con una invitación breve y natural a conocer la propiedad o coordinar una visita.`;

const TIPO_LABEL: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
};

/** Arma una lista plana de los datos cargados (solo los presentes). */
export function buildDatosPropiedad(c: CamposDescripcion): string {
  const L: string[] = [];
  if (c.tipo) L.push(`Tipo: ${TIPO_LABEL[c.tipo] ?? c.tipo}`);
  const ubicacion = [c.barrio, c.ciudad].filter(Boolean).join(", ");
  if (ubicacion) L.push(`Ubicación: ${ubicacion}`);
  if (c.direccion) L.push(`Dirección: ${c.direccion}`);
  if (c.ambientes) L.push(`Ambientes: ${c.ambientes}`);
  if (c.dormitorios != null) L.push(`Dormitorios: ${c.dormitorios}`);
  if (c.banos != null) L.push(`Baños: ${c.banos}`);
  if (c.superficie_total) L.push(`Superficie total: ${c.superficie_total} m²`);
  if (c.superficie_cubierta) L.push(`Superficie cubierta: ${c.superficie_cubierta} m²`);
  if (c.superficie_balcon) L.push(`Balcón: ${c.superficie_balcon} m²`);
  if (c.superficie_descubierta) L.push(`Superficie descubierta / terraza: ${c.superficie_descubierta} m²`);
  if (c.piso) L.push(`Piso: ${c.piso}`);
  if (c.orientacion) L.push(`Orientación: ${c.orientacion}`);
  if (c.disposicion) L.push(`Disposición: ${c.disposicion}`);
  if (c.estado) L.push(`Estado: ${c.estado}`);
  if (c.antiguedad != null) {
    L.push(c.antiguedad === 0 ? "Antigüedad: a estrenar" : `Antigüedad: ${c.antiguedad} años`);
  }
  if (c.cochera) L.push("Cochera / garage: sí");
  if (c.apto_credito) L.push("Apto crédito hipotecario: sí");
  return L.join("\n");
}

/**
 * Genera una descripción a partir de los campos cargados.
 * Lanza si falta ANTHROPIC_API_KEY o si la API falla (el caller lo maneja).
 */
export async function generarDescripcion(campos: CamposDescripcion): Promise<string> {
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  const datos = buildDatosPropiedad(campos);

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 400,
    // El system prompt es estable → breakpoint de prompt caching.
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Datos de la propiedad:\n${datos}\n\nEscribí la descripción del aviso siguiendo todas las reglas.`,
      },
    ],
  });

  const bloque = response.content.find((b) => b.type === "text");
  return bloque && bloque.type === "text" ? bloque.text.trim() : "";
}
