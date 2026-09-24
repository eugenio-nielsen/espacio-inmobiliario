import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Escena from "@/components/ui/Escena";
import "./indice.css";

export type ItemIndice = {
  icon?: LucideIcon;
  t: string;
  d: string;
  /** Con `cta` y `href`, la celda entera es el enlace. */
  cta?: string;
  href?: string;
};

/**
 * Conjunto sin orden (caminos, dudas, lo que incluye un servicio) como un
 * índice: celdas separadas por filetes, sin cajas ni sombras.
 *
 * Reemplaza a las tarjetas con icono en círculo que latía, spotlight al
 * puntero, inclinación 3D y barrido de luz: cuatro efectos por tarjeta
 * para dos líneas de texto. Acá el lujo es el aire y la tipografía.
 *
 * Al entrar, sobre cada celda se traza un filete dorado, una detrás de
 * otra como créditos, y el texto aparece debajo. Al pasar el puntero el
 * filete toma cuerpo, sube un velo de luz y la flecha avanza. Si la celda
 * lleva enlace, la celda completa es clickeable.
 *
 * Estilos en indice.css (prefijo .ix-).
 */
export default function Indice({
  items,
  tono = "claro",
  columnas = 4,
}: {
  items: ItemIndice[];
  /** "claro" sobre crema, "oscuro" sobre navy. */
  tono?: "claro" | "oscuro";
  /** 3 o 4 en escritorio; en tablet pasa a 2 y en móvil a 1. */
  columnas?: 3 | 4;
}) {
  return (
    <Escena
      className={`ix ix-${tono} ix-c${columnas}`}
      style={{ ["--cols" as string]: columnas }}
    >
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={it.t} className="ix-celda" style={{ ["--i" as string]: i }}>
            {Icon && <Icon className="ix-icono" size={18} strokeWidth={1.4} aria-hidden="true" />}
            <h3 className="ix-t">{it.t}</h3>
            <p className="ix-d">{it.d}</p>
            {it.cta && it.href && (
              <Link href={it.href} className="ix-cta">
                {it.cta}
                <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            )}
          </div>
        );
      })}
    </Escena>
  );
}
