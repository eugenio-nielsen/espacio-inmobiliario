/*
 * Arma el MP4 vertical del video de la familia.
 *
 *   node higgsfield/render.mjs                    → salida/familia.mp4
 *   node higgsfield/render.mjs --cuadros 3,20,40  → solo esos segundos, como JPG en salida/
 *
 * Necesita vo/ (node higgsfield/generar-vo.mjs), clips/c1..c8.mp4 (bajados de Higgsfield)
 * y capturas/movil-*.png (node higgsfield/capturar-movil.mjs). Un clip que falte se
 * dibuja como "clip pendiente", para poder revisar el ritmo.
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

const guion = JSON.parse(await readFile(path.join(AQUI, "guion.json"), "utf8"));
const planos = JSON.parse(await readFile(path.join(AQUI, "planos.json"), "utf8"));
const vo = JSON.parse(await readFile(path.join(AQUI, "vo", "vo.json"), "utf8"));
guion.cierreExtra = planos.cierreExtra;
guion.escenas = guion.escenas.map(e => ({ ...e, planos: planos.escenas[e.id], palabras: vo.escenas[e.id].palabras }));

const ARCHIVOS = {
  "/": [path.join(AQUI, "montaje.html"), "text/html; charset=utf-8"],
  "/montaje.js": [path.join(AQUI, "montaje.js"), "text/javascript; charset=utf-8"],
  "/mp4-muxer.js": [path.join(PROMO, "node_modules", "mp4-muxer", "build", "mp4-muxer.js"), "text/javascript; charset=utf-8"],
  "/logo.png": [path.join(PROMO, "..", "public", "logo.png"), "image/png"],
};
const servidor = http.createServer(async (req, res) => {
  try {
    const ruta = new URL(req.url, "http://local").pathname;
    const enviar = (c, t) => { res.writeHead(200, { "content-type": t, "cache-control": "no-store" }); res.end(c); };
    if (ruta === "/guion.json") return enviar(JSON.stringify(guion), "application/json; charset=utf-8");
    if (ARCHIVOS[ruta]) return enviar(await readFile(ARCHIVOS[ruta][0]), ARCHIVOS[ruta][1]);
    let m;
    if ((m = ruta.match(/^\/vo\/([a-z0-9]+)\.mp3$/))) return enviar(await readFile(path.join(AQUI, "vo", `${m[1]}.mp3`)), "audio/mpeg");
    if ((m = ruta.match(/^\/clip\/([a-z0-9]+)\.mp4$/)) && existsSync(path.join(AQUI, "clips", `${m[1]}.mp4`))) return enviar(await readFile(path.join(AQUI, "clips", `${m[1]}.mp4`)), "video/mp4");
    if ((m = ruta.match(/^\/cap\/([a-z0-9-]+)\.png$/)) && existsSync(path.join(AQUI, "capturas", `${m[1]}.png`))) return enviar(await readFile(path.join(AQUI, "capturas", `${m[1]}.png`)), "image/png");
    res.writeHead(404).end();
  } catch (e) { console.error(e.message); res.writeHead(500).end(); }
});
await new Promise(ok => servidor.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${servidor.address().port}`;

const carpeta = path.join(PROMO, "salida");
await mkdir(carpeta, { recursive: true });
const archivo = path.join(carpeta, "familia.mp4");

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 40 * 60 * 1000, args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
try {
  const p = await nav.newPage();
  p.on("pageerror", e => console.error("Error en la página:", e.message));
  p.on("console", m => { if (m.type() === "error" && !/404/.test(m.text())) console.error("  [página]", m.text()); });
  await p.exposeFunction("promoTrozo", b64 => appendFile(archivo, Buffer.from(b64, "base64")));
  await p.exposeFunction("promoAvance", x => { process.stdout.write(`\r  codificando… ${Math.round(x * 100)}%  `); });
  await p.goto(base + "/", { waitUntil: "networkidle0" });
  const listo = await p.evaluate(() => window.montaje.preparar());
  console.log(`Montaje: ${listo.duracion} s`);
  console.log("  " + listo.escenas.join(" · "));
  if (listo.faltan.length) console.log(`  clips pendientes: ${listo.faltan.join(", ")}`);
  if (opciones.includes("--audio")) {
    const b64 = await p.evaluate(() => window.montaje.audioWav());
    const destino = path.join(carpeta, "familia-audio.wav");
    await writeFile(destino, Buffer.from(b64, "base64"));
    console.log("  audio", destino);
  } else if (cuadros) {
    for (const t of cuadros) {
      const d = await p.evaluate(s => window.montaje.vistaPrevia(s), t);
      const destino = path.join(carpeta, `familia-${String(t).replace(".", "_")}s.jpg`);
      await writeFile(destino, Buffer.from(d.split(",")[1], "base64"));
      console.log("  cuadro", destino);
    }
  } else {
    await rm(archivo, { force: true });
    const ini = Date.now();
    const r = await p.evaluate(() => window.montaje.grabar());
    console.log(`\nListo: ${archivo}\n  ${r.cuadros} cuadros · ${(r.bytes / 1e6).toFixed(1)} MB · ${r.codec} + ${r.audioCodec} · ${((Date.now() - ini) / 1000).toFixed(0)} s de render`);
  }
} finally { await nav.close(); servidor.close(); }
