// Hoja de contacto de capturas para revisarlas de un vistazo: node reels/hoja.mjs prefijo ...
import puppeteer from "puppeteer-core";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const pref = process.argv.slice(2);
const arch = readdirSync(path.join(AQUI, "capturas")).filter(f => pref.some(p => f.startsWith(p)));
const html = `<body style="margin:0;background:#222;display:flex;gap:8px;padding:8px">${arch.map(f => `<div><img src="data:image/png;base64,${readFileSync(path.join(AQUI, "capturas", f)).toString("base64")}" height="700"><div style="color:#fff;font:12px sans-serif">${f}</div></div>`).join("")}</body>`;
const nav = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, defaultViewport: { width: arch.length * 340 + 20, height: 740 } });
const pg = await nav.newPage(); await pg.setContent(html); await pg.screenshot({ path: path.join(AQUI, "..", "salida", "hoja.png") }); await nav.close();
