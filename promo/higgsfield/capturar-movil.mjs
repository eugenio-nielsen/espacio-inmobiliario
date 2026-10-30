/*
 * Capturas del sitio en formato celular (390x844 @2x) para el plano 5 del video de la familia.
 *   node higgsfield/capturar-movil.mjs   → higgsfield/capturas/movil-<n>.png
 * Usa el sitio en localhost:3000 y la cuenta de prueba de ../explainer/.demo.json.
 * No envía ningún formulario.
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(AQUI, "capturas"); mkdirSync(OUT, { recursive: true });
const BASE = process.env.SITIO || "http://localhost:3000";
const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && existsSync(p));
const demo = JSON.parse(readFileSync(path.join(AQUI, "..", "explainer", ".demo.json"), "utf8"));
const w = ms => new Promise(r => setTimeout(r, ms));

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
const p = await nav.newPage();
const ir = async (ruta, ms = 1500) => { await p.goto(BASE + ruta, { waitUntil: "networkidle2", timeout: 90000 }); await w(ms); };
const foto = async n => { await p.evaluate(() => document.querySelectorAll("nextjs-portal").forEach(e => e.remove())); await p.screenshot({ path: path.join(OUT, `${n}.png`) }); console.log("  ", n); };
const escribir = async (sel, t) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.type(t, { delay: 12 }); };

await ir("/vender", 2200); await foto("movil-1");
await ir("/auth/registro");
await escribir("input[name=nombre]", "Laura Gómez"); await escribir("input[name=telefono]", "11 5555 0123");
await escribir("input[name=email]", "laura@ejemplo.com"); await foto("movil-2");
await ir("/auth/login");
if (await p.$("input[type=email]")) {
  await escribir("input[type=email]", demo.email); await escribir("input[type=password]", demo.password);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }), p.keyboard.press("Enter")]); await w(1500);
}
await ir("/panel/propiedades/nueva", 2200);
await escribir("input[name=titulo]", "Departamento 3 ambientes luminoso"); await p.select("select[name=tipo]", "departamento");
await escribir("input[name=precio]", "145000"); await foto("movil-3");
await nav.close();
