export type PropertyTipo = "casa" | "departamento" | "terreno" | "local" | "oficina";
export type PropertyOperacion = "venta" | "alquiler";
export type PropertyStatus = "activa" | "pausada" | "vendida";
export type Moneda = "USD" | "ARS";
export type InquiryStatus = "nuevo" | "visto" | "contactado" | "cerrado";

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
  ambientes?: number;
  dormitorios?: number;
  banos?: number;
  cochera: boolean;
  apto_credito: boolean;
  orientacion?: string;
  disposicion?: "Frente" | "Contrafrente" | "Lateral" | "Otra";
  status: PropertyStatus;
  fotos: string[];
  views?: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "nombre" | "email" | "telefono">;
}

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
