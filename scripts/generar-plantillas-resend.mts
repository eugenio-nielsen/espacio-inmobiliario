// Escribe las plantillas de Resend en emails/resend/ (HTML listo para pegar
// en Resend → Broadcasts / Templates). Las imágenes y los links apuntan al
// sitio de producción, que es donde se abre el mail:
//   npx tsx scripts/generar-plantillas-resend.mts
process.env.NEXT_PUBLIC_SITE_URL = "https://www.espacioinmobiliario.com.ar";
const { writeFileSync, mkdirSync } = await import("node:fs");
const { plantillaSeguimiento } = await import("../lib/email");

mkdirSync("emails/resend", { recursive: true });
for (const origen of ["tasador", "registro"] as const) {
  writeFileSync(`emails/resend/seguimiento-${origen}.html`, plantillaSeguimiento(origen), "utf8");
}
console.log("listo");
