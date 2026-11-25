// Exporta los contactos a UN solo CSV para importar en Resend
// (Audiences → Add contacts → Import CSV):
//   node --env-file=.env.local scripts/exportar-contactos-resend.mjs
//
// Quiénes entran:
//   - usuarios registrados con el email confirmado   → origen "registro"
//   - personas que pidieron una tasación con email   → origen "tasador"
// Si una persona está en los dos, queda una sola fila con origen "registro".
// Los contactos bloqueados quedan afuera.
//
// `origen` es una propiedad propia (interna) de cada contacto: al importar,
// Resend ofrece mapear las columnas extra como propiedades.
//
// Escribe en exports/ (ignorado por git: tiene datos personales).
// Imprime solo cantidades.
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL_OK = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const dividir = nombre => {
  const partes = (nombre || "").trim().split(/\s+/).filter(Boolean);
  return [partes[0] ?? "", partes.slice(1).join(" ")];
};

// ── Bloqueados ──────────────────────────────────────────────────
const { data: bloqueados } = await admin.from("contactos_bloqueados").select("email");
const bloq = new Set((bloqueados ?? []).map(b => (b.email || "").trim().toLowerCase()).filter(Boolean));

// email → { nombre, origen }
const contactos = new Map();
const cuenta = { usuarios: 0, confirmados: 0, tasaciones_con_email: 0, email_invalido: 0, repetidos: 0, ya_registrado: 0, bloqueados: 0 };

// ── 1. Usuarios registrados (solo con el email confirmado) ──────
const confirmados = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  for (const u of data.users) {
    cuenta.usuarios++;
    if (u.email && u.email_confirmed_at) confirmados.set(u.id, u.email.trim().toLowerCase());
  }
  if (data.users.length < 1000) break;
}
cuenta.confirmados = confirmados.size;

const { data: perfiles, error: e1 } = await admin.from("profiles").select("id, nombre");
if (e1) throw e1;
const nombres = new Map(perfiles.map(p => [p.id, p.nombre || ""]));

for (const [id, email] of confirmados) {
  if (bloq.has(email)) { cuenta.bloqueados++; continue; }
  contactos.set(email, { nombre: nombres.get(id) || "", origen: "registro" });
}

// ── 2. Tasaciones con email (una fila por dirección: la más reciente) ──
const { data: tasaciones, error: e2 } = await admin
  .from("estimaciones")
  .select("lead_nombre, lead_email, created_at")
  .not("lead_email", "is", null)
  .order("created_at", { ascending: false });
if (e2) throw e2;

const vistos = new Set();
cuenta.tasaciones_con_email = tasaciones.length;
for (const t of tasaciones) {
  const email = (t.lead_email || "").trim().toLowerCase();
  if (!EMAIL_OK.test(email)) { cuenta.email_invalido++; continue; }
  if (vistos.has(email)) { cuenta.repetidos++; continue; }
  vistos.add(email);
  if (contactos.has(email)) { cuenta.ya_registrado++; continue; }
  if (bloq.has(email)) { cuenta.bloqueados++; continue; }
  contactos.set(email, { nombre: t.lead_nombre || "", origen: "tasador" });
}

// ── CSV único ───────────────────────────────────────────────────
const filas = [...contactos].map(([email, c]) => {
  const [first, last] = dividir(c.nombre);
  return [email, first, last, "false", c.origen];
});
mkdirSync("exports", { recursive: true });
const csv = ["email,first_name,last_name,unsubscribed,origen", ...filas.map(f => f.map(esc).join(","))].join("\n");
writeFileSync("exports/contactos-resend.csv", csv + "\n", "utf8");

const porOrigen = filas.reduce((a, f) => ({ ...a, [f[4]]: (a[f[4]] ?? 0) + 1 }), {});
console.log({ ...cuenta, exportados: filas.length, por_origen: porOrigen });
