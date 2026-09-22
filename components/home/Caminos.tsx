import Link from "next/link";
import { Search, Tag, TrendingUp, MessageCircle, ArrowRight } from "lucide-react";
import TarjetaViva from "@/components/ui/TarjetaViva";
import FadeIn from "@/components/ui/FadeIn";

/**
 * Las cuatro puertas de entrada de la home.
 *
 * Las tres primeras son intenciones concretas. La cuarta existe para
 * quien todavía no sabe en cuál de las tres está: sin ella, esa persona
 * no tiene dónde hacer clic y se va.
 *
 * En móvil van 2×2 y no apiladas: cuatro tarjetas en columna serían
 * cuatro pantallas de scroll antes de llegar a las propiedades.
 */
const CAMINOS = [
  {
    icon: Search,
    titulo: "Quiero comprar",
    texto: "Encontrá propiedades y analizá tus opciones con acompañamiento profesional.",
    cta: "Comprar con respaldo",
    href: "/comprar",
  },
  {
    icon: Tag,
    titulo: "Quiero vender",
    texto: "Conocé el valor de tu propiedad y definamos juntos la mejor estrategia para venderla.",
    cta: "Cómo vender",
    href: "/vender",
  },
  {
    icon: TrendingUp,
    titulo: "Quiero invertir",
    texto: "Analicemos cuándo conviene comprar o vender, según tus objetivos y el momento del mercado.",
    cta: "Quiero asesorarme",
    href: "/contacto?motivo=invertir",
  },
  {
    icon: MessageCircle,
    titulo: "Quiero asesoramiento",
    texto: "Comprar, vender o invertir. Si todavía no sabés por dónde empezar, conversemos primero.",
    cta: "Hablemos",
    href: "/contacto",
  },
];

export default function Caminos() {
  return (
    <div className="hm-caminos">
      {CAMINOS.map((c, i) => {
        const Icon = c.icon;
        return (
          <FadeIn key={c.titulo} delay={i * 90} direction="up">
            <TarjetaViva tono="claro" sheenDelay={i * 750} className="hm-camino">
              <span
                className="cf-card-icon"
                style={{ ["--sheen" as string]: `${i * 750}ms`, marginBottom: 16 }}
              >
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <h3 className="hm-camino-t">{c.titulo}</h3>
              <p className="hm-camino-p">{c.texto}</p>
              <Link href={c.href} className="hm-camino-cta">
                {c.cta}
                <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </TarjetaViva>
          </FadeIn>
        );
      })}
    </div>
  );
}
