"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Un destino de la barra (Propiedades, Contacto). Es de cliente solo para
 * saber en qué página está: la sección actual queda subrayada en dorado.
 */
export default function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ruta = usePathname();
  const activo = ruta === href || ruta.startsWith(`${href}/`);
  return (
    <Link href={href} className={`nv-link ${className}`.trim()} aria-current={activo ? "page" : undefined}>
      {children}
    </Link>
  );
}
