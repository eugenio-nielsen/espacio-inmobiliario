"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DESPLEGABLES, romano, hrefActivo, type Desplegable } from "@/lib/menu";

/**
 * Los desplegables del menú de escritorio ("Sobre nosotros", "Herramientas").
 * Los grupos y sus rótulos vienen de lib/menu.ts; un grupo sin rótulo se
 * muestra sin encabezado, separado del anterior por un filete.
 *
 * Cada entrada va numerada con romanos corridos (I, II, III…) a lo largo
 * de todo el desplegable, igual que las cláusulas del resto del sitio, y
 * la página actual queda marcada. En pantallas con mouse se abren al
 * pasar; con el toque, al tocar.
 *
 * La lista se importa acá y no llega como prop desde el Navbar: el
 * Navbar es de servidor y no puede pasar datos con componentes (los
 * íconos) a uno de cliente.
 */
export default function NavDesplegables() {
  return DESPLEGABLES.map(menu => (
    <div key={menu.titulo} className="nav-hide-mobile">
      <NavDesplegable menu={menu} />
    </div>
  ));
}

function NavDesplegable({ menu }: { menu: Desplegable }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const demora = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ruta = usePathname();

  const items = menu.grupos.flatMap(g => g.items);
  const actual = hrefActivo(ruta, items.map(i => i.href));

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

  // Abrir al pasar solo donde hay mouse: en pantallas táctiles el "mouseenter"
  // que dispara el toque abriría el menú y el clic siguiente lo cerraría.
  const conMouse = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const entrar = () => {
    if (!conMouse()) return;
    clearTimeout(demora.current);
    setAbierto(true);
  };
  const salir = () => {
    if (!conMouse()) return;
    clearTimeout(demora.current);
    demora.current = setTimeout(() => setAbierto(false), 140);
  };

  let n = 0;

  return (
    <div ref={caja} className="nv-drop" onMouseEnter={entrar} onMouseLeave={salir}>
      <button
        type="button"
        className="nv-link"
        data-activo={!!actual}
        // Con mouse el menú ya se abrió al pasar: el clic no debe cerrarlo
        onClick={() => setAbierto(a => (conMouse() ? true : !a))}
        aria-expanded={abierto}
        aria-haspopup="true"
      >
        {menu.titulo}
        <ChevronDown size={12} strokeWidth={1.8} className="nv-chev" aria-hidden="true" />
      </button>

      {abierto && (
        <div className="nv-panel-wrap">
          <div className="nv-panel">
            {menu.grupos.map((g, gi) => (
              <div key={g.titulo ?? gi}>
                {g.titulo ? (
                  <p className="nv-grupo">{g.titulo}</p>
                ) : gi > 0 ? (
                  <div className="nv-grupo-corte" />
                ) : null}
                {g.items.map(({ href, label, detalle }) => (
                  <Link
                    key={href}
                    href={href}
                    className="nv-item"
                    aria-current={href === actual ? "page" : undefined}
                    onClick={() => setAbierto(false)}
                  >
                    <span className="nv-n" aria-hidden="true">{romano(++n)}</span>
                    <span>
                      <span className="nv-t">{label}</span>
                      <span className="nv-d">{detalle}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
