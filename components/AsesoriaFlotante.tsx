"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle } from "lucide-react";

const WHATSAPP = "5491164519421";
const MENSAJE =
  "Hola! Vi el sitio de Espacio Inmobiliario y me gustaría recibir asesoramiento para vender mi propiedad.";

/** Se guarda el descarte para no volver a molestar. */
const CLAVE = "asesoria-cerrada";
/** Días que se respeta el descarte antes de volver a ofrecerlo. */
const DIAS_SILENCIO = 30;

/** Segundos antes de aparecer: que la persona lea algo primero. */
const DEMORA = 12;

/**
 * Rutas donde no aparece:
 * - /panel  → ya es usuario nuestro, no hay nada que ofrecerle acá
 * - /auth   → está en medio de un registro, no lo distraemos
 * - /precios y /como-funciona → ya tienen su propio CTA de asesoría
 * - las fichas de propiedad tienen barra fija abajo en mobile y se
 *   pisarían; ahí el contacto ya está resuelto
 */
const RUTAS_EXCLUIDAS = [/^\/panel/, /^\/auth/, /^\/precios/, /^\/como-funciona/, /^\/propiedades\/[^/]+\/[^/]+\/[^/]+\//];

function fueCerrado(): boolean {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (!guardado) return false;
    const cuando = Number(guardado);
    if (!Number.isFinite(cuando)) return false;
    return Date.now() - cuando < DIAS_SILENCIO * 86400_000;
  } catch {
    // Modo privado o cookies bloqueadas: mejor no mostrar nada raro
    return true;
  }
}

export default function AsesoriaFlotante() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const excluida = RUTAS_EXCLUIDAS.some(r => r.test(pathname));

  useEffect(() => {
    if (excluida || fueCerrado()) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), DEMORA * 1000);
    return () => clearTimeout(t);
  }, [excluida, pathname]);

  if (!visible) return null;

  function cerrar() {
    setVisible(false);
    try { localStorage.setItem(CLAVE, String(Date.now())); } catch { /* sin storage, se cierra igual */ }
  }

  return (
    <aside className="asesoria-flotante" role="complementary" aria-label="Asesoramiento para vender">
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar"
        style={{
          position: "absolute", top: 8, right: 8, lineHeight: 0,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--ink-400)", padding: 4,
        }}
      >
        <X size={15} />
      </button>

      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5,
        color: "var(--navy-800)", margin: "0 26px 4px 0", lineHeight: 1.3,
      }}>
        ¿Necesitás ayuda para vender tu propiedad?
      </p>
      <p style={{
        fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)",
        margin: "0 0 12px", lineHeight: 1.45,
      }}>
        Te asesoramos sin cargo, de dueño directo a dueño directo.
      </p>

      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={cerrar}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5,
          padding: "11px 16px", borderRadius: "var(--radius-sm)",
          background: "#25D366", color: "#fff", textDecoration: "none",
        }}
      >
        <MessageCircle size={15} strokeWidth={2} />
        Solicitar asesoramiento gratis
      </a>
    </aside>
  );
}
