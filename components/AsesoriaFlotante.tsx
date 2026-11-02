"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle } from "lucide-react";
import "./asesoria-flotante.css";

import { WHATSAPP } from "@/lib/contacto";
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
 * - /como-funciona → ya tiene su propio CTA de asesoría y su formulario
 * - las fichas de propiedad tienen barra fija abajo en mobile y se
 *   pisarían; ahí el contacto ya está resuelto
 */
const RUTAS_EXCLUIDAS = [/^\/panel/, /^\/auth/, /^\/como-funciona/, /^\/propiedades\/[^/]+\/[^/]+\/[^/]+\//];

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
    <aside className="asesoria-flotante" role="complementary" aria-label="Asesoramiento para tu propiedad">
      <button type="button" onClick={cerrar} aria-label="Cerrar" className="asesoria-cerrar">
        <X size={16} strokeWidth={1.5} />
      </button>

      <p className="asesoria-texto asesoria-titulo">¿Necesitás asesoramiento con tu propiedad?</p>
      <p className="asesoria-texto asesoria-sub">
        Te asesoramos sin cargo, de dueño directo a dueño directo.
      </p>

      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={cerrar}
        className="asesoria-cta"
      >
        <MessageCircle size={17} strokeWidth={1.5} aria-hidden="true" />
        Solicitar asesoramiento
      </a>
    </aside>
  );
}
