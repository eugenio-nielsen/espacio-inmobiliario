"use client";

import { useEffect } from "react";

/**
 * El movimiento del cuerpo de la nota. El texto llega como HTML ya
 * renderizado (Markdown), así que este componente no dibuja nada: al
 * montarse, busca adentro de `#idTexto` y:
 *
 *   · hace entrar suave, al llegar al scroll, subtítulos, citas, cifras,
 *     figuras, tablas y el "En corto";
 *   · cuenta hacia arriba las cifras de los bloques :::dato, respetando
 *     el formato argentino (6.051 · 31,2% · US$ 116.967);
 *   · cambia la miniatura de cada video por el reproductor recién al
 *     tocarla: la nota no carga YouTube hasta que alguien lo pide.
 *
 * Con prefers-reduced-motion todo queda quieto y visible.
 */
export default function MovimientoNota({ idTexto }: { idTexto: string }) {
  useEffect(() => {
    const raiz = document.getElementById(idTexto);
    if (!raiz) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Videos: la miniatura se cambia por el reproductor al tocarla
    const videos = [...raiz.querySelectorAll<HTMLElement>(".nt-video[data-src]")];
    const alTocar = (e: Event) => {
      const fig = (e.currentTarget as HTMLElement).closest<HTMLElement>(".nt-video");
      if (!fig?.dataset.src) return;
      const iframe = document.createElement("iframe");
      iframe.src = fig.dataset.src;
      iframe.title = fig.querySelector("figcaption")?.textContent || "Video";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      fig.querySelector("img")?.remove();
      fig.querySelector(".nt-video-play")?.replaceWith(iframe);
      fig.classList.add("is-reproduciendo");
    };
    const botones = videos.map(v => v.querySelector(".nt-video-play")).filter(Boolean) as HTMLElement[];
    botones.forEach(b => b.addEventListener("click", alTocar));

    if (quieto) return () => botones.forEach(b => b.removeEventListener("click", alTocar));

    // ── Entradas al scroll
    const piezas = [
      ...raiz.querySelectorAll<HTMLElement>(
        "h2, blockquote, .nt-dato, .nt-figura, .nt-video, .nt-tabla, .nt-en-corto, .nt-ancha"
      ),
    ];
    piezas.forEach(p => p.classList.add("nt-revelar"));

    const cifras = [...raiz.querySelectorAll<HTMLElement>(".nt-dato-v")];

    const obs = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("is-in");
          obs.unobserve(el);
          const cifra = el.querySelector<HTMLElement>(".nt-dato-v");
          if (cifra) contar(cifra);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    piezas.forEach(p => obs.observe(p));

    // Las cifras arrancan en cero hasta que entran
    cifras.forEach(c => {
      c.dataset.final = c.textContent ?? "";
      const partes = partir(c.dataset.final);
      if (partes) c.textContent = formatear(0, partes);
    });

    return () => {
      obs.disconnect();
      botones.forEach(b => b.removeEventListener("click", alTocar));
      cifras.forEach(c => { if (c.dataset.final) c.textContent = c.dataset.final; });
    };
  }, [idTexto]);

  return null;
}

type Partes = { antes: string; valor: number; decimales: number; despues: string; miles: boolean };

/** "US$ 116.967" → { antes: "US$ ", valor: 116967, … }. Formato argentino. */
function partir(texto: string): Partes | null {
  const m = texto.match(/^(.*?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/);
  if (!m) return null;
  const entero = Number(m[2].replace(/\./g, ""));
  const decimales = m[3]?.length ?? 0;
  const valor = entero + (decimales ? Number(`0.${m[3]}`) : 0);
  return { antes: m[1], valor, decimales, despues: m[4], miles: m[2].includes(".") || entero >= 1000 };
}

function formatear(n: number, p: Partes) {
  const txt = n.toLocaleString("es-AR", {
    minimumFractionDigits: p.decimales,
    maximumFractionDigits: p.decimales,
    useGrouping: p.miles,
  });
  return `${p.antes}${txt}${p.despues}`;
}

function contar(el: HTMLElement) {
  const final = el.dataset.final ?? "";
  const p = partir(final);
  if (!p) return;
  const inicio = performance.now();
  const dur = 1400;
  const paso = (t: number) => {
    const x = Math.min(1, (t - inicio) / dur);
    const suave = 1 - Math.pow(1 - x, 3);
    el.textContent = x < 1 ? formatear(p.valor * suave, p) : final;
    if (x < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
