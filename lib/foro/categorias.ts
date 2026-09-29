import { Search, Tag, Landmark, FilePen, Scale, Building, Receipt, Hammer, type LucideIcon } from "lucide-react";

/**
 * Categorías de la Tertulia. Fuente única: la portada, los filtros, el
 * formulario de tema y la validación del servidor salen de acá. La
 * columna `categoria` de foro_temas tiene un CHECK con estos mismos
 * slugs (supabase/migrations/foro.sql): para sumar una hay que tocar
 * los dos lugares.
 *
 * `herramienta` es la sugerencia en contexto: quien pregunta por el
 * precio de su casa ve el Tasador al lado del tema.
 */
export type Herramienta = { href: string; label: string; detalle: string };

export type Categoria = {
  slug: string;
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
  herramienta?: Herramienta;
};

const TASADOR: Herramienta = {
  href: "/estimador",
  label: "Tasador",
  detalle: "Estimá en dos minutos cuánto vale una propiedad en CABA.",
};

export const CATEGORIAS = [
  {
    slug: "comprar",
    nombre: "Comprar",
    descripcion: "Buscar, visitar, ofertar y reservar. Qué mirar antes de firmar.",
    icon: Search,
    herramienta: {
      href: "/comprar",
      label: "Comprar con respaldo",
      detalle: "Cómo te acompañamos para decidir antes de firmar.",
    },
  },
  {
    slug: "vender",
    nombre: "Vender",
    descripcion: "Precio, publicación, visitas y negociación, del lado de quien vende.",
    icon: Tag,
    herramienta: TASADOR,
  },
  {
    slug: "creditos-hipotecarios",
    nombre: "Créditos Hipotecarios",
    descripcion: "Bancos, requisitos, tasas y cómo encaja el crédito en la operación.",
    icon: Landmark,
  },
  {
    slug: "escrituras-y-tramites",
    nombre: "Escrituras y Trámites",
    descripcion: "Escribanía, certificados, Registro de la Propiedad y papeles.",
    icon: FilePen,
    herramienta: {
      href: "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble",
      label: "Calculadora RPI",
      detalle: "Cuánto cobra el Registro de la Propiedad por cada trámite.",
    },
  },
  {
    slug: "tasaciones",
    nombre: "Tasaciones",
    descripcion: "Cuánto vale una propiedad y cómo se llega a ese número.",
    icon: Scale,
    herramienta: TASADOR,
  },
  {
    slug: "propiedad-horizontal",
    nombre: "Propiedad Horizontal",
    descripcion: "Reglamento, unidades funcionales, espacios comunes y derechos.",
    icon: Building,
  },
  {
    slug: "consorcio-y-expensas",
    nombre: "Consorcio y Expensas",
    descripcion: "Administración, asambleas y expensas ordinarias y extraordinarias.",
    icon: Receipt,
  },
  {
    slug: "reformas",
    nombre: "Reformas",
    descripcion: "Obras, presupuestos, permisos y cuánto suma una reforma al valor.",
    icon: Hammer,
  },
] as const satisfies readonly Categoria[];

export type CategoriaSlug = (typeof CATEGORIAS)[number]["slug"];

const POR_SLUG = new Map<string, Categoria>(CATEGORIAS.map(c => [c.slug, c]));

export function categoriaPorSlug(slug: string | null | undefined): Categoria | null {
  return (slug && POR_SLUG.get(slug)) || null;
}

export function esCategoria(slug: unknown): slug is CategoriaSlug {
  return typeof slug === "string" && POR_SLUG.has(slug);
}
