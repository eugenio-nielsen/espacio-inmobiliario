-- ============================================================
-- Migración: Agenda de visitas
-- Correr en: Supabase Dashboard → SQL Editor
--
-- El dueño define su disponibilidad semanal por propiedad y el
-- interesado elige una franja concreta. El dueño confirma o
-- rechaza desde el panel.
-- ============================================================

-- ── 1. Disponibilidad semanal (vive en la propiedad) ──────────
-- Forma del JSON:
--   { "activa": true,
--     "duracion": 30,
--     "franjas": [ { "dia": 6, "desde": "10:00", "hasta": "13:00" } ] }
-- dia: 0 = domingo … 6 = sábado (igual que Date.getUTCDay)
alter table public.properties
  add column if not exists visitas_config jsonb;

-- ── 2. Solicitudes de visita ──────────────────────────────────
create table if not exists public.visitas (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,

  -- Datos del interesado (teléfono obligatorio: sin contacto no hay visita)
  nombre      text not null,
  email       text not null,
  telefono    text not null,
  mensaje     text,

  -- Momento elegido. Se guarda el instante exacto; la app siempre
  -- lo formatea en horario de Argentina.
  inicio      timestamptz not null,
  duracion    smallint not null default 30,

  status      text not null default 'pendiente'
              check (status in ('pendiente','confirmada','rechazada','cancelada','realizada')),
  nota_dueno  text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_visitas_property on public.visitas(property_id);
create index if not exists idx_visitas_inicio   on public.visitas(inicio);
create index if not exists idx_visitas_status   on public.visitas(status);

-- Una franja ya confirmada no se puede confirmar dos veces.
-- Los pedidos pendientes SÍ pueden coincidir: si dos interesados
-- piden el mismo horario, el dueño elige a cuál confirmar.
create unique index if not exists idx_visitas_slot_confirmado
  on public.visitas(property_id, inicio)
  where status = 'confirmada';

create trigger trg_visitas_updated_at
  before update on public.visitas
  for each row execute function public.handle_updated_at();

-- ── 3. RLS ────────────────────────────────────────────────────
alter table public.visitas enable row level security;

-- Cualquiera puede pedir una visita (mismo criterio que las consultas)
create policy "Cualquiera puede pedir una visita"
  on public.visitas for insert
  with check (true);

-- Solo el dueño de la propiedad ve las visitas de sus propiedades
create policy "Dueño lee visitas de sus propiedades"
  on public.visitas for select
  using (
    auth.uid() = (
      select owner_id from public.properties
      where id = property_id
    )
  );

-- Solo el dueño confirma, rechaza o marca como realizada
create policy "Dueño actualiza visitas de sus propiedades"
  on public.visitas for update
  using (
    auth.uid() = (
      select owner_id from public.properties
      where id = property_id
    )
  );
