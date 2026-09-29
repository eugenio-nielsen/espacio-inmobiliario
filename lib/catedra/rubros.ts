import { Stamp, Scale, KeyRound, LineChart, DraftingCompass, Ruler, FileStack, Calculator, Camera, type LucideIcon } from "lucide-react";

/**
 * Rubros de la red de profesionales. La columna `rubro` de
 * catedra_profesionales tiene un CHECK con estos mismos valores
 * (supabase/migrations/catedra.sql): para sumar uno, tocar los dos.
 */
export const RUBROS = [
  { valor: "escribania", nombre: "Escribanía", plural: "Escribanos", icon: Stamp },
  { valor: "abogacia", nombre: "Abogacía", plural: "Abogados", icon: Scale },
  { valor: "corretaje", nombre: "Corretaje y martillería", plural: "Martilleros y corredores", icon: KeyRound },
  { valor: "tasacion", nombre: "Tasación", plural: "Tasadores", icon: LineChart },
  { valor: "arquitectura", nombre: "Arquitectura", plural: "Arquitectos", icon: DraftingCompass },
  { valor: "agrimensura", nombre: "Agrimensura", plural: "Agrimensores", icon: Ruler },
  { valor: "gestoria", nombre: "Gestoría", plural: "Gestores", icon: FileStack },
  { valor: "contaduria", nombre: "Contaduría", plural: "Contadores", icon: Calculator },
  { valor: "fotografia", nombre: "Fotografía inmobiliaria", plural: "Fotógrafos inmobiliarios", icon: Camera },
] as const satisfies readonly { valor: string; nombre: string; plural: string; icon: LucideIcon }[];

export type Rubro = (typeof RUBROS)[number]["valor"];

export function esRubro(v: unknown): v is Rubro {
  return RUBROS.some(r => r.valor === v);
}

export function rubroPorValor(v: string) {
  return RUBROS.find(r => r.valor === v) ?? null;
}

/** Zonas sugeridas (el campo es libre: un profesional puede atender varias). */
export const ZONAS_SUGERIDAS = [
  "CABA",
  "GBA Norte",
  "GBA Oeste",
  "GBA Sur",
  "La Plata",
  "Todo AMBA",
  "Todo el país (remoto)",
];

/** Lo que ve un usuario registrado de cada profesional. */
export type Profesional = {
  id: string;
  nombre: string;
  rubro: Rubro;
  matricula: string | null;
  zona: string;
  telefono: string | null;
  email: string | null;
  web: string | null;
  descripcion: string | null;
  recomendado: boolean;
};

/** Lo que ve el superadmin. */
export type ProfesionalAdmin = Profesional & {
  estado: "postulado" | "aprobado" | "rechazado" | "oculto";
  origen: "curado" | "postulacion";
  user_id: string | null;
  consentimiento_at: string;
  created_at: string;
};
