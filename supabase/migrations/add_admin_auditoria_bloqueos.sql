-- ============================================================
-- Migración: auditoría de acciones del superadmin + contactos bloqueados
-- Correr en: Supabase Dashboard → SQL Editor
--
-- admin_auditoria: bitácora de lo que hace el superadmin (borrados,
-- aprobaciones, suspensiones). Se escribe solo con service role.
--
-- contactos_bloqueados: emails/teléfonos de leads falsos. Las consultas
-- que lleguen de estos contactos se descartan en silencio.
-- ============================================================

create table if not exists public.admin_auditoria (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  admin_email text not null,
  accion      text not null,
  objetivo    text,
  detalle     jsonb
);
create index if not exists idx_admin_auditoria_fecha on public.admin_auditoria (created_at desc);

create table if not exists public.contactos_bloqueados (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text,
  telefono   text,           -- solo dígitos
  nombre     text,
  motivo     text,
  constraint contacto_con_dato check (email is not null or telefono is not null)
);
create index if not exists idx_bloqueados_email on public.contactos_bloqueados (lower(email));
create index if not exists idx_bloqueados_tel   on public.contactos_bloqueados (telefono);

-- Sin policies: RLS activo deja las tablas accesibles solo al service role.
alter table public.admin_auditoria      enable row level security;
alter table public.contactos_bloqueados enable row level security;
