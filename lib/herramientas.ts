import { Calculator, LineChart } from "lucide-react";

/**
 * Herramientas gratuitas del sitio. Fuente única: las consumen el
 * desplegable de escritorio, el menú móvil y el footer.
 *
 * Vive en lib/ y no dentro de NavHerramientas.tsx porque ese archivo es
 * "use client": importar la lista desde ahí en un Server Component (el
 * footer) la convertiría en una referencia de cliente y no se podría
 * recorrer al renderizar en el servidor.
 *
 * Para sumar una herramienta: agregar una entrada acá y aparece en los
 * tres lugares.
 */
export const HERRAMIENTAS = [
  {
    href: "/estimador",
    label: "Tasador de Departamentos en CABA",
    /** Etiqueta corta, para donde no entra el nombre completo (footer). */
    corto: "Tasador CABA",
    detalle: "Estimá cuánto vale tu propiedad",
    icon: LineChart,
  },
  {
    href: "/blog/calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble",
    label: "Calculadora Aranceles RPI 2026",
    corto: "Calculadora de aranceles",
    detalle: "Cuánto cobra el Registro por cada trámite",
    icon: Calculator,
  },
];
