/*
 * Montaje del video de la familia (1080x1920, 9:16, MP4 con voz y música).
 *
 * Cada escena es una frase de la voz de Laura (vo/<id>.mp3) y uno o más planos:
 *   · "clip":   un video generado con Higgsfield (clips/<n>.mp4)
 *   · "movil":  el sitio real dentro de un celular (capturas/movil-<n>.png)
 *   · "cierre": logo, frase final, firma de Eugenio y el aviso de "recreada con IA"
 * La duración de cada escena sale de la voz medida. La música es sintética
 * (se compone acá mismo): piano y cuerdas suaves, sin licencia de terceros.
 *
 * Expone window.montaje = { preparar, vistaPrevia, grabar }.
 */

const W = 1080, H = 1920, FPS = 30;
const NAVY = "#0A2038", GOLD = "#B99F66", GOLD_L = "#D9C9A1", CREMA = "#F7F4EE";

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

let guion, escenas = [], total = 0, logo = null;
const clips = {};          // id → { video, dur }
const imagenes = {};       // nombre → Image
const buffers = {};        // id de voz → AudioBuffer
let grano = null;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const suave = t => t * t * (3 - 2 * t);
const mezcla = (a, b, t) => a + (b - a) * t;
const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

const cargarImagen = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

async function cargarClip(id) {
  const r = await fetch(`/clip/${id}.mp4`);
  if (!r.ok) return null;
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto";
  v.src = URL.createObjectURL(await r.blob());
  await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = () => no(new Error(`clip ${id}`)); });
  return { video: v, dur: v.duration };
}

function buscar(video, t) {
  return new Promise(ok => {
    if (Math.abs(video.currentTime - t) < 0.001 && video.readyState >= 2) return ok();
    const fin = () => { video.removeEventListener("seeked", fin); ok(); };
    video.addEventListener("seeked", fin);
    video.currentTime = t;
  });
}

// ── Voz: cuándo empieza y termina de hablar ───────────────────

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
    if ((corta && cur.length >= 3) || cur.length >= 6) { tramos.push(cur); cur = []; }
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
  ].map(f => document.fonts.load(f, "Espacio Inmobiliario ñ á é í ó ú ¿ ? · ¡ … ©")));

  const ac = new AudioContext();
  let t = 0;
  for (let i = 0; i < guion.escenas.length; i++) {
    const e = guion.escenas[i];
    const buf = await ac.decodeAudioData(await (await fetch(`/vo/${e.id}.mp3`)).arrayBuffer());
    buffers[e.id] = buf;
    const voz = medirVoz(buf);
    const lead = i === 0 ? 1.0 : 0.45;
    const ultima = i === guion.escenas.length - 1;
    const cola = ultima ? 0.6 : 0.65;
    const hablaDur = voz.fin - voz.ini;
    const extra = ultima ? (guion.cierreExtra ?? 4.5) : 0;
    const esc = { ...e, voz, ini: t, lead, hablaDur, dur: lead + hablaDur + cola + extra };
    const p0 = e.palabras[0].ini, pN = e.palabras.at(-1).fin, k = hablaDur / Math.max(0.1, pN - p0);
    esc.palabras = e.palabras.map(w => ({ p: w.p, ini: t + lead + (w.ini - p0) * k, fin: t + lead + (w.fin - p0) * k }));
    esc.tramos = armarTramos(esc.palabras);
    escenas.push(esc);
    t += esc.dur;
  }
  total = t;

  // Planos: reparten la duración de su escena según el peso; los clips
  // "continuar" siguen donde quedó el plano anterior del mismo clip.
  const cursor = {};
  for (const e of escenas) {
    const pesos = e.planos.reduce((a, p) => a + (p.peso ?? 1), 0);
    let x = e.ini;
    e.planos = e.planos.map(p => {
      const d = e.dur * (p.peso ?? 1) / pesos;
      const r = { ...p, ini: x, fin: x + d, desde: p.tipo === "clip" ? (p.continuar ? (cursor[p.clip] ?? 0) : (p.desde ?? 0)) : 0 };
      if (p.tipo === "clip") cursor[p.clip] = r.desde + d;
      x += d; return r;
    });
  }
  for (const e of escenas) for (const p of e.planos) {
    if (p.tipo === "clip" && !(p.clip in clips)) clips[p.clip] = await cargarClip(p.clip);
    if (p.tipo === "movil") for (const n of p.imagenes) if (!(n in imagenes)) imagenes[n] = await cargarImagen(`/cap/${n}.png`);
  }
  logo = await cargarImagen("/logo.png");
  grano = armarGrano();
  await cuadro(0);
  return {
    duracion: +total.toFixed(1),
    escenas: escenas.map(e => `${e.id} ${e.ini.toFixed(1)}–${(e.ini + e.dur).toFixed(1)} s`),
    faltan: Object.entries(clips).filter(([, v]) => !v).map(([k]) => k),
  };
}

function armarGrano() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d"), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
}

// ── Dibujo de los planos ──────────────────────────────────────

async function dibujarClip(p, t, alfa) {
  const c = clips[p.clip];
  ctx.globalAlpha = alfa;
  if (!c) { ctx.fillStyle = "#2a2118"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#d9c9a1"; ctx.font = '500 42px "Outfit"'; ctx.textAlign = "center"; ctx.fillText(`clip pendiente: ${p.clip}`, W / 2, H / 2); ctx.textAlign = "left"; ctx.globalAlpha = 1; return; }
  const u = clamp((t - p.ini) / (p.fin - p.ini), 0, 1);
  const dur = p.fin - p.ini, resto = Math.max(0.1, c.dur - p.desde);
  // Si el clip no alcanza, se enlentece apenas (hasta 0,8x) y después se congela el último cuadro
  const rate = dur > resto ? Math.max(0.8, resto / dur) : 1;
  const tc = clamp(p.desde + (t - p.ini) * rate, 0, c.dur - 0.04);
  await buscar(c.video, tc);
  // Un empujón muy lento de cámara para que el plano respire
  const z = mezcla(1.0, p.zoom ?? 1.05, u);
  const w = W * z, h = H * z;
  ctx.drawImage(c.video, (W - w) / 2, (H - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

function dibujarMovil(p, t, alfa) {
  ctx.globalAlpha = alfa;
  const u = clamp((t - p.ini) / (p.fin - p.ini), 0, 1);
  // Fondo cálido, desenfocado
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#241a12"); g.addColorStop(0.55, "#5b4126"); g.addColorStop(1, "#c79a5b");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W / 2, 860, 80, W / 2, 860, 900);
  r.addColorStop(0, "rgba(255,226,170,.28)"); r.addColorStop(1, "rgba(255,226,170,0)");
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);

  // Celular que sube suavemente
  const subida = suave(clamp(u * 3, 0, 1));
  const pw = 600, ph = 1240, px = (W - pw) / 2, py = 330 + (1 - subida) * 80;
  ctx.save(); ctx.globalAlpha = alfa * (0.4 + 0.6 * subida);
  ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 70; ctx.shadowOffsetY = 40;
  ctx.fillStyle = "#14110e"; rr(px, py, pw, ph, 70); ctx.fill();
  ctx.restore();
  // Pantalla: las capturas se cruzan una a una
  const sx = px + 16, sy = py + 16, sw = pw - 32, sh = ph - 32;
  ctx.save(); rr(sx, sy, sw, sh, 56); ctx.clip();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = "#fff"; ctx.fillRect(sx, sy, sw, sh);
  const n = p.imagenes.length, tramo = 1 / n, i = Math.min(n - 1, Math.floor(u * n));
  const dibujaImg = (k, alfaImg) => {
    const img = imagenes[p.imagenes[k]]; if (!img) return;
    const local = clamp((u - k * tramo) / tramo, 0, 1);
    const escala = sw / img.width, alto = img.height * escala;
    const desplaza = Math.max(0, alto - sh) * suave(local) * 0.5;
    ctx.globalAlpha = alfa * alfaImg;
    ctx.drawImage(img, sx, sy - desplaza, sw, alto);
  };
  if (i > 0) dibujaImg(i - 1, 1);                       // la anterior queda debajo mientras entra la nueva
  dibujaImg(i, i === 0 ? 1 : suave(clamp((u - i * tramo) / 0.07, 0, 1)));
  ctx.restore();
  // Muesca
  ctx.globalAlpha = alfa; ctx.fillStyle = "#14110e"; rr(W / 2 - 70, sy + 14, 140, 34, 17); ctx.fill();
  ctx.globalAlpha = 1;
}

function dibujarCierre(p, t, alfa) {
  const u = clamp((t - p.ini) / 1.0, 0, 1);
  ctx.globalAlpha = alfa;
  ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, 700, 60, W / 2, 700, 900);
  g.addColorStop(0, "rgba(185,159,102,.22)"); g.addColorStop(1, "rgba(185,159,102,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  if (logo) {
    const lw = 280, lh = lw * logo.height / logo.width, a = suave(u);
    ctx.globalAlpha = alfa * a;
    ctx.fillStyle = CREMA; rr(W / 2 - lw / 2 - 20, 360 - 20, lw + 40, lh + 40, 22); ctx.fill();
    ctx.drawImage(logo, W / 2 - lw / 2, 360, lw, lh);
  }
  const frase = suave(clamp((t - p.ini - 0.5) / 0.9, 0, 1));
  ctx.globalAlpha = alfa * frase;
  ctx.fillStyle = "#fff"; ctx.font = '700 76px "Playfair Display"';
  ctx.fillText("Vendé por tu cuenta,", W / 2, 960);
  ctx.fillStyle = GOLD_L; ctx.font = 'italic 500 76px "Playfair Display"';
  ctx.fillText("pero no solo.", W / 2, 1050);
  const firma = suave(clamp((t - p.ini - 1.6) / 1.0, 0, 1));
  ctx.globalAlpha = alfa * firma;
  ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = '500 26px "Outfit"'; ctx.letterSpacing = "6px";
  ctx.fillText("ESPACIO INMOBILIARIO", W / 2, 1210);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 60, 1250, 120, 2);
  ctx.fillStyle = GOLD_L; ctx.font = 'italic 500 58px "Playfair Display"';
  ctx.fillText("Eugenio Nielsen", W / 2, 1335);
  const aviso = suave(clamp((t - p.ini - 2.2) / 0.8, 0, 1));
  ctx.globalAlpha = alfa * aviso;
  ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.font = '400 27px "Outfit"';
  ctx.fillText("Historia recreada con inteligencia artificial.", W / 2, 1640);
  ctx.textAlign = "left"; ctx.globalAlpha = 1;
}

async function plano(p, t, alfa) {
  if (p.tipo === "clip") return dibujarClip(p, t, alfa);
  if (p.tipo === "movil") return dibujarMovil(p, t, alfa);
  return dibujarCierre(p, t, alfa);
}

function subtitulo(t) {
  const esc = escenas.find(e => t >= e.ini && t < e.ini + e.dur) || escenas.at(-1);
  const i = esc.tramos.findIndex((tr, k) => t >= tr[0].ini - 0.12 && t < (esc.tramos[k + 1]?.[0].ini ?? tr.at(-1).fin + 0.35) - 0.02);
  if (i < 0) return;
  const tr = esc.tramos[i];
  if (t > tr.at(-1).fin + 0.35) return;
  ctx.save();
  ctx.font = '600 58px "Outfit"'; ctx.textAlign = "left";
  const esp = ctx.measureText(" ").width, MAX = 880;
  // Reparte en líneas
  const lineas = [[]]; let ancho = 0;
  for (const w of tr) {
    const aw = ctx.measureText(w.p).width;
    if (ancho + aw > MAX && lineas.at(-1).length) { lineas.push([]); ancho = 0; }
    lineas.at(-1).push({ w, aw }); ancho += aw + esp;
  }
  const a = clamp((t - (tr[0].ini - 0.12)) / 0.18, 0, 1) * clamp((tr.at(-1).fin + 0.35 - t) / 0.2, 0, 1);
  ctx.globalAlpha = a;
  // Sobre el plano del celular el texto va debajo del teléfono, para no pisar la pantalla del sitio
  const enMovil = escenas.some(e => e.planos.some(p => p.tipo === "movil" && t >= p.ini && t < p.fin));
  const alto = 78, y0 = (enMovil ? 1730 : 1470) - (lineas.length - 1) * alto / 2;
  ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  lineas.forEach((ln, li) => {
    const largo = ln.reduce((s, x) => s + x.aw, 0) + esp * (ln.length - 1);
    let x = (W - largo) / 2;
    for (const { w, aw } of ln) {
      const dicha = t >= w.ini;
      ctx.fillStyle = dicha ? (t < w.ini + 0.16 ? "#fff" : GOLD_L) : "rgba(255,255,255,.62)";
      ctx.fillText(w.p, x, y0 + li * alto);
      x += aw + esp;
    }
  });
  ctx.restore();
}

function acabado() {
  // Viñeta y grano de película, muy suaves
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.34)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = "overlay";
  const ox = Math.floor(Math.random() * 256), oy = Math.floor(Math.random() * 256);
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(grano, x, y);
  ctx.restore();
}

async function cuadro(t) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const todos = escenas.flatMap(e => e.planos);
  const i = todos.findIndex(p => t >= p.ini && t < p.fin);
  const idx = i < 0 ? todos.length - 1 : i;
  const p = todos[idx], antes = todos[idx - 1];
  const F = 0.55, u = (t - p.ini) / F;
  if (antes && u < 1) await plano(antes, Math.min(t, antes.fin - 0.001), 1);
  await plano(p, t, antes ? suave(clamp(u, 0, 1)) : 1);
  if (p.tipo !== "cierre") acabado();
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
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400 + vel * 4000; lp.Q.value = 0.3;
  g.connect(lp).connect(dest);
  [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]].forEach(([h, a], k) => {
    const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f * h * (1 + (k ? 0.0006 * k : 0));
    const og = ac.createGain(); og.gain.value = a; o.connect(og).connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  });
}

function cuerdas(ac, dest, midis, t, dur, vol) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(2.2, dur * 0.4));
  g.gain.setValueAtTime(vol, t + Math.max(0.5, dur - 2.4));
  g.gain.linearRampToValueAtTime(0, t + dur);
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = 0.5;
  g.connect(lp).connect(dest);
  for (const m of midis) for (const det of [-6, 6]) {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = nota(m); o.detune.value = det;
    const og = ac.createGain(); og.gain.value = 0.16; o.connect(og).connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

/** Voz de cada escena en su lugar + la música debajo, que baja cuando habla Laura. */
async function mezclarAudio() {
  const SR = 44100, off = new OfflineAudioContext(2, Math.ceil(total * SR), SR);

  // Voz
  const bus = off.createGain(); bus.gain.value = 1; bus.connect(off.destination);
  for (const e of escenas) { const s = off.createBufferSource(); s.buffer = buffers[e.id]; s.connect(bus); s.start(Math.max(0, e.ini + e.lead - e.voz.ini)); }

  // Música: Am – F – C – G, lenta (≈ 54 bpm), con un arco: entra sola, crece hacia la escritura y resuelve en Fmaj7/C al cierre
  const musica = off.createGain(); musica.gain.value = 0.0; musica.connect(off.destination);
  const rev = off.createConvolver(); rev.buffer = impulso(off); const revG = off.createGain(); revG.gain.value = 0.55;
  const seco = off.createGain(); seco.gain.value = 0.75;
  const sum = off.createGain(); sum.connect(seco).connect(musica); sum.connect(rev).connect(revG).connect(musica);

  const pulso = 60 / 54, compas = pulso * 4;
  const acordes = [
    { b: 45, a: [57, 60, 64, 67] },     // Am7
    { b: 41, a: [53, 57, 60, 64] },     // Fmaj7
    { b: 48, a: [55, 60, 64, 67] },     // C
    { b: 43, a: [55, 59, 62, 66] },     // G
  ];
  const nComp = Math.ceil(total / compas) + 1;
  for (let c = 0; c < nComp; c++) {
    const t0 = c * compas, ac = acordes[c % 4], prog = t0 / total;
    const final = t0 + compas >= total - compas * 1.5;
    const acorde = final ? { b: 41, a: [53, 57, 60, 64, 69] } : ac;
    piano(off, sum, acorde.b, t0, compas * 1.9, 0.22);                      // bajo
    if (t0 > 6) acorde.a.forEach((m, k) => piano(off, sum, m + 12 * (k > 2 ? 0 : 1) - (k > 2 ? 0 : 0), t0 + pulso * (0.5 + k * 0.75), pulso * 5, 0.07 + 0.05 * Math.sin(Math.PI * clamp(prog * 1.1, 0, 1))));
    if (prog > 0.08) cuerdas(off, sum, acorde.a.slice(0, 3), t0, compas * 1.05, 0.05 + 0.07 * clamp((prog - 0.08) / 0.55, 0, 1) * (prog > 0.9 ? 0.8 : 1));
  }

  // Volumen de la música: sutil, y más bajo mientras habla
  const g = musica.gain; g.setValueAtTime(0, 0); g.linearRampToValueAtTime(0.5, 2.5);
  for (const e of escenas) {
    const a = e.ini + e.lead - 0.15, b = e.ini + e.lead + e.hablaDur + 0.25;
    g.linearRampToValueAtTime(0.5, Math.max(0, a - 0.35)); g.linearRampToValueAtTime(0.28, a); g.setValueAtTime(0.28, b); g.linearRampToValueAtTime(0.5, b + 0.8);
  }
  g.linearRampToValueAtTime(0.5, total - 3.2); g.linearRampToValueAtTime(0, total);

  const pista = await off.startRendering();
  // Normalización a −1 dBFS
  let pico = 0; for (let c = 0; c < 2; c++) { const d = pista.getChannelData(c); for (let i = 0; i < d.length; i++) pico = Math.max(pico, Math.abs(d[i])); }
  const k = 0.89 / Math.max(pico, 0.01);
  for (let c = 0; c < 2; c++) { const d = pista.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return pista;
}

// ── Salida ────────────────────────────────────────────────────

async function vistaPrevia(t) { await cuadro(t); return lienzo.toDataURL("image/jpeg", 0.9); }

async function elegirCodec() {
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.640032"]) {
    const { supported } = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS });
    if (supported) return codec;
  }
  throw new Error("Este Chrome no puede codificar H.264 a 1080x1920.");
}

function aBase64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }

async function grabar() {
  const codec = await elegirCodec(), SR = 44100;
  let audioCodec = "aac", cfg = { codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 192_000 };
  if (!(await AudioEncoder.isConfigSupported(cfg)).supported) { audioCodec = "opus"; cfg = { codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 }; }
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, audio: { codec: audioCodec, numberOfChannels: 2, sampleRate: cfg.sampleRate }, fastStart: "in-memory" });
  let falla = null;

  const pista = await mezclarAudio();
  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { falla = e; } });
  ae.configure(cfg);
  const L = pista.getChannelData(0), R = pista.getChannelData(1), B = 4096;
  for (let i = 0; i < L.length; i += B) {
    const n = Math.min(B, L.length - i), plano = new Float32Array(n * 2); plano.set(L.subarray(i, i + n), 0); plano.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / SR * 1e6), data: plano });
    ae.encode(ad); ad.close();
    while (ae.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 2));
  }
  await ae.flush(); if (falla) throw falla;

  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { falla = e; } });
  ve.configure({ codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS, latencyMode: "quality" });
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

/** Voz + música como WAV de 16 bits, en base64 (para revisar el audio aparte). */
async function audioWav() {
  const pista = await mezclarAudio(), n = pista.length, L = pista.getChannelData(0), R = pista.getChannelData(1);
  const buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const txt = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  txt(0, "RIFF"); v.setUint32(4, 36 + n * 4, true); txt(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100 * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); txt(36, "data"); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  return aBase64(new Uint8Array(buf));
}

window.montaje = { preparar, vistaPrevia, grabar, audioWav };
