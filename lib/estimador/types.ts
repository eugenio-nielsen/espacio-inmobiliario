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

export interface EstimadorInput {
  barrio: string;
  direccion?: string;
  m2Cubiertos: number;
  m2Semicubierto: number;      // balcón
  m2Descubiertos: number;      // patio / terraza
  ambientes?: number;
  dormitorios?: number;
  banos: number;
  antiguedad: number;          // años
  condicionObra: CondicionObra;
  estado: EstadoConservacion;  // conservación (para usados)
  piso: number;                // 0 = planta baja
  ultimoPiso: boolean;
  ascensor: boolean;
  disposicion: Disposicion;
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
  categoria: CategoriaEdificio;
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
  rangos?: RangoCoef[];       // tipo "rango"
  opciones?: Record<string, OpcionCoef>; // tipo "opcion"
  coefTrue?: number;          // tipo "booleano"
  coefFalse?: number;
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
  factoresPositivos: FactorAplicado[];
  factoresNegativos: FactorAplicado[];
}
