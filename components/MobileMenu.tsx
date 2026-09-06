"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Building2, FileText, HelpCircle, LayoutDashboard, LogOut, UserRound, Plus } from "lucide-react";
import { HERRAMIENTAS } from "@/components/NavHerramientas";
import { signOut } from "@/lib/actions/auth";

const LINKS = [
  { href: "/propiedades", label: "Propiedades", icon: Building2, highlight: true },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/como-funciona", label: "Cómo funciona", icon: HelpCircle },
];

export default function MobileMenu({ loggedIn, nombre }: { loggedIn: boolean; nombre?: string | null }) {
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
                {loggedIn && nombre ? `Hola, ${nombre.split(" ")[0]}` : "Menú"}
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

            <p style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10.5,
              textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--ink-400)", margin: "16px 0 2px",
            }}>
              Herramientas
            </p>
            {HERRAMIENTAS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="mobile-menu-link" onClick={() => setOpen(false)}>
                <Icon size={18} strokeWidth={1.75} color="var(--gold-600)" />
                {label}
              </Link>
            ))}

            <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {loggedIn ? (
                <>
                  <Link href="/panel" onClick={() => setOpen(false)} style={btnPrimary}>
                    <LayoutDashboard size={17} strokeWidth={1.75} /> Mi panel
                  </Link>
                  <form action={signOut} style={{ margin: 0 }}>
                    <button type="submit" style={{ ...btnGhost, width: "100%", cursor: "pointer" }}>
                      <LogOut size={16} strokeWidth={1.75} /> Salir
                    </button>
                  </form>
                </>
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
