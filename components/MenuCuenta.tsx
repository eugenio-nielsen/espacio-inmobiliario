"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { opcionesCuenta } from "@/lib/menu";
import { signOut } from "@/lib/actions/auth";
import "./menu-cuenta.css";

/**
 * La cuenta del usuario logueado: avatar y nombre en una píldora, con
 * todas sus opciones adentro (lib/menu.ts) y "Salir" al final.
 *
 * Va separada del menú del sitio por un filete vertical y con otra forma
 * (píldora con avatar, no texto suelto): antes "Eugenio" y "Salir" se
 * leían como dos secciones más del sitio.
 *
 * Se usa en el Navbar y en la barra del panel.
 */
export default function MenuCuenta({
  nombre,
  email,
  esAdmin,
}: {
  nombre?: string | null;
  email?: string | null;
  esAdmin: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const ruta = usePathname();

  const nombreVisible = nombre?.trim() || email || "Mi cuenta";
  const primerNombre = nombre?.trim().split(" ")[0] || "Mi cuenta";
  const inicial = (nombre?.trim() || email || "U")[0].toUpperCase();

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="mc">
      <button
        type="button"
        className="mc-boton"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Tu cuenta: ${nombreVisible}`}
      >
        <span className="mc-avatar" aria-hidden="true">{inicial}</span>
        <span className="mc-nombre">{primerNombre}</span>
        <ChevronDown size={14} strokeWidth={2} className="mc-chevron" data-abierto={abierto} />
      </button>

      {abierto && (
        <div className="mc-panel" role="menu">
          <div className="mc-cabeza">
            <span className="mc-avatar mc-avatar-g" aria-hidden="true">{inicial}</span>
            <span style={{ minWidth: 0 }}>
              <span className="mc-rotulo">Tu cuenta</span>
              <span className="mc-cabeza-nombre">{nombreVisible}</span>
              {email && nombre && <span className="mc-cabeza-email">{email}</span>}
            </span>
          </div>

          {opcionesCuenta(esAdmin).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="mc-item"
              aria-current={ruta === href ? "page" : undefined}
              onClick={() => setAbierto(false)}
            >
              <Icon size={16} strokeWidth={1.7} />
              {label}
            </Link>
          ))}

          <form action={signOut} className="mc-pie">
            <button type="submit" role="menuitem" className="mc-item mc-salir">
              <LogOut size={16} strokeWidth={1.7} />
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
