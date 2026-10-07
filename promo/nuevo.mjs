/*
 * Arma el borrador del guion de una propiedad a partir de su ficha.
 *
 *   node nuevo.mjs <id | link de la ficha>            → guiones/<id>.json
 *   node nuevo.mjs <id> --forzar                      → pisa el guion si ya existe
 *   node nuevo.mjs <id> --a ruta/al/guion.json        → lo escribe en otro lado
 *
 * Lee la propiedad de la base (solo lectura, con la clave pública del
 * sitio que ya está en ../.env.local) y completa lo que se puede saber
 * con certeza: fotos, barrio, datos de la barra, ubicación y precio.
 *
 * Lo que no se puede saber sin leer la descripción y mirar las fotos queda
 * para vos: qué foto va en cada escena, las fichas con ícono ("Aire
 * acondicionado", "Lavadero separado"…) y qué hay cerca del mapa. Por eso
 * el resultado es un borrador, no un video terminado.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

const [entrada, ...opciones] = process.argv.slice(2);
if (!entrada) {
  console.error("Uso: node nuevo.mjs <id | link de la ficha> [--forzar] [--a ruta.json]");
  process.exit(1);
}
const forzar = opciones.includes("--forzar");
const iA = opciones.indexOf("--a");

// El id es el último tramo del link: .../departamento/27b2ceb9
const id = (entrada.startsWith("http") ? new URL(entrada).pathname : entrada).split("/").filter(Boolean).pop();
if (!/^[0-9a-f]{8}$/i.test(id)) {
  console.error(`"${id}" no parece el id de una ficha (8 caracteres, como 27b2ceb9).`);
  process.exit(1);
}

const destino = iA >= 0 ? path.resolve(opciones[iA + 1]) : path.join(AQUI, "guiones", `${id}.json`);
if (existsSync(destino) && !forzar) {
  console.error(`Ya existe ${path.relative(process.cwd(), destino)}. Usá --forzar para pisarlo.`);
  process.exit(1);
}

try {
  process.loadEnvFile(path.join(AQUI, "..", ".env.local"));
} catch {
  console.error("No encontré ../.env.local (las claves del sitio). Copialo de la otra PC o de Vercel.");
  process.exit(1);
}
const URL_DB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_DB || !CLAVE) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en ../.env.local.");
  process.exit(1);
}

// ── La propiedad ─────────────────────────────────────────────

const COLUMNAS = [
  "short_id", "tipo", "operacion", "barrio", "ciudad", "provincia", "precio", "moneda", "fotos",
  "ambientes", "dormitorios", "banos", "superficie_total", "superficie_cubierta", "superficie_balcon",
  "piso", "orientacion", "disposicion", "cochera", "apto_credito", "lat", "lng", "geo_aproximada",
].join(",");

const r = await fetch(`${URL_DB}/rest/v1/properties?select=${COLUMNAS}&short_id=eq.${id}&status=eq.activa`, {
  headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}` },
});
if (!r.ok) {
  console.error(`La base respondió ${r.status}.`);
  process.exit(1);
}
const [p] = await r.json();
if (!p) {
  console.error(`No hay una propiedad activa con el id ${id}.`);
  process.exit(1);
}
if (!p.fotos?.length) {
  console.error("La propiedad no tiene fotos: sin fotos no hay video.");
  process.exit(1);
}

// ── El borrador ──────────────────────────────────────────────

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const TIPO = { departamento: "Departamento", casa: "Casa", terreno: "Terreno", local: "Local", oficina: "Oficina", cochera: "Cochera" };
const lugar = p.barrio || p.ciudad;
const enCaba = /ciudad aut[oó]noma|caba/i.test(p.provincia || "");
const m2 = p.superficie_total ? Number(p.superficie_total) : null;

const bajada = [
  TIPO[p.tipo] ?? p.tipo,
  p.ambientes && p.tipo !== "terreno" ? `de ${plural(p.ambientes, "ambiente", "ambientes")}` : m2 ? `de ${m2} m²` : "",
].filter(Boolean).join(" ");

// La barra: hasta cinco datos, en el orden en que se miran
const pie = [
  p.ambientes && { id: "amb", icono: "layout-grid", valor: p.ambientes, rotulo: "ambientes" },
  p.dormitorios && { id: "dorm", icono: "bed-double", valor: p.dormitorios, rotulo: p.dormitorios === 1 ? "dormitorio" : "dormitorios" },
  p.banos && { id: "banos", icono: "bath", valor: p.banos, rotulo: p.banos === 1 ? "baño" : "baños" },
  m2 && { id: "m2", icono: "ruler", valor: m2, unidad: "m²", rotulo: "totales" },
  p.tipo === "departamento" && p.piso && { id: "piso", icono: "building-2", valor: String(p.piso), rotulo: "piso" },
].filter(Boolean).slice(0, 5);

// Escenas con lo que dice la ficha; la foto que corresponde a cada una la elegís vos
const candidatas = [
  p.dormitorios && { titulo: plural(p.dormitorios, "dormitorio", "dormitorios"), bajada: p.banos ? plural(p.banos, "baño", "baños") : undefined, resalta: "dorm" },
  m2 && { titulo: `${m2} m²`, bajada: p.superficie_cubierta ? `${p.superficie_cubierta} m² cubiertos` : "de superficie total", resalta: "m2" },
  p.superficie_balcon && { titulo: "Balcón", bajada: `${p.superficie_balcon} m² de balcón` },
  p.orientacion && { titulo: `Orientación ${String(p.orientacion).toLowerCase()}`, bajada: p.disposicion ? `Disposición ${String(p.disposicion).toLowerCase()}` : undefined },
].filter(Boolean);
const escenas = candidatas.slice(0, Math.min(3, p.fotos.length - 1)).map((c, i) => ({ foto: i + 1, ...c, chips: [] }));

const guion = {
  _borrador: "Revisá este borrador antes de generar el video: qué foto va en cada escena (campo 'foto', empieza en 0), las fichas con ícono ('chips'), qué hay cerca del mapa ('cerca') y los textos. Después borrá esta línea.",
  id,
  duracion: 30,
  ficha: entrada.startsWith("http") ? entrada : undefined,
  fotos: p.fotos,
  pie,
  apertura: { foto: 0, rotulo: "En venta · Dueño directo", titulo: lugar, bajada, chips: [] },
  escenas,
  mapa: p.lat != null && p.lng != null ? {
    lat: p.lat, lng: p.lng,
    titulo: lugar,
    bajada: enCaba ? "Ciudad de Buenos Aires" : p.provincia,
    // El sitio dibuja un círculo de 400 m cuando la ubicación es aproximada
    radio: p.geo_aproximada ? 400 : 250,
    cerca: [],
  } : undefined,
  precio: {
    foto: 0,
    lugar,
    rotulo: "Precio de venta",
    moneda: p.moneda === "USD" ? "US$" : "$",
    valor: Math.round(Number(p.precio)),
    notas: [p.apto_credito && "Apto crédito hipotecario"].filter(Boolean),
  },
  cierre: { titulo: "Tratá directo con el dueño", rotulo: "Sin comisión inmobiliaria", boton: "Ver la ficha completa" },
};

await mkdir(path.dirname(destino), { recursive: true });
await writeFile(destino, JSON.stringify(guion, null, 2) + "\n");

console.log(`Borrador de "${lugar}" (${id}): ${p.fotos.length} fotos, ${pie.length} datos en la barra, ${escenas.length} escenas${guion.mapa ? ", con mapa" : ", sin mapa (la propiedad no tiene coordenadas)"}.`);
console.log(`  Guion: ${destino}`);
console.log("\nPara terminarlo:");
console.log("  1. Miralo con: node render.mjs " + id + " --cuadros 1,5,9,13,16,19   (cuadros sueltos en salida/)");
console.log("  2. Elegí la foto de cada escena, sumá las fichas con ícono y lo que hay cerca (leé la descripción de la ficha).");
console.log("  3. Generalo con: node render.mjs " + id);
