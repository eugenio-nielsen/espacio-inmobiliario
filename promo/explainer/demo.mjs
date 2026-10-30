/*
 * Cuenta de prueba para capturar el panel del explainer.
 *
 *   node explainer/demo.mjs crear    → crea el usuario (sin mail) y guarda explainer/.demo.json
 *   node explainer/demo.mjs borrar   → borra el usuario y todo lo que cree (propiedades, consultas)
 *
 * El .env.local del sitio apunta a la base real: esta cuenta existe en producción
 * mientras dura la captura. Siempre correr `borrar` al terminar.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO = path.join(AQUI, ".demo.json");
const env = Object.fromEntries(readFileSync(path.join(AQUI, "..", "..", ".env.local"), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const a = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const modo = process.argv[2];
if (modo === "crear") {
  if (existsSync(ARCHIVO)) { console.log("Ya existe .demo.json; correr `borrar` primero."); process.exit(1); }
  const email = `demo-explainer-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(12).toString("base64url");
  const { data, error } = await a.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { nombre: "Mariana Rossi", telefono: "+5491155550123" },
  });
  if (error) { console.error(error.message); process.exit(1); }
  await a.from("profiles").update({ nombre: "Mariana Rossi", telefono: "+5491155550123" }).eq("id", data.user.id);
  writeFileSync(ARCHIVO, JSON.stringify({ id: data.user.id, email, password }, null, 2));
  console.log("Usuario de prueba creado:", data.user.id);
} else if (modo === "borrar") {
  if (!existsSync(ARCHIVO)) { console.log("No hay .demo.json."); process.exit(0); }
  const { id } = JSON.parse(readFileSync(ARCHIVO, "utf8"));
  const { error } = await a.auth.admin.deleteUser(id);   // borra en cascada el perfil y sus propiedades
  if (error) { console.error(error.message); process.exit(1); }
  rmSync(ARCHIVO);
  console.log("Usuario de prueba borrado:", id);
} else {
  console.error("Uso: node explainer/demo.mjs crear|borrar");
  process.exit(1);
}
