import { NextResponse } from "next/server";
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
      // Solo permitimos redirecciones internas
      const safeNext = next.startsWith("/") ? next : "/panel";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/recuperar?error=enlace`);
}
