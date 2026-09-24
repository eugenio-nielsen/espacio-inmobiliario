import { Search, Tag, BookOpen, Building2, Plus, UserRound, ShieldCheck, type LucideIcon } from "lucide-react";
import { HERRAMIENTAS } from "@/lib/herramientas";

export type ItemMenu = {
  href: string;
  label: string;
  /** Línea de apoyo que muestra el desplegable de escritorio. */
  detalle?: string;
  icon: LucideIcon;
};

/**
 * Desplegable "Herramientas" del menú principal, en grupos.
 *
 * Absorbió los links sueltos de Vender, Comprar y Blog: la barra queda
 * con menos entradas y cada grupo lleva su rótulo para que no sea una
 * bolsa de links mezclados. Lo consumen el menú de escritorio
 * (NavHerramientas) y el móvil (MobileMenu).
 *
 * Las herramientas en sí siguen en lib/herramientas.ts, porque el
 * footer las lista solas.
 */
export const GRUPOS_HERRAMIENTAS: { titulo: string; items: ItemMenu[] }[] = [
  {
    titulo: "Tu operación",
    items: [
      { href: "/comprar", label: "Quiero comprar", detalle: "Decidí con respaldo antes de firmar", icon: Search },
      { href: "/vender", label: "Quiero vender", detalle: "Publicá gratis o delegá la venta", icon: Tag },
    ],
  },
  { titulo: "Herramientas gratuitas", items: HERRAMIENTAS },
  {
    titulo: "Para leer",
    items: [
      { href: "/blog", label: "Blog", detalle: "Guías para comprar y vender con información", icon: BookOpen },
    ],
  },
];

export type ItemCuenta = ItemMenu & {
  /** "seccion" también aparece como pestaña del panel; "accion" solo en el menú. */
  tipo: "seccion" | "accion";
  soloAdmin?: boolean;
};

/**
 * Opciones de la cuenta del usuario logueado. Fuente única: el menú del
 * nombre en escritorio (MenuCuenta), el bloque "Tu cuenta" del menú móvil
 * y las pestañas del panel. Para sumar una opción, se agrega acá y
 * aparece en los tres lugares. "Salir" no va en la lista: es un
 * formulario, no un link, y siempre cierra el menú.
 */
export const MENU_CUENTA: ItemCuenta[] = [
  { href: "/panel", label: "Mis propiedades", icon: Building2, tipo: "seccion" },
  { href: "/panel/propiedades/nueva", label: "Publicar una propiedad", icon: Plus, tipo: "accion" },
  { href: "/panel/perfil", label: "Mis datos", icon: UserRound, tipo: "seccion" },
  { href: "/panel/admin", label: "Superadmin", icon: ShieldCheck, tipo: "seccion", soloAdmin: true },
];

/** Las opciones que le corresponden a este usuario. */
export function opcionesCuenta(esAdmin: boolean) {
  return MENU_CUENTA.filter(o => !o.soloAdmin || esAdmin);
}
