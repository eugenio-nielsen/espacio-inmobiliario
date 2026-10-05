import { Calculator, LineChart, TrendingUp } from "lucide-react";

/**
 * Herramientas gratuitas del sitio. Fuente única: las consumen el
 * desplegable de escritorio, el menú móvil y el footer.
 *
 * Vive en lib/ y no dentro de NavDesplegables.tsx porque ese archivo es
 * "use client": importar la lista desde ahí en un Server Component (el
 * footer) la convertiría en una referencia de cliente y no se podría
 * recorrer al renderizar en el servidor.
 *
 * `label` es corto a propósito, para que el menú no se estire. Lo que la
 * herramienta hace lo explica `detalle`, que el desplegable de escritorio
 * muestra debajo del nombre.
 *
 * Para sumar una herramienta: agregar una entrada acá y aparece en los
 * tres lugares.
 */
export const HERRAMIENTAS = [
  {
    href: "/estimador",
    label: "Tasar departamentos",
    detalle: "Estimá cuánto vale tu departamento",
    icon: LineChart,
  },
  {
    href: "/precios-m2",
    label: "Precio del m² por barrio",
    detalle: "Cuánto vale el m² en los 48 barrios de CABA",
    icon: TrendingUp,
  },
  {
    href: "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble",
    label: "Calculadora RPI",
    detalle: "Cuánto cobra el Registro por cada trámite",
    icon: Calculator,
  },
];
