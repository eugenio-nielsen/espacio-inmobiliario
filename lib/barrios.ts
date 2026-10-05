import { BARRIOS_CABA, slugifyUbicacion } from "@/lib/ubicaciones";

/**
 * Páginas SEO por barrio.
 * Para habilitar un barrio nuevo: agregar una entrada acá (slug = slugifyUbicacion(nombre))
 * y listo — la ruta, el sitemap y los links internos lo levantan solos.
 */

export interface BarrioPageData {
  slug: string;
  nombre: string;
  /** Igual al campo `provincia` de las propiedades, para el encabezado y el SEO. */
  provincia: "Ciudad Autónoma de Buenos Aires" | "Provincia de Buenos Aires";
  /** Párrafos editoriales que se muestran (y posicionan) en la página. */
  intro: string[];
}

const EDITORIALES: BarrioPageData[] = [
  {
    slug: "villa-crespo",
    nombre: "Villa Crespo",
    provincia: "Ciudad Autónoma de Buenos Aires",
    intro: [
      "Villa Crespo es uno de los barrios con mejor relación precio-ubicación de la Ciudad de Buenos Aires: lindero a Palermo pero con valores del metro cuadrado sensiblemente más accesibles, conserva una identidad propia de barrio porteño con esquinas de café, talleres y una movida gastronómica en pleno crecimiento sobre las calles Aguirre, Murillo y alrededores.",
      "Está muy bien conectado — la línea B de subte lo cruza por Av. Corrientes y las avenidas Juan B. Justo, Córdoba y Warnes lo vinculan rápido con el resto de la ciudad. Es un barrio muy demandado por parejas jóvenes y familias que buscan departamentos de 2 a 4 ambientes, y la oferta de dueño directo permite comprar sin pagar comisión inmobiliaria.",
    ],
  },
  {
    slug: "caballito",
    nombre: "Caballito",
    provincia: "Ciudad Autónoma de Buenos Aires",
    intro: [
      "Caballito es el corazón geográfico de la Ciudad de Buenos Aires y uno de los barrios más buscados para vivienda familiar. Sus espacios verdes — el Parque Rivadavia y el Parque Centenario — y su perfil residencial consolidado lo mantienen sistemáticamente entre los barrios con mayor demanda de compra de la ciudad.",
      "La conectividad es de las mejores de CABA: la línea A de subte y el tren Sarmiento lo cruzan de punta a punta, y las avenidas Rivadavia, Acoyte y Pedro Goyena concentran comercio y servicios. Conviven casas con patio en sus pasajes arbolados y departamentos de todas las tipologías, muchos aptos para crédito hipotecario — una combinación ideal para comprar directo al dueño, sin comisiones.",
    ],
  },
  {
    slug: "escobar",
    nombre: "Escobar",
    provincia: "Provincia de Buenos Aires",
    intro: [
      "Escobar es uno de los partidos del norte del Gran Buenos Aires que más creció en los últimos años. Con acceso directo por la Panamericana, ofrece algo que en la Ciudad de Buenos Aires ya es difícil de conseguir: el mismo presupuesto que allá alcanza para un departamento, acá compra una casa con jardín o un lote propio.",
      "El casco de Belén de Escobar concentra el comercio y los servicios, y tiene en la Fiesta Nacional de la Flor su marca más conocida. Alrededor, el corredor norte sumó barrios cerrados y urbanizaciones que convivieron con el crecimiento del barrio abierto. La oferta va desde terrenos y casas hasta departamentos, y comprar directo al dueño evita la comisión inmobiliaria.",
    ],
  },
];

/** Comuna de cada barrio porteño: sirve para enlazar barrios vecinos entre sí. */
export const COMUNA_DE_BARRIO: Record<string, number> = {
  "Agronomía": 15, "Almagro": 5, "Balvanera": 3, "Barracas": 4, "Belgrano": 13, "Boedo": 5,
  "Caballito": 6, "Chacarita": 15, "Coghlan": 12, "Colegiales": 13, "Constitución": 1,
  "Flores": 7, "Floresta": 10, "La Boca": 4, "La Paternal": 15, "Liniers": 9, "Mataderos": 9,
  "Monte Castro": 10, "Montserrat": 1, "Nueva Pompeya": 4, "Núñez": 13, "Palermo": 14,
  "Parque Avellaneda": 9, "Parque Chacabuco": 7, "Parque Chas": 15, "Parque Patricios": 4,
  "Puerto Madero": 1, "Recoleta": 2, "Retiro": 1, "Saavedra": 12, "San Cristóbal": 3,
  "San Nicolás": 1, "San Telmo": 1, "Versalles": 10, "Villa Crespo": 15, "Villa del Parque": 11,
  "Villa Devoto": 11, "Villa General Mitre": 11, "Villa Lugano": 8, "Villa Luro": 10,
  "Villa Ortúzar": 15, "Villa Pueyrredón": 12, "Villa Real": 10, "Villa Riachuelo": 8,
  "Villa Santa Rita": 11, "Villa Soldati": 8, "Villa Urquiza": 12, "Vélez Sársfield": 10,
};

const CABA = "Ciudad Autónoma de Buenos Aires" as const;

const generadas: BarrioPageData[] = BARRIOS_CABA
  .filter((nombre) => !EDITORIALES.some((e) => e.nombre === nombre))
  .map((nombre) => ({ slug: slugifyUbicacion(nombre), nombre, provincia: CABA, intro: [] }));

export const BARRIO_PAGES: BarrioPageData[] = [...EDITORIALES, ...generadas]
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

export function getBarrioPage(slug: string): BarrioPageData | undefined {
  return BARRIO_PAGES.find((b) => b.slug === slug);
}

/** Barrios de la misma comuna (sin el propio), para el enlazado interno. */
export function barriosVecinos(nombre: string): BarrioPageData[] {
  const comuna = COMUNA_DE_BARRIO[nombre];
  if (!comuna) return [];
  return BARRIO_PAGES.filter((b) => b.nombre !== nombre && COMUNA_DE_BARRIO[b.nombre] === comuna);
}

/**
 * Landings por tipo de propiedad: /propiedades/venta/departamentos, etc.
 * Viven en la misma ruta que los barrios (los slugs no se pisan).
 */
export const TIPO_PAGES = [
  { slug: "departamentos", tipo: "departamento", singular: "Departamento", plural: "Departamentos" },
  { slug: "casas", tipo: "casa", singular: "Casa", plural: "Casas" },
  { slug: "terrenos", tipo: "terreno", singular: "Terreno", plural: "Terrenos" },
  { slug: "locales", tipo: "local", singular: "Local", plural: "Locales comerciales" },
  { slug: "oficinas", tipo: "oficina", singular: "Oficina", plural: "Oficinas" },
  { slug: "cocheras", tipo: "cochera", singular: "Cochera", plural: "Cocheras" },
] as const;

export type TipoPageData = (typeof TIPO_PAGES)[number];

export function getTipoPage(slug: string): TipoPageData | undefined {
  return TIPO_PAGES.find((t) => t.slug === slug);
}
