import Link from "next/link";
import Logo from "@/components/Logo";
import SelloEN from "@/components/SelloEN";
import { BARRIO_PAGES } from "@/lib/barrios";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { Plus, Mail } from "lucide-react";

const WHATSAPP = "5491164519421";
const EMAIL = "eugenio@espacioinmobiliario.com.ar";

/* Los tipos coinciden con la columna `tipo` de properties (minúscula).
   Antes estos cuatro links apuntaban todos a /propiedades sin filtro:
   prometían un listado filtrado y entregaban el listado completo. */
const TIPOS: [string, string][] = [
  ["Departamentos en venta", "departamento"],
  ["Casas en venta", "casa"],
  ["Terrenos en venta", "terreno"],
  ["Locales comerciales", "local"],
  ["Oficinas", "oficina"],
];

const ESPACIO: [string, string][] = [
  ["Cómo funciona", "/como-funciona"],
  ["Precios", "/como-funciona#precios"],
  ["Blog", "/blog"],
  ["Publicar gratis", "/auth/registro"],
  ["Ingresar", "/auth/login"],
];

function IconoWhatsapp({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="ft">
      {/* ══ Banda 1 · Marca ═══════════════════════════════════
          El footer es lo único que se ve en todas las páginas del
          sitio, así que es el mejor lugar para que el sello y el
          nombre trabajen la recordación. */}
      <div className="ft-marca">
        <div className="ft-marca-luz" aria-hidden="true" />
        <div className="ft-marca-in">
          <SelloEN size={104} tono="oscuro" etiqueta="" className="ft-sello" />

          <div className="ft-marca-texto">
            <p className="ft-nombre">Eugenio Nielsen</p>
            <p className="ft-rol">Fundador · Espacio Inmobiliario</p>
            <p className="ft-lema">
              &ldquo;Detrás de cada publicación hay una persona con nombre y apellido.&rdquo;
            </p>
          </div>

          <div className="ft-acciones">
            <a
              className="ft-btn ft-btn-oro"
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoWhatsapp size={14} />
              Hablar con Eugenio
            </a>
            <Link className="ft-btn ft-btn-linea" href="/auth/registro">
              <Plus size={14} strokeWidth={2.2} />
              Publicar gratis
            </Link>
          </div>
        </div>
      </div>

      {/* ══ Banda 2 · Navegación ══════════════════════════════ */}
      <nav className="ft-nav" aria-label="Pie de página">
        <div>
          <Logo className="ft-logo h-14 w-auto mb-4" />
          <p className="ft-desc" style={{
            fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.7,
            color: "var(--navy-300)", maxWidth: 300, margin: "0 0 16px",
          }}>
            Propiedades directas de dueños en Argentina, con acompañamiento
            profesional en cada operación.
          </p>
          <a
            className="ft-contacto"
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span style={{ color: "#4ade80", display: "inline-flex" }}>
              <IconoWhatsapp />
            </span>
            +54 9 11 6451-9421
          </a>
          <br />
          <a className="ft-contacto" href={`mailto:${EMAIL}`} style={{ overflowWrap: "anywhere" }}>
            <Mail size={15} strokeWidth={1.75} color="var(--gold-400)" />
            {EMAIL}
          </a>
        </div>

        <div>
          <h5 className="ft-h">Propiedades</h5>
          {TIPOS.map(([texto, tipo]) => (
            <Link key={tipo} className="ft-link" href={`/propiedades?tipo=${tipo}`}>
              {texto}
            </Link>
          ))}
          <Link className="ft-link" href="/propiedades">Ver todas</Link>
        </div>

        <div>
          <h5 className="ft-h">Barrios</h5>
          {BARRIO_PAGES.map(b => (
            <Link key={b.slug} className="ft-link" href={`/propiedades/venta/${b.slug}`}>
              {b.nombre}
            </Link>
          ))}
        </div>

        <div>
          <h5 className="ft-h">Herramientas</h5>
          {HERRAMIENTAS.map(h => (
            <Link key={h.href} className="ft-link" href={h.href}>
              {h.label}
            </Link>
          ))}
        </div>

        <div>
          <h5 className="ft-h">Espacio</h5>
          {ESPACIO.map(([texto, href]) => (
            <Link key={href} className="ft-link" href={href}>{texto}</Link>
          ))}
        </div>
      </nav>

      {/* ══ Banda 3 · Legales ═════════════════════════════════ */}
      <div className="ft-legal">
        <div className="ft-legal-in">
          <span>
            © {anio} Espacio Inmobiliario
            <span className="ft-sep">·</span>
            Buenos Aires, Argentina
          </span>
          <span>
            <Link href="/terminos">Términos y condiciones</Link>
            <span className="ft-sep">·</span>
            <Link href="/privacidad">Privacidad</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
