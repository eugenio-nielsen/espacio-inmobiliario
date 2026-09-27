import Image from "next/image";
import SelloEN from "@/components/SelloEN";
import Guilloche from "@/components/ui/Guilloche";
import FichaHome from "@/components/home/FichaHome";
import "./apertura.css";

/** Lo que se promete en una línea, al pie de la portada. */
const CINTA = ["Sin comisiones", "Publicación gratuita", "Trato directo con el dueño", "CABA y Provincia de Buenos Aires"];

/**
 * Apertura de la home: la primera escena del sitio.
 *
 * Es cinematográfica sin ser un video: Buenos Aires desde el aire,
 * virada a navy, entra desde la oscuridad y queda derivando con un
 * zoom lento; el titular sube desde una línea de corte, como un rótulo
 * de película, y el sello EN se estampa sobre su guilloché. Después
 * todo queda quieto salvo lo que respira: la deriva de la foto, la
 * roseta y el anillo de texto del sello.
 *
 * El titular va a lo que busca quien entra: propiedades de dueño
 * directo. El respaldo profesional lo cuentan el sello y la bajada.
 * Todo lo que afirma sale de lo que el sistema hace de verdad (ver
 * lib/protocolo.ts): sin cifras ni credenciales que no se puedan
 * sostener.
 *
 * La ficha de abajo (FichaHome) reparte a las dos audiencias con las
 * mismas palabras que el menú "Servicios": Quiero comprar, Quiero vender.
 *
 * Estilos en apertura.css, al lado (prefijo .ap-).
 */
export default function Apertura({ logueado }: { logueado: boolean }) {
  return (
    <section className="ap" aria-labelledby="ap-titulo">
      {/* ── Fondo: entra desde el negro y queda derivando ───────── */}
      <div className="ap-fondo" aria-hidden="true">
        <div className="ap-deriva">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            // `priority` está deprecado en Next 16
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="ap-foto"
          />
        </div>
      </div>
      <div className="ap-velo" aria-hidden="true" />
      <div className="ap-luz" aria-hidden="true" />

      <div className="ap-in">
        {/* ── El texto ─────────────────────────────────────────── */}
        <div className="ap-texto">
          <p className="ap-eyebrow">
            Compra y venta de propiedades<span className="ap-eyebrow-lugar"> · Buenos Aires</span>
          </p>

          <h1 id="ap-titulo" className="ap-t">
            <span className="ap-corte"><span>Encontrá Propiedades</span></span>{" "}
            <span className="ap-corte"><em>Dueño Directo.</em></span>
          </h1>

          <p className="ap-lead">
            Comprá o vendé sin comisiones, tratando con quien firma la escritura.
            Publicar es gratis, y cada publicación se revisa una por una antes de salir.
          </p>

          <FichaHome logueado={logueado} />
        </div>

        {/* ── El sello, estampado sobre su guilloché ───────────── */}
        <div className="ap-marca" aria-hidden="true">
          <div className="ap-emblema">
            <Guilloche id="ap-gq" className="ap-gq" />
            <SelloEN size={236} tono="oscuro" etiqueta="" className="ap-sello" />
          </div>
          <p className="ap-marca-pie">
            Del primer contacto <em>a la escritura</em>
          </p>
        </div>
      </div>

      {/* ── La cinta del pie ──────────────────────────────────── */}
      <ul className="ap-cinta">
        {CINTA.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </section>
  );
}
