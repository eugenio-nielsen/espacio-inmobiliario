/*
 * Video de presentación de una herramienta del sitio: 1080x1920, 30 s,
 * con subtítulos. Mismo método que video.js (canvas dibujado cuadro por
 * cuadro según el segundo, H.264 con WebCodecs, MP4 con mp4-muxer), pero
 * en vez de fotos de una propiedad cuenta cómo se usa una herramienta.
 *
 * Los textos, los tiempos de los subtítulos y los números del ejemplo
 * salen del guion (guiones/<id>.json, con "tipo": "herramienta").
 *
 * Secuencia del tasador:
 *   1. Gancho    · la pregunta, sobre el guilloché.
 *   2. Pasos     · la hoja del tasador con sus pasos I a IV: se tipea, se
 *                  toca cada opción y la barra de cláusulas avanza.
 *   3. Emisión   · el sello, mientras se calcula.
 *   4. Informe   · el valor contando hasta su cifra, el rango y lo que suma.
 *   5. Cierre    · el logo y a dónde ir.
 *
 * Fijo en pantalla: la marca arriba y los subtítulos en la zona segura.
 *
 * Lo corre render.mjs dentro de Chrome; no se abre a mano.
 */

const W = 1080, H = 1920, FPS = 30;

// Paleta y tipografías del sitio (app/globals.css)
const NAVY_950 = "#07182C", NAVY_900 = "#0A2038", NAVY_800 = "#0E2C50", NAVY_700 = "#173A63";
const GOLD_700 = "#8C7641", GOLD_500 = "#B99F66", GOLD_400 = "#CBB585", GOLD_300 = "#D9C9A1", GOLD_100 = "#F2EBDA", GOLD_50 = "#F8F4EA";
const PAPEL = "#FFFDF8", LINEA = "#E7E2D8", INK_500 = "#7C766B", INK_400 = "#A39C8F", INK_600 = "#595349";
const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"Outfit", system-ui, sans-serif';

// ── Zona segura (la misma lógica que video.js) ───────────────
const X = 84, MARCA_Y = 292;
const HOJA = { x: 84, y: 372, w: 880, h: 900 };      // la hoja del tasador
const SUB = { cx: W / 2, y: 1328, max: 860 };        // subtítulos

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

let guion, TOTAL, K, T, iconos, logo, crema, rosetas;

const COL = { oro: GOLD_400, blanco: "#FFFFFF", navy: NAVY_800, dorado: GOLD_500, gris: INK_400 };

// ── Utilidades ───────────────────────────────────────────────

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const salida = x => 1 - Math.pow(1 - x, 3);
const suave = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const rebote = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const expo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const mezcla = (a, b, k) => a + (b - a) * k;
const entra = (t, t0, d = 0.6) => salida(prog(t, t0, t0 + d));

async function cargarImagen(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function armarLogo(img) {
  const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = "destination-in";
  for (const [x1, y1, largo] of [[c.width, 0, c.width], [0, c.height, c.height]]) {
    const borde = (c.width * 0.09) / largo;
    const g = x.createLinearGradient(0, 0, x1, y1);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(borde, "#000");
    g.addColorStop(1 - borde, "#000");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

function colorDelBorde(img) {
  const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const lado = 12;
  let r = 0, g = 0, b = 0, n = 0;
  for (const [px, py] of [[0, 0], [c.width - lado, 0], [0, c.height - lado], [c.width - lado, c.height - lado]]) {
    const d = x.getImageData(px, py, lado, lado).data;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  }
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}

// ── Íconos (Lucide, los mismos del sitio) ────────────────────

async function cargarIcono(nombre, color) {
  const svg = await (await fetch(`/icono/${nombre}.svg`)).text();
  const pintado = svg
    .replace(/currentColor/g, color)
    .replace('width="24"', 'width="192"')
    .replace('height="24"', 'height="192"');
  return cargarImagen("data:image/svg+xml;charset=utf-8," + encodeURIComponent(pintado));
}

function icono(nombre, color, x, y, tam, alpha = 1) {
  const img = iconos[`${nombre}|${color}`];
  if (!img || alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x - tam / 2, y - tam / 2, tam, tam);
  ctx.restore();
}

// ── Texto ────────────────────────────────────────────────────

const fuente = ({ peso = 400, tam, familia = SANS, estilo = "" }) => `${estilo} ${peso} ${tam}px ${familia}`.trim();

function escribir(texto, x, y, o) {
  const { color = "#fff", alpha = 1, espaciado = 0, alinear = "left", sombra = false } = o;
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.font = fuente(o);
  ctx.letterSpacing = `${espaciado}px`;
  ctx.textAlign = alinear;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  if (sombra) {
    ctx.shadowColor = "rgba(4,14,26,.5)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillText(texto, x, y);
  ctx.restore();
}

function ancho(texto, o) {
  ctx.save();
  ctx.font = fuente(o);
  ctx.letterSpacing = `${o.espaciado || 0}px`;
  const w = ctx.measureText(texto).width;
  ctx.restore();
  return w;
}

function ajustar(texto, o, max) {
  let tam = o.tam;
  while (tam > 30 && ancho(texto, { ...o, tam }) > max) tam -= 2;
  return tam;
}

/** Parte un texto en líneas que entran en `max`. */
function lineas(texto, o, max) {
  const out = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && ancho(prueba, o) > max) { out.push(actual); actual = palabra; }
    else actual = prueba;
  }
  if (actual) out.push(actual);
  return out;
}

function enMascara(texto, x, y, o, p, alpha = 1) {
  if (p <= 0.001 || alpha <= 0.001) return;
  const w = ancho(texto, o);
  const x0 = o.alinear === "center" ? x - w / 2 : x;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 24, y - o.tam * 1.05, w + 48, o.tam * 1.5);
  ctx.clip();
  escribir(texto, x, y + (1 - p) * o.tam * 1.15, { ...o, alpha });
  ctx.restore();
}

function filete(x, y, largo, alpha, color = GOLD_500, grosor = 4) {
  if (alpha <= 0.001 || largo <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, largo, grosor);
  ctx.restore();
}

function trazo(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Lo que va escribiendo una persona: el texto hasta el instante `t`. */
function tipeado(texto, t, ini, fin) {
  return texto.slice(0, Math.floor(prog(t, ini, fin) * texto.length + 0.0001));
}

// ── Guilloché (el de Guilloche.tsx, dibujado una vez) ────────

const ANILLOS = [
  { r: 196, a: 9, k: 26, copias: 12, vuelta: 14 },
  { r: 150, a: 17, k: 16, copias: 14, vuelta: -10 },
  { r: 98, a: 13, k: 11, copias: 12, vuelta: 8 },
];

function armarRosetas() {
  const S = 1240, esc = 2.7;
  return ANILLOS.map(an => {
    const c = new OffscreenCanvas(S, S);
    const x = c.getContext("2d");
    x.translate(S / 2, S / 2);
    x.scale(esc, esc);
    x.strokeStyle = "#CBB585";
    x.lineWidth = 1.5 / esc;
    const pasos = an.k * 14;
    for (let i = 0; i < an.copias; i++) {
      x.save();
      x.rotate(i * ((Math.PI * 2) / an.k / an.copias));
      x.beginPath();
      for (let j = 0; j <= pasos; j++) {
        const th = (j / pasos) * Math.PI * 2;
        const rr = an.r + an.a * Math.sin(an.k * th);
        j ? x.lineTo(rr * Math.cos(th), rr * Math.sin(th)) : x.moveTo(rr * Math.cos(th), rr * Math.sin(th));
      }
      x.stroke();
      x.restore();
    }
    return { c, S, vuelta: an.vuelta };
  });
}

/** La roseta centrada en (cx, cy); `escala` 1 ≈ 1100 px de diámetro. */
function roseta(cx, cy, t, alpha, escala = 1, velocidad = 1) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(escala, escala);
  for (const { c, S, vuelta } of rosetas) {
    ctx.save();
    ctx.rotate(((t * vuelta * velocidad) * Math.PI) / 180);
    ctx.drawImage(c, -S / 2, -S / 2);
    ctx.restore();
  }
  ctx.restore();
}

// ── Piezas de la hoja ────────────────────────────────────────

/** La hoja: papel con sombra y un doble filete dorado hacia adentro. */
function hoja(x, y, w, h, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(2,8,16,.55)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 26;
  trazo(x, y, w, h, 10);
  ctx.fillStyle = PAPEL;
  ctx.fill();
  ctx.shadowColor = "transparent";
  trazo(x + 12, y + 12, w - 24, h - 24, 4);
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD_300;
  ctx.stroke();
  trazo(x + 18, y + 18, w - 36, h - 36, 3);
  ctx.lineWidth = 1;
  ctx.strokeStyle = GOLD_100;
  ctx.stroke();
  ctx.restore();
}

const CLAUSULAS = ["I", "II", "III", "IV", "V"];

/** Las cláusulas: I a V unidas por una línea que se va llenando. */
function riel(x, y, w, pos, alpha) {
  const xs = CLAUSULAS.map((_, i) => x + (w * i) / (CLAUSULAS.length - 1));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = LINEA;
  ctx.beginPath();
  ctx.moveTo(xs[0], y);
  ctx.lineTo(xs[4], y);
  ctx.stroke();
  ctx.strokeStyle = GOLD_500;
  ctx.beginPath();
  ctx.moveTo(xs[0], y);
  ctx.lineTo(mezcla(xs[0], xs[4], pos / 4), y);
  ctx.stroke();

  CLAUSULAS.forEach((n, i) => {
    const hecho = pos >= i + 0.999;
    const actual = !hecho && Math.abs(pos - i) < 0.5;
    ctx.beginPath();
    ctx.arc(xs[i], y, actual ? 30 : 24, 0, Math.PI * 2);
    ctx.fillStyle = actual ? NAVY_800 : hecho ? GOLD_500 : "#fff";
    ctx.fill();
    ctx.lineWidth = actual ? 3 : 2;
    ctx.strokeStyle = actual ? GOLD_400 : hecho ? GOLD_500 : LINEA;
    ctx.stroke();
    if (hecho) icono("check", "blanco", xs[i], y, 26);
    else escribir(n, xs[i], y + 9, { peso: 600, familia: SERIF, estilo: "italic", tam: actual ? 28 : 24, color: actual ? "#fff" : INK_400, alinear: "center" });
  });
  ctx.restore();
}

/** Un campo de texto. Si `foco`, el borde es dorado y parpadea el cursor. */
function campo(x, y, w, h, { texto = "", marcador = "", foco = false, t = 0, tam = 46, alpha = 1, color = NAVY_800 }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  trazo(x, y, w, h, 8);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = foco ? 3 : 2;
  ctx.strokeStyle = foco ? GOLD_500 : LINEA;
  ctx.stroke();
  ctx.restore();

  const baseY = y + h / 2 + tam * 0.34;
  if (texto) {
    escribir(texto, x + 30, baseY, { peso: 500, tam, color, alpha });
    if (foco && Math.floor(t * 2.4) % 2 === 0) {
      filete(x + 34 + ancho(texto, { peso: 500, tam }), y + h / 2 - tam * 0.5, 3, alpha, GOLD_500, tam);
    }
  } else {
    if (foco && Math.floor(t * 2.4) % 2 === 0) filete(x + 32, y + h / 2 - tam * 0.5, 3, alpha, GOLD_500, tam);
    escribir(marcador, x + 30 + (foco ? 14 : 0), baseY, { peso: 400, tam: tam - 4, color: INK_400, alpha });
  }
}

function rotulo(texto, x, y, alpha, color = GOLD_700) {
  escribir(texto, x, y, { peso: 600, tam: 25, espaciado: 5, color, alpha });
}

/** Onda de un toque con el dedo, centrada en (x, y), que empieza en `ts`. */
function toque(x, y, ts, t, alpha = 1) {
  const p = prog(t, ts - 0.12, ts + 0.5);
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 18 + p * 70, 0, Math.PI * 2);
  ctx.lineWidth = 5 * (1 - p) + 1;
  ctx.strokeStyle = `rgba(185,159,102,${0.9 * (1 - p) * alpha})`;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 16 * (1 - p * 0.4), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(185,159,102,${0.35 * (1 - p) * alpha})`;
  ctx.fill();
  ctx.restore();
}

/**
 * Una fila de opciones (como los botones del tasador). La opción `sel` se
 * toca en el segundo `ts`: la onda avanza, la opción se llena de navy.
 * `ini` es cuándo aparece la fila.
 */
function opciones(x, y, w, h, etiquetas, sel, ts, t, ini, { gap = 14, tam = 32, alpha = 1 } = {}) {
  const e = entra(t, ini, 0.5);
  if (e <= 0.001) return;
  const n = etiquetas.length;
  const ancho1 = (w - gap * (n - 1)) / n;
  const marcada = prog(t, ts, ts + 0.22);
  const golpe = rebote(prog(t, ts - 0.05, ts + 0.35));
  etiquetas.forEach((l, i) => {
    const px = x + i * (ancho1 + gap);
    const es = i === sel;
    const k = es ? marcada : 0;
    const sc = es && golpe > 0 && golpe < 1.2 ? 0.94 + 0.06 * golpe : 1;
    ctx.save();
    ctx.globalAlpha = e * alpha;
    ctx.translate(px + ancho1 / 2, y + h / 2 + (1 - e) * 24);
    ctx.scale(sc, sc);
    ctx.translate(-(px + ancho1 / 2), -(y + h / 2));
    trazo(px, y, ancho1, h, 8);
    ctx.fillStyle = es ? mezclaColor("#FFFFFF", NAVY_800, k) : "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = es ? mezclaColor(LINEA, NAVY_800, k) : LINEA;
    ctx.stroke();
    escribir(l, px + ancho1 / 2, y + h / 2 + tam * 0.34, {
      peso: 500, tam, alinear: "center", color: es ? mezclaColor(NAVY_800, "#FFFFFF", k) : INK_600,
    });
    ctx.restore();
  });
  const sx = x + sel * (ancho1 + gap) + ancho1 / 2;
  toque(sx, y + h / 2, ts, t, alpha);
}

function mezclaColor(a, b, k) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return `rgb(${Math.round(mezcla(r1, r2, k))},${Math.round(mezcla(g1, g2, k))},${Math.round(mezcla(b1, b2, k))})`;
}

/** Entrada y salida del contenido de un paso: se desliza y se funde. */
function fase(t, ini, fin) {
  const a = entra(t, ini, 0.45);
  const s = 1 - prog(t, fin - 0.35, fin);
  return { a: a * s, dx: (1 - a) * 70 - (1 - s) * 70 };
}

// ── Tramo 1: gancho y pasos ──────────────────────────────────

function dibujarPasos(t) {
  const d = guion.datos;
  ctx.fillStyle = NAVY_950;
  ctx.fillRect(0, 0, W, H);

  // El guilloché de fondo, siempre girando
  roseta(W / 2, 840, t, 0.2 + 0.1 * entra(t, 0, 1.2), 1.05);

  // ── Gancho ──
  const sale = 1 - prog(t, T.gancho[1] - 0.45, T.gancho[1] - 0.05);
  if (sale > 0.001) {
    const o = { peso: 600, familia: SERIF, tam: 130, alinear: "center" };
    const l1 = "¿Cuánto vale", l2 = "tu departamento?";
    const tam = ajustar(l2, { ...o, estilo: "italic" }, 900);
    escribir("TASADOR ONLINE · GRATIS", W / 2, 700, { peso: 600, tam: 30, espaciado: 9, color: GOLD_400, alinear: "center", alpha: entra(t, 0.15, 0.6) * sale });
    filete(W / 2 - 44 * entra(t, 0.3, 0.6), 736, 88 * entra(t, 0.3, 0.6), sale);
    enMascara(l1, W / 2, 920, { ...o, tam }, entra(t, 0.35, 0.7), sale);
    enMascara(l2, W / 2, 920 + tam * 1.14, { ...o, tam, estilo: "italic", color: GOLD_400 }, entra(t, 0.62, 0.7), sale);
    escribir(d.gancho, W / 2, 1240, { peso: 500, tam: 38, color: "rgba(255,255,255,.78)", alinear: "center", alpha: entra(t, 1.5, 0.6) * sale });
  }

  // ── La hoja ──
  const sube = suave(prog(t, T.gancho[1] - 0.5, T.gancho[1] + 0.55));
  const sacude = 1 - prog(t, T.emision[0] - 0.45, T.emision[0] - 0.05);
  if (sube <= 0 || sacude <= 0.001) return;
  const dy = (1 - sube) * 620 + (1 - sacude) * 80;
  ctx.save();
  ctx.translate(0, dy);
  hoja(HOJA.x, HOJA.y, HOJA.w, HOJA.h, sube * sacude);

  const px = HOJA.x + 48, pw = HOJA.w - 96;
  const limites = [T.p1[1], T.p2[1], T.p3[1], T.p4[1]];
  const pos = limites.reduce((s, b) => s + suave(prog(t, b - 0.05, b + 0.5)), 0);
  riel(HOJA.x + 100, HOJA.y + 78, HOJA.w - 200, pos, sube * sacude);

  paso1(t, px, pw);
  paso2(t, px, pw);
  paso3(t, px, pw);
  paso4(t, px, pw);
  ctx.restore();
}

/** Cabecera de cada paso: la cláusula y la pregunta. */
function cabecera(clausula, titulo, pregunta, f, px) {
  if (f.a <= 0.001) return;
  const y0 = HOJA.y + 160;
  escribir(`CLÁUSULA ${clausula} · ${titulo.toUpperCase()}`, px + f.dx, y0, { peso: 600, tam: 25, espaciado: 5, color: GOLD_700, alpha: f.a });
  const o = { peso: 600, familia: SERIF, tam: 60, color: NAVY_800 };
  lineas(pregunta, o, 780).forEach((l, i) => escribir(l, px + f.dx, y0 + 78 + i * 70, { ...o, alpha: f.a }));
}

function paso1(t, px, pw) {
  const f = fase(t, T.p1[0] + 0.15, T.p1[1]);
  if (f.a <= 0.001) return;
  const d = guion.datos, lt = t - T.p1[0];
  cabecera("I", "Ubicación", "¿En qué barrio está el departamento?", f, px);
  ctx.save();
  ctx.translate(f.dx, 0);

  const y = HOJA.y + 392;
  rotulo("BARRIO", px, y, f.a);
  const escribiendo = lt >= 0.7 && lt < 2.2;
  campo(px, y + 22, pw, 104, {
    texto: tipeado(d.barrio, lt, 0.8, 1.7), marcador: "Buscá un barrio…", foco: lt >= 0.5 && lt < 2.6, t, alpha: f.a,
  });

  // El barrio aparece como resultado y se elige
  const eRes = entra(lt, 1.8, 0.4);
  if (eRes > 0.001) {
    const ry = y + 138, sel = prog(lt, 2.3, 2.5);
    ctx.save();
    ctx.globalAlpha = eRes * f.a;
    trazo(px, ry, pw, 84, 8);
    ctx.fillStyle = mezclaColor("#FFFFFF", GOLD_50, sel);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = mezclaColor(LINEA, GOLD_400, sel);
    ctx.stroke();
    escribir(d.barrio, px + 30, ry + 56, { peso: 500, tam: 40, color: NAVY_800 });
    icono("check", "dorado", px + pw - 54, ry + 42, 38, sel);
    ctx.restore();
    toque(px + pw / 2, ry + 42, 2.3, lt, f.a);
  }

  // La dirección, opcional
  const yd = y + 258;
  rotulo("DIRECCIÓN (OPCIONAL)", px, yd, entra(lt, 2.6, 0.4) * f.a);
  campo(px, yd + 22, pw, 104, {
    texto: tipeado(d.direccion, lt, 3.0, 4.1), marcador: "Ej.: Av. Santa Fe 1234", foco: lt >= 2.7 && lt < 4.8, t,
    alpha: entra(lt, 2.6, 0.4) * f.a,
  });
  escribir(d.nota_direccion, px, yd + 190, { peso: 400, estilo: "italic", familia: SERIF, tam: 33, color: INK_500, alpha: entra(lt, 4.1, 0.5) * f.a });
  ctx.restore();
}

function paso2(t, px, pw) {
  const f = fase(t, T.p2[0] + 0.15, T.p2[1]);
  if (f.a <= 0.001) return;
  const d = guion.datos, lt = t - T.p2[0];
  cabecera("II", "La unidad", "¿Cómo es el departamento?", f, px);
  ctx.save();
  ctx.translate(f.dx, 0);

  const y = HOJA.y + 340;
  rotulo("SUPERFICIE CUBIERTA", px, y, f.a);
  const cuenta = Math.round(d.superficie * expo(prog(lt, 0.7, 1.5)));
  campo(px, y + 22, 520, 104, { texto: `${cuenta} m²`, foco: lt >= 0.5 && lt < 1.9, t, alpha: f.a, tam: 52 });
  rotulo("BALCÓN", px + 556, y, entra(lt, 1.5, 0.4) * f.a);
  campo(px + 556, y + 22, pw - 556, 104, { texto: tipeado(`${d.balcon} m²`, lt, 1.7, 2.1), alpha: entra(lt, 1.5, 0.4) * f.a, tam: 46 });

  const y2 = y + 168;
  rotulo("AMBIENTES", px, y2, entra(lt, 2.0, 0.4) * f.a);
  opciones(px, y2 + 22, pw, 84, ["Mono", "2", "3", "4", "5+"], d.ambientes - 1, 2.7, lt, 2.0, { alpha: f.a, tam: 34 });

  const y3 = y2 + 150;
  rotulo("BAÑOS", px, y3, entra(lt, 3.0, 0.4) * f.a);
  opciones(px, y3 + 22, 300, 84, ["1", "2", "3+"], d.banos - 1, 3.6, lt, 3.0, { alpha: f.a, tam: 34, gap: 12 });

  rotulo("PISO", px + 372, y3, entra(lt, 3.3, 0.4) * f.a);
  const ep = entra(lt, 3.3, 0.5), yp = y3 + 22;
  if (ep > 0.001) {
    ctx.save();
    ctx.globalAlpha = ep * f.a;
    trazo(px + 372, yp, pw - 372, 84, 8);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = LINEA;
    ctx.stroke();
    escribir("−", px + 372 + 44, yp + 58, { peso: 500, tam: 44, color: INK_400, alinear: "center" });
    escribir("+", px + pw - 44, yp + 58, { peso: 500, tam: 44, color: NAVY_800, alinear: "center" });
    const piso = lt < 4.0 ? d.piso - 1 : d.piso;
    escribir(`${piso}° piso`, px + 372 + (pw - 372) / 2, yp + 56, { peso: 500, tam: 36, color: NAVY_800, alinear: "center" });
    ctx.restore();
    toque(px + pw - 44, yp + 42, 4.0, lt, f.a);
  }
  ctx.restore();
}

function paso3(t, px, pw) {
  const f = fase(t, T.p3[0] + 0.15, T.p3[1]);
  if (f.a <= 0.001) return;
  const d = guion.datos, lt = t - T.p3[0];
  cabecera("III", "El edificio", "Contanos del edificio", f, px);
  ctx.save();
  ctx.translate(f.dx, 0);

  const y = HOJA.y + 330;
  rotulo("ESTADO DE CONSERVACIÓN", px, y, f.a);
  opciones(px, y + 22, pw, 84, ["A reciclar", "Bueno", "Muy bueno", "Excelente"], 1, 0.8, lt, 0.3, { alpha: f.a, tam: 29, gap: 12 });

  const y2 = y + 160;
  rotulo("CATEGORÍA DEL EDIFICIO", px, y2, entra(lt, 0.7, 0.4) * f.a);
  opciones(px, y2 + 22, pw, 84, ["Regular", "Estándar", "Premium"], 1, 1.5, lt, 0.7, { alpha: f.a, tam: 32 });

  rotulo("ANTIGÜEDAD", px, y2 + 160, entra(lt, 1.1, 0.4) * f.a);
  campo(px, y2 + 182, 300, 96, { texto: tipeado(`${d.antiguedad} años`, lt, 1.3, 1.8), alpha: entra(lt, 1.1, 0.4) * f.a, tam: 42 });
  ctx.restore();
}

function paso4(t, px, pw) {
  const f = fase(t, T.p4[0] + 0.15, T.p4[1]);
  if (f.a <= 0.001) return;
  const lt = t - T.p4[0];
  cabecera("IV", "Detalles", "Detalles que afinan el valor", f, px);
  ctx.save();
  ctx.translate(f.dx, 0);

  const y = HOJA.y + 330;
  rotulo("ORIENTACIÓN", px, y, f.a);
  opciones(px, y + 22, pw, 84, ["Norte", "Este", "Sur", "Oeste"], 0, 0.7, lt, 0.2, { alpha: f.a, tam: 32, gap: 12 });

  const y2 = y + 160;
  rotulo("DISPOSICIÓN", px, y2, entra(lt, 0.7, 0.4) * f.a);
  opciones(px, y2 + 22, pw, 84, ["Frente", "Contrafrente", "Interno"], 0, 1.1, lt, 0.5, { alpha: f.a, tam: 31 });

  const y3 = y2 + 160;
  rotulo("VISTA", px, y3, entra(lt, 1.1, 0.4) * f.a);
  opciones(px, y3 + 22, pw, 84, ["Abierta", "Despejada", "A la calle", "Interna"], 1, 1.5, lt, 0.8, { alpha: f.a, tam: 29, gap: 12 });
  ctx.restore();
}

// ── Tramo 2: emisión ─────────────────────────────────────────

function arcoTexto(texto, radio, centro, abajo, o) {
  ctx.save();
  ctx.font = fuente(o);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const letras = [...texto];
  const anchos = letras.map(l => ctx.measureText(l).width + (o.espaciado || 0));
  const abertura = anchos.reduce((a, b) => a + b, 0) / radio;
  let ang = abajo ? centro + abertura / 2 : centro - abertura / 2;
  letras.forEach((l, i) => {
    const paso = anchos[i] / radio;
    const medio = abajo ? ang - paso / 2 : ang + paso / 2;
    ctx.save();
    ctx.translate(radio * Math.cos(medio), radio * Math.sin(medio));
    ctx.rotate(abajo ? medio - Math.PI / 2 : medio + Math.PI / 2);
    ctx.fillText(l, 0, 0);
    ctx.restore();
    ang += abajo ? -paso : paso;
  });
  ctx.restore();
}

/** El sello: cae con un golpe, una onda sale de él y un brillo lo cruza. */
function sello(cx, cy, r, lt, ini, arriba, abajo) {
  const p = prog(lt, ini, ini + 0.42);
  if (p <= 0) return;
  const escala = mezcla(2.4, 1, salida(p));
  ctx.save();
  ctx.translate(cx, cy);

  const onda = prog(lt, ini + 0.36, ini + 1.0);
  if (onda > 0 && onda < 1) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (1 + onda * 1.1), 0, Math.PI * 2);
    ctx.lineWidth = 5 * (1 - onda);
    ctx.strokeStyle = `rgba(203,181,133,${0.7 * (1 - onda)})`;
    ctx.stroke();
  }

  ctx.rotate((1 - salida(p)) * -0.5);
  ctx.scale(escala, escala);
  ctx.globalAlpha = clamp(p * 2.2);

  ctx.shadowColor = "rgba(3,10,20,.5)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = NAVY_950;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.lineWidth = 4;
  ctx.strokeStyle = GOLD_500;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(203,181,133,.6)";
  ctx.stroke();

  const oArco = { peso: 600, tam: r * 0.15, color: GOLD_400, espaciado: r * 0.03 };
  arcoTexto(arriba, r * 0.805, -Math.PI / 2, false, oArco);
  arcoTexto(abajo, r * 0.805, Math.PI / 2, true, oArco);
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.translate(lado * r * 0.805, 0);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = GOLD_500;
    ctx.fillRect(-r * 0.03, -r * 0.03, r * 0.06, r * 0.06);
    ctx.restore();
  }
  escribir("EN", 0, r * 0.2, { peso: 700, familia: SERIF, tam: r * 0.56, color: GOLD_400, alinear: "center" });

  const brillo = prog(lt, ini + 0.55, ini + 1.25);
  if (brillo > 0 && brillo < 1) {
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
    ctx.clip();
    const bx = mezcla(-r * 1.6, r * 1.6, brillo);
    const g = ctx.createLinearGradient(bx - r * 0.5, -r * 0.5, bx + r * 0.5, r * 0.5);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,246,222,.34)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();
}

function dibujarEmision(t) {
  const lt = t - T.emision[0], dur = T.emision[1] - T.emision[0];
  ctx.fillStyle = NAVY_950;
  ctx.fillRect(0, 0, W, H);

  // La roseta gira rápido mientras "se calcula" y se calma al sellar
  const calma = prog(lt, 1.3, 2.2);
  roseta(W / 2, 800, t, 0.3, 1.05, mezcla(14, 1, calma));

  const sale = 1 - prog(lt, dur - 0.3, dur);
  const frases = guion.datos.emision;
  const i = Math.min(frases.length - 1, Math.floor(lt / 0.62));
  const antes = lt < 1.9 ? 1 : 0;
  escribir("CLÁUSULA V · EMISIÓN", W / 2, 520, { peso: 600, tam: 26, espaciado: 6, color: GOLD_400, alinear: "center", alpha: entra(lt, 0.1, 0.4) * sale });
  if (antes) {
    const o = { peso: 500, familia: SERIF, estilo: "italic", tam: 56, alinear: "center", color: "#fff" };
    enMascara(`${frases[i]}…`, W / 2, 1090, { ...o, tam: ajustar(`${frases[i]}…`, o, 900) }, entra(lt - i * 0.62, 0, 0.3), sale);
  }
  sello(W / 2, 800, 190, lt, 1.5, "ESTIMACIÓN", "DE VALOR");
}

// ── Tramo 3: informe ─────────────────────────────────────────

const usd = n => `US$ ${Math.round(n).toLocaleString("es-AR")}`;
const pct = c => `${c >= 1 ? "+" : "−"}${Math.abs((c - 1) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

function dibujarInforme(t) {
  const d = guion.datos, lt = t - T.informe[0], dur = T.informe[1] - T.informe[0];
  const sale = 1 - prog(lt, dur - 0.3, dur);
  ctx.fillStyle = NAVY_950;
  ctx.fillRect(0, 0, W, H);
  roseta(W / 2, 720, t, 0.14, 1.2, 0.8);

  const cx = W / 2;
  escribir("ESTIMACIÓN DE VALOR · EJEMPLO", cx, 392, { peso: 600, tam: 27, espaciado: 7, color: GOLD_400, alinear: "center", alpha: entra(lt, 0.1, 0.5) * sale });
  escribir(`${d.barrio}, Buenos Aires`, cx, 468, { peso: 500, estilo: "italic", familia: SERIF, tam: 52, alinear: "center", alpha: entra(lt, 0.25, 0.5) * sale });

  escribir("VALOR ESTIMADO", cx, 586, { peso: 600, tam: 28, espaciado: 8, color: GOLD_400, alinear: "center", alpha: entra(lt, 0.4, 0.5) * sale });
  const valor = d.valor * expo(prog(lt, 0.55, 1.9));
  const oV = { peso: 700, familia: SERIF, tam: 176, alinear: "center" };
  const e = entra(lt, 0.5, 0.5);
  ctx.save();
  ctx.translate(cx, 766);
  ctx.scale(0.95 + 0.05 * e, 0.95 + 0.05 * e);
  escribir(usd(valor), 0, 0, { ...oV, tam: ajustar(usd(d.valor), oV, 900), alpha: e * sale });
  ctx.restore();

  // El rango, como una regla con el valor en su lugar
  const er = entra(lt, 1.7, 0.6);
  const x0 = 130, x1 = W - 130, yr = 850;
  const marca = (d.valor - d.rangoMin) / (d.rangoMax - d.rangoMin);
  ctx.save();
  ctx.globalAlpha = er * sale;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "rgba(185,159,102,.25)");
  g.addColorStop(0.5, GOLD_500);
  g.addColorStop(1, "rgba(185,159,102,.25)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, yr, (x1 - x0) * er, 4);
  ctx.translate(mezcla(x0, x1, marca), yr + 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD_400;
  ctx.fillRect(-13, -13, 26, 26);
  ctx.restore();
  escribir("DESDE", x0, yr + 62, { peso: 500, tam: 24, espaciado: 5, color: GOLD_400, alpha: er * sale });
  escribir(usd(d.rangoMin), x0, yr + 108, { peso: 500, tam: 42, alpha: er * sale });
  escribir("HASTA", x1, yr + 62, { peso: 500, tam: 24, espaciado: 5, color: GOLD_400, alinear: "right", alpha: er * sale });
  escribir(usd(d.rangoMax), x1, yr + 108, { peso: 500, tam: 42, alinear: "right", alpha: er * sale });

  // Lo que sumó, ficha por ficha
  const ef = entra(lt, 2.7, 0.5);
  escribir("LO QUE MUEVE EL VALOR", cx, 1052, { peso: 600, tam: 26, espaciado: 7, color: GOLD_400, alinear: "center", alpha: ef * sale });
  d.factores.forEach((f, i) => {
    const e2 = entra(lt, 3.0 + i * 0.28, 0.45);
    const y = 1112 + i * 56 + (1 - e2) * 26;
    escribir(f.label, 150, y, { peso: 500, tam: 38, alpha: e2 * sale });
    escribir(f.detalle, 150 + ancho(f.label, { peso: 500, tam: 38 }) + 16, y, { peso: 400, tam: 34, color: GOLD_300, alpha: e2 * sale });
    escribir(pct(f.coef), W - 150, y, { peso: 600, tam: 38, color: f.coef >= 1 ? "#8FD1A9" : "#E9A5A0", alinear: "right", alpha: e2 * sale });
  });
}

// ── Tramo 4: cierre ──────────────────────────────────────────

function dibujarCierre(t) {
  const c = guion.cierre, lt = t - T.cierre[0];
  const cx = W / 2;
  ctx.fillStyle = crema;
  ctx.fillRect(0, 0, W, H);

  const e0 = entra(lt, 0.15, 0.7);
  const lw = 700, lh = lw * logo.height / logo.width;
  ctx.save();
  ctx.globalAlpha = e0;
  ctx.translate(cx, 250 + lh / 2);
  ctx.scale(0.94 + 0.06 * e0, 0.94 + 0.06 * e0);
  ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
  ctx.restore();

  const oT = { peso: 600, familia: SERIF, tam: 76, color: NAVY_800, alinear: "center" };
  const l = lineas(c.titulo, oT, 900);
  l.forEach((txt, i) => enMascara(txt, cx, 860 + i * 88, oT, entra(lt, 0.4 + i * 0.12, 0.6)));
  const yb = 860 + (l.length - 1) * 88 + 62;
  enMascara(c.rotulo.toUpperCase(), cx, yb, { peso: 600, tam: 28, espaciado: 6, color: GOLD_700, alinear: "center" }, entra(lt, 0.75, 0.5));

  const ep = rebote(prog(lt, 1.0, 1.5));
  if (ep > 0 && c.boton) {
    const o = { peso: 600, tam: 36 };
    const w = ancho(c.boton, o) + 120, h = 108, y = yb + 48;
    ctx.save();
    ctx.globalAlpha = clamp(ep * 1.5);
    ctx.translate(cx, y + h / 2);
    ctx.scale(0.8 + 0.2 * ep, 0.8 + 0.2 * ep);
    ctx.translate(-cx, -(y + h / 2));
    ctx.shadowColor = "rgba(14,44,80,.35)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    trazo(cx - w / 2, y, w, h, 6);
    ctx.fillStyle = NAVY_800;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.save();
    trazo(cx - w / 2, y, w, h, 6);
    ctx.clip();
    const brillo = mezcla(-200, w + 200, prog(lt, 1.45, 2.2));
    const g = ctx.createLinearGradient(cx - w / 2 + brillo - 90, 0, cx - w / 2 + brillo + 90, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.restore();
    escribir(c.boton, cx, y + h / 2 + 13, { ...o, alinear: "center" });
    ctx.restore();
  }
  escribir(c.aviso, cx, yb + 48 + 108 + 58, { peso: 400, tam: 26, color: INK_500, alinear: "center", alpha: entra(lt, 1.8, 0.6) });
}

// ── Fijo en pantalla: marca y subtítulos ─────────────────────

function dibujarMarca(t) {
  const enCierre = t >= T.cierre[0];
  const a = entra(t, 0.25) * (1 - prog(t, T.cierre[0] - 0.1, T.cierre[0] + 0.25));
  if (a <= 0.001) return;
  escribir("ESPACIO INMOBILIARIO", X, MARCA_Y, { peso: 600, tam: 29, espaciado: 7, alpha: a, sombra: true, color: enCierre ? NAVY_800 : "#fff" });
  filete(X, MARCA_Y + 22, 64 * a, a);
}

/**
 * Subtítulos: la frase aparece en una placa y las palabras se van
 * encendiendo en dorado a medida que "se dicen". Cada palabra dura en
 * proporción a su largo.
 */
function dibujarSubtitulos(t) {
  const lista = guion.subtitulos || [];
  const s = lista.find(x => t >= x.ini - 0.01 && t < x.fin + 0.25);
  if (!s) return;
  const a = entra(t, s.ini, 0.25) * (1 - prog(t, s.fin, s.fin + 0.22));
  if (a <= 0.001) return;

  const o = { peso: 600, tam: 60 };
  const palabras = s.texto.split(" ");
  const renglones = [];
  let actual = [];
  for (const p of palabras) {
    const prueba = [...actual, p].join(" ");
    if (actual.length && ancho(prueba, o) > SUB.max) { renglones.push(actual); actual = [p]; }
    else actual.push(p);
  }
  if (actual.length) renglones.push(actual);

  // Cuándo se enciende cada palabra: reparto por cantidad de letras
  const total = palabras.reduce((n, p) => n + p.length + 1, 0);
  const lapso = Math.max(0.5, s.fin - s.ini - 0.2);
  let acum = 0;
  const inicios = palabras.map(p => { const i = s.ini + (acum / total) * lapso; acum += p.length + 1; return i; });

  const hLinea = 82;
  const wPlaca = Math.min(SUB.max + 70, Math.max(...renglones.map(r => ancho(r.join(" "), o))) + 76);
  const hPlaca = renglones.length * hLinea + 34;
  const yPlaca = SUB.y;

  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(0, (1 - a) * 18);
  ctx.shadowColor = "rgba(2,8,16,.4)";
  ctx.shadowBlur = 30;
  trazo(SUB.cx - wPlaca / 2, yPlaca, wPlaca, hPlaca, 22);
  ctx.fillStyle = "rgba(7,24,44,.86)";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(203,181,133,.45)";
  ctx.stroke();
  ctx.restore();

  let idx = 0;
  renglones.forEach((r, i) => {
    const wRenglon = ancho(r.join(" "), o);
    let x = SUB.cx - wRenglon / 2;
    const y = yPlaca + 17 + 62 + i * hLinea;
    r.forEach(p => {
      const activa = t >= inicios[idx] && (idx === palabras.length - 1 || t < inicios[idx + 1]);
      const dicha = t >= inicios[idx];
      escribir(p, x, y, { ...o, color: activa ? GOLD_400 : dicha ? "#fff" : "rgba(255,255,255,.62)", alpha: a });
      x += ancho(p + " ", o);
      idx++;
    });
  });
}

// ── Composición ──────────────────────────────────────────────

function dibujarTramo(nombre, t) {
  if (nombre === "pasos") dibujarPasos(t);
  else if (nombre === "emision") dibujarEmision(t);
  else if (nombre === "informe") dibujarInforme(t);
  else dibujarCierre(t);
}

/** Línea de corte del barrido: sube en diagonal y deja entrar el tramo nuevo. */
function corte(e) {
  const caida = W * 0.1;
  const Y = H * 1.12 - e * H * 1.36;
  return [[0, Y + caida], [W, Y - caida]];
}

const TRAMOS = () => [
  ["pasos", 0],
  ["emision", T.emision[0]],
  ["informe", T.informe[0]],
  ["cierre", T.cierre[0]],
];
const TR = 0.55;

function cuadro(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = NAVY_950;
  ctx.fillRect(0, 0, W, H);

  const tramos = TRAMOS();
  const k = Math.max(0, tramos.findLastIndex(([, ini]) => t >= ini));
  const [nombre, ini] = tramos[k];

  if (k > 0 && t < ini + TR) {
    dibujarTramo(tramos[k - 1][0], t);
    const e = suave(prog(t, ini, ini + TR));
    const [[x0, y0], [x1, y1]] = corte(e);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(W, H + 300);
    ctx.lineTo(0, H + 300);
    ctx.closePath();
    ctx.clip();
    dibujarTramo(nombre, t);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.strokeStyle = GOLD_400;
    ctx.shadowColor = GOLD_500;
    ctx.shadowBlur = 34;
    ctx.stroke();
    ctx.restore();
  } else {
    dibujarTramo(nombre, t);
  }

  dibujarMarca(t);
  dibujarSubtitulos(t);
}

// ── Preparación ──────────────────────────────────────────────

async function preparar() {
  guion = await (await fetch("/guion.json")).json();

  await Promise.all([
    '700 100px "Playfair Display"', '600 100px "Playfair Display"', 'italic 500 100px "Playfair Display"',
    '400 50px "Outfit"', '500 50px "Outfit"', '600 50px "Outfit"',
  ].map(f => document.fonts.load(f, "Espacio Inmobiliario ñ á é í ó ú ¿ ? ² · $ ° − + ©")));

  // Los tiempos del guion están pensados para 30 s: con otra duración, se estiran
  TOTAL = guion.duracion ?? 30;
  K = TOTAL / 30;
  const base = guion.tiempos;
  T = Object.fromEntries(Object.entries(base).map(([n, [a, b]]) => [n, [a * K, b * K]]));
  for (const s of guion.subtitulos || []) { s.ini *= K; s.fin *= K; }

  iconos = {};
  const nombres = ["check", "arrow-right"];
  await Promise.all(nombres.flatMap(n => Object.entries(COL).map(async ([clave, color]) => {
    iconos[`${n}|${clave}`] = await cargarIcono(n, color);
  })));

  const imagenLogo = await cargarImagen("/logo.png");
  crema = colorDelBorde(imagenLogo);
  logo = armarLogo(imagenLogo);
  rosetas = armarRosetas();

  cuadro(0);
  return {
    fotos: 0, duracion: TOTAL,
    tramos: Object.entries(T).map(([n, [a, b]]) => `${n} ${a.toFixed(1)}–${b.toFixed(1)} s`),
  };
}

// ── Salida ───────────────────────────────────────────────────

function vistaPrevia(t) {
  cuadro(t);
  return lienzo.toDataURL("image/jpeg", 0.9);
}

async function elegirCodec() {
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.420028", "avc1.640032", "avc1.420032"]) {
    const { supported } = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 12_000_000, framerate: FPS });
    if (supported) return codec;
  }
  throw new Error("Este Chrome no puede codificar H.264 a 1080x1920.");
}

function aBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function grabar() {
  const codec = await elegirCodec();
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H, frameRate: FPS },
    fastStart: "in-memory",
  });

  let falla = null;
  const codificador = new VideoEncoder({
    output: (trozo, meta) => muxer.addVideoChunk(trozo, meta),
    error: e => { falla = e; },
  });
  codificador.configure({ codec, width: W, height: H, bitrate: 12_000_000, framerate: FPS, latencyMode: "quality" });

  const total = Math.round(TOTAL * FPS);
  for (let i = 0; i < total; i++) {
    cuadro(i / FPS);
    const vf = new VideoFrame(lienzo, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    codificador.encode(vf, { keyFrame: i % FPS === 0 });
    vf.close();
    while (codificador.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 4));
    if (falla) throw falla;
    if (i % FPS === 0) await window.promoAvance(i / total);
  }
  await codificador.flush();
  if (falla) throw falla;
  muxer.finalize();

  const bytes = new Uint8Array(muxer.target.buffer);
  const TROZO = 3 * 1024 * 1024;
  for (let i = 0; i < bytes.length; i += TROZO) await window.promoTrozo(aBase64(bytes.subarray(i, i + TROZO)));
  return { codec, cuadros: total, bytes: bytes.length };
}

window.promo = { preparar, vistaPrevia, grabar };
