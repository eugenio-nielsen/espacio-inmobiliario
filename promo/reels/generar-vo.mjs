/*
 * Voz en off de un reel con ElevenLabs (voz Melanie, colección "Claude").
 *
 *   node reels/generar-vo.mjs <reel>            → vo/<reel>/<escena>.mp3 + vo/<reel>/vo.json
 *   node reels/generar-vo.mjs <reel> <escena>   → regenera solo esa escena
 *
 * Los textos salen de guiones/<reel>.json. La clave está en ../../.env.local (solo local).
 * Cada escena se pide con la anterior y la siguiente como contexto, para una sola lectura.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const [reel, solo] = process.argv.slice(2);
if (!reel) { console.error("Uso: node reels/generar-vo.mjs <reel> [escena]"); process.exit(1); }
const env = Object.fromEntries(readFileSync(path.join(AQUI, "..", "..", ".env.local"), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const KEY = env.ELEVEN_LABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Falta ELEVEN_LABS_API_KEY en .env.local."); process.exit(1); }

const guion = JSON.parse(readFileSync(path.join(AQUI, "guiones", `${reel}.json`), "utf8"));
const OUT = path.join(AQUI, "vo", reel); mkdirSync(OUT, { recursive: true });
const prev = existsSync(path.join(OUT, "vo.json")) ? JSON.parse(readFileSync(path.join(OUT, "vo.json"), "utf8")) : { escenas: {} };
const ajustes = { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 1.0 };
const habladas = guion.escenas.filter(e => e.texto);

for (let i = 0; i < habladas.length; i++) {
  const e = habladas[i];
  if (solo && solo !== e.id) continue;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${guion.voz}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text: e.texto, model_id: "eleven_multilingual_v2", voice_settings: ajustes, previous_text: habladas[i - 1]?.texto, next_text: habladas[i + 1]?.texto }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error(`${e.id}: ${r.status} ${JSON.stringify(j.detail || j).slice(0, 300)}`); process.exit(1); }
  writeFileSync(path.join(OUT, `${e.id}.mp3`), Buffer.from(j.audio_base64, "base64"));
  const al = j.alignment, palabras = []; let ini = null, buf = "";
  al.characters.forEach((c, k) => {
    if (c.trim()) { if (ini === null) ini = al.character_start_times_seconds[k]; buf += c; }
    if ((!c.trim() || k === al.characters.length - 1) && buf) {
      palabras.push({ p: buf, ini: +ini.toFixed(3), fin: +al.character_end_times_seconds[k - (c.trim() ? 0 : 1)].toFixed(3) });
      ini = null; buf = "";
    }
  });
  prev.escenas[e.id] = { texto: e.texto, palabras };
  console.log(`${e.id}: ${palabras.at(-1).fin.toFixed(1)} s`);
}
prev.voz = guion.voz;
writeFileSync(path.join(OUT, "vo.json"), JSON.stringify(prev, null, 1));
console.log(`listo: vo/${reel}/vo.json`);
