export type PostStatus = "borrador" | "publicado";

export interface Post {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  contenido: string;          // Markdown
  cover: string | null;
  categoria: string | null;
  autor: string;
  status: PostStatus;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Conjunto fijo de categorías
export const CATEGORIAS_BLOG = [
  // Serie mensual con los datos del Colegio de Escribanos porteño
  "Seguimiento de Escrituras 2026",
  "Guía para vender",
  "Mercado inmobiliario",
  "Legal y escrituras",
  "Créditos hipotecarios",
  "Consejos para propietarios",
  "Tendencias y diseño",
] as const;

export type CategoriaBlog = (typeof CATEGORIAS_BLOG)[number];
