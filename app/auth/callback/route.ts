import { NextResponse, after } from "next/server";
import { enviarBienvenidaUnaVez } from "@/lib/bienvenida";
import { volverSeguro } from "@/lib/foro/texto";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback?code=...&next=/panel/clave
 * Destino de los enlaces de email de Supabase (recuperación de contraseña,
 * confirmación, etc.). Intercambia el código por una sesión y redirige.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Cuenta recién confirmada → bienvenida (no en la recuperación de clave)
      if (!next.startsWith("/panel/clave")) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) after(() => enviarBienvenidaUnaVez(user));
      }
      // Solo permitimos redirecciones internas
      const safeNext = next.startsWith("/") ? next : "/panel";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // No se pudo abrir la sesión. La recuperación de clave sí necesita el
  // enlace: se pide uno nuevo.
  if (next.startsWith("/panel/clave")) {
    return NextResponse.redirect(`${origin}/auth/recuperar?error=enlace`);
  }

  // Cualquier otro destino es el enlace de confirmación de una cuenta (el alta
  // de un dueño, de la Tertulia o de la Cátedra). Con `code`, Supabase ya
  // confirmó el email y lo que falló fue abrir la sesión acá: pasa cuando el
  // mail se abre en otro navegador o dispositivo que el del alta, que es donde
  // quedó guardada la verificación. Sin `code`, el enlace ya se usó o venció.
  // En los dos casos ingresar con la contraseña lo resuelve (y si faltaba
  // confirmar, el ingreso ofrece mandar un mail nuevo), y se vuelve a donde iba.
  const login = new URL("/auth/login", origin);
  login.searchParams.set(code ? "confirmada" : "enlace", code ? "1" : "vencido");
  login.searchParams.set("volver", volverSeguro(next, "/panel"));
  return NextResponse.redirect(login);
}
