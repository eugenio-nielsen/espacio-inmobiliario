/*
 * Video promocional de una propiedad: 1080x1920, 20 segundos.
 *
 * Todo se dibuja en un <canvas>, cuadro por cuadro, a partir del guion
 * (guiones/<id>.json): cada cuadro depende solo del tiempo, así el
 * resultado es siempre el mismo. Los cuadros se codifican a H.264 con
 * WebCodecs y se empaquetan en MP4 con mp4-muxer, sin ffmpeg.
 *
 * Secuencia (cada tramo es opcional salvo apertura, precio y cierre):
 *   1. Apertura  · la portada, con el barrio y qué es.
 *   2. Escenas   · una foto por vez, con su título y fichas con ícono.
 *   3. Mapa      · dónde queda, y qué hay cerca.
 *   4. Precio    · sello de dueño directo y el precio contando.
 *   5. Cierre    · el logo y la invitación a ver la ficha.
 *
 * Fijo en pantalla, sobre todos los tramos menos el cierre:
 *   · la marca arriba
 *   · la barra de datos abajo (ambientes, dormitorios, m²…), que además
 *     resalta el dato del que habla cada escena
 *
 * Lo corre render.mjs dentro de Chrome; no se abre a mano.
 */

const W = 1080, H = 1920, FPS = 30;

// Paleta y tipografías del sitio (app/globals.css)
const NAVY_950 = "#07182C", NAVY_900 = "#0A2038", NAVY_800 = "#0E2C50";
const GOLD_700 = "#8C7641", GOLD_600 = "#A4894E", GOLD_500 = "#B99F66", GOLD_400 = "#CBB585";
const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"Outfit", system-ui, sans-serif';

// ── Zona segura ──────────────────────────────────────────────
// Instagram y TikTok tapan con su interfaz unos 250px arriba, bastante más
// abajo (el epígrafe y el nombre de la cuenta) y una columna de botones a
// la derecha. Para cambiar dónde va cada cosa, tocar solo estos números.
const X = 84, ANCHO_TEXTO = 880;
const MARCA_Y = 292;
const TITULO_Y = 1196;                              // línea base del título de cada escena
const PIE = { x: 60, y: 1322, w: 960, h: 168 };     // barra de datos
const MAPA = { x: 90, y: 560, w: 900, h: 450, r: 40 };

// Duración de cada tramo (s) en un video de 20 s. Con otra `duracion` en el
// guion, todos se estiran en la misma proporción; las escenas se reparten
// lo que queda. Cualquiera se puede fijar a mano en `duraciones`.
const DURACION_BASE = 20;
const DURACIONES = { apertura: 3.2, mapa: 3.3, precio: 3.2, cierre: 2.3 };
const TR = 0.55;                                    // transición entre tramos

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

let guion, segs, TOTAL, laminas, velada, iconos, logo, crema, mapa;

// Colores con los que se pintan los íconos (son SVG de trazo, uno por color)
const COL = { oro: GOLD_400, blanco: "#FFFFFF", navy: NAVY_950, dorado: GOLD_500 };

// ── Utilidades ───────────────────────────────────────────────

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const salida = x => 1 - Math.pow(1 - x, 3);                                  // frena al llegar
const suave = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const rebote = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // se pasa y vuelve
const expo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));                  // arranca rápido, termina lento
const mezcla = (a, b, k) => a + (b - a) * k;
/** 0 → 1 a partir de t0: la entrada de cada elemento. */
const entra = (t, t0, d = 0.6) => salida(prog(t, t0, t0 + d));

async function cargarImagen(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function centrada(x, img, escala) {
  const w = img.naturalWidth * escala, h = img.naturalHeight * escala;
  x.drawImage(img, (x.canvas.width - w) / 2, (x.canvas.height - h) / 2, w, h);
}

/**
 * La foto ya encuadrada a 9:16, a 1,25x para que el zoom no la ablande.
 * Una vertical llena el cuadro; una apaisada va entera sobre sí misma
 * desenfocada (el mismo criterio que la galería de la ficha).
 */
function armarLamina(img) {
  const c = new OffscreenCanvas(Math.round(W * 1.25), Math.round(H * 1.25));
  const x = c.getContext("2d");
  x.imageSmoothingQuality = "high";
  const llenar = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
  if (img.naturalHeight > img.naturalWidth) {
    centrada(x, img, llenar);
  } else {
    x.filter = "blur(48px) brightness(.55)";
    centrada(x, img, llenar * 1.15);
    x.filter = "none";
    centrada(x, img, c.width / img.naturalWidth);
  }
  return c;
}

/** Fondo de la placa del precio: la foto desenfocada y oscurecida. */
function armarVelada(lamina) {
  const c = new OffscreenCanvas(W, H);
  const x = c.getContext("2d");
  x.filter = "blur(22px)";
  x.drawImage(lamina, -60, -106, W + 120, H + 212);
  x.filter = "none";
  x.fillStyle = "rgba(7,24,44,.72)";
  x.fillRect(0, 0, W, H);
  return c;
}

/**
 * El logo con los bordes esfumados. El PNG trae su propio fondo de papel,
 * con algo de textura: sin esto, en la placa final se le nota el recuadro.
 */
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

/** El color del papel del logo: la placa final usa el mismo, así se funden. */
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

/** Dibuja un ícono centrado en (x, y). */
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
  const { color = "#fff", alpha = 1, espaciado = 0, alinear = "left", sombra = true } = o;
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

/** El tamaño más grande (hasta o.tam) con el que el texto entra en `max`. */
function ajustar(texto, o, max) {
  let tam = o.tam;
  while (tam > 40 && ancho(texto, { ...o, tam }) > max) tam -= 2;
  return tam;
}

/**
 * El texto sube desde atrás de una línea invisible: aparece "saliendo del
 * piso". `p` es el avance de 0 a 1.
 */
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

// ── Fotos con movimiento ─────────────────────────────────────

// Movimiento lento de cada foto: [zoom inicial, zoom final, y inicial, y final]
const MOVIMIENTOS = [
  [1.03, 1.13, 0, -14],
  [1.14, 1.04, -12, 8],
  [1.04, 1.13, 10, -10],
  [1.13, 1.04, 6, -6],
];

function foto(lamina, p, variante, extra = 0) {
  const [z0, z1, y0, y1] = MOVIMIENTOS[variante % MOVIMIENTOS.length];
  const z = mezcla(z0, z1, p) + extra;
  const w = W * z, h = H * z;
  ctx.drawImage(lamina, (W - w) / 2, (H - h) / 2 + mezcla(y0, y1, p), w, h);
}

/** Sombras arriba y abajo, y un viñeteado suave, para que el texto se lea sobre cualquier foto. */
function velos() {
  let g = ctx.createLinearGradient(0, 0, 0, 560);
  g.addColorStop(0, "rgba(7,24,44,.7)");
  g.addColorStop(1, "rgba(7,24,44,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 560);

  g = ctx.createLinearGradient(0, 700, 0, H);
  g.addColorStop(0, "rgba(7,24,44,0)");
  g.addColorStop(0.42, "rgba(7,24,44,.7)");
  g.addColorStop(1, "rgba(7,24,44,.96)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 700, W, H - 700);

  g = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.78);
  g.addColorStop(0, "rgba(7,24,44,0)");
  g.addColorStop(1, "rgba(7,24,44,.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ── Tramo: foto con título y fichas ──────────────────────────

const tamTitulo = seg => ajustar(seg.titulo, { peso: 700, familia: SERIF, tam: seg.tamMax }, ANCHO_TEXTO);

function bloque(seg, lt) {
  const sale = 1 - prog(lt, seg.dur - 0.32, seg.dur - 0.04);
  const oT = { peso: 700, familia: SERIF, tam: tamTitulo(seg) };
  const techo = TITULO_Y - oT.tam * 0.96;

  const e0 = entra(lt, 0.15);
  if (seg.rotulo) {
    filete(X, techo - 108, 72 * e0, e0 * sale);
    enMascara(seg.rotulo.toUpperCase(), X, techo - 34, { peso: 600, tam: 32, espaciado: 6, color: GOLD_400 }, entra(lt, 0.22, 0.5), sale);
  } else {
    filete(X, techo - 44, 72 * e0, e0 * sale);
  }
  enMascara(seg.titulo, X, TITULO_Y, oT, entra(lt, 0.34, 0.7), sale);

  if (seg.bajada) {
    const oB = { peso: 400, tam: 46 };
    enMascara(seg.bajada, X, TITULO_Y + 66, { ...oB, tam: ajustar(seg.bajada, oB, ANCHO_TEXTO) }, entra(lt, 0.52, 0.6), sale * 0.96);
  }
}

/** Fichas con ícono: aparecen una tras otra, desde la izquierda, con un pequeño rebote. */
function fichas(seg, lt) {
  const lista = seg.chips || [];
  if (!lista.length) return;
  const sale = 1 - prog(lt, seg.dur - 0.32, seg.dur - 0.04);
  const techo = TITULO_Y - tamTitulo(seg) * 0.96;
  const fondo = techo - (seg.rotulo ? 150 : 96);   // donde termina la última ficha
  const alto = 84, sep = 16;
  const o = { peso: 500, tam: 38 };

  lista.forEach((c, i) => {
    const p = prog(lt, 0.85 + i * 0.2, 1.35 + i * 0.2);
    if (p <= 0) return;
    const e = rebote(p);
    const w = 16 + 60 + 18 + ancho(c.texto, o) + 36;
    const y = fondo - (lista.length - i) * (alto + sep) + sep;
    const x = X - (1 - e) * 150;
    const a = clamp(p * 2) * sale;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = "rgba(3,10,20,.4)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 8;
    trazo(x, y, w, alto, alto / 2);
    ctx.fillStyle = "rgba(7,24,44,.7)";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(203,181,133,.42)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 16 + 30, y + alto / 2, 30, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_500;
    ctx.fill();
    ctx.restore();

    icono(c.icono, "navy", x + 16 + 30, y + alto / 2, 32, a);
    escribir(c.texto, x + 16 + 60 + 18, y + alto / 2 + 13, { ...o, alpha: a, sombra: false });
  });
}

function dibujarFoto(seg, t) {
  const lt = t - seg.ini;
  const p = lt / (seg.dur + TR);
  // Al entrar, la foto llega con un empujón de zoom que se asienta
  foto(laminas[seg.foto], clamp(p), seg.n, 0.07 * (1 - salida(prog(lt, 0, 1.1))));
  velos();
  fichas(seg, lt);
  bloque(seg, lt);
}

// ── Tramo: mapa ──────────────────────────────────────────────

const TILE = 256;

/** Coordenadas (fraccionarias) de un punto en la grilla de tiles de zoom z. */
function aTile(lat, lng, z) {
  const n = Math.pow(2, z);
  const r = lat * Math.PI / 180;
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n];
}

/** El tile en blanco y negro con un tinte azulado: el mapa queda dentro de la paleta del sitio. */
function hornear(img) {
  const c = new OffscreenCanvas(TILE, TILE);
  const x = c.getContext("2d");
  x.filter = "grayscale(1) contrast(1.06) brightness(1.04)";
  x.drawImage(img, 0, 0, TILE, TILE);
  x.filter = "none";
  x.globalCompositeOperation = "multiply";
  x.fillStyle = "rgb(212,224,240)";
  x.fillRect(0, 0, TILE, TILE);
  return c;
}

async function cargarMapa(m) {
  const z = 16;
  const [cx, cy] = aTile(m.lat, m.lng, z);
  const lista = [];
  for (let ix = Math.floor(cx - 4.7); ix <= Math.floor(cx + 4.7); ix++)
    for (let iy = Math.floor(cy - 2.8); iy <= Math.floor(cy + 2.8); iy++) lista.push([ix, iy]);

  const tiles = new Map();
  let i = 0;
  // De a seis: hay que ser amable con el servidor de tiles
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < lista.length) {
      const [ix, iy] = lista[i++];
      try { tiles.set(`${ix},${iy}`, hornear(await cargarImagen(`/tile/${z}/${ix}/${iy}.png`))); } catch { /* falta un tile: queda el fondo */ }
    }
  }));
  return { z, cx, cy, lat: m.lat, tiles };
}

function dibujarMapa(seg, t) {
  const lt = t - seg.ini;
  const m = seg.mapa;
  const sale = 1 - prog(lt, seg.dur - 0.32, seg.dur - 0.04);

  // Fondo
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, NAVY_900);
  g.addColorStop(1, NAVY_950);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  enMascara("UBICACIÓN", X, 408, { peso: 600, tam: 30, espaciado: 7, color: GOLD_400 }, entra(lt, 0.2, 0.5), sale);
  enMascara(m.titulo, X, 508, { peso: 700, familia: SERIF, tam: ajustar(m.titulo, { peso: 700, familia: SERIF, tam: 112 }, ANCHO_TEXTO) }, entra(lt, 0.3, 0.7), sale);

  // Tarjeta del mapa: entra creciendo desde el centro
  const ea = entra(lt, 0.25, 0.7);
  const cxT = MAPA.x + MAPA.w / 2, cyT = MAPA.y + MAPA.h / 2;
  ctx.save();
  ctx.globalAlpha = clamp(ea * 1.4) * sale;
  ctx.translate(cxT, cyT + (1 - ea) * 60);
  ctx.scale(0.9 + 0.1 * ea, 0.9 + 0.1 * ea);
  ctx.translate(-cxT, -cyT);

  ctx.shadowColor = "rgba(3,10,20,.55)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 18;
  trazo(MAPA.x, MAPA.y, MAPA.w, MAPA.h, MAPA.r);
  ctx.fillStyle = "#d4e0f0";
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.save();
  trazo(MAPA.x, MAPA.y, MAPA.w, MAPA.h, MAPA.r);
  ctx.clip();

  // La cámara se acerca y termina centrada en la propiedad
  const k = suave(prog(lt, 0.2, seg.dur + TR - 0.1));
  const Z = mezcla(14.9, 16, k);
  const tam = TILE * Math.pow(2, Z - mapa.z);
  const camX = mapa.cx + 0.34 * (1 - k), camY = mapa.cy - 0.12 * (1 - k);
  const aPantalla = (tx, ty) => [cxT + (tx - camX) * tam, cyT + (ty - camY) * tam];

  for (const [clave, tile] of mapa.tiles) {
    const [ix, iy] = clave.split(",").map(Number);
    const [px, py] = aPantalla(ix, iy);
    if (px > MAPA.x + MAPA.w || py > MAPA.y + MAPA.h || px + tam < MAPA.x || py + tam < MAPA.y) continue;
    ctx.drawImage(tile, px, py, tam + 0.6, tam + 0.6);
  }

  // La zona (no el punto exacto): un círculo del radio indicado en el guion
  const [zx, zy] = aPantalla(mapa.cx, mapa.cy);
  const mpp = 156543.03392 * Math.cos(mapa.lat * Math.PI / 180) / Math.pow(2, Z);
  const rZona = (m.radio || 250) / mpp;
  const ez = entra(lt, 0.7, 0.8);
  ctx.beginPath();
  ctx.arc(zx, zy, rZona * ez, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(185,159,102,.24)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = GOLD_600;
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const fase = ((lt * 0.55 + i / 3) % 1);
    ctx.beginPath();
    ctx.arc(zx, zy, rZona * (1 + fase * 1.1) * ez, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(164,137,78,${(1 - fase) * 0.55 * ez})`;
    ctx.stroke();
  }

  // Marcador: cae sobre la zona
  const ep = prog(lt, 1.0, 1.55);
  if (ep > 0) {
    const caida = (1 - rebote(ep)) * -150;
    ctx.save();
    ctx.globalAlpha = clamp(ep * 3);
    ctx.shadowColor = "rgba(3,10,20,.45)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(zx, zy - 6 + caida, 42, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_500;
    ctx.fill();
    ctx.restore();
    icono("map-pin", "navy", zx, zy - 6 + caida, 46, clamp(ep * 3));
  }

  // Bordes del mapa algo más oscuros, para que se sienta una pieza
  const v = ctx.createRadialGradient(cxT, cyT, MAPA.h * 0.3, cxT, cyT, MAPA.w * 0.62);
  v.addColorStop(0, "rgba(7,24,44,0)");
  v.addColorStop(1, "rgba(7,24,44,.28)");
  ctx.fillStyle = v;
  ctx.fillRect(MAPA.x, MAPA.y, MAPA.w, MAPA.h);

  // Atribución obligatoria de OpenStreetMap
  const oA = { peso: 400, tam: 17, sombra: false, color: "rgba(7,24,44,.78)", alinear: "right" };
  escribir("© OpenStreetMap contributors", MAPA.x + MAPA.w - 20, MAPA.y + MAPA.h - 16, oA);
  ctx.restore();

  ctx.lineWidth = 3;
  trazo(MAPA.x, MAPA.y, MAPA.w, MAPA.h, MAPA.r);
  ctx.strokeStyle = "rgba(203,181,133,.55)";
  ctx.stroke();
  ctx.restore();

  // Qué hay cerca
  const lista = m.cerca || [];
  const oC = { peso: 500, tam: 38 };
  lista.forEach((c, i) => {
    const p = prog(lt, 1.15 + i * 0.22, 1.7 + i * 0.22);
    if (p <= 0) return;
    const e = salida(p);
    const y = MAPA.y + MAPA.h + 78 + i * 60;
    const a = clamp(p * 2) * sale;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(X + 22 - (1 - e) * 60, y - 12, 22, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_500;
    ctx.fill();
    ctx.restore();
    icono(c.icono, "navy", X + 22 - (1 - e) * 60, y - 12, 26, a);
    escribir(c.texto, X + 60 - (1 - e) * 60, y, { ...oC, alpha: a, sombra: false });
  });
}

// ── Tramo: precio ────────────────────────────────────────────

/**
 * Texto siguiendo un arco, centrado en `centro` (radianes). Arriba se lee
 * de izquierda a derecha por fuera del círculo; abajo también, con las
 * letras al derecho (si no, quedaría patas arriba).
 */
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

/** El sello de "dueño directo": cae con un golpe, una onda sale de él y un brillo lo cruza. */
function sello(cx, cy, r, lt, ini) {
  const p = prog(lt, ini, ini + 0.42);
  if (p <= 0) return;
  const escala = mezcla(2.4, 1, salida(p));
  ctx.save();
  ctx.translate(cx, cy);

  // Onda de choque al apoyarse
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

  const oArco = { peso: 600, tam: r * 0.165, color: GOLD_400, espaciado: r * 0.03 };
  arcoTexto("DUEÑO DIRECTO", r * 0.805, -Math.PI / 2, false, oArco);
  arcoTexto("SIN COMISIÓN", r * 0.805, Math.PI / 2, true, oArco);
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.translate(lado * r * 0.805, 0);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = GOLD_500;
    ctx.fillRect(-r * 0.03, -r * 0.03, r * 0.06, r * 0.06);
    ctx.restore();
  }

  escribir("EN", 0, r * 0.2, { peso: 700, familia: SERIF, tam: r * 0.56, color: GOLD_400, alinear: "center", sombra: false });

  // Brillo que cruza el sello una vez, apenas apoyado
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

function dibujarPrecio(seg, t) {
  const p = seg.precio;
  const lt = t - seg.ini;
  const cx = W / 2;
  const sale = 1 - prog(lt, seg.dur - 0.32, seg.dur - 0.04);

  const z = 1 + 0.05 * prog(lt, 0, seg.dur + TR);
  ctx.drawImage(velada, (W - W * z) / 2, (H - H * z) / 2, W * z, H * z);

  sello(cx, 520, 150, lt, 0.2);

  enMascara(p.lugar, cx, 770, { peso: 500, estilo: "italic", familia: SERIF, tam: 62, alinear: "center" }, entra(lt, 0.5, 0.6), sale);
  enMascara(p.rotulo.toUpperCase(), cx, 846, { peso: 600, tam: 30, espaciado: 8, color: GOLD_400, alinear: "center" }, entra(lt, 0.62, 0.5), sale);

  // El precio cuenta hasta su valor
  const formato = n => `${p.moneda} ${n.toLocaleString("es-AR")}`;
  const oV = { peso: 700, familia: SERIF, tam: 190, alinear: "center" };
  const e2 = entra(lt, 0.7, 0.5);
  ctx.save();
  ctx.translate(cx, 1030);
  ctx.scale(0.95 + 0.05 * e2, 0.95 + 0.05 * e2);
  // El tamaño se mide con el precio final, para que no cambie mientras cuenta
  escribir(formato(Math.round(p.valor * expo(prog(lt, 0.7, 1.75)))), 0, 0, {
    ...oV, tam: ajustar(formato(p.valor), oV, 920), alpha: e2 * sale,
  });
  ctx.restore();

  const e3 = entra(lt, 1.4, 0.5);
  filete(cx - 60 * e3, 1086, 120 * e3, e3 * sale);

  (p.notas || []).forEach((nota, i) => {
    const e = entra(lt, 1.55 + i * 0.2);
    const o = { peso: 500, tam: 45 };
    const y = 1170 + i * 80 + (1 - e) * 34;
    const w = ancho(nota, o);
    ctx.save();
    ctx.globalAlpha = e * sale;
    ctx.fillStyle = GOLD_500;
    ctx.translate(cx - w / 2 - 34, y - 15);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    escribir(nota, cx + 8, y, { ...o, alinear: "center", alpha: e * sale });
  });
}

// ── Tramo: cierre ────────────────────────────────────────────

function dibujarCierre(seg, t) {
  const c = seg.cierre;
  const lt = t - seg.ini;
  const cx = W / 2;

  ctx.fillStyle = crema;
  ctx.fillRect(0, 0, W, H);

  const e0 = entra(lt, 0.15, 0.7);
  const lw = 720, lh = lw * logo.height / logo.width;
  ctx.save();
  ctx.globalAlpha = e0;
  ctx.translate(cx, 330 + lh / 2);
  ctx.scale(0.94 + 0.06 * e0, 0.94 + 0.06 * e0);
  ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
  ctx.restore();

  const oT = { peso: 600, familia: SERIF, tam: 66, color: NAVY_800, sombra: false, alinear: "center" };
  enMascara(c.titulo, cx, 1090, { ...oT, tam: ajustar(c.titulo, oT, 920) }, entra(lt, 0.4, 0.6));
  enMascara(c.rotulo.toUpperCase(), cx, 1166, { peso: 600, tam: 29, espaciado: 6, color: GOLD_700, alinear: "center", sombra: false }, entra(lt, 0.52, 0.5));

  // Botón con brillo que lo recorre
  const ep = rebote(prog(lt, 0.7, 1.2));
  if (ep > 0 && c.boton) {
    const o = { peso: 600, tam: 40 };
    const w = ancho(c.boton, o) + 150, h = 112, y = 1240;
    ctx.save();
    ctx.globalAlpha = clamp(ep * 1.5);
    ctx.translate(cx, y + h / 2);
    ctx.scale(0.8 + 0.2 * ep, 0.8 + 0.2 * ep);
    ctx.translate(-cx, -(y + h / 2));
    ctx.shadowColor = "rgba(14,44,80,.35)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    trazo(cx - w / 2, y, w, h, h / 2);
    ctx.fillStyle = NAVY_800;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.save();
    trazo(cx - w / 2, y, w, h, h / 2);
    ctx.clip();
    const brillo = mezcla(-200, w + 200, prog(lt, 1.15, 1.9));
    const g = ctx.createLinearGradient(cx - w / 2 + brillo - 90, 0, cx - w / 2 + brillo + 90, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.restore();
    escribir(c.boton, cx - 28, y + h / 2 + 14, { ...o, alinear: "center", sombra: false });
    icono("arrow-right", "blanco", cx - 28 + ancho(c.boton, o) / 2 + 40, y + h / 2, 40);
    ctx.restore();
  }
}

// ── Fijo en pantalla: marca y barra de datos ─────────────────

function dibujarMarca(t) {
  const cierre = segs.find(s => s.tipo === "cierre");
  const a = entra(t, 0.25) * (1 - prog(t, cierre.ini - 0.1, cierre.ini + 0.25));
  if (a <= 0.001) return;
  escribir("ESPACIO INMOBILIARIO", X, MARCA_Y, { peso: 600, tam: 29, espaciado: 7, alpha: a });
  filete(X, MARCA_Y + 22, 64 * a, a);
}

function dibujarPie(t, seg) {
  const celdas = guion.pie || [];
  if (!celdas.length) return;
  const cierre = segs.find(s => s.tipo === "cierre");
  const baja = Math.pow(prog(t, cierre.ini - 0.1, cierre.ini + 0.45), 2);
  const sube = 1 - salida(prog(t, 0.7, 1.4));
  const dy = sube * 280 + baja * 660;                // la sombra también tiene que salir
  if (baja >= 1) return;

  const { x, y, w, h } = PIE;
  ctx.save();
  ctx.translate(0, dy);

  ctx.shadowColor = "rgba(3,10,20,.55)";
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 14;
  trazo(x, y, w, h, 36);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "rgba(10,32,56,.9)");
  g.addColorStop(1, "rgba(7,24,44,.95)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(203,181,133,.4)";
  ctx.stroke();

  // El dato del que habla la escena se enciende
  const luz = seg.resalta ? suave(prog(t, seg.ini + 0.4, seg.ini + 0.95)) * (1 - prog(t, seg.fin - 0.25, seg.fin)) : 0;

  const cw = (w - 40) / celdas.length;
  celdas.forEach((c, i) => {
    const cx = x + 20 + cw * (i + 0.5);
    const p = prog(t, 0.95 + i * 0.1, 1.5 + i * 0.1);
    if (p <= 0) return;
    const e = rebote(p);
    const a = clamp(p * 2);
    const act = c.id === seg.resalta ? luz : 0;

    if (act > 0.01) {
      trazo(cx - cw / 2 + 5, y + 12, cw - 10, h - 32, 24);
      ctx.fillStyle = `rgba(185,159,102,${0.3 * act})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(203,181,133,${0.65 * act})`;
      ctx.stroke();
    }
    if (i > 0) {
      ctx.fillStyle = "rgba(203,181,133,.2)";
      ctx.fillRect(x + 20 + cw * i - 1, y + 28, 2, h - 72);
    }

    // Entra con un pequeño rebote; el dato resaltado crece un poco (ícono y número, no la etiqueta)
    const entrada = mezcla(0.6, 1, e);
    const crece = 1 + 0.14 * act;
    ctx.save();
    ctx.translate(cx, y + h / 2);
    ctx.scale(entrada, entrada);
    ctx.translate(-cx, -(y + h / 2));

    ctx.save();
    ctx.translate(cx, y + 52);
    ctx.scale(crece, crece);
    ctx.translate(-cx, -(y + 52));
    icono(c.icono, "oro", cx, y + 52, 42, a);
    if (act > 0.01) icono(c.icono, "blanco", cx, y + 52, 42, act);
    ctx.restore();

    const num = typeof c.valor === "number"
      ? Math.round(c.valor * expo(prog(t, 1.0 + i * 0.1, 1.9 + i * 0.1))).toLocaleString("es-AR")
      : String(c.valor);
    const oV = { peso: 600, tam: 48 };
    const oU = { peso: 500, tam: 28 };
    const wN = ancho(num, oV), wU = c.unidad ? ancho(` ${c.unidad}`, oU) : 0;
    const x0 = cx - (wN + wU) / 2;
    ctx.save();
    ctx.translate(cx, y + 94);
    ctx.scale(crece, crece);
    ctx.translate(-cx, -(y + 94));
    escribir(num, x0, y + 108, { ...oV, alpha: a, sombra: false });
    if (c.unidad) escribir(` ${c.unidad}`, x0 + wN, y + 108, { ...oU, alpha: a, sombra: false });
    ctx.restore();
    escribir(c.rotulo.toUpperCase(), cx, y + 136, { peso: 500, tam: 18, espaciado: 2, color: GOLD_400, alinear: "center", alpha: a, sombra: false });
    ctx.restore();
  });

  // Avance del video
  const bx = x + 40, bw = w - 80;
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(bx, y + h - 9, bw, 3);
  ctx.fillStyle = GOLD_500;
  ctx.fillRect(bx, y + h - 9, bw * clamp(t / TOTAL), 3);

  ctx.restore();
}

// ── Composición ──────────────────────────────────────────────

const indiceSeg = t => Math.max(0, segs.findLastIndex(s => t >= s.ini));

function dibujarSegmento(seg, t) {
  if (seg.tipo === "foto") dibujarFoto(seg, t);
  else if (seg.tipo === "mapa") dibujarMapa(seg, t);
  else if (seg.tipo === "precio") dibujarPrecio(seg, t);
  else dibujarCierre(seg, t);
}

/** Línea de corte del barrido: sube en diagonal y deja entrar el tramo nuevo. */
function corte(e) {
  const caida = W * 0.1;
  const Y = H * 1.12 - e * H * 1.36;
  return [[0, Y + caida], [W, Y - caida]];
}

/** Dibuja el cuadro que corresponde al segundo `t`. */
function cuadro(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = NAVY_950;
  ctx.fillRect(0, 0, W, H);

  const k = indiceSeg(t);
  const seg = segs[k];

  if (k > 0 && t < seg.ini + TR) {
    dibujarSegmento(segs[k - 1], t);
    const e = suave(prog(t, seg.ini, seg.ini + TR));
    const [[x0, y0], [x1, y1]] = corte(e);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(W, H + 300);
    ctx.lineTo(0, H + 300);
    ctx.closePath();
    ctx.clip();
    dibujarSegmento(seg, t);
    ctx.restore();

    // Filo dorado con resplandor sobre el borde del barrido
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
    dibujarSegmento(seg, t);
  }

  dibujarMarca(t);
  dibujarPie(t, seg);
}

// ── Preparación ──────────────────────────────────────────────

function armarSegmentos() {
  const total = guion.duracion ?? DURACION_BASE;
  const k = total / DURACION_BASE;
  const d = {
    ...Object.fromEntries(Object.entries(DURACIONES).map(([tramo, s]) => [tramo, s * k])),
    ...(guion.duraciones || {}),
  };
  const fotosEscena = guion.escenas || [];
  const conMapa = !!guion.mapa;
  const resto = total - d.apertura - (conMapa ? d.mapa : 0) - d.precio - d.cierre;
  const porEscena = fotosEscena.length ? resto / fotosEscena.length : 0;

  const lista = [];
  let t = 0;
  const poner = (tipo, dur, datos) => {
    lista.push({ tipo, ini: t, fin: t + dur, dur, ...datos });
    t += dur;
  };

  const a = guion.apertura;
  poner("foto", d.apertura, { n: 0, foto: a.foto, rotulo: a.rotulo, titulo: a.titulo, bajada: a.bajada, chips: a.chips, resalta: a.resalta, tamMax: 168 });
  fotosEscena.forEach((e, i) =>
    poner("foto", porEscena, { n: i + 1, foto: e.foto, titulo: e.titulo, bajada: e.bajada, chips: e.chips, resalta: e.resalta, tamMax: 128 }));
  if (conMapa) poner("mapa", d.mapa, { mapa: guion.mapa });
  poner("precio", d.precio, { precio: guion.precio });
  poner("cierre", d.cierre, { cierre: guion.cierre });
  return { lista, total: t };
}

async function preparar() {
  guion = await (await fetch("/guion.json")).json();

  await Promise.all([
    '700 100px "Playfair Display"', '600 100px "Playfair Display"', 'italic 500 100px "Playfair Display"',
    '400 50px "Outfit"', '500 50px "Outfit"', '600 50px "Outfit"',
  ].map(f => document.fonts.load(f, "Espacio Inmobiliario ñ á ² · $ ©")));

  ({ lista: segs, total: TOTAL } = armarSegmentos());

  // Solo las fotos que el guion usa
  const usadas = [...new Set([
    guion.apertura.foto, guion.precio.foto,
    ...(guion.escenas || []).map(e => e.foto),
  ])];
  laminas = {};
  await Promise.all(usadas.map(async i => { laminas[i] = armarLamina(await cargarImagen(`/foto/${i}`)); }));
  velada = armarVelada(laminas[guion.precio.foto]);

  // Íconos: los que nombra el guion, cada uno en los colores con que se usa
  iconos = {};
  const nombres = new Set(["map-pin", "arrow-right"]);
  for (const c of guion.pie || []) nombres.add(c.icono);
  for (const c of [guion.apertura, ...(guion.escenas || [])]) for (const f of c.chips || []) nombres.add(f.icono);
  for (const f of guion.mapa?.cerca || []) nombres.add(f.icono);
  await Promise.all([...nombres].flatMap(n => Object.entries(COL).map(async ([clave, color]) => {
    iconos[`${n}|${clave}`] = await cargarIcono(n, color);
  })));

  const imagenLogo = await cargarImagen("/logo.png");
  crema = colorDelBorde(imagenLogo);
  logo = armarLogo(imagenLogo);

  if (guion.mapa) mapa = await cargarMapa(guion.mapa);

  cuadro(0);
  return {
    fotos: usadas.length, iconos: nombres.size, tiles: mapa?.tiles.size ?? 0, duracion: TOTAL,
    tramos: segs.map(s => `${s.tipo === "foto" ? (s.n === 0 ? "apertura" : `escena ${s.n}`) : s.tipo} ${s.ini.toFixed(1)}–${s.fin.toFixed(1)} s`),
  };
}

// ── Salida ───────────────────────────────────────────────────

function vistaPrevia(t) {
  cuadro(t);
  return lienzo.toDataURL("image/jpeg", 0.9);
}

async function elegirCodec() {
  // High, Main y Baseline, nivel 4.0 (lo mínimo para 1080x1920 a 30 cuadros)
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

/** Codifica el video entero y se lo pasa a render.mjs en trozos. */
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
