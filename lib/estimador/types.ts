// ── Tipos del Estimador de Precios ─────────────────────────────

export type EstadoConservacion = "a_reciclar" | "bueno" | "muy_bueno" | "a_estrenar";
export type Disposicion = "frente" | "contrafrente" | "interno";
export type CategoriaEdificio = "regular" | "estandar" | "premium";
export type NivelConfianza = "baja" | "media" | "alta";

export interface EstimadorInput {
  barrio: string;
  direccion?: string;
  m2Cubiertos: number;
  m2Descubiertos: number;
  ambientes?: number;
  dormitorios?: number;
  banos: number;
  antiguedad: number;          // años
  estado: EstadoConservacion;
  piso: number;                // 0 = planta baja
  ultimoPiso: boolean;
  disposicion: Disposicion;
  orientacion?: string;        // "norte", "sur", etc. o ""
  cochera: boolean;
  baulera: boolean;
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
  superficieDescubiertaFactor: number;  // peso de m² descubiertos (0.35 = 35% del cubierto)
  topeMin: number;                      // tope inferior del índice (ej 0.55)
  topeMax: number;                      // tope superior del índice (ej 1.60)
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
  valorBase: number;
  indiceAjuste: number;
  confianza: NivelConfianza;
  factoresPositivos: FactorAplicado[];
  factoresNegativos: FactorAplicado[];
}
