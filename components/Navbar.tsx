import Logo from "@/components/Logo";
import { UserRound, Plus } from "lucide-react";

export default function Navbar() {
  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid var(--line-200)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{
        maxWidth: "var(--container)", margin: "0 auto",
        padding: "14px 24px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ flexShrink: 0 }}>
          <Logo className="h-12 w-auto" />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <a href="/propiedades" style={navLink}>Propiedades</a>
          <a href="#" style={navLink}>Cómo funciona</a>
          <a href="/auth/login" style={{ ...navLink, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <UserRound size={16} strokeWidth={1.75} />
            Ingresar
          </a>
          <a
            href="/auth/registro"
            className="esbtn esbtn-primary"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 600,
              borderRadius: "var(--radius-sm)", border: "1.5px solid transparent",
              cursor: "pointer", display: "inline-flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontSize: 13.5,
              padding: "9px 18px", background: "var(--navy-800)", color: "#fff",
              transition: "all var(--dur) var(--ease-out)",
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            <Plus size={15} strokeWidth={2} />
            Publicar propiedad
          </a>
        </nav>
      </div>
    </header>
  );
}

const navLink: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 500,
  color: "var(--ink-600)", cursor: "pointer", textDecoration: "none",
};
