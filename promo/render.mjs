/*
 * Genera el video promocional de una propiedad.
 *
 *   node render.mjs <id>                    → salida/<id>.mp4
 *   node render.mjs <id> --cuadros 1,5,15   → solo esos segundos, como JPG
 *
 * <id> es el nombre de un guion en guiones/<id>.json (el borrador de un
 * guion nuevo lo arma `node nuevo.mjs <id>`).
 *
 * Levanta un servidor local que le sirve a Chrome la página (video.html),
 * el guion, el logo del sitio, las fotos de la propiedad, los íconos y los
 * tiles del mapa (los baja y los reenvía, así el canvas los puede leer).
 * Chrome dibuja y codifica; acá solo se escribe el archivo. Usa el Chrome
 * instalado en la máquina.
 */
import http from "node:http";
import { readFile, writeFile, appendFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

const [entrada, ...opciones] = process.argv.slice(2);
if (!entrada) {
  console.error("Uso: node render.mjs <id> [--cuadros 1,5,15]");
  process.exit(1);
}
const iCuadros = opciones.indexOf("--cuadros");
const cuadros = iCuadros >= 0 ? opciones[iCuadros + 1].split(",").map(Number) : null;

// <id> es el nombre de un guion en guiones/; también vale la ruta a un .json
const archivoGuion = entrada.endsWith(".json") ? path.resolve(entrada) : path.join(AQUI, "guiones", `${entrada}.json`);
const id = path.basename(archivoGuion, ".json");
if (!existsSync(archivoGuion)) {
  console.error(`No existe el guion ${archivoGuion}. Para armar un borrador: node nuevo.mjs ${id}`);
  process.exit(1);
}
const guion = JSON.parse(await readFile(archivoGuion, "utf8"));

const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(p => p && existsSync(p));
if (!CHROME) {
  console.error("No encontré Chrome ni Edge. Indicá la ruta en la variable CHROME_PATH.");
  process.exit(1);
}

// ── Servidor local ───────────────────────────────────────────

// Un guion con "tipo": "herramienta" usa su propio motor (herramienta.js):
// cuenta cómo se usa una herramienta del sitio, no una propiedad.
const esHerramienta = guion.tipo === "herramienta";
const PAGINA = esHerramienta ? "herramienta.html" : "video.html";

const ARCHIVOS = {
  "/video.html": [path.join(AQUI, "video.html"), "text/html; charset=utf-8"],
  "/video.js": [path.join(AQUI, "video.js"), "text/javascript; charset=utf-8"],
  "/herramienta.html": [path.join(AQUI, "herramienta.html"), "text/html; charset=utf-8"],
  "/herramienta.js": [path.join(AQUI, "herramienta.js"), "text/javascript; charset=utf-8"],
  "/mp4-muxer.js": [path.join(AQUI, "node_modules", "mp4-muxer", "build", "mp4-muxer.js"), "text/javascript; charset=utf-8"],
  "/logo.png": [path.join(AQUI, "..", "public", "logo.png"), "image/png"],
};

const fotos = new Map();

// Mapa: los mismos tiles de OpenStreetMap que usa el sitio. Se guardan en
// disco (cache/tiles) para no pedir dos veces lo mismo, y se piden de a
// pocos con un User-Agent que dice quiénes somos, como pide su política.
const TILES = path.join(AQUI, "cache", "tiles");
const AGENTE = "EspacioInmobiliario-VideoPromo/1.0 (+https://www.espacioinmobiliario.com.ar)";
const enCurso = new Map();

async function leerTile(z, x, y) {
  const archivo = path.join(TILES, String(z), String(x), `${y}.png`);
  if (existsSync(archivo)) return readFile(archivo);
  const clave = `${z}/${x}/${y}`;
  if (!enCurso.has(clave)) {
    enCurso.set(clave, (async () => {
      const r = await fetch(`https://tile.openstreetmap.org/${clave}.png`, { headers: { "user-agent": AGENTE } });
      if (!r.ok) throw new Error(`tile ${clave}: ${r.status}`);
      const cuerpo = Buffer.from(await r.arrayBuffer());
      await mkdir(path.dirname(archivo), { recursive: true });
      await writeFile(archivo, cuerpo);
      return cuerpo;
    })().finally(() => enCurso.delete(clave)));
  }
  return enCurso.get(clave);
}

/** Solo las fotos que figuran en el guion, pedidas por su posición. */
async function leerFoto(i) {
  const url = guion.fotos?.[i];
  if (!url) return null;
  if (!fotos.has(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`No pude bajar la foto ${i}: ${r.status}`);
    fotos.set(url, { cuerpo: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type") || "image/jpeg" });
  }
  return fotos.get(url);
}

const servidor = http.createServer(async (req, res) => {
  try {
    const ruta = new URL(req.url, "http://local").pathname;
    const enviar = (cuerpo, tipo) => { res.writeHead(200, { "content-type": tipo, "cache-control": "no-store" }); res.end(cuerpo); };

    if (ruta === "/favicon.ico") return void res.writeHead(204).end();
    if (ruta === "/guion.json") return enviar(JSON.stringify(guion), "application/json; charset=utf-8");
    if (ARCHIVOS[ruta]) return enviar(await readFile(ARCHIVOS[ruta][0]), ARCHIVOS[ruta][1]);

    const m = ruta.match(/^\/foto\/(\d+)$/);
    const f = m && (await leerFoto(Number(m[1])));
    if (f) return enviar(f.cuerpo, f.tipo);

    // Íconos de Lucide, los mismos del sitio
    const ic = ruta.match(/^\/icono\/([a-z0-9-]+)\.svg$/);
    if (ic) return enviar(await readFile(path.join(AQUI, "node_modules", "lucide-static", "icons", `${ic[1]}.svg`)), "image/svg+xml");

    const ti = ruta.match(/^\/tile\/(\d+)\/(\d+)\/(\d+)\.png$/);
    if (ti) return enviar(await leerTile(...ti.slice(1).map(Number)), "image/png");

    res.writeHead(404).end();
  } catch (e) {
    console.error(e.message);
    res.writeHead(500).end();
  }
});
await new Promise(listo => servidor.listen(0, "127.0.0.1", listo));
const base = `http://127.0.0.1:${servidor.address().port}`;

// ── Chrome ───────────────────────────────────────────────────

const carpeta = path.join(AQUI, "salida");
await mkdir(carpeta, { recursive: true });
const archivo = path.join(carpeta, `${id}.mp4`);

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 15 * 60 * 1000,
  args: ["--mute-audio", "--hide-scrollbars"],
});

try {
  const pagina = await navegador.newPage();
  pagina.on("pageerror", e => console.error("Error en la página:", e.message));
  pagina.on("console", m => { if (m.type() === "error") console.error("  [página]", m.text()); });

  await pagina.exposeFunction("promoTrozo", b64 => appendFile(archivo, Buffer.from(b64, "base64")));
  await pagina.exposeFunction("promoAvance", p => { process.stdout.write(`\r  codificando… ${Math.round(p * 100)}%  `); });

  await pagina.goto(`${base}/${PAGINA}`, { waitUntil: "networkidle0" });
  const listo = await pagina.evaluate(() => window.promo.preparar());
  console.log(`Guion "${id}": ${esHerramienta ? "herramienta" : `${listo.fotos} fotos`}, ${listo.duracion} s.`);
  console.log(`  ${listo.tramos.join(" · ")}`);

  if (cuadros) {
    for (const t of cuadros) {
      const dato = await pagina.evaluate(seg => window.promo.vistaPrevia(seg), t);
      const destino = path.join(carpeta, `${id}-${String(t).replace(".", "_")}s.jpg`);
      await writeFile(destino, Buffer.from(dato.split(",")[1], "base64"));
      console.log("  cuadro", destino);
    }
  } else {
    await rm(archivo, { force: true });
    const inicio = Date.now();
    const r = await pagina.evaluate(() => window.promo.grabar());
    console.log(`\nListo: ${archivo}`);
    console.log(`  ${r.cuadros} cuadros · ${(r.bytes / 1e6).toFixed(1)} MB · ${r.codec} · ${((Date.now() - inicio) / 1000).toFixed(0)} s de render`);
  }
} finally {
  await navegador.close();
  servidor.close();
}
