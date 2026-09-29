-- ============================================================
-- Cátedra Inmobiliaria (/catedra)
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que la usa.
-- ============================================================

-- ── 1. Parámetros de la calculadora de costos ────────────────
--    Una sola fila (id=1). Si no existe, la app usa el default de
--    lib/catedra/costos.ts. Se edita desde /panel/admin → Cátedra.
create table if not exists public.catedra_config (
  id         smallint primary key default 1,
  config     jsonb not null,
  updated_at timestamptz not null default now(),
  constraint catedra_config_una_fila check (id = 1)
);

drop trigger if exists trg_catedra_config_updated_at on public.catedra_config;
create trigger trg_catedra_config_updated_at
  before update on public.catedra_config
  for each row execute function public.handle_updated_at();

alter table public.catedra_config enable row level security;

-- Lectura pública: la calculadora es libre
drop policy if exists "catedra_config_lectura" on public.catedra_config;
create policy "catedra_config_lectura" on public.catedra_config for select using (true);
revoke insert, update, delete on public.catedra_config from anon, authenticated;

-- ── 2. Red de profesionales de confianza ─────────────────────
--    Dos vías de alta: curada por el superadmin (con el
--    consentimiento del profesional) o postulación desde el sitio
--    (queda "postulado" hasta que se aprueba).
--    Tiene teléfonos y emails de personas: SIN policies. Solo el
--    service role lee y escribe, y el servidor muestra la red solo a
--    usuarios con sesión.
create table if not exists public.catedra_profesionales (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete set null,
  nombre             text not null check (char_length(nombre) between 2 and 80),
  rubro              text not null check (rubro in (
                       'escribania','abogacia','corretaje','tasacion','arquitectura',
                       'agrimensura','gestoria','contaduria','fotografia')),
  matricula          text check (char_length(matricula) <= 120),
  zona               text not null check (char_length(zona) between 2 and 80),
  telefono           text check (char_length(telefono) <= 40),
  email              text check (char_length(email) <= 120),
  web                text check (char_length(web) <= 200),
  descripcion        text check (char_length(descripcion) <= 400),
  estado             text not null default 'postulado'
                     check (estado in ('postulado','aprobado','rechazado','oculto')),
  origen             text not null check (origen in ('curado','postulacion')),
  recomendado        boolean not null default false,
  consentimiento_at  timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_catedra_prof_estado on public.catedra_profesionales (estado, rubro);
create unique index if not exists uq_catedra_prof_usuario on public.catedra_profesionales (user_id) where user_id is not null;

drop trigger if exists trg_catedra_prof_updated_at on public.catedra_profesionales;
create trigger trg_catedra_prof_updated_at
  before update on public.catedra_profesionales
  for each row execute function public.handle_updated_at();

alter table public.catedra_profesionales enable row level security;
revoke all on public.catedra_profesionales from anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
