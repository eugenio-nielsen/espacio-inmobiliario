/*
 * Voz en off del explainer con ElevenLabs.
 *
 *   node explainer/generar-vo.mjs            → vo/<id>.mp3 por escena + vo/vo.json
 *   node explainer/generar-vo.mjs <id>       → regenera solo esa escena
 *
 * Lee los textos de guion.json y la clave de ../../.env.local (ELEVEN_LABS_API_KEY,
 * solo local: nunca va a Vercel ni a git). Cada escena se pide con la anterior y la
 * siguiente como contexto para que la entonación sea la de una sola lectura.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(readFileSync(path.join(AQUI, "..", "..", ".env.local"), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const KEY = env.ELEVEN_LABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Falta ELEVEN_LABS_API_KEY en .env.local."); process.exit(1); }

const guion = JSON.parse(readFileSync(path.join(AQUI, "guion.json"), "utf8"));
const OUT = path.join(AQUI, "vo");
mkdirSync(OUT, { recursive: true });
const solo = process.argv[2];
const prev = existsSync(path.join(OUT, "vo.json")) ? JSON.parse(readFileSync(path.join(OUT, "vo.json"), "utf8")) : { escenas: {} };

// Valeria: rioplatense, cálida. Un poco menos enérgica que en el anuncio: acá explica.
const ajustes = { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 1.0 };

for (let i = 0; i < guion.escenas.length; i++) {
  const e = guion.escenas[i];
  if (solo && solo !== e.id) continue;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${guion.voz}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: e.texto, model_id: "eleven_multilingual_v2", voice_settings: ajustes,
      previous_text: guion.escenas[i - 1]?.texto, next_text: guion.escenas[i + 1]?.texto,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error(`${e.id}: ${r.status} ${JSON.stringify(j.detail || j).slice(0, 300)}`); process.exit(1); }
  writeFileSync(path.join(OUT, `${e.id}.mp3`), Buffer.from(j.audio_base64, "base64"));
  const al = j.alignment;
  // Cuándo empieza cada palabra, para encender los subtítulos en sincronía
  const palabras = [];
  let ini = null, buf = "";
  al.characters.forEach((c, k) => {
    if (c.trim()) { if (ini === null) ini = al.character_start_times_seconds[k]; buf += c; }
    if ((!c.trim() || k === al.characters.length - 1) && buf) {
      palabras.push({ p: buf, ini: +ini.toFixed(3), fin: +al.character_end_times_seconds[k - (c.trim() ? 0 : 1)].toFixed(3) });
      ini = null; buf = "";
    }
  });
  prev.escenas[e.id] = { archivo: `vo/${e.id}.mp3`, texto: e.texto, palabras };
  console.log(`${e.id}: ${palabras.at(-1).fin.toFixed(1)} s`);
}
prev.voz = guion.voz; prev.ajustes = ajustes;
writeFileSync(path.join(OUT, "vo.json"), JSON.stringify(prev, null, 1));
console.log("listo: vo/vo.json");
