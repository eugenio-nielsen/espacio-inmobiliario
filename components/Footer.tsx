import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SelloEN from "@/components/SelloEN";
import FirmaTrazo from "@/components/FirmaTrazo";
import Guilloche from "@/components/ui/Guilloche";
import Reveal from "@/components/como-funciona/Reveal";
import { BARRIO_PAGES } from "@/lib/barrios";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { PROTOCOLO } from "@/lib/protocolo";
import "./footer.css";

const WHATSAPP = "5491164519421";
const EMAIL = "eugenio@espacioinmobiliario.com.ar";

/* Los tipos coinciden con la columna `tipo` de properties (minúscula).
   Antes estos links apuntaban todos a /propiedades sin filtro:
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
  ["Vender mi propiedad", "/vender"],
  ["Comprar con respaldo", "/comprar"],
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

/**
 * Footer: el cierre de cada página, firmado.
 *
 * Es la versión nocturna del documento de Respaldo de la home: el mismo
 * idioma notarial (sello EN sobre guilloché, firma que se dibuja,
 * cláusulas en números romanos) grabado en oro sobre navy, como la tapa
 * de una escritura. Es lo único que se ve en TODAS las páginas, así que
 * es donde la identidad y la promesa trabajan la recordación.
 *
 * Cuatro bandas:
 *   1. Cierre      · invitación a hablar, con sello, firma y contacto.
 *   2. Protocolo   · los cuatro controles (lib/protocolo.ts), en corto.
 *   3. Directorio  · contacto directo + navegación del sitio.
 *   4. Legales     · y la marca grabada a todo el ancho, cortada al pie.
 *
 * Estilos en footer.css (prefijo .pie-), fuera de globals.css por el
 * cache de Tailwind que no ve los cambios en Windows.
 */
export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="pie">
      {/* ══ 1 · Cierre ════════════════════════════════════════ */}
      <section className="pie-cierre" aria-labelledby="pie-titulo">
        <div className="pie-luz" aria-hidden="true" />
        <div className="pie-cierre-in">
          <div className="pie-medalla">
            <Guilloche id="pie-gq" className="pie-gq" />
            <SelloEN size={176} tono="oscuro" etiqueta="Fundador" className="pie-sello" />
          </div>

          <div className="pie-carta">
            <span className="pie-eyebrow">Atención personal</span>
            <h2 id="pie-titulo" className="pie-t">
              Hablemos de tu <em>próxima operación.</em>
            </h2>
            <p className="pie-lead">
              Vender, comprar, invertir o entender una operación antes de
              decidir: te responde Eugenio Nielsen en persona, sin
              intermediarios y sin compromiso.
            </p>

            <div className="pie-firma-fila">
              <Reveal className="cf-firma pie-firma">
                <FirmaTrazo height={48} grosor={3.6} color="var(--gold-400)" />
              </Reveal>
              <div>
                <p className="pie-nombre">Eugenio Nielsen</p>
                <p className="pie-rol">Fundador · Espacio Inmobiliario</p>
              </div>
            </div>

            <div className="pie-ctas">
              <a
                className="pie-cta pie-cta-oro"
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconoWhatsapp size={15} />
                Hablar con Eugenio
              </a>
              <Link className="pie-cta pie-cta-texto" href="/contacto">
                Escribir una consulta
                <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2 · Protocolo ═════════════════════════════════════
          La promesa de la home, en todas las páginas y en una línea
          por punto. Misma fuente que el documento de Respaldo. */}
      <section className="pie-protocolo" aria-label="Protocolo de respaldo">
        <div className="pie-protocolo-in">
          <p className="pie-protocolo-t">
            Protocolo <em>de respaldo</em>
          </p>
          <ol className="pie-clausulas">
            {PROTOCOLO.map(c => (
              <li key={c.n} className="pie-clausula">
                <span className="pie-num" aria-hidden="true">{c.n}</span>
                <span>
                  <strong>{c.clave}</strong>
                  {c.corto}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ 3 · Directorio ════════════════════════════════════ */}
      <nav className="pie-nav" aria-label="Pie de página">
        {/* Contacto con formato de membrete: rótulo y dato */}
        <div className="pie-col pie-membrete">
          <h3 className="pie-h">Contacto directo</h3>
          <dl>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                  +54 9 11 6451-9421
                </a>
              </dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>
                {/* Si no entra, que corte después de la arroba y no en ".com.ar" */}
                <a href={`mailto:${EMAIL}`}>
                  {EMAIL.split("@")[0]}@<wbr />{EMAIL.split("@")[1]}
                </a>
              </dd>
            </div>
            <div>
              <dt>Base</dt>
              <dd>Buenos Aires, Argentina</dd>
            </div>
          </dl>
        </div>

        <div className="pie-col">
          <h3 className="pie-h">Propiedades</h3>
          {TIPOS.map(([texto, tipo]) => (
            <Link key={tipo} className="pie-link" href={`/propiedades?tipo=${tipo}`}>
              {texto}
            </Link>
          ))}
          <Link className="pie-link" href="/propiedades">Ver todas</Link>
        </div>

        <div className="pie-col">
          <h3 className="pie-h">Barrios</h3>
          {BARRIO_PAGES.map(b => (
            <Link key={b.slug} className="pie-link" href={`/propiedades/venta/${b.slug}`}>
              {b.nombre}
            </Link>
          ))}
        </div>

        <div className="pie-col">
          <h3 className="pie-h">Herramientas</h3>
          {HERRAMIENTAS.map(h => (
            <Link key={h.href} className="pie-link" href={h.href}>
              {h.label}
            </Link>
          ))}
        </div>

        <div className="pie-col">
          <h3 className="pie-h">Espacio</h3>
          {ESPACIO.map(([texto, href]) => (
            <Link key={href} className="pie-link" href={href}>{texto}</Link>
          ))}
        </div>
      </nav>

      {/* ══ 4 · Legales + marca grabada ═══════════════════════ */}
      <div className="pie-legal">
        <div className="pie-legal-in">
          <span>
            © {anio} Espacio Inmobiliario
            <span className="pie-sep" aria-hidden="true">◆</span>
            Buenos Aires, Argentina
          </span>
          <span>
            <Link href="/terminos">Términos y condiciones</Link>
            <span className="pie-sep" aria-hidden="true">◆</span>
            <Link href="/privacidad">Privacidad</Link>
          </span>
        </div>
      </div>

      {/* El nombre, grabado a todo el ancho y cortado por el borde:
          la última imagen de cada página es la marca. */}
      <p className="pie-marca" aria-hidden="true">
        <span>Espacio</span> <em>Inmobiliario</em>
      </p>
    </footer>
  );
}
