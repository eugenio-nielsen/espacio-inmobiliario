"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { DESPLEGABLES, opcionesCuenta, romano, hrefActivo } from "@/lib/menu";
import { signOut } from "@/lib/actions/auth";
import "./menu-cuenta.css";
import "./nav.css";

// El mismo orden que la barra de escritorio: Propiedades, los
// desplegables de lib/menu.ts (Sobre nosotros, Herramientas) y Contacto

export default function MobileMenu({
  loggedIn,
  nombre,
  email,
  esAdmin = false,
}: {
  loggedIn: boolean;
  nombre?: string | null;
  email?: string | null;
  esAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ruta = usePathname();

  // Bloquear scroll del body con el menú abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape también cierra
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const cerrar = () => setOpen(false);
  const todos = DESPLEGABLES.flatMap(m => m.grupos.flatMap(g => g.items.map(i => i.href)));
  const actual = hrefActivo(ruta, todos);

  return (
    <>
      <button className="mobile-menu-btn" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu size={20} strokeWidth={1.6} />
      </button>

      {open && (
        <>
          <div className="mobile-menu-overlay" onClick={cerrar} />
          <nav className="mobile-menu-panel" aria-label="Menú">
            <div className="nv-m-cab">
              <span className="nv-m-cab-t">Menú</span>
              <button className="nv-m-cerrar" aria-label="Cerrar menú" onClick={cerrar}>
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>

            <Link
              href="/propiedades"
              className="nv-m-principal"
              aria-current={ruta === "/propiedades" || ruta.startsWith("/propiedades/") ? "page" : undefined}
              onClick={cerrar}
            >
              <span className="nv-t">Propiedades</span>
              <span className="nv-d">Departamentos, casas y terrenos de dueños directos</span>
            </Link>

            {/* Cada desplegable bajo su rótulo, con las entradas numeradas de corrido */}
            {DESPLEGABLES.map(menu => {
              let n = 0;
              return (
                <div key={menu.titulo}>
                  <p className="nv-m-grupo">{menu.titulo}</p>
                  {menu.grupos.flatMap(g => g.items).map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="nv-m-item"
                      aria-current={href === actual ? "page" : undefined}
                      onClick={cerrar}
                    >
                      <span className="nv-n" aria-hidden="true">{romano(++n)}</span>
                      <span className="nv-t">{label}</span>
                    </Link>
                  ))}
                </div>
              );
            })}

            <p className="nv-m-grupo">Escribinos</p>
            <Link
              href="/contacto"
              className="nv-m-item"
              aria-current={ruta === "/contacto" ? "page" : undefined}
              onClick={cerrar}
              style={{ gridTemplateColumns: "1fr" }}
            >
              <span className="nv-t">Contacto</span>
            </Link>

            <div className="nv-m-pie">
              {loggedIn ? (
                // La cuenta en un bloque propio, para no confundirla con el menú del sitio
                <div className="mm-cuenta">
                  <div className="mm-cuenta-cabeza">
                    <span className="mc-avatar mc-avatar-g" aria-hidden="true">
                      {(nombre?.trim() || email || "U")[0].toUpperCase()}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="mc-rotulo">Tu cuenta</span>
                      <span className="mc-cabeza-nombre">{nombre?.trim() || email || "Mi cuenta"}</span>
                    </span>
                  </div>
                  {opcionesCuenta(esAdmin).map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className="mc-item" onClick={cerrar}>
                      <Icon size={17} strokeWidth={1.7} />
                      {label}
                    </Link>
                  ))}
                  <form action={signOut} className="mc-pie">
                    <button type="submit" className="mc-item mc-salir">
                      <LogOut size={17} strokeWidth={1.7} />
                      Salir
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <Link href="/auth/registro" className="nv-m-cta" onClick={cerrar}>
                    <span className="nv-cta-mas" aria-hidden="true">+</span> Publicar propiedad
                  </Link>
                  <Link href="/auth/login" className="nv-m-cta-sec" onClick={cerrar}>
                    Ingresar
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
