import { calcularCostos, type CostosConfig, type EntradaCostos } from "@/lib/catedra/costos";
import { ACLARATORIO } from "@/lib/estimador/aclaratorio";

/**
 * Contenido editorial de las dos páginas de costos con foco
 * (/catedra/cuanto-cuesta-vender-una-propiedad y …-comprar-…).
 *
 * Las cifras salen de la misma configuración que usa la calculadora
 * (`CostosConfig`): si el superadmin actualiza Sellos u honorarios, el
 * texto y los ejemplos se actualizan solos y nunca contradicen la cuenta.
 */

export type Foco = "vender" | "comprar";

export type Guia = {
  foco: Foco;
  slug: string;
  titulo: string;
  descripcion: string;
  h1: [string, string];
  lead: string;
  migas: string;
  /** Pregunta que responde la guía, con el rango resumido. */
  respuesta: string;
  secciones: { t: string; p: string[] }[];
  preguntas: { q: string; a: string }[];
};

export const SLUGS: Record<Foco, string> = {
  vender: "cuanto-cuesta-vender-una-propiedad",
  comprar: "cuanto-cuesta-comprar-una-propiedad",
};

const n = (x: number, d = 1) => x.toLocaleString("es-AR", { maximumFractionDigits: d });
const usd = (x: number) => `US$ ${Math.round(x).toLocaleString("es-AR")}`;

/** Ejemplo de referencia: US$ 150.000, vivienda única, con inmobiliaria e IVA. */
export function entradaEjemplo(precio: number, c: CostosConfig, over: Partial<EntradaCostos> = {}): EntradaCostos {
  return {
    precio,
    moneda: "USD",
    tipoCambio: c.tipoCambio,
    vir: null,
    viviendaUnica: true,
    conInmobiliaria: true,
    honorariosComprador: c.inmobiliaria.comprador,
    honorariosVendedor: c.inmobiliaria.vendedor,
    ivaHonorarios: true,
    honorariosEscribano: c.escribania.honorarios,
    credito: 0,
    ...over,
  };
}

/** Precios de la tabla de ejemplos. */
export const PRECIO_EJ = 120_000;
export const PRECIOS_EJEMPLO = [80_000, 120_000, 200_000, 400_000];

/**
 * Los porcentajes que resumen cada guía, sobre el ejemplo de referencia.
 * Los usan las guías y el bloque de la home, para que digan lo mismo.
 */
export function rangosCostos(c: CostosConfig) {
  const ej = calcularCostos(entradaEjemplo(PRECIO_EJ, c), c);
  const sinInmo = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { conInmobiliaria: false }), c);
  const noUnica = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { viviendaUnica: false }), c);
  const pct = (monto: number) => (monto / PRECIO_EJ) * 100;
  return {
    venderCon: pct(ej.vendedor.costos),
    venderSin: pct(sinInmo.vendedor.costos),
    comprarMin: pct(sinInmo.comprador.costos),
    comprarMax: pct(noUnica.comprador.costos),
  };
}

export const porcentaje = (x: number) => n(x);

export function guia(foco: Foco, c: CostosConfig): Guia {
  const ej = calcularCostos(entradaEjemplo(PRECIO_EJ, c), c);
  const sinInmo = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { conInmobiliaria: false }), c);
  const umbralUsd = c.sellos.umbral / c.tipoCambio;
  const ivaH = 1 + c.iva / 100;
  const honV = c.inmobiliaria.vendedor;
  const honC = c.inmobiliaria.comprador;

  if (foco === "vender") {
    const { venderCon: pctV, venderSin: pctVsin } = rangosCostos(c);
    const sellosNoExento = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { viviendaUnica: false }), c);
    return {
      foco,
      slug: SLUGS.vender,
      titulo: "Cuánto cuesta vender una propiedad en CABA 2026",
      descripcion: `Cuánto te queda al vender un departamento en CABA: honorarios de la inmobiliaria (${honV} % + IVA), Sellos, certificados e impuestos. Calculadora con la norma de cada gasto y ejemplo a ${usd(PRECIO_EJ)}.`,
      h1: ["Cuánto cuesta ", "vender una propiedad"],
      lead: "Los gastos de quien vende en la Ciudad de Buenos Aires, línea por línea: qué se descuenta del precio, qué impuestos ya no se pagan y cuánto te queda neto. Cargá tu precio y probá distintos honorarios.",
      migas: "Cuánto cuesta vender",
      respuesta: `Vender una propiedad en CABA cuesta, con inmobiliaria, alrededor del ${n(pctV)} % del precio: los honorarios de la inmobiliaria (${honV} % más IVA), la mitad del Impuesto de Sellos si corresponde y los certificados para escriturar. Sin inmobiliaria baja a cerca del ${n(pctVsin)} %. Hoy no se paga impuesto a las ganancias ni ITI por vender una vivienda como persona humana.`,
      secciones: [
        {
          t: "Qué paga el vendedor en una compraventa",
          p: [
            `<strong>Honorarios de la inmobiliaria.</strong> Se pactan libremente (Ley 2340, art. 11). La costumbre de plaza en CABA es ${honV} % del precio a cargo del vendedor, y suele sumarse el IVA (${n(c.iva, 0)} %) si la inmobiliaria es responsable inscripta: en la práctica, ${n(honV * ivaH, 2)} % del precio. Es el gasto más grande de quien vende.`,
            `<strong>Impuesto de Sellos.</strong> La ley lo reparte entre las partes y por costumbre se paga mitad y mitad. Si el comprador compra su vivienda única por debajo de unos ${usd(umbralUsd)} (el umbral es de $ ${c.sellos.umbral.toLocaleString("es-AR")}), la operación está exenta y el vendedor no paga nada por este concepto. Si no está exenta, el vendedor afronta la mitad: ${usd(sellosNoExento.vendedor.lineas.find(l => l.id === "sellos-v")?.monto ?? 0)} sobre una venta de ${usd(PRECIO_EJ)}.`,
            `<strong>Certificados, informes y libre deuda.</strong> Para escriturar, el vendedor tiene que acreditar que la propiedad está libre de deuda e inhibiciones: certificado de dominio e inhibición, catastro, ABL, AySA y expensas. El cálculo de referencia es ${n(c.escribania.certificadosVendedor)} % del precio, aunque varía según la escribanía.`,
          ],
        },
        {
          t: "Lo que ya no se paga al vender",
          p: [
            `<strong>Impuesto cedular (ganancias por la venta).</strong> Desde el 01/01/2026 está exento para personas humanas que no venden de manera habitual (Ley 27.802). Quien opera como empresa o vende en forma habitual sigue alcanzado.`,
            `<strong>ITI (Impuesto a la Transferencia de Inmuebles).</strong> Derogado por la Ley 27.743 (2024). Si venís de una operación vieja o de un artículo desactualizado, ya no corresponde.`,
          ],
        },
        {
          t: `Ejemplo: vender a ${usd(PRECIO_EJ)}`,
          p: [
            `Con una inmobiliaria al ${honV} % más IVA, certificados y Sellos exentos por vivienda única del comprador, los gastos del vendedor suman ${usd(ej.vendedor.costos)} (${n(pctV)} % del precio) y le quedan ${usd(ej.vendedor.neto)} netos. Sin inmobiliaria, los gastos bajan a ${usd(sinInmo.vendedor.costos)} y el neto sube a ${usd(sinInmo.vendedor.neto)}.`,
            "Cambiá el precio, los honorarios o si el comprador usa la exención en la calculadora de arriba: la liquidación se recalcula y el enlace guarda tus datos.",
          ],
        },
        {
          t: "Cómo bajar el costo de vender",
          p: [
            "Los honorarios son libres: se negocian antes de firmar la autorización de venta, no después. Pedir el pacto por escrito y con el IVA discriminado evita sorpresas. También conviene empezar temprano con los certificados, que tienen vencimiento: pedirlos cuando ya hay oferta acelera la escritura.",
            "Y fijar bien el precio de salida pesa más que cualquier otro gasto: una propiedad mal publicada pierde meses y termina bajando el precio. Podés orientarte con el <a href=\"/estimador\">estimador online de Espacio Inmobiliario</a>. " + ACLARATORIO,
          ],
        },
      ],
      preguntas: [
        {
          q: "¿Cuánto cuesta vender un departamento en CABA?",
          a: `Con inmobiliaria, alrededor del ${n(pctV)} % del precio en el ejemplo de ${usd(PRECIO_EJ)}: honorarios del ${honV} % más IVA, certificados y, si corresponde, la mitad de Sellos. Sin inmobiliaria, cerca del ${n(pctVsin)} %.`,
        },
        {
          q: "¿Quién paga la comisión de la inmobiliaria cuando se vende?",
          a: `Los honorarios se pactan libremente (Ley 2340). La costumbre en CABA es ${honV} % a cargo del vendedor y ${honC} % a cargo del comprador, más IVA si la inmobiliaria factura como responsable inscripta.`,
        },
        {
          q: "¿El vendedor paga el impuesto de Sellos?",
          a: "Por costumbre, la mitad del Impuesto de Sellos la paga el vendedor. Si el comprador adquiere su única vivienda por debajo del umbral vigente, la operación está exenta y no se paga.",
        },
        {
          q: "¿Se paga impuesto a las ganancias al vender una casa o departamento?",
          a: "Desde el 01/01/2026, una persona humana que no vende de forma habitual no paga impuesto cedular por la venta de un inmueble (Ley 27.802). El ITI fue derogado en 2024 (Ley 27.743).",
        },
        {
          q: "¿Cuánto me queda neto después de vender?",
          a: `Es el precio menos los gastos del vendedor. En el ejemplo de ${usd(PRECIO_EJ)} con inmobiliaria, quedan ${usd(ej.vendedor.neto)}. La calculadora lo recalcula con tus datos.`,
        },
        {
          q: "¿Qué certificados necesito para vender?",
          a: "Dominio e inhibición, catastro, libre deuda de ABL y AySA y el estado de expensas. El escribano los gestiona y su costo se descuenta del vendedor.",
        },
      ],
    };
  }

  // ── comprar ──
  const conCred = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { credito: 75_000 }), c);
  const noUnica = calcularCostos(entradaEjemplo(PRECIO_EJ, c, { viviendaUnica: false }), c);
  const pctC = (ej.comprador.costos / PRECIO_EJ) * 100;
  const { comprarMin: pctCsin, comprarMax: pctCnoUnica } = rangosCostos(c);
  return {
    foco,
    slug: SLUGS.comprar,
    titulo: "Cuánto cuesta comprar una propiedad en CABA 2026",
    descripcion: `Cuánto hay que tener además del precio al comprar un departamento en CABA: escribano, Sellos (exención de vivienda única 2026), honorarios, IVA e hipoteca. Calculadora y ejemplo a ${usd(PRECIO_EJ)}.`,
    h1: ["Cuánto cuesta ", "comprar una propiedad"],
    lead: "Lo que desembolsa quien compra en la Ciudad de Buenos Aires además del precio: escribano, impuestos, honorarios y escritura de la hipoteca. Cargá el precio, indicá si es tu vivienda única y si sacás crédito.",
    migas: "Cuánto cuesta comprar",
    respuesta: `Comprar una propiedad en CABA suma, además del precio, entre ${n(pctCsin)} % y ${n(pctCnoUnica)} % en gastos según los casos: escribano (${n(c.escribania.honorarios)} % más IVA), gastos de escritura e inscripción (${n(c.escribania.gastos)} %), honorarios de la inmobiliaria (${honC} % más IVA) y la mitad de Sellos si no hay exención. Con vivienda única por debajo del umbral, Sellos no se paga.`,
    secciones: [
      {
        t: "Qué paga el comprador además del precio",
        p: [
          `<strong>Escribano.</strong> Lo elige y lo paga el comprador. Los honorarios son de libre pacto; la referencia de plaza en CABA es de ${n(c.escribania.honorarios)} % del precio, más IVA (${n(c.iva, 0)} %).`,
          `<strong>Gastos de escritura e inscripción.</strong> Aportes notariales, folios, testimonio y la tasa del Registro de la Propiedad (1 ‰ del monto). Se estiman en ${n(c.escribania.gastos)} % del precio.`,
          `<strong>Honorarios de la inmobiliaria.</strong> La costumbre es ${honC} % del precio a cargo del comprador (Ley 2340, art. 11, libre pacto), más IVA si corresponde: ${n(honC * ivaH, 2)} % en la práctica.`,
          `<strong>Impuesto de Sellos.</strong> Mitad y mitad por costumbre. Es el gasto que más cambia entre casos: ${usd(noUnica.comprador.lineas.find(l => l.id === "sellos-c")?.monto ?? 0)} para el comprador en una compra de ${usd(PRECIO_EJ)} que no es vivienda única, y cero si lo es y está por debajo del umbral.`,
        ],
      },
      {
        t: "La exención de Sellos por vivienda única",
        p: [
          `En CABA, la compra de la vivienda única, familiar y de ocupación permanente está exenta de Sellos hasta $ ${c.sellos.umbral.toLocaleString("es-AR")} (unos ${usd(umbralUsd)} al tipo de cambio de referencia). Por encima, se paga ${n(c.sellos.alicuotaAlta)} % solo sobre el excedente. Si no es tu vivienda única, la alícuota es ${n(c.sellos.alicuotaGeneral)} % sobre el total hasta el umbral y ${n(c.sellos.alicuotaAlta)} % desde ahí.`,
          `Esta es la diferencia más importante a la hora de presupuestar: en el ejemplo de ${usd(PRECIO_EJ)}, pasar de “vivienda única” a “no es vivienda única” agrega ${usd(noUnica.comprador.costos - ej.comprador.costos)} de gastos.`,
        ],
      },
      {
        t: "Comprar con crédito hipotecario",
        p: [
          `Si financiás con un banco, se suma la escritura de la hipoteca (${n(c.escribania.hipoteca)} % del crédito más IVA, orientativo y con diferencias entre entidades). Los Sellos sobre la hipoteca están exentos en CABA para créditos de entidades financieras destinados a vivienda de personas humanas.`,
          `Ejemplo: comprar a ${usd(PRECIO_EJ)} con un crédito de ${usd(75_000)} agrega ${usd(conCred.comprador.costos - ej.comprador.costos)} de gastos por la hipoteca. Con el crédito, el desembolso propio es ${usd(conCred.comprador.desembolsoPropio)}.`,
        ],
      },
      {
        t: `Ejemplo: comprar a ${usd(PRECIO_EJ)}`,
        p: [
          `Vivienda única, con inmobiliaria al ${honC} % más IVA y escribano al ${n(c.escribania.honorarios)} % más IVA: los gastos suman ${usd(ej.comprador.costos)} (${n(pctC)} % del precio) y el total a desembolsar es ${usd(ej.comprador.total)}. Sin inmobiliaria, los gastos bajan a ${usd(sinInmo.comprador.costos)}.`,
          "Cambiá los datos en la calculadora: el enlace guarda tu cuenta y podés imprimirla o guardarla en PDF para llevarla a la escribanía.",
        ],
      },
    ],
    preguntas: [
      {
        q: "¿Cuánto hay que tener además del precio para comprar un departamento en CABA?",
        a: `Entre ${n(pctCsin)} % y ${n(pctCnoUnica)} % del precio según el caso. En el ejemplo de ${usd(PRECIO_EJ)} con inmobiliaria y vivienda única, ${usd(ej.comprador.costos)} (${n(pctC)} %).`,
      },
      {
        q: "¿Quién paga la escribanía, el comprador o el vendedor?",
        a: "Por costumbre en CABA, el comprador elige al escribano y paga sus honorarios y los gastos de escritura e inscripción. El vendedor paga los certificados que necesita para escriturar.",
      },
      {
        q: "¿Se paga Sellos al comprar la vivienda única?",
        a: `No, hasta $ ${c.sellos.umbral.toLocaleString("es-AR")} si es la única vivienda, familiar y de ocupación permanente. Por encima del umbral, ${n(c.sellos.alicuotaAlta)} % sobre el excedente.`,
      },
      {
        q: "¿Cuánto cuesta la escritura de la hipoteca?",
        a: `Como referencia, ${n(c.escribania.hipoteca)} % del crédito más IVA. La designa el banco y varía por entidad; algunas bonifican gastos. Los Sellos sobre la hipoteca están exentos para vivienda de personas humanas.`,
      },
      {
        q: "¿Cuánto cobra la inmobiliaria al comprador?",
        a: `Los honorarios se pactan libremente (Ley 2340). La costumbre en CABA es ${honC} % del precio a cargo del comprador, más IVA si la inmobiliaria es responsable inscripta.`,
      },
      {
        q: "¿Cuánto es el costo total de comprar con crédito?",
        a: `En el ejemplo de ${usd(PRECIO_EJ)} con un crédito de ${usd(75_000)}: gastos de ${usd(conCred.comprador.costos)} y un desembolso propio de ${usd(conCred.comprador.desembolsoPropio)}.`,
      },
    ],
  };
}
