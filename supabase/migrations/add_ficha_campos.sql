-- ============================================================
-- Migración: campos nuevos de la ficha de propiedad
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que los usa.
-- ============================================================

alter table public.properties
  add column if not exists expensas    numeric(12,2),  -- ARS por mes (deptos)
  add column if not exists antiguedad  smallint,        -- años; 0 = a estrenar
  add column if not exists estado      text check (estado in
    ('A estrenar','Excelente','Muy bueno','Bueno','A refaccionar')),
  add column if not exists piso        text,            -- "PB", "3", "12", etc.
  add column if not exists plano       text;            -- URL de imagen del plano

comment on column public.properties.expensas   is 'Expensas mensuales en ARS';
comment on column public.properties.antiguedad is 'Antigüedad en años (0 = a estrenar)';
comment on column public.properties.plano      is 'URL del plano (bucket property-photos)';
