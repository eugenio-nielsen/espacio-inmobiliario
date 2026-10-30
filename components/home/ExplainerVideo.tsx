"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * El explainer de la home. Pesa ~15 MB: no se descarga hasta que alguien
 * le da play (preload="none"); mientras tanto se ve el póster.
 *
 * CAPITULOS: segundos en que empieza cada parte. Salen del render
 * (promo/explainer/render.mjs imprime los tiempos de cada escena): si se
 * vuelve a renderizar el video con otra voz o guion, hay que actualizarlos.
 */
const CAPITULOS = [
  { t: "Tu cuenta", s: 11.6 },
  { t: "Publicar", s: 18.5 },
  { t: "Propiedades", s: 28.5 },
  { t: "Tasador", s: 38.9 },
  { t: "Tu panel", s: 46.5 },
  { t: "Herramientas", s: 62.6 },
];

export default function ExplainerVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [iniciado, setIniciado] = useState(false);
  const [activo, setActivo] = useState<number | null>(null);

  function reproducir(desde?: number) {
    const v = ref.current;
    if (!v) return;
    setIniciado(true);
    if (desde !== undefined) v.currentTime = desde;
    void v.play();
  }

  function alAvanzar() {
    const v = ref.current;
    if (!v) return;
    let k = -1;
    CAPITULOS.forEach((c, i) => { if (v.currentTime >= c.s - 0.1) k = i; });
    setActivo(k < 0 ? null : k);
  }

  return (
    <div className="ex-wrap">
      <div className="ex-marco">
        <div className="ex-pantalla">
          <video
            ref={ref}
            className="ex-video"
            controls={iniciado}
            playsInline
            preload="none"
            poster="/video/explainer-poster.jpg"
            aria-label="Recorrido por Espacio Inmobiliario: crear la cuenta, publicar, buscar propiedades, tasar y gestionar tu panel"
            onPlay={() => setIniciado(true)}
            onTimeUpdate={alAvanzar}
          >
            <source src="/video/explainer.mp4" type="video/mp4" />
          </video>
          {!iniciado && (
            <button type="button" className="ex-play" onClick={() => reproducir()} aria-label="Ver el recorrido">
              <span className="ex-play-aro" aria-hidden="true"><Play size={26} strokeWidth={1.8} fill="currentColor" /></span>
              <span className="ex-play-txt">Ver el recorrido · 1 min 20</span>
            </button>
          )}
        </div>
      </div>

      <ul className="ex-caps" aria-label="Ir a una parte del video">
        {CAPITULOS.map((c, i) => (
          <li key={c.t}>
            <button
              type="button"
              className={`ex-cap${activo === i ? " ex-cap-on" : ""}`}
              onClick={() => reproducir(c.s)}
            >
              <span className="ex-cap-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {c.t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
