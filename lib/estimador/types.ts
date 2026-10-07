// ── Tipos del Estimador de Precios ─────────────────────────────

export type EstadoConservacion = "a_reciclar" | "bueno" | "muy_bueno" | "excelente";
export type CondicionObra = "usado" | "a_estrenar" | "pozo";
export type Disposicion = "frente" | "contrafrente" | "interno";
export type CategoriaEdificio = "regular" | "estandar" | "premium";
export type Vista = "" | "abierta" | "despejada" | "a_la_calle" | "interna";
export type Expensas = "" | "bajas" | "medias" | "altas";
export type Ocupacion = "" | "libre" | "alquilada" | "ocupada";
export type SituacionDominial = "" | "escritura" | "sucesion" | "observaciones";
export type Calefaccion = "" | "losa" | "central" | "individual" | "sin";
export type Cochera = "no" | "descubierta" | "movil" | "fija";
export type NivelConfianza = "baja" | "media" | "alta";

/**
 * Lo que la persona no respondió queda vacío ("" o undefined) y el motor lo
 * trata como neutro: antes arrancaba con valores por defecto (frente, planta
 * baja, menos de un año…) que movían el precio sin que nadie los hubiera elegido.
 */
export interface EstimadorInput {
  barrio: string;
  direccion?: string;
  m2Cubiertos: number;
  m2Semicubierto: number;      // balcón
  m2Descubiertos: number;      // patio / terraza
  ambientes?: number;
  dormitorios?: number;
  banos?: number;
  antiguedad?: number;         // años; undefined = no informó
  condicionObra: CondicionObra;
  estado: EstadoConservacion | "";  // conservación (solo se usa en usados)
  piso?: number;               // 0 = planta baja; undefined = no informó
  ultimoPiso: boolean;
  ascensor: boolean;
  disposicion: Disposicion | "";
  orientacion?: string;        // "norte", "sur", etc. o ""
  vista: Vista;
  cochera: Cochera;
  baulera: boolean;
  dependenciaServicio: boolean;
  calefaccion: Calefaccion;
  expensas: Expensas;
  aptoCredito: boolean;
  ocupacion: Ocupacion;
  situacionDominial: SituacionDominial;
  vecinosEspeciales: boolean;  // a < 3 cuadras de bomberos, cementerio, hospital o terminal
  categoria: CategoriaEdificio | "";
  amenities: {
    pileta: boolean;
    sum: boolean;
    gimnasio: boolean;
    seguridad: boolean;
    parrilla: boolean;
  };
}

// ── Config del modelo (editable) ───────────────────────────────
export type FactorTipo = "rango" | "opcion" | "booleano";

export interface RangoCoef {
  min?: number;   // inclusive; undefined = sin límite inferior
  max?: number;   // inclusive; undefined = sin límite superior
  coef: number;
  label: string;
}
export interface OpcionCoef {
  coef: number;
  label: string;
}

export interface Factor {
  id: string;
  label: string;
  tipo: FactorTipo;
  input: string;              // clave del input (soporta dot-notation: "amenities.pileta")
  activo: boolean;            // permite "quitar" un factor sin borrarlo
  grupo?: string;             // factores del mismo grupo comparten un tope (ver topesGrupo)
  rangos?: RangoCoef[];       // tipo "rango"
  opciones?: Record<string, OpcionCoef>; // tipo "opcion"
  coefTrue?: number;          // tipo "booleano"
  coefFalse?: number;
}

/**
 * Una zona dentro de un barrio (ej.: Palermo Soho dentro de Palermo) donde el
 * metro cuadrado vale distinto del promedio del barrio. Es un círculo: si la
 * dirección cae adentro, el precio de referencia se multiplica por `coef`.
 */
export interface ZonaMicro {
  id: string;
  nombre: string;
  barrio: string;
  lat: number;
  lng: number;
  radioM: number;
  /** Multiplica el precio de referencia del barrio (1.10 = 10% más caro). */
  coef: number;
  activa: boolean;
}

export interface EstimadorConfig {
  version: number;                      // si cambia, se migra a la nueva config
  superficieSemicubiertaFactor: number; // peso de m² de balcón (ej 0.50 = 50% del cubierto)
  superficieDescubiertaFactor: number;  // peso de m² patio/terraza (ej 0.30 = 30% del cubierto)
  // multiplica el $/m² del barrio según la condición de obra
  estadoObra: { usado: number; a_estrenar: number; pozo: number };
  topeMin: number;                      // tope inferior del índice
  topeMax: number;                      // tope superior del índice
  rango: { alta: number; media: number; baja: number }; // spread del rango por confianza
  /**
   * Topes al producto de los factores de un mismo grupo. Evitan contar dos
   * veces lo mismo (ej.: categoría premium + cinco amenities + estado excelente).
   */
  /** Zonas dentro de los barrios, para ajustar el precio por la dirección. */
  zonas?: ZonaMicro[];
  topesGrupo?: Record<string, { label: string; min?: number; max?: number }>;
  factores: Factor[];
}

// ── Resultado ──────────────────────────────────────────────────
export interface FactorAplicado {
  label: string;
  coef: number;
  detalle: string;           // ej "Premium", "6° a 8° piso"
  positivo: boolean;         // coef > 1
}

export interface EstimadorResultado {
  estimado: number;
  rangoMin: number;
  rangoMax: number;
  precioM2Resultante: number;
  precioM2Referencia: number;  // $/m² del barrio ajustado por condición de obra
  valorBase: number;
  indiceAjuste: number;
  ajustePct: number;           // (indice - 1) * 100
  confianza: NivelConfianza;
  /** 0–100: qué parte de lo que más pesa en el valor fue respondida (menos las incoherencias). */
  puntaje: number;
  /** Datos que no respondió y que ajustarían el rango. */
  faltantes: string[];
  /** Datos que parecen incoherentes entre sí; restan precisión. */
  advertencias: string[];
  /** Grupos de factores cuyo producto se limitó, y cuánto sumaban antes del tope. */
  topesAplicados: { grupo: string; label: string; antes: number; despues: number }[];
  /** Cuándo se actualizó por última vez el precio de referencia del barrio. */
  precioActualizado?: string;
  /** Dónde cayó la dirección y si ajustó el precio. Ausente si no dio dirección o no se pudo ubicar. */
  ubicacion?: UbicacionEstimada;
  factoresPositivos: FactorAplicado[];
  factoresNegativos: FactorAplicado[];
}

export interface UbicacionEstimada {
  lat: number;
  lng: number;
  /** Barrio que el mapa le asigna a la dirección, si difiere del elegido. */
  barrioDetectado?: string;
  /** Zona que ajustó el precio de referencia, si el barrio tiene zonas cargadas. */
  zona?: { nombre: string; coef: number };
}
