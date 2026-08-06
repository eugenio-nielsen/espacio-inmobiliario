-- ============================================================
-- Migración: estadísticas de la home en una sola consulta
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que la usa.
--
-- Antes la home traía TODAS las filas activas solo para sumar
-- las vistas en JavaScript. Ahora suma Postgres y devuelve
-- una única fila.
-- ============================================================

create or replace function public.home_stats()
returns table (total_activas bigint, total_views bigint)
language sql
stable
as $$
  select
    count(*)::bigint,
    coalesce(sum(views), 0)::bigint
  from public.properties
  where status = 'activa';
$$;

comment on function public.home_stats() is
  'Cantidad de propiedades activas y suma de sus vistas, para la banda de estadísticas de la home.';

grant execute on function public.home_stats() to anon, authenticated;
