"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, RotateCcw } from "lucide-react";
import SelloEN from "@/components/SelloEN";
import FirmaTrazo from "@/components/FirmaTrazo";
import Guilloche from "@/components/ui/Guilloche";
import type { EstimadorInput, EstimadorResultado, FactorAplicado, NivelConfianza } from "@/lib/estimador/types";

const WHATSAPP = "5491164519421";
const PRECISION: Record<NivelConfianza, string> = { baja: "Baja", media: "Media", alta: "Alta" };

const usd = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)}`;
const pct = (coef: number) => {
  const v = (coef - 1) * 100;
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
};

/** Cuenta desde cero hasta el valor. Termina siempre en el número exacto. */
function useContador(final: number, dur = 1800, retardo = 700) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(final);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + retardo;
    const paso = (t: number) => {
      const x = Math.min(1, Math.max(0, (t - t0) / dur));
      setN(Math.round(final * (1 - Math.pow(1 - x, 4))));
      if (x < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    // Si la pestaña está en segundo plano el rAF no corre: el número
    // igual tiene que quedar bien
    const fin = setTimeout(() => setN(final), retardo + dur + 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(fin); };
  }, [final, dur, retardo]);
  return n;
}

/**
 * El informe: la estimación emitida como un documento.
 *
 * Arriba, la carátula nocturna con el valor que cuenta hasta su número,
 * el rango dibujado como una regla y el sello estampado sobre el
 * guilloché, con número de estimación y fecha. Abajo, el papel: cómo se
 * llegó al valor en cuatro cláusulas, lo que suma y lo que resta, y la
 * firma de Eugenio, que revisa cada estimación.
 *
 * Es orientativa y lo dice: no se presenta como una tasación profesional.
 */
export default function Informe({
  input,
  resultado,
  nombre,
  onOtra,
}: {
  input: EstimadorInput;
  resultado: EstimadorResultado & { estimacionId?: string | null };
  nombre: string;
  onOtra: () => void;
}) {
  const valor = useContador(resultado.estimado);
  const firma = useRef<HTMLDivElement>(null);
  const [firmado, setFirmado] = useState(false);

  // La firma se dibuja cuando llega a la pantalla
  useEffect(() => {
    const el = firma.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setFirmado(true); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const numero = resultado.estimacionId?.slice(0, 8).toUpperCase();
  const fecha = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  const span = resultado.rangoMax - resultado.rangoMin;
  const marca = span > 0 ? ((resultado.estimado - resultado.rangoMin) / span) * 100 : 50;
  const ajuste = resultado.ajustePct;

  return (
    <article className="ts-informe" aria-labelledby="ts-inf-valor">
      {/* ── La carátula ───────────────────────────────────────── */}
      <section className="ts-caratula">
        <Guilloche id="ts-gq-informe" className="ts-caratula-gq" />
        <SelloEN size={132} tono="oscuro" etiqueta="" className="ts-caratula-sello" />

        <div className="ts-caratula-in">
          <p className="ts-caratula-k">
            Estimación de valor{numero && <> · <span>N.º {numero}</span></>}
          </p>
          <p className="ts-caratula-lugar">
            {input.barrio}, Buenos Aires · {fecha}
          </p>

          <p className="ts-caratula-rot">Valor estimado</p>
          <p id="ts-inf-valor" className="ts-valor" aria-label={usd(resultado.estimado)}>
            <span aria-hidden="true">{usd(valor)}</span>
          </p>

          {/* El rango, como una regla: los extremos y el valor en su lugar */}
          <div className="ts-regla" style={{ ["--marca" as string]: `${marca}%` }}>
            <div className="ts-regla-linea" aria-hidden="true">
              <span className="ts-regla-rombo" />
            </div>
            <div className="ts-regla-extremos">
              <span><small>Desde</small>{usd(resultado.rangoMin)}</span>
              <span><small>Hasta</small>{usd(resultado.rangoMax)}</span>
            </div>
          </div>

          <dl className="ts-datos">
            <div><dt>Por metro cuadrado</dt><dd>{usd(resultado.precioM2Resultante)}</dd></div>
            <div><dt>Precisión</dt><dd>{PRECISION[resultado.confianza]}</dd></div>
            <div><dt>Superficie cubierta</dt><dd>{new Intl.NumberFormat("es-AR").format(input.m2Cubiertos)} m²</dd></div>
          </dl>
        </div>
      </section>

      {/* ── El papel ──────────────────────────────────────────── */}
      <section className="ts-papel">
        <header className="ts-papel-cab">
          <span className="ts-ficha-k">Fundamentos</span>
          <h3 className="ts-papel-t">Cómo llegamos <em>a este valor</em></h3>
        </header>
        <div className="ts-doble" aria-hidden="true" />

        <ol className="ts-clausulas">
          <li style={{ ["--i" as string]: 0 }}>
            <span className="ts-cl-n">I</span>
            <div>
              <h4>Referencia del barrio</h4>
              <p>El valor del metro cuadrado en {input.barrio}{input.condicionObra !== "usado" ? ", ajustado por ser " + (input.condicionObra === "pozo" ? "en pozo" : "a estrenar") : ""}.</p>
            </div>
            <strong>{usd(resultado.precioM2Referencia)}/m²</strong>
          </li>
          <li style={{ ["--i" as string]: 1 }}>
            <span className="ts-cl-n">II</span>
            <div>
              <h4>Valor base por superficie</h4>
              <p>La superficie cubierta a valor pleno; balcón y patio o terraza, ponderados.</p>
            </div>
            <strong>{usd(resultado.valorBase)}</strong>
          </li>
          <li style={{ ["--i" as string]: 2 }}>
            <span className="ts-cl-n">III</span>
            <div>
              <h4>Ajustes de la unidad</h4>
              <p>Lo que la distingue del promedio del barrio, combinado en un solo índice.</p>
            </div>
            <strong data-signo={ajuste > 0 ? "mas" : ajuste < 0 ? "menos" : "cero"}>
              {ajuste > 0 ? "+" : ajuste < 0 ? "−" : ""}{Math.abs(ajuste)}%
            </strong>
          </li>
          <li style={{ ["--i" as string]: 3 }} className="ts-cl-final">
            <span className="ts-cl-n">IV</span>
            <div>
              <h4>Valor estimado</h4>
              <p>Con un rango según la precisión de los datos.</p>
            </div>
            <strong>{usd(resultado.estimado)}</strong>
          </li>
        </ol>

        <div className="ts-factores">
          <Factores t="Lo que suma" factores={resultado.factoresPositivos} vacio="Ningún factor por encima del promedio." />
          <Factores t="Lo que resta" factores={resultado.factoresNegativos} vacio="Ningún factor por debajo del promedio." />
        </div>

        {/* ── La firma ─────────────────────────────────────── */}
        <footer className="ts-firma-bloque">
          <div className="ts-firma-txt">
            <p className="ts-firma-t">
              {nombre ? `${nombre}, ` : ""}Eugenio va a revisar <em>tu estimación</em>
            </p>
            <p>
              Ya tenemos tus datos: se va a contactar con vos para repasarla sin cargo
              y contarte qué esperar del mercado en tu zona.
            </p>
            <div className="ts-ctas">
              <Link href="/auth/registro" className="ts-cta">
                <Plus size={15} strokeWidth={2} />
                Publicar gratis
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Eugenio, hice una estimación en el tasador.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-cta-texto"
              >
                Hablar con Eugenio
                <ArrowRight size={15} strokeWidth={1.8} />
              </a>
            </div>
          </div>
          <div ref={firma} className="ts-firma">
            <div className={`cf-firma${firmado ? " is-in" : ""}`}>
              <FirmaTrazo height={56} grosor={3.2} color="var(--gold-600)" />
            </div>
            <p className="ts-firma-nombre">Eugenio Nielsen</p>
            <p className="ts-firma-rol">Fundador · Espacio Inmobiliario</p>
          </div>
        </footer>
      </section>

      <p className="ts-aviso">
        <strong>Importante:</strong> esta estimación es orientativa y no constituye una tasación profesional.
        Los valores pueden variar según condiciones particulares del inmueble, la demanda del mercado y el
        momento de comercialización.
      </p>

      <button type="button" className="ts-otra" onClick={onOtra}>
        <RotateCcw size={14} strokeWidth={1.8} />
        Hacer otra estimación
      </button>
    </article>
  );
}

function Factores({ t, factores, vacio }: { t: string; factores: FactorAplicado[]; vacio: string }) {
  return (
    <div className="ts-fac">
      <p className="ts-rotulo">{t}</p>
      {factores.length ? (
        <ul>
          {factores.map(f => (
            <li key={f.label}>
              <span>{f.label} <em>{f.detalle}</em></span>
              <b data-positivo={f.positivo}>{pct(f.coef)}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ts-fac-vacio">{vacio}</p>
      )}
    </div>
  );
}
