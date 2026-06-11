"use client";

import { useMemo } from "react";

// ---------------------------------------------------------------
// Skyline vivo — animación ambiental del hero.
// Tres capas de movimiento continuo y sutil, todo CSS-only:
//  1. Ventanas que se encienden/apagan (la ciudad "respira")
//  2. Nubes blureadas en deriva horizontal a 3 velocidades
//  3. Pins de propiedades flotando sobre algunos edificios
// Sin Math.random: pseudo-random determinístico por índice para
// que el SSR y el cliente rendericen exactamente lo mismo.
// ---------------------------------------------------------------

function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface BuildingDef {
  x: number; w: number; h: number; cols: number; rows: number; pin: boolean;
}

const BUILDINGS: BuildingDef[] = [
  { x: 0,    w: 90,  h: 150, cols: 4, rows: 7,  pin: false },
  { x: 100,  w: 70,  h: 220, cols: 3, rows: 10, pin: true  },
  { x: 180,  w: 110, h: 130, cols: 5, rows: 6,  pin: false },
  { x: 300,  w: 80,  h: 260, cols: 3, rows: 12, pin: false },
  { x: 390,  w: 130, h: 180, cols: 6, rows: 8,  pin: true  },
  { x: 530,  w: 75,  h: 240, cols: 3, rows: 11, pin: false },
  { x: 615,  w: 100, h: 160, cols: 4, rows: 7,  pin: false },
  { x: 725,  w: 85,  h: 290, cols: 3, rows: 13, pin: true  },
  { x: 820,  w: 120, h: 140, cols: 5, rows: 6,  pin: false },
  { x: 950,  w: 70,  h: 200, cols: 3, rows: 9,  pin: false },
  { x: 1030, w: 95,  h: 170, cols: 4, rows: 8,  pin: false },
  { x: 1135, w: 65,  h: 230, cols: 2, rows: 10, pin: true  },
];

function Building({ b, index }: { b: BuildingDef; index: number }) {
  const windows = useMemo(() => {
    const list: { x: number; y: number; w: number; h: number; mode: "blink" | "on" | "off"; delay: number; dur: number }[] = [];
    const padX = 8;
    const padTop = 12;
    const gapX = (b.w - padX * 2) / b.cols;
    const gapY = (b.h - padTop - 8) / b.rows;
    let id = 0;
    for (let r = 0; r < b.rows; r++) {
      for (let c = 0; c < b.cols; c++) {
        const rnd = seeded(index * 1000 + id);
        list.push({
          x: b.x + padX + c * gapX + gapX * 0.18,
          y: 320 - b.h + padTop + r * gapY,
          w: gapX * 0.55,
          h: gapY * 0.5,
          // ~40% titilan; el resto queda fija (encendida o apagada)
          mode: rnd < 0.4 ? "blink" : rnd < 0.65 ? "on" : "off",
          delay: seeded(index * 2000 + id) * 14,
          dur: 8 + seeded(index * 3000 + id) * 10,
        });
        id++;
      }
    }
    return list;
  }, [b, index]);

  return (
    <g>
      <rect x={b.x} y={320 - b.h} width={b.w} height={b.h} fill="var(--sk-building)" rx="2" />
      {windows.map((w, i) => (
        <rect
          key={i}
          x={w.x} y={w.y} width={w.w} height={w.h} rx="0.5"
          className={w.mode === "blink" ? "sk-window-blink" : ""}
          fill={w.mode === "off" ? "var(--sk-window-off)" : "var(--sk-window-on)"}
          style={
            w.mode === "blink"
              ? { animationDelay: `${w.delay.toFixed(2)}s`, animationDuration: `${w.dur.toFixed(2)}s` }
              : undefined
          }
        />
      ))}
      {b.pin && (
        <g className="sk-pin" style={{ animationDelay: `${(seeded(index * 77) * 3).toFixed(2)}s` }}>
          <g transform={`translate(${b.x + b.w / 2}, ${320 - b.h - 26})`}>
            <path
              d="M0,-14 C-7,-14 -11,-9 -11,-4 C-11,2 0,12 0,12 C0,12 11,2 11,-4 C11,-9 7,-14 0,-14 Z"
              fill="var(--sk-pin)"
            />
            <circle cx="0" cy="-4.5" r="3.6" fill="var(--sk-pin-dot)" />
          </g>
        </g>
      )}
    </g>
  );
}

/**
 * Capa ambiental para el fondo del hero. Se posiciona absoluta sobre
 * todo el section (que debe tener position:relative + overflow:hidden)
 * y no captura interacciones.
 */
export default function SkylineVivo() {
  return (
    <div className="sk-root" aria-hidden="true">
      <style>{`
        .sk-root {
          /* Paleta del proyecto (globals.css) */
          --sk-building:   var(--navy-950);
          --sk-window-on:  rgba(217, 201, 161, 0.85); /* gold-300 */
          --sk-window-off: rgba(255, 255, 255, 0.05);
          --sk-pin:        var(--gold-500);
          --sk-pin-dot:    var(--navy-950);
          --sk-cloud:      rgba(255, 255, 255, 0.05);
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        /* 1. Ventanas que titilan */
        .sk-window-blink {
          animation-name: sk-blink;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @keyframes sk-blink {
          0%, 38%   { fill: var(--sk-window-off); }
          45%, 88%  { fill: var(--sk-window-on); }
          95%, 100% { fill: var(--sk-window-off); }
        }

        /* 2. Nubes en deriva continua */
        .sk-cloud {
          position: absolute;
          background: var(--sk-cloud);
          border-radius: 999px;
          filter: blur(18px);
          animation: sk-drift linear infinite;
        }
        @keyframes sk-drift {
          from { transform: translateX(-30vw); }
          to   { transform: translateX(110vw); }
        }

        /* 3. Pins flotando */
        .sk-pin {
          animation: sk-float 4.5s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes sk-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }

        .sk-skyline {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 44%;
          min-height: 170px;
          opacity: 0.55;
        }

        /* Accesibilidad: sin motion si el usuario lo pide */
        @media (prefers-reduced-motion: reduce) {
          .sk-window-blink, .sk-cloud, .sk-pin { animation: none; }
        }
      `}</style>

      {/* Nubes — tres capas, velocidades distintas */}
      <div className="sk-cloud" style={{ top: "12%", width: 260, height: 60, animationDuration: "90s" }} />
      <div className="sk-cloud" style={{ top: "26%", width: 380, height: 80, animationDuration: "140s", animationDelay: "-50s" }} />
      <div className="sk-cloud" style={{ top: "7%", width: 180, height: 46, animationDuration: "70s", animationDelay: "-20s" }} />

      {/* Skyline */}
      <svg className="sk-skyline" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice">
        {BUILDINGS.map((b, i) => (
          <Building key={i} b={b} index={i} />
        ))}
        <rect x="0" y="318" width="1200" height="2" fill="var(--sk-building)" />
      </svg>
    </div>
  );
}
