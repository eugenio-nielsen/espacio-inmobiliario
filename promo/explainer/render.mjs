/*
 * Arma el MP4 del explainer.
 *
 *   node explainer/render.mjs                    → salida/explainer.mp4
 *   node explainer/render.mjs --cuadros 1,12,30  → solo esos segundos, como JPG en salida/
 *
 * Necesita vo/ (node explainer/generar-vo.mjs) y capturas/ (node explainer/capturar.mjs).
 * Las capturas que falten se dibujan como "captura pendiente", para poder revisar el ritmo.
 */
import http from "node:http";
import { readFile, writeFile, appendFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROMO = path.join(AQUI, "..");
const opciones = process.argv.slice(2);
const iC = opciones.indexOf("--cuadros");
const cuadros = iC >= 0 ? opciones[iC + 1].split(",").map(Number) : null;

const CHROME = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && existsSync(p));
if (!CHROME) { console.error("No encontré Chrome ni Edge. Indicá la ruta en CHROME_PATH."); process.exit(1); }

// Guion + voz + planos, todo en un solo JSON para la página
const guion = JSON.parse(await readFile(path.join(AQUI, "guion.json"), "utf8"));
const planos = JSON.parse(await readFile(path.join(AQUI, "planos.json"), "utf8"));
const vo = JSON.parse(await readFile(path.join(AQUI, "vo", "vo.json"), "utf8"));
guion.escenas = guion.escenas.map(e => ({ ...e, ...planos[e.id], palabras: vo.escenas[e.id].palabras }));

const ARCHIVOS = {
  "/": [path.join(AQUI, "explainer.html"), "text/html; charset=utf-8"],
  "/explainer.js": [path.join(AQUI, "explainer.js"), "text/javascript; charset=utf-8"],
  "/mp4-muxer.js": [path.join(PROMO, "node_modules", "mp4-muxer", "build", "mp4-muxer.js"), "text/javascript; charset=utf-8"],
  "/logo.png": [path.join(PROMO, "..", "public", "logo.png"), "image/png"],
};

const servidor = http.createServer(async (req, res) => {
  try {
    const ruta = new URL(req.url, "http://local").pathname;
    const enviar = (c, t) => { res.writeHead(200, { "content-type": t, "cache-control": "no-store" }); res.end(c); };
    if (ruta === "/guion.json") return enviar(JSON.stringify(guion), "application/json; charset=utf-8");
    if (ARCHIVOS[ruta]) return enviar(await readFile(ARCHIVOS[ruta][0]), ARCHIVOS[ruta][1]);
    const mp3 = ruta.match(/^\/vo\/([a-z]+)\.mp3$/);
    if (mp3) return enviar(await readFile(path.join(AQUI, "vo", `${mp3[1]}.mp3`)), "audio/mpeg");
    const cap = ruta.match(/^\/cap\/([a-z0-9-]+)\.png$/);
    if (cap && existsSync(path.join(AQUI, "capturas", `${cap[1]}.png`))) return enviar(await readFile(path.join(AQUI, "capturas", `${cap[1]}.png`)), "image/png");
    res.writeHead(404).end();
  } catch (e) { console.error(e.message); res.writeHead(500).end(); }
});
await new Promise(ok => servidor.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${servidor.address().port}`;

const carpeta = path.join(PROMO, "salida");
await mkdir(carpeta, { recursive: true });
const archivo = path.join(carpeta, "explainer.mp4");

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 30 * 60 * 1000, args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
try {
  const p = await nav.newPage();
  p.on("pageerror", e => console.error("Error en la página:", e.message));
  p.on("console", m => { if (m.type() === "error") console.error("  [página]", m.text()); });
  await p.exposeFunction("promoTrozo", b64 => appendFile(archivo, Buffer.from(b64, "base64")));
  await p.exposeFunction("promoAvance", x => { process.stdout.write(`\r  codificando… ${Math.round(x * 100)}%  `); });
  await p.goto(base + "/", { waitUntil: "networkidle0" });
  const listo = await p.evaluate(() => window.explainer.preparar());
  console.log(`Explainer: ${listo.duracion} s`);
  console.log("  " + listo.escenas.join(" · "));
  if (listo.faltan.length) console.log(`  capturas pendientes: ${listo.faltan.join(", ")}`);

  if (cuadros) {
    for (const t of cuadros) {
      const d = await p.evaluate(s => window.explainer.vistaPrevia(s), t);
      const destino = path.join(carpeta, `explainer-${String(t).replace(".", "_")}s.jpg`);
      await writeFile(destino, Buffer.from(d.split(",")[1], "base64"));
      console.log("  cuadro", destino);
    }
  } else {
    await rm(archivo, { force: true });
    const ini = Date.now();
    const r = await p.evaluate(() => window.explainer.grabar());
    console.log(`\nListo: ${archivo}\n  ${r.cuadros} cuadros · ${(r.bytes / 1e6).toFixed(1)} MB · ${r.codec} + ${r.audioCodec} · ${((Date.now() - ini) / 1000).toFixed(0)} s de render`);
  }
} finally { await nav.close(); servidor.close(); }
