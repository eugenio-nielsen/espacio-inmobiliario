-- ============================================================
-- Migración: seguimiento de leads en Consultas Recibidas
-- Correr en: Supabase Dashboard → SQL Editor
--
-- Suma "próxima acción" a cada consulta para que el dueño no
-- pierda el hilo del seguimiento. El campo `favorito` ya existía
-- pero no estaba expuesto en el panel: ahora se usa como
-- marcador de lead prioritario.
-- ============================================================

alter table public.inquiries
  add column if not exists proxima_accion       text,
  add column if not exists proxima_accion_fecha date;

-- Para ordenar por lo que vence primero sin escanear toda la tabla
create index if not exists idx_inquiries_proxima_accion
  on public.inquiries (proxima_accion_fecha)
  where proxima_accion_fecha is not null;

-- Los leads marcados como prioritarios se consultan seguido
create index if not exists idx_inquiries_favorito
  on public.inquiries (property_id)
  where favorito = true;
