import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { esBot } from "@/lib/bots";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Una visita por persona (IP) y propiedad cada 24 horas. */
const VENTANA_SEGUNDOS = 24 * 60 * 60;

/**
 * Suma una visita a una ficha.
 *
 * Antes la ficha sumaba una visita cada vez que el servidor la armaba, y eso
 * lo hace también cada robot (buscadores, rastreadores de ChatGPT y de redes,
 * herramientas de SEO), cada vez que el dueño entra a mirar su aviso y cada
 * recarga: el número que veían los dueños y el público no era de personas.
 *
 * Ahora lo pide el navegador (<RegistrarVista>) una vez cargada la ficha, así
 * que los robots que no ejecutan JavaScript no cuentan. Acá se descartan
 * además los que sí lo ejecutan (se identifican por el User-Agent) y se cuenta
 * una sola vez por IP y propiedad por día, aunque recarguen o borren el
 * almacenamiento del navegador.
 *
 * Siempre responde 200 con el motivo, para poder ver desde afuera por qué una
 * visita no se contó. El navegador no usa la respuesta.
 */
export async function POST(request: Request) {
  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return Response.json({ contada: false, motivo: "invalido" }, { status: 400 });
  }
  if (typeof id !== "string" || !UUID.test(id)) {
    return Response.json({ contada: false, motivo: "invalido" }, { status: 400 });
  }

  if (esBot(request.headers.get("user-agent"))) {
    return Response.json({ contada: false, motivo: "bot" });
  }

  // Fail-open: si el límite falla, la visita se cuenta
  if (!(await checkRateLimit(`vista:${id}`, 1, VENTANA_SEGUNDOS))) {
    return Response.json({ contada: false, motivo: "repetida" });
  }

  // La función de la base solo suma si la propiedad está activa
  const { error } = await createAdminClient().rpc("increment_property_views", { property_id: id });
  if (error) {
    console.error("Error incrementando views:", error.message);
    return Response.json({ contada: false, motivo: "error" });
  }
  return Response.json({ contada: true });
}
