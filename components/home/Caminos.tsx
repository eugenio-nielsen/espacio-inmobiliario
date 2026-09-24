import { Search, Tag, TrendingUp, MessageCircle } from "lucide-react";
import Indice, { type ItemIndice } from "@/components/ui/Indice";

/**
 * Las cuatro puertas de entrada de la home.
 *
 * Las tres primeras son intenciones concretas. La cuarta existe para
 * quien todavía no sabe en cuál de las tres está: sin ella, esa persona
 * no tiene dónde hacer clic y se va.
 *
 * Van como Índice (celdas con filete, la celda entera es el enlace). En
 * móvil pasan a filas compactas con el icono al margen: ocupan menos que
 * el 2×2 de tarjetas que había antes.
 */
const CAMINOS: ItemIndice[] = [
  {
    icon: Search,
    t: "Quiero comprar",
    d: "Encontrá propiedades y analizá tus opciones con acompañamiento profesional.",
    cta: "Comprar con respaldo",
    href: "/comprar",
  },
  {
    icon: Tag,
    t: "Quiero vender",
    d: "Conocé el valor de tu propiedad y definamos juntos la mejor estrategia para venderla.",
    cta: "Cómo vender",
    href: "/vender",
  },
  {
    icon: TrendingUp,
    t: "Quiero invertir",
    d: "Analicemos cuándo conviene comprar o vender, según tus objetivos y el momento del mercado.",
    cta: "Quiero asesorarme",
    href: "/contacto?motivo=invertir",
  },
  {
    icon: MessageCircle,
    t: "Quiero asesoramiento",
    d: "Comprar, vender o invertir. Si todavía no sabés por dónde empezar, conversemos primero.",
    cta: "Hablemos",
    href: "/contacto",
  },
];

export default function Caminos() {
  return <Indice items={CAMINOS} tono="claro" />;
}
