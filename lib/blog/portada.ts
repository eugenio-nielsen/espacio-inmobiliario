import {
  Calculator, Scale, Receipt, FileSignature, KeyRound, TrendingUp,
  Landmark, HandCoins, FileText, BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Portadas del blog.
 *
 * En vez de una foto de stock, cada nota se identifica con un ícono
 * sobre un fondo de la paleta. Queda más limpio, carga sin pedir una
 * imagen y no obliga a conseguir una foto por nota.
 *
 * El ícono se busca primero por slug (para las notas que ya existen)
 * y si no hay, se deduce de palabras del título. La categoría es el
 * último recurso: así una nota nueva ya sale con una portada decente
 * sin tocar este archivo.
 */
export type Portada = { icono: LucideIcon; tono: Tono };

/** Tonos disponibles, todos derivados de la paleta de la marca. */
export type Tono = "navy" | "gold" | "verde" | "ciruela" | "petroleo";

export const TONOS: Record<Tono, { fondo: string; trama: string; icono: string; halo: string }> = {
  navy: {
    fondo: "linear-gradient(135deg, #0E2C50 0%, #173A63 55%, #234C7A 100%)",
    trama: "rgba(185,159,102,.16)",
    icono: "#E8DFC8",
    halo:  "rgba(185,159,102,.20)",
  },
  gold: {
    fondo: "linear-gradient(135deg, #8C7641 0%, #A4894E 55%, #B99F66 100%)",
    trama: "rgba(255,255,255,.14)",
    icono: "#FFF8EA",
    halo:  "rgba(255,255,255,.18)",
  },
  verde: {
    fondo: "linear-gradient(135deg, #1B4332 0%, #24614A 55%, #2F7A52 100%)",
    trama: "rgba(203,226,213,.16)",
    icono: "#DCF0E5",
    halo:  "rgba(203,226,213,.20)",
  },
  ciruela: {
    fondo: "linear-gradient(135deg, #3B2A45 0%, #52395F 55%, #6D4B7D 100%)",
    trama: "rgba(255,255,255,.12)",
    icono: "#EFE4F5",
    halo:  "rgba(255,255,255,.16)",
  },
  // Reservado para la serie mensual de escrituras: que se reconozca de un vistazo
  petroleo: {
    fondo: "linear-gradient(135deg, #10333B 0%, #17505C 55%, #1F6E7E 100%)",
    trama: "rgba(210,236,240,.15)",
    icono: "#D8EEF2",
    halo:  "rgba(210,236,240,.20)",
  },
};

/** Notas ya publicadas: ícono elegido a mano. */
const POR_SLUG: Record<string, Portada> = {
  "calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble":
    { icono: Calculator, tono: "gold" },
  "aranceles-registro-de-la-propiedad-inmueble-caba-valores-actualizados-2026":
    { icono: Landmark, tono: "navy" },
  "sigue-vigente-el-iti-impuestos-al-vender-una-propiedad-2026":
    { icono: Scale, tono: "ciruela" },
  "los-costos-ocultos-al-vender-una-propiedad-en-caba-2026":
    { icono: Receipt, tono: "verde" },
  "desregulacion-inmobiliaria-vender-sin-inmobiliaria":
    { icono: TrendingUp, tono: "navy" },
  "guia-practica-para-propietarios-que-venden-sin-inmobiliaria-en-caba":
    { icono: KeyRound, tono: "gold" },
};

/** Para notas futuras: se deduce del título. El orden importa. */
const POR_PALABRA: [RegExp, Portada][] = [
  [/calculadora|calcul/i,          { icono: Calculator,    tono: "gold" }],
  [/impuesto|iti|ganancia|fiscal/i,{ icono: Scale,         tono: "ciruela" }],
  [/arancel|registro|rpi/i,        { icono: Landmark,      tono: "navy" }],
  [/escritura|boleto|firma/i,      { icono: FileSignature, tono: "navy" }],
  [/costo|gasto|comisi/i,          { icono: Receipt,       tono: "verde" }],
  [/precio|tasaci|valor|mercado/i, { icono: TrendingUp,    tono: "verde" }],
  [/crédito|credito|hipotec|uva/i, { icono: HandCoins,     tono: "gold" }],
  [/vender|dueño|propietario/i,    { icono: KeyRound,      tono: "gold" }],
];

const POR_CATEGORIA: Record<string, Portada> = {
  "Seguimiento de Escrituras 2026": { icono: BarChart3,     tono: "petroleo" },
  "Legal y escrituras":             { icono: FileSignature, tono: "navy" },
  "Guía para vender":               { icono: KeyRound,      tono: "gold" },
};

const POR_DEFECTO: Portada = { icono: FileText, tono: "navy" };

export function portadaDe(post: {
  slug: string;
  titulo: string;
  categoria?: string | null;
}): Portada {
  const directa = POR_SLUG[post.slug];
  if (directa) return directa;

  // La serie mensual va primero: su categoría define la portada aunque el
  // título contenga palabras que apuntarían a otro ícono ("escrituras").
  if (post.categoria === "Seguimiento de Escrituras 2026") {
    return POR_CATEGORIA[post.categoria];
  }

  for (const [patron, portada] of POR_PALABRA) {
    if (patron.test(post.titulo)) return portada;
  }

  if (post.categoria && POR_CATEGORIA[post.categoria]) {
    return POR_CATEGORIA[post.categoria];
  }

  return POR_DEFECTO;
}
