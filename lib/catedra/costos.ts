/**
 * Costos de una compraventa en CABA, para las dos partes: cuánto
 * desembolsa el comprador y cuánto le queda neto al vendedor.
 *
 * Es una función pura (sin servidor ni navegador): la usa la calculadora
 * de la Cátedra en el cliente y se puede probar aislada. Los parámetros
 * viven en `CostosConfig`, que el superadmin edita desde el panel
 * (tabla catedra_config); lo que está acá es el default.
 *
 * Fuentes del default (2.º semestre de 2026):
 *   · Sellos: Ley Tarifaria CABA 2026 (Ley 6926) y Código Fiscal (Ley
 *     6805), según el cuadro de montos del Colegio de Escribanos de la
 *     Ciudad vigente del 01/07 al 31/12/2026.
 *   · Honorarios del corredor: Ley 2340, art. 11 (libre pacto).
 *   · Registro de la Propiedad: tasa general del 1 ‰ (Decreto 902/2024).
 *   · Impuesto cedular: exento para personas humanas no habitualistas
 *     desde el 01/01/2026 (Ley 27.802). ITI: derogado (Ley 27.743).
 *   · Tipo de cambio: BNA vendedor del 28/09/2026.
 *   · Provincia de Buenos Aires (solo Sellos): Ley Impositiva 15.558,
 *     2 % sobre el precio o la valuación fiscal, el mayor.
 */

export type CostosConfig = {
  version: 1;
  /** Texto que se muestra como vigencia de los valores. */
  vigencia: string;
  /** Pesos por dólar de referencia (BNA vendedor). */
  tipoCambio: number;
  /** IVA sobre honorarios profesionales, en %. */
  iva: number;
  sellos: {
    /** Monto en pesos que separa las dos alícuotas (y tope de la exención de vivienda única). */
    umbral: number;
    /** % hasta el umbral. */
    alicuotaGeneral: number;
    /** % por encima del umbral (y sobre el excedente en vivienda única). */
    alicuotaAlta: number;
    /** % del impuesto que paga el comprador (por costumbre, la mitad). */
    parteComprador: number;
    /** Provincia de Buenos Aires: alícuota general, %. */
    alicuotaPBA: number;
  };
  escribania: {
    /** Honorarios del escribano, % del precio (comprador). */
    honorarios: number;
    /** Aportes notariales, folios, testimonio e inscripción en el Registro, % del precio (comprador). */
    gastos: number;
    /** Certificados, informes y libre deuda, % del precio (vendedor). */
    certificadosVendedor: number;
    /** Escritura de hipoteca, % del crédito (comprador). */
    hipoteca: number;
  };
  inmobiliaria: {
    /** Honorarios habituales, % del precio. */
    comprador: number;
    vendedor: number;
  };
};

export const COSTOS_DEFAULT: CostosConfig = {
  version: 1,
  vigencia: "2.º semestre de 2026",
  tipoCambio: 1545,
  iva: 21,
  sellos: { umbral: 226_100_000, alicuotaGeneral: 2.7, alicuotaAlta: 3.5, parteComprador: 50, alicuotaPBA: 2 },
  escribania: { honorarios: 2, gastos: 1, certificadosVendedor: 0.5, hipoteca: 1 },
  inmobiliaria: { comprador: 4, vendedor: 3 },
};

export type Moneda = "USD" | "ARS";
export type Jurisdiccion = "CABA" | "PBA";

export type EntradaCostos = {
  precio: number;
  moneda: Moneda;
  tipoCambio: number;
  /** Valor Inmobiliario de Referencia o valuación fiscal, en pesos, si se conoce. */
  vir: number | null;
  /** Vivienda única, familiar y de ocupación permanente del comprador. */
  viviendaUnica: boolean;
  conInmobiliaria: boolean;
  honorariosComprador: number;
  honorariosVendedor: number;
  /** El corredor es responsable inscripto y factura IVA. */
  ivaHonorarios: boolean;
  honorariosEscribano: number;
  /** Monto del crédito hipotecario, en la moneda de la operación (0 si no hay). */
  credito: number;
  /** Dónde está el inmueble. Por defecto, CABA. */
  jurisdiccion?: Jurisdiccion;
};

export type Linea = {
  id: string;
  concepto: string;
  /** Cómo se calcula ("2 % del precio"), en una línea. */
  calculo?: string;
  monto: number;
  /** Informativa: no suma (un impuesto exento, uno derogado). */
  informativa?: boolean;
  /** Etiqueta en vez del monto ("Exento", "Derogado"). */
  etiqueta?: string;
  /** De dónde sale: la norma o la costumbre de plaza. */
  fuente: string;
};

export type CasoSellos = "exento" | "excedente" | "general" | "alta" | "pba";

export type ResultadoCostos = {
  comprador: { lineas: Linea[]; costos: number; total: number; desembolsoPropio: number };
  vendedor: { lineas: Linea[]; costos: number; neto: number };
  sellos: { baseARS: number; totalARS: number; caso: CasoSellos; alicuota: number };
};

const pct = (n: number) => `${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;

/** Impuesto de Sellos total de la operación, en pesos. */
export function sellosCABA(baseARS: number, viviendaUnica: boolean, c: CostosConfig["sellos"]) {
  const { umbral, alicuotaGeneral, alicuotaAlta } = c;
  if (viviendaUnica) {
    if (baseARS <= umbral) return { total: 0, caso: "exento" as const, alicuota: 0 };
    return { total: (baseARS - umbral) * alicuotaAlta / 100, caso: "excedente" as const, alicuota: alicuotaAlta };
  }
  if (baseARS <= umbral) return { total: baseARS * alicuotaGeneral / 100, caso: "general" as const, alicuota: alicuotaGeneral };
  return { total: baseARS * alicuotaAlta / 100, caso: "alta" as const, alicuota: alicuotaAlta };
}

export function calcularCostos(e: EntradaCostos, c: CostosConfig): ResultadoCostos {
  const precio = Math.max(0, e.precio || 0);
  const tc = e.moneda === "USD" ? Math.max(1, e.tipoCambio || c.tipoCambio) : 1;
  const aMoneda = (ars: number) => ars / tc;
  const iva = c.iva / 100;

  // ── Sellos: sobre el precio o el VIR, el mayor, siempre en pesos ──
  const precioARS = precio * tc;
  const baseARS = Math.max(precioARS, e.vir && e.vir > 0 ? e.vir : 0);
  const pba = e.jurisdiccion === "PBA";
  // En Provincia la exención de vivienda única depende de una valuación
  // fiscal ínfima ($1.154.400 en 2026): en la práctica, 2 % sobre el total
  const s = pba
    ? { total: baseARS * c.sellos.alicuotaPBA / 100, caso: "pba" as const, alicuota: c.sellos.alicuotaPBA }
    : sellosCABA(baseARS, e.viviendaUnica, c.sellos);
  const parteC = c.sellos.parteComprador / 100;
  const sellosComprador = aMoneda(s.total * parteC);
  const sellosVendedor = aMoneda(s.total * (1 - parteC));

  const calculoSellos =
    s.caso === "exento" ? "Vivienda única hasta el umbral" :
    s.caso === "excedente" ? `${pct(s.alicuota)} sobre el excedente del umbral, la mitad` :
    `${pct(s.alicuota)} del total, la mitad`;
  const fuenteSellos = pba
    ? "Ley Impositiva de la Provincia de Buenos Aires 2026 (Ley 15.558): 2 % sobre el precio o la valuación " +
      "fiscal, el mayor. La exención de vivienda única solo alcanza valuaciones fiscales muy bajas. Por costumbre se reparte mitad y mitad."
    : "Ley Tarifaria CABA 2026 (Ley 6926) y Código Fiscal (Ley 6805). Base: precio, valuación fiscal o " +
      "Valor Inmobiliario de Referencia, el mayor. Por costumbre se reparte mitad y mitad.";

  const lineaSellos = (id: string, monto: number): Linea => s.caso === "exento"
    ? { id, concepto: "Impuesto de Sellos", calculo: calculoSellos, monto: 0, informativa: true, etiqueta: "Exento", fuente: fuenteSellos }
    : { id, concepto: "Impuesto de Sellos", calculo: calculoSellos, monto, fuente: fuenteSellos };

  // ── Comprador ──
  const lc: Linea[] = [];
  const honEsc = precio * e.honorariosEscribano / 100;
  lc.push({
    id: "escribano",
    concepto: "Honorarios del escribano",
    calculo: `${pct(e.honorariosEscribano)} del precio`,
    monto: honEsc,
    fuente: "Honorarios de libre pacto. Referencia de plaza en CABA: entre 1,5 % y 2 % del precio. Los elige y paga el comprador.",
  });
  lc.push({
    id: "escribano-iva",
    concepto: "IVA sobre honorarios del escribano",
    calculo: `${pct(c.iva)}`,
    monto: honEsc * iva,
    fuente: "Los honorarios profesionales llevan IVA.",
  });
  lc.push({
    id: "gastos",
    concepto: "Gastos de escritura e inscripción",
    calculo: `${pct(c.escribania.gastos)} del precio`,
    monto: precio * c.escribania.gastos / 100,
    fuente: pba
      ? "Aportes notariales, folios, testimonio y las tasas del Registro de la Propiedad de la Provincia. Valor orientativo."
      : "Aportes notariales, folios, testimonio y la tasa del Registro de la Propiedad (1 ‰ del monto, Decreto 902/2024). Valor orientativo.",
  });
  lc.push(lineaSellos("sellos-c", sellosComprador));
  if (e.conInmobiliaria) {
    const hon = precio * e.honorariosComprador / 100;
    lc.push({
      id: "inmo-c",
      concepto: "Honorarios de la inmobiliaria",
      calculo: `${pct(e.honorariosComprador)} del precio`,
      monto: hon,
      fuente: "Ley 2340 (CABA), art. 11: se pactan libremente. Por costumbre, entre 3 % y 4 % a cargo del comprador.",
    });
    if (e.ivaHonorarios) {
      lc.push({ id: "inmo-c-iva", concepto: "IVA sobre honorarios de la inmobiliaria", calculo: pct(c.iva), monto: hon * iva, fuente: "Solo si el corredor es responsable inscripto." });
    }
  }
  const credito = Math.min(Math.max(0, e.credito || 0), precio);
  if (credito > 0) {
    const honHip = credito * c.escribania.hipoteca / 100;
    lc.push({
      id: "hipoteca",
      concepto: "Escritura de la hipoteca",
      calculo: `${pct(c.escribania.hipoteca)} del crédito, más IVA`,
      monto: honHip * (1 + iva),
      fuente: "La designa el banco. Valor orientativo: varía según la entidad (algunas bonifican gastos).",
    });
    lc.push({
      id: "hipoteca-sellos",
      concepto: "Sellos sobre la hipoteca",
      monto: 0,
      informativa: true,
      etiqueta: "Exento",
      fuente: pba
        ? "Provincia de Buenos Aires 2026: exentos los créditos para vivienda única hasta $ 251.281.250; por encima, 1,8 %."
        : "Ley Tarifaria CABA 2026: los créditos de entidades financieras para vivienda de personas humanas están exentos.",
    });
  }
  const costosC = lc.filter(l => !l.informativa).reduce((a, l) => a + l.monto, 0);

  // ── Vendedor ──
  const lv: Linea[] = [];
  if (e.conInmobiliaria) {
    const hon = precio * e.honorariosVendedor / 100;
    lv.push({
      id: "inmo-v",
      concepto: "Honorarios de la inmobiliaria",
      calculo: `${pct(e.honorariosVendedor)} del precio`,
      monto: hon,
      fuente: "Ley 2340 (CABA), art. 11: se pactan libremente. Por costumbre, 3 % a cargo del vendedor.",
    });
    if (e.ivaHonorarios) {
      lv.push({ id: "inmo-v-iva", concepto: "IVA sobre honorarios de la inmobiliaria", calculo: pct(c.iva), monto: hon * iva, fuente: "Solo si el corredor es responsable inscripto." });
    }
  }
  lv.push(lineaSellos("sellos-v", sellosVendedor));
  lv.push({
    id: "certificados",
    concepto: "Certificados, informes y libre deuda",
    calculo: `${pct(c.escribania.certificadosVendedor)} del precio`,
    monto: precio * c.escribania.certificadosVendedor / 100,
    fuente: "Dominio, inhibición, catastro, ABL, AySA y expensas. Suele estar entre 0,3 % y 1 % según la escribanía.",
  });
  lv.push({
    id: "cedular",
    concepto: "Impuesto cedular (Ganancias)",
    monto: 0,
    informativa: true,
    etiqueta: "Exento",
    fuente: "Exento desde el 01/01/2026 para personas humanas que no venden en forma habitual (Ley 27.802). Quien opera como empresa sigue alcanzado.",
  });
  lv.push({
    id: "iti",
    concepto: "Impuesto a la Transferencia de Inmuebles (ITI)",
    monto: 0,
    informativa: true,
    etiqueta: "Derogado",
    fuente: "Derogado por la Ley 27.743 (2024).",
  });
  const costosV = lv.filter(l => !l.informativa).reduce((a, l) => a + l.monto, 0);

  const total = precio + costosC;
  return {
    comprador: { lineas: lc, costos: costosC, total, desembolsoPropio: total - credito },
    vendedor: { lineas: lv, costos: costosV, neto: precio - costosV },
    sellos: { baseARS, totalARS: s.total, caso: s.caso, alicuota: s.alicuota },
  };
}

/**
 * Une una configuración guardada con el default: si el código suma un
 * parámetro nuevo, las configs viejas lo toman del default sin perder
 * lo que el admin ya editó.
 */
export function unirConfig(guardada: Partial<CostosConfig> | null | undefined): CostosConfig {
  if (!guardada) return COSTOS_DEFAULT;
  return {
    ...COSTOS_DEFAULT,
    ...guardada,
    version: 1,
    sellos: { ...COSTOS_DEFAULT.sellos, ...(guardada.sellos ?? {}) },
    escribania: { ...COSTOS_DEFAULT.escribania, ...(guardada.escribania ?? {}) },
    inmobiliaria: { ...COSTOS_DEFAULT.inmobiliaria, ...(guardada.inmobiliaria ?? {}) },
  };
}
