/*
 * Capturas del sitio real (localhost:3000) para el explainer, en 1920x1080.
 *   node explainer/capturar.mjs [escena ...]   → explainer/capturas/<escena>-<n>.png
 *
 * Las escenas con sesión (publicar, panel, perfil) usan la cuenta de .demo.json
 * (node explainer/demo.mjs crear). Sin ese archivo se saltean.
 * Ninguna escena envía formularios: se llenan para mostrarlos y no se guarda nada.
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(AQUI, "capturas");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.SITIO || "http://localhost:3000";
const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && existsSync(p));
const pide = process.argv.slice(2);
const demo = existsSync(path.join(AQUI, ".demo.json")) ? JSON.parse(readFileSync(path.join(AQUI, ".demo.json"), "utf8")) : null;

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const p = await nav.newPage();
const w = ms => new Promise(r => setTimeout(r, ms));
const ir = async (ruta, ms = 1200) => { await p.goto(BASE + ruta, { waitUntil: "networkidle2", timeout: 90000 }); await w(ms); };
const foto = async (nombre) => {
  await p.evaluate(() => {
    // Fuera el indicador de Next en desarrollo
    document.querySelectorAll("nextjs-portal").forEach(e => e.remove());
    // El nombre y el avatar de quien publica (alguien real) salen difuminados: el video no es sobre esa persona
    for (const el of document.querySelectorAll("*")) {
      if (el.children.length === 0 && el.textContent.trim() === "Propietario directo") {
        const fila = el.parentElement, nombre = el.previousElementSibling;
        if (nombre) nombre.style.filter = "blur(9px)";
        const av = fila?.previousElementSibling; if (av) av.style.filter = "blur(9px)";
      }
    }
  });
  await p.screenshot({ path: path.join(OUT, `${nombre}.png`) }); console.log("  ", nombre);
};
const clickTexto = async (sel, txt, n = 0) => {
  const ok = await p.evaluate((s, t, i) => { const l = [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.innerText.trim().toLowerCase() === t.toLowerCase()); if (l[i]) { l[i].click(); return true; } return false; }, sel, txt, n);
  await w(600); return ok;
};
const escribir = async (selector, texto) => { await p.click(selector, { clickCount: 3 }); await p.keyboard.type(texto, { delay: 15 }); };
const numero = async (ph, v) => { const h = await p.evaluateHandle(ph => [...document.querySelectorAll("input[type=number]")].find(i => i.offsetParent && i.placeholder === ph), ph); await h.click({ clickCount: 3 }); await p.keyboard.type(String(v)); await w(200); };
const entrar = async () => {
  await ir("/auth/login");
  if (!(await p.$("input[type=email]"))) return;   // ya hay sesión
  await escribir("input[type=email]", demo.email); await escribir("input[type=password]", demo.password);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }), p.keyboard.press("Enter")]);
  await w(1500);
};

const PASOS = {
  async gancho() { await ir("/", 2500); await foto("gancho-1"); await p.evaluate(() => window.scrollTo(0, 950)); await w(900); await foto("gancho-2"); },
  async registro() {
    await ir("/auth/registro"); await foto("registro-1");
    await escribir("input[name=nombre]", "Mariana Rossi"); await escribir("input[name=telefono]", "11 5555 0123");
    await escribir("input[name=email]", "mariana@ejemplo.com"); await foto("registro-2");
    await escribir("input[name=password]", "contraseña-segura"); await foto("registro-3");
  },
  async propiedades() {
    await ir("/propiedades", 2000); await foto("propiedades-1");
    await p.select("select", "departamento").catch(() => {}); await w(600); await foto("propiedades-2");
    await ir("/propiedades", 1500);
    const href = await p.evaluate(() => [...document.querySelectorAll("a[href*='/propiedades/']")].map(a => a.getAttribute("href")).filter(h => h.split("/").length >= 6 && h.includes("/venta/") && /montserrat|monserrat/i.test(h))[0]);
    console.log("   ficha:", href);
    await ir(href, 2500); await foto("propiedades-3");
    await p.evaluate(() => window.scrollTo(0, 820)); await w(900); await foto("propiedades-4");
    await p.evaluate(() => window.scrollTo(0, 1700)); await w(1400); await foto("propiedades-5");
  },
  async tasador() {
    await ir("/estimador", 2200); await foto("tasador-1");
    await clickTexto("label", "Palermo"); await foto("tasador-2");
    await clickTexto("button", "Continuar"); await w(700);
    await numero("65", 58); await clickTexto("label", "3", 0); await clickTexto("label", "2", 1); await numero("Ej.: 4", 3); await foto("tasador-3");
    await clickTexto("button", "Continuar"); await clickTexto("button", "Continuar"); await w(900);
    await clickTexto("button", "Frente"); await clickTexto("button", "Despejada"); await foto("tasador-4");
  },
  async herramientas() {
    await ir("/blog", 1800); await foto("herramientas-1");
    await ir("/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble", 2200); await foto("herramientas-2");
    await ir("/foro", 1800); await foto("herramientas-3");
  },
  // — con sesión —
  async publicar() {
    await entrar(); await ir("/panel/propiedades/nueva", 2200); await foto("publicar-1");
    await escribir("input[name=titulo]", "Departamento 3 ambientes luminoso con balcón en Palermo");
    await p.select("select[name=tipo]", "departamento");
    await escribir("input[name=precio]", "145000");
    await p.select("select[name=zona]", "Ciudad Autónoma de Buenos Aires").catch(async () => {
      // el selector de zona no tiene name: es el primero después de "Ubicación"
      const sel = await p.$$("select"); for (const x of sel) { const t = await x.evaluate(e => e.innerText); if (/Ciudad Aut/.test(t) && /Provincia/.test(t)) { await x.select("Ciudad Autónoma de Buenos Aires"); break; } }
    });
    await w(500); await p.select("select[name=barrio]", "Palermo").catch(() => {});
    await escribir("input[name=direccion]", "Honduras 5000").catch(() => {});
    await w(1500); await foto("publicar-2");
    await p.evaluate(() => window.scrollTo(0, 900)); await w(2500); await foto("publicar-3");
    await p.evaluate(() => window.scrollTo(0, 1900)); await w(1000); await foto("publicar-4");
  },
  async panel() {
    await entrar(); await ir("/panel", 2500); await foto("panel-1");
    await clickTexto("div,button,h2,h3,span", "Consultas recibidas"); await w(800);
    await p.evaluate(() => window.scrollTo(0, 260)); await w(600); await foto("panel-2");
    await clickTexto("div,button,h2,h3,span", "Agenda de visitas"); await w(800);
    await p.evaluate(() => window.scrollTo(0, 420)); await w(600); await foto("panel-3");
  },
  async perfil() { await entrar(); await ir("/panel/perfil", 2200); await foto("perfil-1"); await p.evaluate(() => window.scrollTo(0, 900)); await w(800); await foto("perfil-2"); },
};
const CON_SESION = new Set(["publicar", "panel", "perfil"]);

for (const [nombre, f] of Object.entries(PASOS)) {
  if (pide.length && !pide.includes(nombre)) continue;
  if (CON_SESION.has(nombre) && !demo) { console.log(`${nombre}: sin cuenta de prueba (.demo.json), se saltea`); continue; }
  console.log(nombre);
  try { await f(); } catch (e) { console.error("  falló:", e.message); }
}
await nav.close();
