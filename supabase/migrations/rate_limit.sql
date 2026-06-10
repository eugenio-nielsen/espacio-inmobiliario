-- ============================================================
-- Migración: rate limiting para formularios públicos
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  key        text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_key_time
  on public.rate_limit_hits (key, created_at);

-- Sin policies → solo el service role (admin client) accede.
alter table public.rate_limit_hits enable row level security;

-- Devuelve true si la acción está permitida (y registra el hit).
-- Devuelve false si la key superó p_max hits en la ventana.
create or replace function public.check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
as $$
declare
  hits int;
begin
  -- Limpieza oportunista de hits viejos (> 1 día)
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';

  select count(*) into hits
  from public.rate_limit_hits
  where key = p_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if hits >= p_max then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;
