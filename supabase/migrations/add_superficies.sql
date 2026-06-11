-- ============================================================
-- Migración: desglose de superficies (balcón y descubierta/terraza)
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que las usa.
-- ============================================================

alter table public.properties
  add column if not exists superficie_balcon      numeric(10,2),
  add column if not exists superficie_descubierta numeric(10,2);

comment on column public.properties.superficie_balcon      is 'm² de balcón';
comment on column public.properties.superficie_descubierta is 'm² descubiertos / terraza / patio';
-- superficie_total pasa a ser la suma (calculada en el formulario):
-- cubierta + balcón + descubierta
