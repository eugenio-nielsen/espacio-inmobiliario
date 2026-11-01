/*
 * Capturas del sitio real en formato celular (390x844 @2x) para los reels de funciones y de notas.
 *   node reels/capturar.mjs [grupo ...]   → reels/capturas/<grupo>-<n>.png
 * Grupos: publicar, tasador, panel, buscar, herramientas, notas.
 *
 * Usa el sitio en localhost:3000 (npm run dev) y la cuenta de prueba de ../explainer/.demo.json
 * para los grupos con sesión (publicar, panel). No envía ningún formulario.
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(AQUI, "capturas"); mkdirSync(OUT, { recursive: true });
const BASE = process.env.SITIO || "http://localhost:3000";
const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && existsSync(p));
const pide = process.argv.slice(2);
const archivoDemo = path.join(AQUI, "..", "explainer", ".demo.json");
const demo = existsSync(archivoDemo) ? JSON.parse(readFileSync(archivoDemo, "utf8")) : null;
const w = ms => new Promise(r => setTimeout(r, ms));

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
const p = await nav.newPage();
const ir = async (ruta, ms = 1500) => { await p.goto(BASE + ruta, { waitUntil: "networkidle2", timeout: 120000 }); await w(ms); };
const bajar = async y => { await p.evaluate(y => window.scrollTo(0, y), y); await w(800); };
const foto = async n => {
  await p.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach(e => e.remove());
    // El nombre y el avatar de quien publica (alguien real) salen difuminados
    for (const el of document.querySelectorAll("*")) {
      if (el.children.length === 0 && el.textContent.trim() === "Propietario directo") {
        const nombre = el.previousElementSibling; if (nombre) nombre.style.filter = "blur(9px)";
        const av = el.parentElement?.previousElementSibling; if (av) av.style.filter = "blur(9px)";
      }
    }
  });
  await p.screenshot({ path: path.join(OUT, `${n}.png`) }); console.log("  ", n);
};
const escribir = async (sel, t) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.type(t, { delay: 12 }); };
const clickTexto = async (sel, txt, n = 0) => {
  const ok = await p.evaluate((s, t, i) => { const l = [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.innerText.trim().toLowerCase() === t.toLowerCase()); if (l[i]) { l[i].click(); return true; } return false; }, sel, txt, n);
  await w(600); return ok;
};
const numero = async (ph, v) => { const h = await p.evaluateHandle(ph => [...document.querySelectorAll("input[type=number]")].find(i => i.offsetParent && i.placeholder === ph), ph); await h.click({ clickCount: 3 }); await p.keyboard.type(String(v)); await w(200); };
const entrar = async () => {
  await ir("/auth/login");
  if (!(await p.$("input[type=email]"))) return;
  await escribir("input[type=email]", demo.email); await escribir("input[type=password]", demo.password);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }), p.keyboard.press("Enter")]); await w(1500);
};

const NOTAS = [
  "como-calcular-el-precio-de-alquiler-de-tu-propiedad",
  "alquilar-sin-inmobiliaria-contrato-garantia-y-deposito",
  "credito-hipotecario-que-mirar-antes-de-pedirlo",
  "como-sacar-buenas-fotos-de-tu-propiedad-para-vender-mas-rapido",
  "sena-boleto-y-reserva-que-firmas-en-cada-paso",
];

const GRUPOS = {
  async publicar() {
    await entrar(); await ir("/panel/propiedades/nueva", 2500); await foto("publicar-1");
    await escribir("input[name=titulo]", "Departamento 3 ambientes luminoso con balcón en Palermo");
    await p.select("select[name=tipo]", "departamento");
    await escribir("input[name=precio]", "145000"); await foto("publicar-2");
    await bajar(700); await foto("publicar-3");
    await bajar(1500); await foto("publicar-4");
    await bajar(2400); await foto("publicar-5");
  },
  async tasador() {
    await ir("/estimador", 2500); await foto("tasador-1");
    await clickTexto("label", "Palermo"); await foto("tasador-2");
    await clickTexto("button", "Continuar"); await w(700);
    await numero("65", 58); await clickTexto("label", "3", 0); await clickTexto("label", "2", 1); await numero("Ej.: 4", 3); await foto("tasador-3");
    await clickTexto("button", "Continuar"); await clickTexto("button", "Continuar"); await w(900);
    await clickTexto("button", "Frente"); await clickTexto("button", "Despejada"); await foto("tasador-4");
  },
  async panel() {
    await entrar(); await ir("/panel", 2800); await foto("panel-1");
    await clickTexto("div,button,h2,h3,span", "Consultas recibidas"); await w(800); await bajar(260); await foto("panel-2");
    await clickTexto("div,button,h2,h3,span", "Agenda de visitas"); await w(800); await bajar(420); await foto("panel-3");
    await ir("/panel/perfil", 2200); await foto("panel-4");
  },
  async buscar() {
    await ir("/propiedades", 2500); await foto("buscar-1"); await bajar(700); await foto("buscar-2");
    await ir("/propiedades", 1500);
    const href = await p.evaluate(() => [...document.querySelectorAll("a[href*='/propiedades/']")].map(a => a.getAttribute("href")).filter(h => h.split("/").length >= 6 && h.includes("/venta/") && h.includes("/departamento/"))[0]);
    console.log("   ficha:", href);
    await ir(href, 2800); await foto("buscar-3"); await bajar(700); await foto("buscar-4"); await bajar(1500); await foto("buscar-5");
  },
  async herramientas() {
    await ir("/blog", 2000); await foto("herramientas-1");
    await ir("/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble", 2500); await foto("herramientas-2"); await bajar(800); await foto("herramientas-3");
    await ir("/foro", 2000); await foto("herramientas-4");
  },
  async notas() {
    for (let i = 0; i < NOTAS.length; i++) { await ir(`/blog/${NOTAS[i]}`, 2500); await foto(`nota-${i + 1}`); }
  },
};
const CON_SESION = new Set(["publicar", "panel"]);

for (const [nombre, f] of Object.entries(GRUPOS)) {
  if (pide.length && !pide.includes(nombre)) continue;
  if (CON_SESION.has(nombre) && !demo) { console.log(`${nombre}: sin cuenta de prueba (.demo.json), se saltea`); continue; }
  console.log(nombre);
  try { await f(); } catch (e) { console.error("  falló:", e.message); }
}
await nav.close();
