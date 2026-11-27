import { TIPO_PAGES } from "@/lib/barrios";
import { getCostosConfig } from "@/lib/catedra/data";
import { guia } from "@/lib/catedra/guias-costos";
import { EMAIL_CONTACTO, TELEFONO_TEXTO } from "@/lib/contacto";
import { SITE, SITE_NOMBRE } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/publico";
import { buildPropertyUrl } from "@/lib/utils/urls";
import { htmlEnLineaAMarkdown, textoEnlace, unaLinea } from "./markdown";
import { ACLARATORIO } from "@/lib/estimador/aclaratorio";

/**
 * Contenido de /llms.txt: el índice del sitio para asistentes y agentes de IA
 * (formato de https://llmstxt.org).
 *
 * Qué va a mano y qué se arma solo:
 *  - El texto de presentación está escrito a mano. Dice solo lo que el sitio
 *    ya afirma en sus páginas y que el sistema cumple hoy; no repite la
 *    promesa de "revisión previa" de cada publicación mientras las
 *    propiedades salgan publicadas sin pasar por una revisión.
 *  - Las guías de costos, las notas del blog y las propiedades recientes
 *    salen de los mismos datos que las páginas, así que el archivo se
 *    mantiene al día sin tocarlo.
 *  - Cada bloque que depende de la base de datos es opcional: si la consulta
 *    falla, el archivo sale igual con lo demás.
 */

/** Nota-herramienta: su contenido es una calculadora que solo existe en la web. */
const SLUG_CALCULADORA_RPI = "calculadora-aranceles-rpi-registro-de-la-propiedad-inmueble";

const fmt = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);

/** Corta en el último espacio antes del límite, sin dejar palabras a medias. */
function recortar(texto: string, max: number): string {
  const limpio = unaLinea(texto);
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  const ultimo = corte.lastIndexOf(" ");
  return corte.slice(0, ultimo > 40 ? ultimo : max - 1).replace(/[,;:.\s]+$/, "") + "…";
}

/** Un elemento de lista de archivos: `- [texto](url): nota`. */
function item(texto: string, url: string, nota?: string): string {
  const base = `- [${textoEnlace(texto)}](${url})`;
  return nota ? `${base}: ${unaLinea(nota)}` : base;
}

/** Una sección H2 con su lista; vacía no se escribe. */
function seccion(titulo: string, items: string[]): string | null {
  return items.length ? [`## ${titulo}`, ...items].join("\n") : null;
}

type NotaIndice = { slug: string; titulo: string; resumen: string | null; categoria: string | null; published_at: string | null };
type PropiedadIndice = {
  id: string; operacion: string; tipo: string; barrio: string | null; ciudad: string;
  moneda: string; precio: number; ambientes: number | null; superficie_total: number | null;
};

async function notasPublicadas(): Promise<NotaIndice[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select("slug, titulo, resumen, categoria, published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as NotaIndice[];
  } catch (e) {
    console.error("llms.txt · notas:", e);
    return [];
  }
}

async function propiedadesRecientes(): Promise<PropiedadIndice[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("properties")
      .select("id, operacion, tipo, barrio, ciudad, moneda, precio, ambientes, superficie_total")
      .eq("status", "activa")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as PropiedadIndice[];
  } catch (e) {
    console.error("llms.txt · propiedades:", e);
    return [];
  }
}

const SINGULAR_DE_TIPO: Record<string, string> = Object.fromEntries(TIPO_PAGES.map(t => [t.tipo, t.singular]));

/**
 * Descripción armada con datos estructurados, nunca con el título libre que
 * cargó el dueño: ese texto no está bajo nuestro control y no tiene por
 * qué estar en un archivo que leen las máquinas.
 */
function itemDePropiedad(p: PropiedadIndice): string {
  const tipo = SINGULAR_DE_TIPO[p.tipo] ?? "Propiedad";
  const zona = p.barrio || p.ciudad;
  const ambientes = p.tipo !== "cochera" && p.tipo !== "terreno" && p.ambientes ? ` ${p.ambientes} amb.` : "";
  const operacion = p.operacion === "alquiler" ? "en alquiler" : "en venta";
  const precio = `${p.moneda === "USD" ? "US$" : "$"} ${fmt(p.precio)}`;
  const superficie = p.superficie_total ? ` · ${fmt(p.superficie_total)} m²` : "";
  const url = `${SITE}${buildPropertyUrl({ operacion: p.operacion, barrio: zona, tipo: p.tipo, id: p.id })}`;
  return item(`${tipo}${ambientes} ${operacion} en ${zona}`, url, `${precio}${superficie}`);
}

export async function generarLlmsTxt(): Promise<string> {
  const [config, notas, propiedades] = await Promise.all([getCostosConfig(), notasPublicadas(), propiedadesRecientes()]);

  const vender = guia("vender", config);
  const comprar = guia("comprar", config);
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

  const cabecera = [
    `# ${SITE_NOMBRE}`,
    `> Portal de propiedades publicadas directamente por sus dueños en la Ciudad y la Provincia de Buenos Aires (Argentina), sin comisión inmobiliaria. Tiene un estimador online de departamentos en CABA, guías y calculadoras con los costos de comprar y vender, y acompañamiento profesional opcional. Sitio en español (es-AR), fundado por Eugenio Nielsen.`,
    [
      "Qué conviene saber:",
      "",
      "- Publicar una propiedad es gratis y no se cobra comisión: Espacio Inmobiliario no es intermediario, el trato es entre el dueño y quien compra.",
      "- Se publican departamentos, casas, terrenos, locales, oficinas y cocheras en venta.",
      "- Quien busca contacta al dueño desde la ficha de cada propiedad: deja una consulta o, cuando el dueño habilitó su agenda, pide una visita en los horarios que eligió. El sitio no muestra el teléfono del dueño.",
      "- Los dueños pueden validar su identidad y su escritura: la ficha muestra entonces el sello de «Propietario verificado».",
      "- Cada aviso tiene su precio en dólares o en pesos, según lo cargó el dueño, y puede cambiar o dejar de estar disponible: confirmalo siempre en la ficha.",
      "- Las cifras de las guías de costos corresponden a la Ciudad de Buenos Aires y son orientativas: no reemplazan la consulta con un escribano o un contador.",
      `- Contacto del sitio: ${EMAIL_CONTACTO} · WhatsApp ${TELEFONO_TEXTO}.`,
      `- Este archivo se genera solo y se actualiza cada hora (última actualización: ${hoy}). Las páginas marcadas con la extensión .md son la misma información sin menús ni scripts.`,
    ].join("\n"),
  ].join("\n\n");

  const costos = seccion("Cuánto cuesta comprar y vender", [
    item(vender.titulo, `${SITE}/catedra/${vender.slug}.md`, vender.respuesta),
    item(comprar.titulo, `${SITE}/catedra/${comprar.slug}.md`, comprar.respuesta),
    item("Calculadora de costos de una compraventa", `${SITE}/catedra/calculadora`, "Cuánto desembolsa quien compra y cuánto le queda a quien vende, línea por línea y con la norma de cada gasto. Herramienta interactiva."),
    item("Calculadora de aranceles del Registro de la Propiedad Inmueble (CABA)", `${SITE}/blog/${SLUG_CALCULADORA_RPI}`, "Cuánto cobra el Registro por cada trámite: informes, certificados, minuta y trámites urgentes. Herramienta interactiva."),
  ]);

  const propietarios = seccion("Para quienes quieren vender", [
    item("Publicá tu propiedad gratis", `${SITE}/propietarios/publicar`, "Cómo se publica, qué incluye y preguntas frecuentes sobre comisión, contacto y verificación."),
    item("Vender tu propiedad", `${SITE}/vender`, "Dos formas de vender, por tu cuenta o con acompañamiento profesional; en ninguna hay comisión."),
    item("Estimador online de departamentos en CABA", `${SITE}/estimador`, `Estima gratis el valor de un departamento a partir del barrio, la superficie y las características. ${ACLARATORIO}`),
    item("Precio del metro cuadrado por barrio", `${SITE}/precios-m2`, "Valores de referencia por barrio de la Ciudad de Buenos Aires."),
  ]);

  const compradores = seccion("Para quienes quieren comprar", [
    item("Propiedades publicadas", `${SITE}/propiedades`, "Catálogo completo de propiedades de dueños directos, con filtros por tipo, zona, dormitorios y precio."),
    item("Comprar una propiedad", `${SITE}/comprar`, "Cómo comprar a un dueño directo: verificar quién vende, saber si el precio es razonable y qué se paga además del precio."),
    ...TIPO_PAGES.map(t => item(`${t.plural} en venta`, `${SITE}/propiedades/venta/${t.slug}`, `Listado de ${t.plural.toLowerCase()} en venta de dueños directos.`)),
    item("Propiedades en venta en Villa Crespo", `${SITE}/propiedades/venta/villa-crespo`, "Barrio de CABA. Hay una página igual por cada barrio porteño: /propiedades/venta/ más el nombre del barrio, por ejemplo /propiedades/venta/palermo."),
    item("Propiedades en venta en Caballito", `${SITE}/propiedades/venta/caballito`),
    item("Propiedades en venta en Escobar", `${SITE}/propiedades/venta/escobar`, "Partido del norte del Gran Buenos Aires."),
  ]);

  const recientes = seccion("Propiedades publicadas recientemente", propiedades.map(itemDePropiedad));

  const guias = seccion(
    "Guías y notas del blog",
    notas
      .filter(n => n.slug !== SLUG_CALCULADORA_RPI)
      .map(n => {
        const fecha = n.published_at ? n.published_at.slice(0, 10) : null;
        const rotulo = [n.categoria, fecha].filter(Boolean).join(" · ");
        const nota = [rotulo ? `${rotulo}.` : null, n.resumen ? recortar(htmlEnLineaAMarkdown(n.resumen), 220) : null].filter(Boolean).join(" ");
        return item(n.titulo, `${SITE}/blog/${n.slug}.md`, nota || undefined);
      })
  );

  const opcional = seccion("Optional", [
    item("Cátedra Inmobiliaria", `${SITE}/catedra`, "Herramientas para quienes estudian corredor o martillero público: calculadora de costos y red de profesionales."),
    item("Tertulia Inmobiliaria", `${SITE}/foro`, "Foro para resolver dudas entre personas que compran y venden."),
    item("Cómo funciona", `${SITE}/como-funciona`, "Cómo funciona el sitio paso a paso, para quien vende y para quien compra."),
    item("Sobre nosotros", `${SITE}/sobre-nosotros`, "Quién está detrás del portal."),
    item("Contacto", `${SITE}/contacto`),
    item("Términos y condiciones", `${SITE}/terminos`),
    item("Política de privacidad", `${SITE}/privacidad`),
    item("Mapa del sitio", `${SITE}/sitemap.xml`, "Todas las páginas públicas, para buscadores."),
  ]);

  return [cabecera, costos, propietarios, compradores, recientes, guias, opcional]
    .filter((parte): parte is string => !!parte)
    .join("\n\n") + "\n";
}
