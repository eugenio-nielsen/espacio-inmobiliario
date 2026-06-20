-- ============================================================
-- Migración: generador de descripción con IA (límite por propiedad)
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que la usa.
-- ============================================================

alter table public.properties
  add column if not exists ai_usos integer not null default 0;

comment on column public.properties.ai_usos is
  'Cantidad de descripciones generadas con IA para esta propiedad (límite 2).';
