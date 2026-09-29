/** Tipos de la Tertulia (ver supabase/migrations/foro.sql). */

export type Rol = "compra" | "vende" | "profesional" | "estudiante" | "otro";

export const ROLES: { valor: Rol; opcion: string; etiqueta: string | null }[] = [
  { valor: "compra", opcion: "Compro", etiqueta: "Quiere comprar" },
  { valor: "vende", opcion: "Vendo", etiqueta: "Quiere vender" },
  { valor: "profesional", opcion: "Soy profesional", etiqueta: "Profesional" },
  { valor: "estudiante", opcion: "Soy estudiante", etiqueta: "Estudiante" },
  // "Otro" no se muestra junto al nombre: no dice nada de la persona
  { valor: "otro", opcion: "Otro", etiqueta: null },
];

export function esRol(v: unknown): v is Rol {
  return ROLES.some(r => r.valor === v);
}

export function etiquetaRol(rol: Rol | null): string | null {
  return ROLES.find(r => r.valor === rol)?.etiqueta ?? null;
}

/** Lo que cualquiera puede ver de un miembro (las columnas con GRANT público). */
export type Miembro = {
  id: string;
  alias: string;
  handle: string;
  rol: Rol | null;
  bio: string | null;
  avatar_url: string | null;
  verificado: boolean;
  equipo: boolean;
  created_at: string;
};

/** El miembro completo: solo para él mismo y para el superadmin. */
export type MiembroPrivado = Miembro & {
  suspendido: boolean;
  avisos_email: boolean;
  email_verificado_at: string | null;
  matricula: string | null;
  verificacion_estado: "sin_pedir" | "pendiente" | "aprobada" | "rechazada";
};

export type Estado = "pendiente" | "publicado" | "oculto";

export type TemaFila = {
  id: string;
  slug: string;
  categoria: string;
  titulo: string;
  cuerpo: string;
  votos: number;
  respuestas: number;
  vistas: number;
  fijado: boolean;
  respuesta_aceptada_id: string | null;
  ultima_actividad_at: string;
  created_at: string;
  autor: Miembro;
};

export type Tema = TemaFila & {
  fotos: string[];
  editado_at: string | null;
  autor_id: string;
};

export type Respuesta = {
  id: string;
  tema_id: string;
  autor_id: string;
  cuerpo: string;
  fotos: string[];
  votos: number;
  editado_at: string | null;
  created_at: string;
  autor: Miembro;
};

export type Comentario = {
  id: string;
  respuesta_id: string;
  autor_id: string;
  cuerpo: string;
  editado_at: string | null;
  created_at: string;
  autor: Miembro;
};

export type Orden = "actividad" | "nuevos" | "sin-respuesta" | "resueltos" | "valorados";

export const ORDENES: { valor: Orden; label: string }[] = [
  { valor: "actividad", label: "Actividad" },
  { valor: "nuevos", label: "Nuevos" },
  { valor: "sin-respuesta", label: "Sin respuesta" },
  { valor: "resueltos", label: "Resueltos" },
  { valor: "valorados", label: "Más valorados" },
];

export function esOrden(v: unknown): v is Orden {
  return ORDENES.some(o => o.valor === v);
}

export type MotivoReporte = "spam" | "ofensivo" | "publicidad" | "datos_personales" | "otro";

export const MOTIVOS_REPORTE: { valor: MotivoReporte; label: string }[] = [
  { valor: "spam", label: "Spam o contenido repetido" },
  { valor: "publicidad", label: "Publicidad encubierta" },
  { valor: "ofensivo", label: "Ofensivo o agresivo" },
  { valor: "datos_personales", label: "Expone datos personales" },
  { valor: "otro", label: "Otro motivo" },
];

/** Resultado de las acciones del foro que ve el cliente. */
export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };
