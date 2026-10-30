/*
 * Datos ficticios para la cuenta de prueba (.demo.json): una propiedad pausada
 * (no sale en el listado ni en el sitemap), dos consultas y una visita.
 *   node explainer/sembrar.mjs
 * Es idempotente: si la propiedad de prueba ya existe, no hace nada.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const demo = JSON.parse(readFileSync(path.join(AQUI, ".demo.json"), "utf8"));
const env = Object.fromEntries(readFileSync(path.join(AQUI, "..", "..", ".env.local"), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const a = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: ya } = await a.from("properties").select("id").eq("owner_id", demo.id).limit(1);
if (ya?.length) { console.log("Ya hay datos de prueba."); process.exit(0); }

// Fotos de referencia: las de una ficha pública (solo se enlazan, no se copian)
const { data: ref } = await a.from("properties").select("fotos").eq("slug", "montserrat-departamento-8e8ac684").single();
const fotos = (ref?.fotos || []).slice(0, 4);

const id = crypto.randomUUID();
const { error } = await a.from("properties").insert({
  id, owner_id: demo.id, slug: `palermo-departamento-${id.slice(0, 8)}`,
  titulo: "Departamento 3 ambientes luminoso con balcón en Palermo",
  descripcion: "Propiedad de prueba para capturas y pruebas del sitio. No es una publicación real.",
  tipo: "departamento", operacion: "venta", precio: 145000, moneda: "USD",
  provincia: "CABA", ciudad: "Ciudad Autónoma de Buenos Aires", barrio: "Palermo", direccion: "Honduras 5000",
  superficie_total: 62, superficie_cubierta: 58, ambientes: 3, dormitorios: 2, banos: 1,
  status: "pausada", fotos, lat: -34.5877, lng: -58.4291,
});
if (error) { console.error(error.message); process.exit(1); }

await a.from("inquiries").insert([
  { property_id: id, nombre: "Lucas Giménez", email: "lucas@ejemplo.com", telefono: "+5491155550101", mensaje: "Hola, ¿sigue disponible? Me gustaría coordinar una visita esta semana." },
  { property_id: id, nombre: "Carla Benítez", email: "carla@ejemplo.com", telefono: "+5491155550102", mensaje: "¿Es apto crédito? ¿Cuánto son las expensas?" },
]);
const ini = new Date(); ini.setDate(ini.getDate() + 2); ini.setHours(15, 0, 0, 0);
const { error: ev } = await a.from("visitas").insert({ property_id: id, nombre: "Lucas Giménez", email: "lucas@ejemplo.com", telefono: "+5491155550101", mensaje: "Visita para conocer el departamento.", inicio: ini.toISOString(), duracion: 30, status: "pendiente" });
if (ev) console.log("visita:", ev.message);
console.log("Datos de prueba sembrados:", id);
