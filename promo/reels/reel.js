/*
 * Motor de los reels (1080x1920, 9:16, MP4 con voz y música). Un guion = un reel.
 *
 * Cada escena es una frase de la voz (vo/<reel>/<escena>.mp3) con un visual:
 *   · "gancho": kicker + título grande (las partes entre *asteriscos* van en cursiva dorada)
 *   · "movil":  el sitio real dentro de un celular (capturas/<nombre>.png, se cruzan en orden)
 *   · "punto":  un punto numerado de una lista ("1 de 3") con su título
 *   · "cierre": logo, frase final y dirección del sitio
 * La duración de cada escena sale de la voz medida; una escena sin "texto" dura `dur` segundos.
 * La música es sintética (piano y cuerdas suaves, sin licencia de terceros).
 *
 * Expone window.reel = { preparar, vistaPrevia, grabar }.
 */
const W = 1080, H = 1920, FPS = 30;
const NAVY = "#0A2038", NAVY_D = "#06152A", GOLD = "#B99F66", GOLD_L = "#D9C9A1", CREMA = "#F7F4EE";
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const BITRATE = +(new URLSearchParams(location.search).get("bitrate")) || 6_000_000;

let guion, escenas = [], total = 0, logo = null;
const imagenes = {}, buffers = {};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const suave = t => t * t * (3 - 2 * t);
const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const cargarImagen = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function medirVoz(buf) {
  const d = buf.getChannelData(0), paso = Math.round(buf.sampleRate * 0.01), rms = [];
  for (let i = 0; i + paso <= d.length; i += paso) { let s = 0; for (let k = 0; k < paso; k++) s += d[i + k] * d[i + k]; rms.push(Math.sqrt(s / paso)); }
  const umbral = Math.max(0.01, Math.max(...rms) * 0.06);
  const a = rms.findIndex(v => v > umbral);
  const b = rms.length - 1 - [...rms].reverse().findIndex(v => v > umbral);
  return { ini: Math.max(0, a * 0.01 - 0.03), fin: (b + 1) * 0.01 + 0.05 };
}

function armarTramos(palabras) {
  const tramos = []; let cur = [];
  for (const w of palabras) {
    cur.push(w);
    const corta = /[.,:;?!…]$/.test(w.p);
    if ((corta && cur.length >= 3) || cur.length >= 5) { tramos.push(cur); cur = []; }
  }
  if (cur.length) { if (tramos.length && cur.length < 3) tramos[tramos.length - 1].push(...cur); else tramos.push(cur); }
  return tramos;
}

async function preparar() {
  guion = await (await fetch("/guion.json")).json();
  await Promise.all([
    '700 100px "Playfair Display"', '600 100px "Playfair Display"', 'italic 500 100px "Playfair Display"',
    '400 50px "Outfit"', '500 50px "Outfit"', '600 50px "Outfit"',
  ].map(f => document.fonts.load(f, "Espacio Inmobiliario ñ á é í ó ú ¿ ? · ¡ … ©")));

  const ac = new AudioContext();
  let t = 0;
  for (let i = 0; i < guion.escenas.length; i++) {
    const e = guion.escenas[i], ultima = i === guion.escenas.length - 1;
    let esc;
    if (e.texto) {
      const buf = await ac.decodeAudioData(await (await fetch(`/vo/${e.id}.mp3`)).arrayBuffer());
      buffers[e.id] = buf;
      const voz = medirVoz(buf), lead = i === 0 ? 0.8 : 0.35, hablaDur = voz.fin - voz.ini;
      const dur = lead + hablaDur + (ultima ? 2.2 : 0.45);
      const p0 = e.palabras[0].ini, pN = e.palabras.at(-1).fin, k = hablaDur / Math.max(0.1, pN - p0);
      const palabras = e.palabras.map(w => ({ p: w.p, ini: t + lead + (w.ini - p0) * k, fin: t + lead + (w.fin - p0) * k }));
      esc = { ...e, voz, ini: t, lead, hablaDur, dur, palabras, tramos: armarTramos(palabras) };
    } else {
      esc = { ...e, ini: t, lead: 0, hablaDur: 0, dur: e.dur ?? 2.5, tramos: [] };
    }
    escenas.push(esc); t += esc.dur;
  }
  total = t;
  for (const e of escenas) if (e.visual.tipo === "movil") for (const n of e.visual.imagenes) if (!(n in imagenes)) imagenes[n] = await cargarImagen(`/cap/${n}.png`);
  logo = await cargarImagen("/logo.png");
  await cuadro(0);
  return {
    duracion: +total.toFixed(1),
    escenas: escenas.map(e => `${e.id} ${e.ini.toFixed(1)}–${(e.ini + e.dur).toFixed(1)} s`),
    faltan: Object.entries(imagenes).filter(([, v]) => !v).map(([k]) => k),
  };
}

// ── Fondo y marca ─────────────────────────────────────────────

function fondo(alfa = 1) {
  ctx.globalAlpha = alfa;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, NAVY); g.addColorStop(1, NAVY_D);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W / 2, 780, 60, W / 2, 780, 980);
  r.addColorStop(0, "rgba(185,159,102,.20)"); r.addColorStop(1, "rgba(185,159,102,0)");
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

function marca(alfa) {
  ctx.save(); ctx.globalAlpha = alfa * 0.8; ctx.textAlign = "center";
  ctx.fillStyle = GOLD_L; ctx.font = '500 25px "Outfit"'; ctx.letterSpacing = "7px";
  ctx.fillText("ESPACIO INMOBILIARIO", W / 2, 170);
  ctx.letterSpacing = "0px"; ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 40, 196, 80, 2);
  ctx.restore();
}

/** Línea con partes *en cursiva dorada*, centrada en x. */
function lineaMixta(texto, x, y, tam, color, alfa) {
  const partes = texto.split("*").map((s, i) => ({ s, em: i % 2 === 1 })).filter(p => p.s);
  const fuente = em => em ? `italic 500 ${tam}px "Playfair Display"` : `700 ${tam}px "Playfair Display"`;
  const medir = () => { let a = 0; for (const p of partes) { ctx.font = fuente(p.em); p.w = ctx.measureText(p.s).width; a += p.w; } return a; };
  let ancho = medir();
  if (ancho > 900) { tam = Math.floor(tam * 900 / ancho); ancho = medir(); }   // que no toque los bordes
  let cx = x - ancho / 2; ctx.globalAlpha = alfa; ctx.textAlign = "left";
  for (const p of partes) { ctx.font = fuente(p.em); ctx.fillStyle = p.em ? GOLD_L : color; ctx.fillText(p.s, cx, y); cx += p.w; }
}

// ── Visuales ──────────────────────────────────────────────────

function dibujarGancho(e, t, alfa) {
  const v = e.visual, u = t - e.ini;
  fondo(alfa); marca(alfa);
  ctx.save(); ctx.textAlign = "center";
  ctx.globalAlpha = alfa * suave(clamp(u / 0.6, 0, 1));
  ctx.fillStyle = GOLD; ctx.font = '600 30px "Outfit"'; ctx.letterSpacing = "9px";
  ctx.fillText(v.kicker.toUpperCase(), W / 2, 640);
  ctx.letterSpacing = "0px";
  v.titulo.forEach((ln, i) => {
    const a = suave(clamp((u - 0.25 - i * 0.28) / 0.7, 0, 1));
    ctx.save(); lineaMixta(ln, W / 2, 790 + i * 130 + (1 - a) * 36, 112, "#fff", alfa * a); ctx.restore();
  });
  const a = suave(clamp((u - 1.0) / 0.8, 0, 1));
  ctx.globalAlpha = alfa * a; ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 60, 790 + v.titulo.length * 130 + 20, 120 * a, 3);
  ctx.restore();
}

function dibujarPunto(e, t, alfa) {
  const v = e.visual, u = t - e.ini;
  fondo(alfa); marca(alfa);
  ctx.save(); ctx.textAlign = "center";
  const a = suave(clamp(u / 0.55, 0, 1)), y = (1 - a) * 40;
  ctx.globalAlpha = alfa * a;
  ctx.fillStyle = GOLD; ctx.font = 'italic 500 330px "Playfair Display"';
  ctx.fillText(String(v.n), W / 2, 790 + y);
  const lineas = v.titulo.split("|");
  lineas.forEach((ln, i) => lineaMixta(ln, W / 2, 960 + i * 100 + y, 80, "#fff", alfa * a));
  const base = 960 + lineas.length * 100 + 60;
  for (let k = 0; k < v.de; k++) {
    ctx.globalAlpha = alfa * a * (k < v.n ? 1 : 0.28);
    ctx.fillStyle = k < v.n ? GOLD : "#fff"; ctx.fillRect(W / 2 - v.de * 50 + k * 100 + 8, base, 84, 5);
  }
  ctx.restore();
}

function dibujarMovil(e, t, alfa) {
  const v = e.visual, u = clamp((t - e.ini) / e.dur, 0, 1);
  fondo(alfa); marca(alfa);
  if (v.etiqueta) {
    ctx.save(); ctx.globalAlpha = alfa * suave(clamp((t - e.ini) / 0.5, 0, 1)); ctx.textAlign = "center";
    ctx.fillStyle = GOLD; ctx.font = '600 30px "Outfit"'; ctx.letterSpacing = "8px";
    ctx.fillText(v.etiqueta.toUpperCase(), W / 2, 275); ctx.restore();
  }
  const subida = suave(clamp(u * 4, 0, 1));
  const pw = 520, ph = 1090, px = (W - pw) / 2, py = 330 + (1 - subida) * 70;
  ctx.save(); ctx.globalAlpha = alfa * (0.4 + 0.6 * subida);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 70; ctx.shadowOffsetY = 40;
  ctx.fillStyle = "#14110e"; rr(px, py, pw, ph, 66); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = alfa * (0.4 + 0.6 * subida);
  ctx.strokeStyle = "rgba(185,159,102,.55)"; ctx.lineWidth = 2; rr(px, py, pw, ph, 66); ctx.stroke(); ctx.restore();
  const sx = px + 16, sy = py + 16, sw = pw - 32, sh = ph - 32;
  ctx.save(); rr(sx, sy, sw, sh, 52); ctx.clip();
  ctx.globalAlpha = alfa; ctx.fillStyle = "#fff"; ctx.fillRect(sx, sy, sw, sh);
  const n = v.imagenes.length, tramo = 1 / n, i = Math.min(n - 1, Math.floor(u * n));
  const dibuja = (k, a) => {
    const img = imagenes[v.imagenes[k]]; if (!img) return;
    const local = clamp((u - k * tramo) / tramo, 0, 1), escala = sw / img.width, alto = img.height * escala;
    ctx.globalAlpha = alfa * a; ctx.drawImage(img, sx, sy - Math.max(0, alto - sh) * suave(local) * 0.45, sw, alto);
  };
  if (i > 0) dibuja(i - 1, 1);
  dibuja(i, i === 0 ? 1 : suave(clamp((u - i * tramo) / 0.08, 0, 1)));
  ctx.restore();
  ctx.globalAlpha = alfa; ctx.fillStyle = "#14110e"; rr(W / 2 - 64, sy + 12, 128, 30, 15); ctx.fill(); ctx.globalAlpha = 1;
}

function dibujarCierre(e, t, alfa) {
  const v = e.visual, u = t - e.ini;
  fondo(alfa);
  ctx.save(); ctx.textAlign = "center";
  if (logo) {
    const lw = 260, lh = lw * logo.height / logo.width, a = suave(clamp(u / 0.8, 0, 1));
    ctx.globalAlpha = alfa * a; ctx.fillStyle = CREMA; rr(W / 2 - lw / 2 - 20, 520 - 20, lw + 40, lh + 40, 22); ctx.fill();
    ctx.drawImage(logo, W / 2 - lw / 2, 520, lw, lh);
  }
  v.frase.forEach((ln, i) => {
    const a = suave(clamp((u - 0.4 - i * 0.25) / 0.8, 0, 1));
    lineaMixta(ln, W / 2, 940 + i * 100 + (1 - a) * 24, 78, "#fff", alfa * a);
  });
  const a = suave(clamp((u - 1.3) / 0.8, 0, 1));
  ctx.textAlign = "center";
  ctx.globalAlpha = alfa * a; ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 60, 1190, 120, 2);
  ctx.fillStyle = GOLD_L; ctx.font = '500 40px "Outfit"'; ctx.letterSpacing = "2px";
  ctx.fillText(v.url, W / 2, 1270); ctx.letterSpacing = "0px";
  if (v.aviso) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = '400 28px "Outfit"'; ctx.fillText(v.aviso, W / 2, 1380); }
  ctx.restore();
}

function plano(e, t, alfa) {
  const f = { gancho: dibujarGancho, punto: dibujarPunto, movil: dibujarMovil, cierre: dibujarCierre }[e.visual.tipo];
  f(e, t, alfa);
}

function subtitulo(t) {
  const esc = escenas.find(e => t >= e.ini && t < e.ini + e.dur) || escenas.at(-1);
  if (!esc.tramos.length) return;
  const i = esc.tramos.findIndex((tr, k) => t >= tr[0].ini - 0.12 && t < (esc.tramos[k + 1]?.[0].ini ?? tr.at(-1).fin + 0.35) - 0.02);
  if (i < 0) return;
  const tr = esc.tramos[i];
  if (t > tr.at(-1).fin + 0.35) return;
  ctx.save(); ctx.font = '600 62px "Outfit"'; ctx.textAlign = "left";
  const esp = ctx.measureText(" ").width, MAX = 860;
  const lineas = [[]]; let ancho = 0;
  for (const w of tr) {
    const aw = ctx.measureText(w.p).width;
    if (ancho + aw > MAX && lineas.at(-1).length) { lineas.push([]); ancho = 0; }
    lineas.at(-1).push({ w, aw }); ancho += aw + esp;
  }
  ctx.globalAlpha = clamp((t - (tr[0].ini - 0.12)) / 0.18, 0, 1) * clamp((tr.at(-1).fin + 0.35 - t) / 0.2, 0, 1);
  const alto = 82, y0 = 1560 - (lineas.length - 1) * alto / 2;
  ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
  lineas.forEach((ln, li) => {
    const largo = ln.reduce((s, x) => s + x.aw, 0) + esp * (ln.length - 1);
    let x = (W - largo) / 2;
    for (const { w, aw } of ln) {
      ctx.fillStyle = t >= w.ini ? (t < w.ini + 0.16 ? "#fff" : GOLD_L) : "rgba(255,255,255,.6)";
      ctx.fillText(w.p, x, y0 + li * alto); x += aw + esp;
    }
  });
  ctx.restore();
}

async function cuadro(t) {
  ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  let idx = escenas.findIndex(e => t >= e.ini && t < e.ini + e.dur); if (idx < 0) idx = escenas.length - 1;
  const e = escenas[idx], antes = escenas[idx - 1], u = (t - e.ini) / 0.45;
  if (antes && u < 1) plano(antes, Math.min(t, antes.ini + antes.dur - 0.001), 1);
  plano(e, t, antes ? suave(clamp(u, 0, 1)) : 1);
  subtitulo(t);
}

// ── Música sintética: piano y cuerdas suaves ──────────────────

const nota = m => 440 * Math.pow(2, (m - 69) / 12);
function impulso(ac, seg = 3.2) {
  const n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  return b;
}
function piano(ac, dest, midi, t, dur, vel) {
  const f = nota(midi), g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400 + vel * 4000; lp.Q.value = 0.3;
  g.connect(lp).connect(dest);
  [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]].forEach(([h, a], k) => {
    const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f * h * (1 + (k ? 0.0006 * k : 0));
    const og = ac.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
  });
}
function cuerdas(ac, dest, midis, t, dur, vol) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(2.2, dur * 0.4));
  g.gain.setValueAtTime(vol, t + Math.max(0.5, dur - 2.4)); g.gain.linearRampToValueAtTime(0, t + dur);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = 0.5;
  g.connect(lp).connect(dest);
  for (const m of midis) for (const det of [-6, 6]) {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = nota(m); o.detune.value = det;
    const og = ac.createGain(); og.gain.value = 0.16; o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
  }
}

async function mezclarAudio() {
  const SR = 44100, off = new OfflineAudioContext(2, Math.ceil(total * SR), SR);
  const bus = off.createGain(); bus.connect(off.destination);
  for (const e of escenas) if (e.texto) { const s = off.createBufferSource(); s.buffer = buffers[e.id]; s.connect(bus); s.start(Math.max(0, e.ini + e.lead - e.voz.ini)); }

  const musica = off.createGain(); musica.gain.value = 0; musica.connect(off.destination);
  const rev = off.createConvolver(); rev.buffer = impulso(off); const revG = off.createGain(); revG.gain.value = 0.55;
  const seco = off.createGain(); seco.gain.value = 0.75;
  const sum = off.createGain(); sum.connect(seco).connect(musica); sum.connect(rev).connect(revG).connect(musica);
  const pulso = 1, compas = pulso * 4;   // 60 bpm: un poco más ágil que el video largo
  const acordes = [
    { b: 45, a: [57, 60, 64, 67] }, { b: 41, a: [53, 57, 60, 64] },
    { b: 48, a: [55, 60, 64, 67] }, { b: 43, a: [55, 59, 62, 66] },
  ];
  const nComp = Math.ceil(total / compas) + 1;
  for (let c = 0; c < nComp; c++) {
    const t0 = c * compas, ac = acordes[c % 4], prog = t0 / total;
    const final = t0 + compas >= total - compas * 1.2;
    const acorde = final ? { b: 41, a: [53, 57, 60, 64, 69] } : ac;
    piano(off, sum, acorde.b, t0, compas * 1.9, 0.22);
    if (t0 > 1.5) acorde.a.forEach((m, k) => piano(off, sum, m + (k > 2 ? 0 : 12), t0 + pulso * (0.5 + k * 0.75), pulso * 5, 0.07 + 0.05 * Math.sin(Math.PI * clamp(prog * 1.1, 0, 1))));
    if (prog > 0.05) cuerdas(off, sum, acorde.a.slice(0, 3), t0, compas * 1.05, 0.05 + 0.06 * clamp((prog - 0.05) / 0.5, 0, 1));
  }
  const g = musica.gain; g.setValueAtTime(0, 0); g.linearRampToValueAtTime(0.5, 1.2);
  for (const e of escenas) if (e.texto) {
    const a = e.ini + e.lead - 0.15, b = e.ini + e.lead + e.hablaDur + 0.25;
    g.linearRampToValueAtTime(0.5, Math.max(0, a - 0.35)); g.linearRampToValueAtTime(0.27, a); g.setValueAtTime(0.27, b); g.linearRampToValueAtTime(0.5, b + 0.7);
  }
  g.linearRampToValueAtTime(0.5, total - 2.4); g.linearRampToValueAtTime(0, total);

  const pista = await off.startRendering();
  let pico = 0; for (let c = 0; c < 2; c++) { const d = pista.getChannelData(c); for (let i = 0; i < d.length; i++) pico = Math.max(pico, Math.abs(d[i])); }
  const k = 0.89 / Math.max(pico, 0.01);
  for (let c = 0; c < 2; c++) { const d = pista.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return pista;
}

// ── Salida ────────────────────────────────────────────────────

async function vistaPrevia(t) { await cuadro(t); return lienzo.toDataURL("image/jpeg", 0.9); }
async function elegirCodec() {
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.640032"]) {
    const { supported } = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: BITRATE, framerate: FPS });
    if (supported) return codec;
  }
  throw new Error("Este Chrome no puede codificar H.264 a 1080x1920.");
}
function aBase64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }

async function grabar() {
  const codec = await elegirCodec(), SR = 44100;
  let audioCodec = "aac", cfg = { codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 160_000 };
  if (!(await AudioEncoder.isConfigSupported(cfg)).supported) { audioCodec = "opus"; cfg = { codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 }; }
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, audio: { codec: audioCodec, numberOfChannels: 2, sampleRate: cfg.sampleRate }, fastStart: "in-memory" });
  let falla = null;
  const pista = await mezclarAudio();
  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { falla = e; } });
  ae.configure(cfg);
  const L = pista.getChannelData(0), R = pista.getChannelData(1), B = 4096;
  for (let i = 0; i < L.length; i += B) {
    const n = Math.min(B, L.length - i), pl = new Float32Array(n * 2); pl.set(L.subarray(i, i + n), 0); pl.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / SR * 1e6), data: pl });
    ae.encode(ad); ad.close();
    while (ae.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 2));
  }
  await ae.flush(); if (falla) throw falla;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { falla = e; } });
  ve.configure({ codec, width: W, height: H, bitrate: BITRATE, framerate: FPS, latencyMode: "quality" });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    await cuadro(i / FPS);
    const vf = new VideoFrame(lienzo, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(vf, { keyFrame: i % FPS === 0 }); vf.close();
    while (ve.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 4));
    if (falla) throw falla;
    if (i % FPS === 0) await window.promoAvance(i / n);
  }
  await ve.flush(); if (falla) throw falla;
  muxer.finalize();
  const bytes = new Uint8Array(muxer.target.buffer), TROZO = 3 * 1024 * 1024;
  for (let i = 0; i < bytes.length; i += TROZO) await window.promoTrozo(aBase64(bytes.subarray(i, i + TROZO)));
  return { codec, audioCodec, cuadros: n, bytes: bytes.length };
}

window.reel = { preparar, vistaPrevia, grabar };
