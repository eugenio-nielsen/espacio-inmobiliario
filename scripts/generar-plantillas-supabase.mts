// Escribe los mails de la cuenta en emails/supabase/ (HTML listo para pegar en
// Supabase → Authentication → Emails). Las imágenes y los links apuntan al
// sitio de producción, que es donde se abre el mail:
//   npx tsx scripts/generar-plantillas-supabase.mts
//
// Asuntos:
//   Confirm signup  → Confirmá tu cuenta en Espacio Inmobiliario
//   Reset password  → Elegí una contraseña nueva — Espacio Inmobiliario
process.env.NEXT_PUBLIC_SITE_URL = "https://www.espacioinmobiliario.com.ar";
const { writeFileSync, mkdirSync } = await import("node:fs");
const { plantillaCuenta } = await import("../lib/email");

mkdirSync("emails/supabase", { recursive: true });
writeFileSync("emails/supabase/confirmar-cuenta.html", plantillaCuenta("confirmar"), "utf8");
writeFileSync("emails/supabase/recuperar-clave.html", plantillaCuenta("clave"), "utf8");
console.log("listo");
