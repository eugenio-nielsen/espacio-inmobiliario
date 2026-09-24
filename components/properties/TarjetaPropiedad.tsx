import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { PropertyCardData } from "@/lib/types";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { tituloTarjeta } from "@/lib/utils/titulo";
import GaleriaTarjeta from "@/components/properties/GaleriaTarjeta";
import "./tarjeta-propiedad.css";

const TIPO: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina",
};

const ESTADO: Record<string, string> = {
  "A estrenar": "A estrenar",
  Excelente: "Excelente estado",
  "Muy bueno": "Muy buen estado",
  Bueno: "Buen estado",
  "A refaccionar": "A refaccionar",
};

/** Fotos que viajan en la tarjeta; el resto se ve en la ficha. */
const FOTOS_EN_TARJETA = 5;
/** Días en los que una publicación lleva la marca "Nueva". */
const DIAS_NUEVA = 15;

const num = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
const signo = (moneda: string) => (moneda === "USD" ? "US$" : "$");

/**
 * Tarjeta de propiedad, versión editorial.
 *
 * Todo lo primordial a la vista, en el orden en que se decide: dónde y
 * qué es, cuánto cuesta, cuánto mide, en qué estado está y quién la
 * respalda. Las fotos se recorren sin salir del listado.
 *
 *   · Rótulo en versalitas doradas (tipo · barrio) y título prolijo.
 *   · Precio en serif, con el valor por m² y las expensas.
 *   · Libro de datos entre filetes: m² totales, cubiertos, ambientes
 *     (o dormitorios) y baños.
 *   · Rasgos con rombo: estado, cochera, piso, agenda de visitas.
 *   · Pie: el sello de verificación si lo tiene; si no, lo que siempre
 *     es cierto acá: dueño directo, sin comisión.
 *
 * La tarjeta no es un <a>: adentro hay botones (las flechas). El link
 * principal es el título, que se estira sobre el cuerpo; las fotos son
 * links propios para que el swipe funcione.
 *
 * El sello del dueño sale de `propietario_verificado`, que completa
 * conPropietarioVerificado() (lib/propiedades/verificados.ts) al armar
 * el listado; sin eso, la tarjeta muestra "Dueño directo".
 */
export default function TarjetaPropiedad({
  property: p,
  priority = false,
}: {
  property: PropertyCardData;
  priority?: boolean;
}) {
  const href = buildPropertyUrl(p);
  const esTerreno = p.tipo === "terreno";
  const fotos = (p.fotos ?? []).slice(0, FOTOS_EN_TARJETA);
  const m2 = p.superficie_total && p.superficie_total > 0 ? p.superficie_total : null;
  const precioM2 = m2 ? Math.round(p.precio / m2) : null;
  const cubierta =
    p.superficie_cubierta && m2 && p.superficie_cubierta < m2 ? p.superficie_cubierta : null;
  const nueva =
    !!p.created_at && Date.now() - new Date(p.created_at).getTime() < DIAS_NUEVA * 86_400_000;
  const dominioVerificado = p.dominio_estado === "aprobada";
  const propietarioVerificado = !!p.propietario_verificado;

  // Libro de datos: hasta cuatro, en orden de importancia. Con cuatro
  // celdas los rótulos completos no entran y van abreviados, como en
  // cualquier aviso ("amb.", "dorm.").
  const datos: { v: string; l: string; c: string }[] = [];
  if (m2) datos.push({ v: `${num(m2)} m²`, l: cubierta || esTerreno ? "Totales" : "Superficie", c: "Tot." });
  if (cubierta) datos.push({ v: `${num(cubierta)} m²`, l: "Cubiertos", c: "Cub." });
  if (esTerreno && precioM2) datos.push({ v: `${signo(p.moneda)} ${num(precioM2)}`, l: "Por m²", c: "Por m²" });
  if (p.ambientes) datos.push({ v: String(p.ambientes), l: p.ambientes === 1 ? "Ambiente" : "Ambientes", c: "Amb." });
  else if (p.dormitorios) datos.push({ v: String(p.dormitorios), l: p.dormitorios === 1 ? "Dormitorio" : "Dormitorios", c: "Dorm." });
  if (p.banos) datos.push({ v: String(p.banos), l: p.banos === 1 ? "Baño" : "Baños", c: p.banos === 1 ? "Baño" : "Baños" });
  const abreviar = datos.length >= 4;

  const rasgos = [
    p.estado && ESTADO[p.estado],
    p.cochera && "Cochera",
    p.tipo === "departamento" && p.piso && `Piso ${p.piso}`,
    p.visitas_config?.activa && "Visitas con agenda",
  ].filter(Boolean) as string[];

  const sello =
    propietarioVerificado && dominioVerificado ? "Dueño y escritura verificados"
      : propietarioVerificado ? "Propietario verificado"
      : dominioVerificado ? "Escritura verificada"
      : null;

  return (
    <article className="tp">
      <div className="tp-media">
        <GaleriaTarjeta
          fotos={fotos}
          total={p.fotos?.length ?? 0}
          href={href}
          alt={p.titulo}
          priority={priority}
        />
        {(p.apto_credito || nueva) && (
          <div className="tp-insignias">
            {nueva && <span className="tp-insignia">Nueva</span>}
            {p.apto_credito && <span className="tp-insignia tp-insignia-oro">Apto crédito</span>}
          </div>
        )}
      </div>

      <div className="tp-cuerpo">
        <p className="tp-lugar">
          {TIPO[p.tipo] ?? p.tipo}
          {(p.barrio || p.ciudad) && <><i aria-hidden="true">·</i>{p.barrio || p.ciudad}</>}
        </p>

        <h3 className="tp-titulo">
          <Link href={href} className="tp-enlace">{tituloTarjeta(p.titulo)}</Link>
        </h3>

        <div className="tp-precio-fila">
          <p className="tp-precio">{signo(p.moneda)} {num(p.precio)}</p>
          {precioM2 && !esTerreno && <p className="tp-m2">{signo(p.moneda)} {num(precioM2)} / m²</p>}
        </div>
        {p.expensas != null && p.expensas > 0 && (
          <p className="tp-expensas">+ $ {num(p.expensas)} de expensas</p>
        )}

        {datos.length > 0 && (
          <dl className="tp-datos">
            {datos.slice(0, 4).map(d => (
              <div key={d.l}>
                <dt>{abreviar ? d.c : d.l}</dt>
                <dd>{d.v}</dd>
              </div>
            ))}
          </dl>
        )}

        {rasgos.length > 0 && (
          <ul className="tp-rasgos">
            {rasgos.map(r => <li key={r}>{r}</li>)}
          </ul>
        )}

        <div className="tp-pie">
          {sello ? (
            <span className="tp-sello"><BadgeCheck size={14} strokeWidth={2} />{sello}</span>
          ) : (
            <span className="tp-origen">Dueño directo · Sin comisión</span>
          )}
          <span className="tp-ver" aria-hidden="true">
            Ver ficha
            <ArrowRight size={13} strokeWidth={2} />
          </span>
        </div>
      </div>
    </article>
  );
}
