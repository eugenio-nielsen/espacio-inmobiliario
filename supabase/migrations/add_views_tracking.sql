-- ============================================================
-- Migración: tracking de visitas en properties
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Columna views (default 0, nunca null)
alter table public.properties
  add column if not exists views integer not null default 0;

-- 2. Función RPC para incrementar de forma atómica y sin RLS
--    Se llama con: supabase.rpc('increment_property_views', { property_id: '...' })
--    security definer → corre con permisos del dueño de la función (sin RLS)
create or replace function public.increment_property_views(property_id uuid)
returns void
language sql
security definer
as $$
  update public.properties
  set views = views + 1
  where id = property_id
    and status = 'activa';
$$;

-- Permisos: la función es invocable por el rol anon (visitantes no logueados)
grant execute on function public.increment_property_views(uuid) to anon, authenticated;
