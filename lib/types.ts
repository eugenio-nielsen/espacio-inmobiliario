export type PropertyTipo = "casa" | "departamento" | "terreno" | "local" | "oficina";
export type PropertyOperacion = "venta" | "alquiler";
export type PropertyStatus = "activa" | "pausada" | "vendida";
export type Moneda = "USD" | "ARS";
export type InquiryStatus = "nuevo" | "visto" | "contactado" | "cerrado";
export type PropertyEstado = "A estrenar" | "Excelente" | "Muy bueno" | "Bueno" | "A refaccionar";

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  slug: string;
  titulo: string;
  descripcion?: string;
  tipo: PropertyTipo;
  operacion: PropertyOperacion;
  precio: number;
  moneda: Moneda;
  provincia: string;
  ciudad: string;
  barrio?: string;
  direccion?: string;
  superficie_total?: number;
  superficie_cubierta?: number;
  superficie_balcon?: number | null;
  superficie_descubierta?: number | null;
  ambientes?: number;
  dormitorios?: number;
  banos?: number;
  cochera: boolean;
  apto_credito: boolean;
  orientacion?: string;
  disposicion?: "Frente" | "Contrafrente" | "Lateral" | "Otra";
  expensas?: number | null;
  antiguedad?: number | null;
  estado?: PropertyEstado | null;
  piso?: string | null;
  plano?: string | null;
  status: PropertyStatus;
  fotos: string[];
  ai_usos?: number;
  views?: number;
  lat?: number | null;
  lng?: number | null;
  geo_aproximada?: boolean | null;
  /** Disponibilidad para visitas. Sin configurar = null. */
  visitas_config?: VisitasConfig | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "nombre" | "email" | "telefono">;
}

/**
 * Campos que realmente usa PropertyListCard.
 * Evita traer columnas pesadas (descripcion, plano, geo…) en los listados.
 */
export type PropertyCardData = Pick<
  Property,
  | "id" | "titulo" | "precio" | "moneda" | "tipo" | "operacion"
  | "barrio" | "ciudad" | "fotos" | "ambientes" | "dormitorios"
  | "superficie_total" | "cochera" | "apto_credito"
>;

/** Tope de propiedades que la home llega a mostrar antes de derivar al listado. */
export const TOPE_HOME = 24;

/** Lista de columnas para los SELECT de listados (coincide con PropertyCardData). */
export const PROPERTY_CARD_COLS =
  "id, titulo, precio, moneda, tipo, operacion, barrio, ciudad, fotos, ambientes, dormitorios, superficie_total, cochera, apto_credito";

export interface Inquiry {
  id: string;
  property_id: string;
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
  leida: boolean;
  status: InquiryStatus;
  favorito: boolean;
  created_at: string;
  properties?: Pick<Property, "titulo" | "slug" | "barrio" | "ciudad">;
}

export interface PropertyWithInquiries extends Property {
  inquiries: Inquiry[];
  total_inquiries: number;
  week_inquiries: number;
  new_inquiries: number;
}

// ── Agenda de visitas ──────────────────────────────────────────

export type VisitaStatus =
  | "pendiente" | "confirmada" | "rechazada" | "cancelada" | "realizada";

/** Franja semanal recurrente. dia: 0 = domingo … 6 = sábado. */
export interface Franja {
  dia: number;
  desde: string; // "10:00"
  hasta: string; // "13:00"
}

/** Disponibilidad del dueño para una propiedad (columna properties.visitas_config). */
export interface VisitasConfig {
  activa: boolean;
  /** Minutos que dura cada visita: 30, 45 o 60. */
  duracion: number;
  franjas: Franja[];
}

export interface Visita {
  id: string;
  property_id: string;
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string | null;
  /** Instante exacto en ISO. Se muestra siempre en hora de Argentina. */
  inicio: string;
  duracion: number;
  status: VisitaStatus;
  nota_dueno?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitaConPropiedad extends Visita {
  propiedadTitulo: string;
  propiedadBarrio?: string;
}
