/**
 * Inserta las notas para compradores como BORRADOR.
 *
 * Borrador y no publicado a propósito: nada aparece en el sitio ni en el
 * sitemap hasta que Eugenio las revise y las publique desde /panel/admin.
 *
 * Es idempotente: si el slug ya existe, no lo toca. Se puede correr dos
 * veces sin duplicar ni pisar ediciones hechas a mano.
 *
 * Uso:  node scripts/insertar-notas-compradores.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env.local a mano: el script corre fuera de Next, que es quien
// normalmente se encarga de cargarlo.
const env = Object.fromEntries(
  readFileSync(join(raiz, ".env.local"), "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const CARPETA = process.argv[2];
if (!CARPETA) {
  console.error("Falta la carpeta con los .md. Uso: node scripts/insertar-notas-compradores.mjs <carpeta>");
  process.exit(1);
}

const NOTAS = [
  {
    archivo: "post1.md",
    slug: "que-revisar-antes-de-comprar-una-propiedad-en-caba",
    titulo: "Qué revisar antes de comprar una propiedad en CABA",
    resumen:
      "La lista de lo que conviene mirar antes de hacer una oferta: la propiedad, el edificio, los papeles y quién te está vendiendo.",
    meta_title: "Qué revisar antes de comprar una propiedad en CABA · Guía 2026",
    meta_description:
      "Checklist para comprar sin inmobiliaria: qué mirar en la visita, qué preguntar del edificio, qué papeles pedir y qué señales encienden una alarma.",
  },
  {
    archivo: "post2.md",
    slug: "que-documentacion-pedirle-al-dueno-antes-de-firmar",
    titulo: "Qué documentación pedirle al dueño antes de firmar",
    resumen:
      "Título, informe de dominio, inhibiciones, libres deuda, reglamento y planos: qué es cada documento y qué mirar en él.",
    meta_title: "Qué documentación pedir antes de comprar una propiedad",
    meta_description:
      "Los documentos que conviene pedir antes de señar una propiedad, qué revisar en cada uno y quién hace qué en la operación.",
  },
  {
    archivo: "post3.md",
    slug: "cuanto-cuesta-escriturar-los-gastos-del-comprador",
    titulo: "Cuánto cuesta escriturar: los gastos del comprador",
    resumen:
      "Honorarios, sellos, aranceles y certificados: qué se paga además del precio, quién paga qué y cómo estimarlo antes de ofertar.",
    meta_title: "Cuánto cuesta escriturar: los gastos del comprador",
    meta_description:
      "Qué gastos tiene el comprador además del precio de la propiedad: honorarios de escribano, impuesto de sellos, aranceles del Registro y certificados.",
  },
];

const { data: existentes, error: errLectura } = await supabase
  .from("posts")
  .select("slug")
  .in("slug", NOTAS.map(n => n.slug));

if (errLectura) {
  console.error("No se pudo consultar posts:", errLectura.message);
  process.exit(1);
}

const yaEstan = new Set((existentes ?? []).map(p => p.slug));
const aInsertar = NOTAS.filter(n => !yaEstan.has(n.slug)).map(n => ({
  slug: n.slug,
  titulo: n.titulo,
  resumen: n.resumen,
  contenido: readFileSync(join(CARPETA, n.archivo), "utf8"),
  categoria: "Guía para comprar",
  autor: "Eugenio Nielsen",
  status: "borrador",
  meta_title: n.meta_title,
  meta_description: n.meta_description,
  published_at: null,
}));

for (const slug of yaEstan) console.log(`  ya existía, sin tocar: ${slug}`);

if (aInsertar.length === 0) {
  console.log("Nada para insertar.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("posts")
  .insert(aInsertar)
  .select("slug, titulo, status, categoria");

if (error) {
  console.error("Error insertando:", error.message);
  process.exit(1);
}

for (const p of data) console.log(`  insertada [${p.status}] ${p.categoria} — ${p.titulo}`);
console.log(`\n${data.length} nota(s) creadas como borrador.`);
