import Link from "next/link";
import { Check, Plus, ArrowRight } from "lucide-react";
import SelloEN from "@/components/SelloEN";
import FirmaTrazo from "@/components/FirmaTrazo";
import FadeIn from "@/components/ui/FadeIn";
import Guilloche from "@/components/ui/Guilloche";
import Reveal from "@/components/como-funciona/Reveal";
import { PROTOCOLO } from "@/lib/protocolo";
import "./respaldo.css";

const WHATSAPP = "5491164519421";

/**
 * Respaldo profesional: quién responde, con pruebas en vez de adjetivos.
 *
 * La metáfora es el papel notarial, que es el idioma de la confianza en
 * una operación inmobiliaria: un documento con marco doble, cláusulas
 * numeradas, el sello EN estampado en la esquina sobre un guilloché (el
 * entramado de billetes y escrituras) y la firma de Eugenio que se
 * dibuja al pie. A la izquierda, la carta; a la derecha, lo firmado.
 *
 * Las cuatro cláusulas salen de lib/protocolo.ts, la misma fuente que la
 * franja del footer: cada una es algo que el sistema hace de verdad. La
 * experiencia se transmite con precisión, no con cifras infladas.
 *
 * El vocabulario visual vive en respaldo.css, al lado de este archivo
 * (prefijo .rs-; el guilloché trae el suyo, .gq-), y es el punto de
 * partida del rediseño del resto del sitio.
 */

/** Lo que se sostiene en el tiempo; la cinta lo repite sin apuro. */
const VALORES = ["Criterio", "Transparencia", "Discreción", "Palabra", "Compromiso", "Trato directo"];

export default function Respaldo() {
  const anio = new Date().getFullYear();

  return (
    <section className="rs" aria-labelledby="rs-titulo">
      <div className="rs-luz" aria-hidden="true" />

      <div className="rs-in">
        {/* ── La carta ─────────────────────────────────────────── */}
        <div className="rs-carta">
          <FadeIn direction="up">
            <span className="rs-eyebrow">Respaldo profesional</span>
            <h2 id="rs-titulo" className="rs-t">
              Detrás de cada operación, <em>una firma que responde.</em>
            </h2>
          </FadeIn>

          <FadeIn delay={120} direction="up">
            <p className="rs-lead">
              Espacio Inmobiliario es un portal, pero no funciona en piloto
              automático. Cada publicación pasa por las manos de{" "}
              <strong>Eugenio Nielsen</strong> antes de salir, y cada operación
              tiene a alguien que la acompaña hasta la escritura.
            </p>
            <p className="rs-cita">
              Del otro lado no hay un algoritmo ni un call center: hay una
              persona con nombre y apellido que da la cara por lo que se publica.
            </p>
          </FadeIn>

          {/* El CTA de publicar vive acá desde que se fue el bloque que
              repetía el camino "Quiero vender": no se pierde la conversión. */}
          <FadeIn delay={220} direction="up">
            <div className="rs-ctas">
              <Link href="/auth/registro" className="rs-cta rs-cta-lleno">
                <Plus size={15} strokeWidth={2} />
                Publicar mi propiedad gratis
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rs-cta rs-cta-texto"
              >
                Hablar con Eugenio
                <ArrowRight size={15} strokeWidth={1.8} />
              </a>
            </div>
          </FadeIn>
        </div>

        {/* ── El documento ─────────────────────────────────────── */}
        <div className="rs-doc-wrap">
          <Guilloche id="rs-gq" className="rs-gq" />

          <Reveal className="rs-doc">
            <SelloEN size={148} tono="claro" etiqueta="Fundador" className="rs-sello" />

            <header className="rs-doc-head">
              <span className="rs-doc-kicker">Protocolo de respaldo</span>
              <h3 className="rs-doc-t">
                Cuatro compromisos, <em>una sola firma</em>
              </h3>
            </header>
            <div className="rs-doble" aria-hidden="true" />

            <ol className="rs-clausulas">
              {PROTOCOLO.map((c, i) => (
                <li key={c.t} className="rs-clausula" style={{ ["--i" as string]: i }}>
                  <span className="rs-num" aria-hidden="true">{c.n}</span>
                  <div>
                    <h4 className="rs-clausula-t">{c.t}</h4>
                    <p className="rs-clausula-d">{c.d}</p>
                  </div>
                  <span className="rs-tick" aria-hidden="true">
                    <Check size={13} strokeWidth={2.2} />
                  </span>
                </li>
              ))}
            </ol>

            <footer className="rs-doc-pie">
              <div>
                <div className="cf-firma rs-firma">
                  <FirmaTrazo height={52} grosor={3.4} color="var(--gold-600)" />
                </div>
                <p className="rs-firma-nombre">Eugenio Nielsen</p>
                <p className="rs-firma-rol">Fundador · Espacio Inmobiliario</p>
              </div>
              <p className="rs-lugar">
                Buenos Aires
                <span>{anio}</span>
              </p>
            </footer>
          </Reveal>
        </div>
      </div>

      {/* ── Cinta de valores ─────────────────────────────────────
          Dos pistas idénticas: cuando la primera termina de salir,
          la segunda ocupa su lugar y el loop no tiene costura. */}
      <div className="rs-cinta" aria-hidden="true">
        {[0, 1].map(pista => (
          <div key={pista} className="rs-cinta-pista">
            {VALORES.map(v => (
              <span key={v} className="rs-cinta-item">
                {v}
                <i className="rs-rombo" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
