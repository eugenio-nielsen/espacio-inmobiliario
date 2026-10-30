/*
 * Explainer de la home (1920x1080, MP4 con voz en off).
 *
 * Cada escena es una frase de la voz (vo/<id>.mp3) y una secuencia de capturas
 * del sitio real (capturas/<nombre>.png). La duración de cada escena sale del
 * audio: se mide cuándo empieza y cuándo termina de hablar la voz y la escena
 * dura eso más un respiro. Los subtítulos se encienden palabra por palabra con
 * los tiempos que devolvió ElevenLabs.
 *
 * Expone window.explainer = { preparar, vistaPrevia, grabar }.
 */

const W = 1920, H = 1080, FPS = 30;
// Para la web se baja con ?bitrate=2000000 (la pantalla casi no se mueve y comprime muy bien)
const BITRATE = Number(new URLSearchParams(location.search).get("bitrate")) || 8_000_000;
const NAVY = "#0A2038", NAVY2 = "#0E2C50", GOLD = "#B99F66", GOLD_L = "#D9C9A1", CREMA = "#F7F4EE";

// La ventana donde se ve el sitio
const VX = 210, VY = 70, VW = 1500, VH = 844, RAD = 18;
const ESCALA_CAP = VW / 1920;

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

let guion, escenas = [], total = 0, logo = null, bufferes = {};
const imagenes = {};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const suave = t => t * t * (3 - 2 * t);
const mezcla = (a, b, t) => a + (b - a) * t;

function cargarImagen(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

// ── Audio: cuándo empieza y termina de hablar ─────────────────

/** Primer y último instante con voz, por energía cada 10 ms (la alineación estira los finales). */
function medirVoz(buf) {
  const d = buf.getChannelData(0), paso = Math.round(buf.sampleRate * 0.01);
  const rms = [];
  for (let i = 0; i + paso <= d.length; i += paso) {
    let s = 0; for (let k = 0; k < paso; k++) s += d[i + k] * d[i + k];
    rms.push(Math.sqrt(s / paso));
  }
  const pico = Math.max(...rms), umbral = Math.max(0.01, pico * 0.06);
  const a = rms.findIndex(v => v > umbral);
  const b = rms.length - 1 - [...rms].reverse().findIndex(v => v > umbral);
  return { ini: Math.max(0, a * 0.01 - 0.03), fin: (b + 1) * 0.01 + 0.05 };
}

// ── Subtítulos ────────────────────────────────────────────────

/** Parte las palabras en tramos cortos, cortando después de coma o punto. */
function armarTramos(palabras) {
  const tramos = []; let cur = [];
  for (const w of palabras) {
    cur.push(w);
    const corta = /[.,:;?!]$/.test(w.p);
    if ((corta && cur.length >= 4) || cur.length >= 9) { tramos.push(cur); cur = []; }
  }
  if (cur.length) { if (tramos.length && cur.length < 3) tramos[tramos.length - 1].push(...cur); else tramos.push(cur); }
  return tramos;
}

// ── Preparación ───────────────────────────────────────────────

async function preparar() {
  guion = await (await fetch("/guion.json")).json();
  await Promise.all([
    '700 100px "Playfair Display"', '600 100px "Playfair Display"', 'italic 500 100px "Playfair Display"',
    '400 50px "Outfit"', '500 50px "Outfit"', '600 50px "Outfit"',
  ].map(f => document.fonts.load(f, "Espacio Inmobiliario ñ á é í ó ú ¿ ? · $ ° ©")));

  const ac = new AudioContext();
  let t = 0;
  for (let i = 0; i < guion.escenas.length; i++) {
    const e = guion.escenas[i];
    const datos = await (await fetch(`/vo/${e.id}.mp3`)).arrayBuffer();
    const buf = await ac.decodeAudioData(datos);
    bufferes[e.id] = buf;
    const voz = medirVoz(buf);
    const lead = i === 0 ? 0.7 : 0.35, cola = i === guion.escenas.length - 1 ? 2.6 : 0.6;
    const hablaDur = voz.fin - voz.ini;
    const esc = { ...e, voz, ini: t, lead, dur: lead + hablaDur + cola, hablaDur };
    // Palabras en tiempo de video: la primera cae donde empieza a sonar la voz
    const p0 = e.palabras[0].ini, pN = e.palabras.at(-1).fin;
    const k = hablaDur / Math.max(0.1, pN - p0);   // la voz medida manda sobre la alineación
    esc.palabras = e.palabras.map(w => ({ p: w.p, ini: t + lead + (w.ini - p0) * k, fin: t + lead + (w.fin - p0) * k }));
    esc.tramos = armarTramos(esc.palabras);
    escenas.push(esc);
    t += esc.dur;
  }
  total = t;

  // Planos: cada escena reparte su duración según el peso de cada captura
  for (const e of escenas) {
    const pesos = e.planos.reduce((a, p) => a + (p.peso ?? 1), 0);
    let x = e.ini;
    e.planos = e.planos.map(p => { const d = e.dur * (p.peso ?? 1) / pesos; const r = { ...p, ini: x, fin: x + d }; x += d; return r; });
    for (const p of e.planos) if (p.img && !(p.img in imagenes)) imagenes[p.img] = await cargarImagen(`/cap/${p.img}.png`);
  }
  logo = await cargarImagen("/logo.png");
  cuadro(0);
  return { duracion: +total.toFixed(1), escenas: escenas.map(e => `${e.id} ${e.ini.toFixed(1)}–${(e.ini + e.dur).toFixed(1)} s`), faltan: Object.entries(imagenes).filter(([, v]) => !v).map(([k]) => k) };
}

// ── Dibujo ────────────────────────────────────────────────────

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function fondo() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, NAVY); g.addColorStop(1, NAVY2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Un halo dorado muy tenue detrás de la ventana
  const r = ctx.createRadialGradient(W / 2, VY + VH / 2, 200, W / 2, VY + VH / 2, 1000);
  r.addColorStop(0, "rgba(185,159,102,.10)"); r.addColorStop(1, "rgba(185,159,102,0)");
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}

/** Región visible de la captura para un plano, en coordenadas de la captura. */
function vista(p, u) {
  const z = p.zoom || {};
  const de = z.de || [960, 540, 1], a = z.a || de;
  const e = suave(clamp(u, 0, 1));
  const s = mezcla(de[2], a[2], e);
  const vw = 1920 / s, vh = 1080 / s;
  const cx = clamp(mezcla(de[0], a[0], e), vw / 2, 1920 - vw / 2);
  const cy = clamp(mezcla(de[1], a[1], e), vh / 2, 1080 - vh / 2);
  return { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };
}

function placeholder(p, esc) {
  ctx.fillStyle = CREMA; ctx.fillRect(VX, VY, VW, VH);
  ctx.fillStyle = NAVY; ctx.font = '600 40px "Playfair Display"'; ctx.textAlign = "center";
  ctx.fillText(esc.titulo || esc.id, VX + VW / 2, VY + VH / 2 - 10);
  ctx.fillStyle = "#8C7641"; ctx.font = '500 22px "Outfit"';
  ctx.fillText(`captura pendiente: ${p.img}`, VX + VW / 2, VY + VH / 2 + 34);
  ctx.textAlign = "left";
}

function dibujarPlano(p, esc, t, alfa) {
  if (alfa <= 0) return;
  ctx.save();
  rr(VX, VY, VW, VH, RAD); ctx.clip();
  ctx.globalAlpha = alfa;
  const img = imagenes[p.img];
  const u = (t - p.ini) / (p.fin - p.ini);
  if (!img) placeholder(p, esc);
  else {
    const v = vista(p, u);
    ctx.drawImage(img, v.x, v.y, v.w, v.h, VX, VY, VW, VH);
  }
  // Cursor y clic
  if (img && p.cursor) {
    const v = vista(p, u), c = p.cursor;
    const m = suave(clamp((u - 0.05) / 0.55, 0, 1));
    const px = mezcla(c.de[0], c.a[0], m), py = mezcla(c.de[1], c.a[1], m);
    const sx = VX + (px - v.x) * (VW / v.w), sy = VY + (py - v.y) * (VH / v.h);
    if (c.clic) {
      const k = clamp((u - 0.62) / 0.25, 0, 1);
      if (k > 0 && k < 1) { ctx.strokeStyle = `rgba(185,159,102,${0.8 * (1 - k)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, 10 + 46 * k, 0, 7); ctx.stroke(); }
    }
    ctx.save(); ctx.translate(sx, sy); ctx.scale(1.5, 1.5);
    ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0A2038"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(7.5, 20); ctx.lineTo(10, 19); ctx.lineTo(7, 12); ctx.lineTo(13, 12); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

function ventana(t, esc) {
  // Sombra y borde de la ventana
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#fff"; rr(VX, VY, VW, VH, RAD); ctx.fill();
  ctx.restore();

  // Planos de esta escena y de la vecina, con fundido de 0,45 s
  const todos = escenas.flatMap(e => e.planos.map(p => ({ p, e })));
  const F = 0.45;
  const i = todos.findIndex(({ p }) => t >= p.ini && t < p.fin);
  const idx = i < 0 ? todos.length - 1 : i;
  const { p, e } = todos[idx];
  const antes = todos[idx - 1];
  const u = (t - p.ini) / F;
  // La escena de cierre no tiene captura: la ventana se queda con el último plano mientras entra la tarjeta
  if (!p.img && antes) { dibujarPlano(antes.p, antes.e, antes.p.fin - 0.001, 1); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; rr(VX, VY, VW, VH, RAD); ctx.stroke(); return; }
  if (antes && u < 1) dibujarPlano(antes.p, antes.e, Math.min(t, antes.p.fin - 0.001), 1);
  dibujarPlano(p, e, t, antes ? suave(clamp(u, 0, 1)) : 1);

  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; rr(VX, VY, VW, VH, RAD); ctx.stroke();
}

function chip(esc, t) {
  const n = escenas.indexOf(esc) + 1;
  const a = clamp((t - esc.ini) / 0.4, 0, 1);
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = '600 20px "Outfit"';
  const texto = (esc.titulo || "").toUpperCase();
  ctx.fillStyle = GOLD;
  ctx.fillText(String(n).padStart(2, "0"), VX, 46);
  ctx.fillStyle = "#fff"; ctx.letterSpacing = "3px";
  ctx.fillText(texto, VX + 44, 46);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

function progreso(t) {
  const x0 = VX, x1 = VX + VW;
  ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(x0, H - 14, x1 - x0, 3);
  ctx.fillStyle = GOLD; ctx.fillRect(x0, H - 14, (x1 - x0) * clamp(t / total, 0, 1), 3);
  // marcas de escena
  ctx.fillStyle = "rgba(255,255,255,.5)";
  for (const e of escenas.slice(1)) ctx.fillRect(x0 + (x1 - x0) * e.ini / total - 1, H - 17, 2, 9);
}

function subtitulo(t) {
  const esc = escenas.find(e => t >= e.ini && t < e.ini + e.dur) || escenas.at(-1);
  const tr = esc.tramos.find((tr, i) => t >= tr[0].ini - 0.15 && t < (esc.tramos[i + 1]?.[0].ini ?? esc.ini + esc.dur) - 0.02);
  if (!tr || t < tr[0].ini - 0.15) return;
  ctx.save();
  ctx.font = '500 44px "Outfit"';
  const esp = ctx.measureText(" ").width;
  const anchos = tr.map(w => ctx.measureText(w.p).width);
  const largo = anchos.reduce((a, b) => a + b, 0) + esp * (tr.length - 1);
  const x0 = (W - largo) / 2, y = 988;
  const a = clamp((t - (tr[0].ini - 0.15)) / 0.2, 0, 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(6,20,36,.72)"; rr(x0 - 34, y - 52, largo + 68, 74, 16); ctx.fill();
  let x = x0;
  tr.forEach((w, i) => {
    const hecho = t >= w.ini;
    ctx.fillStyle = hecho ? GOLD_L : "rgba(255,255,255,.55)";
    if (hecho && t < w.ini + 0.18) ctx.fillStyle = "#fff";
    ctx.fillText(w.p, x, y);
    x += anchos[i] + esp;
  });
  ctx.restore();
}

function cierre(t, esc) {
  const a = suave(clamp((t - esc.ini) / 0.8, 0, 1));
  ctx.fillStyle = NAVY; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, 450, 60, W / 2, 450, 760);
  g.addColorStop(0, "rgba(185,159,102,.20)"); g.addColorStop(1, "rgba(185,159,102,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (logo) {
    const lw = 220, lh = lw * logo.height / logo.width;
    ctx.fillStyle = CREMA; rr(W / 2 - lw / 2 - 16, 190 - 16, lw + 32, lh + 32, 18); ctx.fill();
    ctx.drawImage(logo, W / 2 - lw / 2, 190, lw, lh);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff"; ctx.font = '700 92px "Playfair Display"';
  ctx.fillText("Espacio Inmobiliario", W / 2, 560);
  ctx.fillStyle = GOLD_L; ctx.font = 'italic 500 48px "Playfair Display"';
  ctx.fillText("Del primer contacto a la escritura", W / 2, 640);
  const k = suave(clamp((t - esc.ini - 0.8) / 0.6, 0, 1));
  ctx.globalAlpha = a * k;
  ctx.fillStyle = GOLD; rr(W / 2 - 230, 720, 460, 84, 12); ctx.fill();
  ctx.fillStyle = NAVY; ctx.font = '600 30px "Outfit"'; ctx.letterSpacing = "3px";
  ctx.fillText("PUBLICÁ GRATIS", W / 2, 774);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = '400 30px "Outfit"';
  ctx.fillText("espacioinmobiliario.com.ar", W / 2, 880);
  ctx.textAlign = "left"; ctx.globalAlpha = 1;
}

function cuadro(t) {
  ctx.globalAlpha = 1;
  fondo();
  const esc = escenas.find(e => t >= e.ini && t < e.ini + e.dur) || escenas.at(-1);
  const final = esc.id === "cierre";
  if (!final || t < esc.ini + 0.8) { ventana(t, esc); chip(esc, t); }
  if (final) cierre(t, esc);
  progreso(t);
  subtitulo(t);
}

// ── Salida ────────────────────────────────────────────────────

function vistaPrevia(t) { cuadro(t); return lienzo.toDataURL("image/jpeg", 0.9); }

async function elegirCodec() {
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.420028"]) {
    const { supported } = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: BITRATE, framerate: FPS });
    if (supported) return codec;
  }
  throw new Error("Este Chrome no puede codificar H.264 a 1920x1080.");
}

/** La voz de cada escena, puesta en su lugar, en una sola pista estéreo. */
async function mezclarAudio() {
  const SR = 44100;
  const off = new OfflineAudioContext(2, Math.ceil(total * SR), SR);
  for (const e of escenas) {
    const s = off.createBufferSource(); s.buffer = bufferes[e.id];
    const g = off.createGain(); g.gain.value = 1;
    s.connect(g).connect(off.destination);
    s.start(Math.max(0, e.ini + e.lead - e.voz.ini));   // la voz empieza a sonar en `lead`
  }
  return off.startRendering();
}

function aBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function grabar() {
  const codec = await elegirCodec();
  const SR = 44100;
  let audioCodec = "aac", audioCfg = { codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 160_000 };
  if (!(await AudioEncoder.isConfigSupported(audioCfg)).supported) { audioCodec = "opus"; audioCfg = { codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 }; }

  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H, frameRate: FPS },
    audio: { codec: audioCodec, numberOfChannels: 2, sampleRate: audioCfg.sampleRate },
    fastStart: "in-memory",
  });

  // Audio
  let falla = null;
  const pista = await mezclarAudio();
  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { falla = e; } });
  ae.configure(audioCfg);
  const L = pista.getChannelData(0), R = pista.getChannelData(1), BLOQUE = 4096;
  for (let i = 0; i < L.length; i += BLOQUE) {
    const n = Math.min(BLOQUE, L.length - i);
    const plano = new Float32Array(n * 2); plano.set(L.subarray(i, i + n), 0); plano.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / SR * 1e6), data: plano });
    ae.encode(ad); ad.close();
    while (ae.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 2));
  }
  await ae.flush();
  if (falla) throw falla;

  // Video
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { falla = e; } });
  ve.configure({ codec, width: W, height: H, bitrate: BITRATE, framerate: FPS, latencyMode: "quality" });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    cuadro(i / FPS);
    const vf = new VideoFrame(lienzo, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(vf, { keyFrame: i % FPS === 0 });
    vf.close();
    while (ve.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 4));
    if (falla) throw falla;
    if (i % FPS === 0) await window.promoAvance(i / n);
  }
  await ve.flush();
  if (falla) throw falla;
  muxer.finalize();

  const bytes = new Uint8Array(muxer.target.buffer);
  const TROZO = 3 * 1024 * 1024;
  for (let i = 0; i < bytes.length; i += TROZO) await window.promoTrozo(aBase64(bytes.subarray(i, i + TROZO)));
  return { codec, audioCodec, cuadros: n, bytes: bytes.length };
}

window.explainer = { preparar, vistaPrevia, grabar };
