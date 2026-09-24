"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Building2, HelpCircle, LogOut, UserRound, Plus, MessageCircle } from "lucide-react";
import { GRUPOS_HERRAMIENTAS, opcionesCuenta } from "@/lib/menu";
import { signOut } from "@/lib/actions/auth";
import "./menu-cuenta.css";

// Comprar, Vender y Blog viven en los grupos de Herramientas (lib/menu.ts)
const LINKS = [
  { href: "/propiedades", label: "Propiedades", icon: Building2, highlight: true },
  { href: "/como-funciona", label: "Cómo funciona", icon: HelpCircle },
  { href: "/contacto", label: "Contacto", icon: MessageCircle },
];

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

  // Bloquear scroll del body con el menú abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button className="mobile-menu-btn" aria-label="Abrir menú" onClick={() => setOpen(true)}>
        <Menu size={22} strokeWidth={2} />
      </button>

      {open && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setOpen(false)} />
          <nav className="mobile-menu-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--navy-800)" }}>
                Menú
              </span>
              <button aria-label="Cerrar menú" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-500)", padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            {LINKS.map(({ href, label, icon: Icon, highlight }) => (
              <Link key={href} href={href} className="mobile-menu-link" onClick={() => setOpen(false)}
                style={highlight ? {
                  background: "rgba(185,159,102,.14)", borderRadius: "var(--radius-sm)",
                  fontWeight: 700, color: "var(--navy-800)", borderBottom: "none",
                  padding: "14px 12px", marginBottom: 4,
                } : undefined}>
                <Icon size={18} strokeWidth={1.75} color="var(--gold-600)" />
                {label}
              </Link>
            ))}

            {GRUPOS_HERRAMIENTAS.map(g => (
              <div key={g.titulo}>
                <p style={{
                  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10.5,
                  textTransform: "uppercase", letterSpacing: ".08em",
                  color: "var(--ink-400)", margin: "16px 0 2px",
                }}>
                  {g.titulo}
                </p>
                {g.items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="mobile-menu-link" onClick={() => setOpen(false)}>
                    <Icon size={18} strokeWidth={1.75} color="var(--gold-600)" />
                    {label}
                  </Link>
                ))}
              </div>
            ))}

            <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
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
                    <Link key={href} href={href} className="mc-item" onClick={() => setOpen(false)}>
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
                  <Link href="/auth/registro" onClick={() => setOpen(false)} style={btnPrimary}>
                    <Plus size={17} strokeWidth={2} /> Publicar propiedad
                  </Link>
                  <Link href="/auth/login" onClick={() => setOpen(false)} style={btnGhost}>
                    <UserRound size={16} strokeWidth={1.75} /> Ingresar
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

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
  background: "var(--navy-800)", color: "#fff", padding: "13px 18px",
  borderRadius: "var(--radius-sm)", textDecoration: "none", border: "none",
};
const btnGhost: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
  background: "#fff", color: "var(--navy-800)", padding: "13px 18px",
  borderRadius: "var(--radius-sm)", textDecoration: "none", border: "1.5px solid var(--line-200)",
};
