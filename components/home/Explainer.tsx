import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import ExplainerVideo from "./ExplainerVideo";
import "./explainer.css";

/**
 * El recorrido en video: ocupa el lugar del viejo bloque "Ecosistema de
 * servicios", que había quedado desactualizado y fuera de la estética.
 * Usa el mismo vocabulario que Respaldo: marco doble con esquineros
 * dorados, Playfair con cursiva dorada y filetes finos.
 */
export default function Explainer() {
  return (
    <section className="ex" aria-labelledby="ex-titulo">
      <div className="ex-in">
        <FadeIn direction="up">
          <div className="ex-cab">
            <span className="ex-eyebrow">El recorrido</span>
            <h2 id="ex-titulo" className="ex-t">
              De la cuenta a la escritura, <em>paso a paso.</em>
            </h2>
            <p className="ex-lead">
              En poco más de un minuto: cómo crear tu cuenta, publicar tu propiedad,
              buscar, tasar y llevar tus operaciones desde un solo lugar.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={120} direction="up">
          <ExplainerVideo />
        </FadeIn>

        <FadeIn delay={200} direction="up">
          <div className="ex-ctas">
            <Link href="/propietarios/publicar" className="ex-cta">
              Publicar gratis <ArrowRight size={15} strokeWidth={2} />
            </Link>
            <Link href="/como-funciona" className="ex-cta-texto">
              Cómo funciona, en detalle <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
