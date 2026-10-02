-- ============================================================
-- Migración: "cochera" como tipo de unidad
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que lo usa
-- (sin esto, guardar una propiedad de tipo "cochera" falla).
-- ============================================================

alter table public.properties
  drop constraint if exists properties_tipo_check;

alter table public.properties
  add constraint properties_tipo_check
  check (tipo in ('casa','departamento','terreno','local','oficina','cochera'));
