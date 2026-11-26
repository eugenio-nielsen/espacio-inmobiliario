import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rutas privadas: redirigir a /auth/login si no hay sesión
  if (pathname.startsWith("/panel") && !user) {
    const login = new URL("/auth/login", request.url);
    // Después de ingresar vuelve adonde iba (p. ej. el enlace de un mail). Los
    // utm no van dentro de `volver` sino como parámetros propios de la página
    // de ingreso: así Analytics atribuye la visita al mail o al anuncio.
    const resto = new URLSearchParams(request.nextUrl.search);
    for (const [clave, valor] of request.nextUrl.searchParams) {
      if (clave.startsWith("utm_")) {
        login.searchParams.set(clave, valor);
        resto.delete(clave);
      }
    }
    const consulta = resto.toString();
    login.searchParams.set("volver", pathname + (consulta ? `?${consulta}` : ""));
    return NextResponse.redirect(login);
  }

  // Si ya está logueado y va a auth pages, redirigir al panel
  // (excepto /auth/callback, que debe intercambiar el código del email)
  if (pathname.startsWith("/auth") && !pathname.startsWith("/auth/callback") && user) {
    // Si la página de ingreso traía a dónde volver (p. ej. un tema del
    // foro), va ahí. Solo rutas internas.
    const volver = request.nextUrl.searchParams.get("volver") || "";
    const destino = volver.startsWith("/") && !volver.startsWith("//") && !volver.startsWith("/\\") ? volver : "/panel";
    return NextResponse.redirect(new URL(destino, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/panel/:path*", "/auth/:path*"],
};
