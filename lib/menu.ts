import { Search, Tag, BookOpen, HelpCircle, Building2, Plus, UserRound, ShieldCheck, MessagesSquare, GraduationCap, type LucideIcon } from "lucide-react";
import { HERRAMIENTAS } from "@/lib/herramientas";

export type ItemMenu = {
  href: string;
  label: string;
  /** Línea de apoyo que muestra el desplegable de escritorio. */
  detalle?: string;
  icon: LucideIcon;
};

export type GrupoMenu = {
  /** Rótulo del grupo. Sin rótulo, el grupo va sin encabezado. */
  titulo?: string;
  items: ItemMenu[];
};

export type Desplegable = { titulo: string; grupos: GrupoMenu[] };

/**
 * Desplegables del menú principal. La barra queda en tres entradas:
 * "Propiedades" (link directo) y estos dos.
 *
 *   · "Sobre nosotros": qué hacemos (los servicios para comprar y para
 *     vender), cómo trabajamos y el blog.
 *   · "Herramientas": lo que se usa: el tasador, la calculadora del
 *     Registro, el foro y la Cátedra. Foro y Cátedra eran links sueltos
 *     en la barra, y "Servicios" un desplegable aparte.
 *
 * Un grupo con rótulo lo muestra como encabezado; sin rótulo va solo,
 * separado por una línea. Los consumen el menú de escritorio
 * (NavDesplegables) y el móvil (MobileMenu).
 *
 * El tasador y la calculadora siguen en lib/herramientas.ts, porque el
 * footer los lista solos.
 */
export const DESPLEGABLES: Desplegable[] = [
  {
    titulo: "Sobre nosotros",
    grupos: [
      {
        titulo: "Servicios",
        items: [
          { href: "/comprar", label: "Quiero comprar", detalle: "Decidí con respaldo antes de firmar", icon: Search },
          { href: "/vender", label: "Quiero vender", detalle: "Publicá gratis o delegá la venta", icon: Tag },
        ],
      },
      {
        items: [
          { href: "/como-funciona", label: "Cómo funciona", detalle: "El proceso paso a paso, para vender y para comprar", icon: HelpCircle },
          { href: "/blog", label: "Blog", detalle: "Guías para comprar y vender con información", icon: BookOpen },
        ],
      },
    ],
  },
  {
    titulo: "Herramientas",
    grupos: [
      {
        items: [
          ...HERRAMIENTAS,
          { href: "/foro", label: "Foro", detalle: "Tertulia Inmobiliaria: preguntá y debatí con otros", icon: MessagesSquare },
          { href: "/catedra", label: "Cátedra Inmobiliaria", detalle: "Para estudiantes y recién matriculados", icon: GraduationCap },
        ],
      },
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
  { href: "/foro/perfil", label: "Mi perfil en la Tertulia", icon: MessagesSquare, tipo: "accion" },
  { href: "/panel/admin", label: "Superadmin", icon: ShieldCheck, tipo: "seccion", soloAdmin: true },
];

/** Las opciones que le corresponden a este usuario. */
export function opcionesCuenta(esAdmin: boolean) {
  return MENU_CUENTA.filter(o => !o.soloAdmin || esAdmin);
}
