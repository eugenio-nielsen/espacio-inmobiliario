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

export const BARRIO_PAGES: BarrioPageData[] = [
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

export function getBarrioPage(slug: string): BarrioPageData | undefined {
  return BARRIO_PAGES.find((b) => b.slug === slug);
}
