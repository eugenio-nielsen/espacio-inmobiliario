-- ============================================================
-- Migración: coordenadas geocodificadas en properties
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que las usa.
-- ============================================================

alter table public.properties
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists geo_aproximada boolean;

comment on column public.properties.lat is 'Latitud geocodificada al crear/editar (Nominatim)';
comment on column public.properties.lng is 'Longitud geocodificada al crear/editar (Nominatim)';
comment on column public.properties.geo_aproximada is 'true si la coordenada es del barrio/localidad y no de la dirección exacta';
