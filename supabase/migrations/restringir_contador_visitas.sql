-- ============================================================
-- Migración: las visitas de una ficha solo las suma el servidor
-- Correr en: Supabase Dashboard → SQL Editor
--
-- add_views_tracking.sql dejó increment_property_views invocable
-- por anon y authenticated. La clave pública viaja en el
-- navegador, así que cualquiera podía llamar a
-- /rest/v1/rpc/increment_property_views y sumar visitas a mano,
-- salteando los filtros de /api/vistas (robots, dueño, una por IP
-- y día). Desde que las visitas se registran por esa ruta, con el
-- service role, nadie más necesita ejecutarla.
--
-- Se puede correr más de una vez.
-- ============================================================

-- Postgres da EXECUTE a PUBLIC por defecto: hay que quitarlo también
revoke execute on function public.increment_property_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_property_views(uuid) to service_role;

-- Una función "security definer" sin search_path fijo puede resolver
-- nombres en un esquema ajeno
alter function public.increment_property_views(uuid) set search_path = public;
