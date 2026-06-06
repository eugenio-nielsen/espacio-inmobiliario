-- ============================================================
-- Estimador de Precios de Deptos en CABA
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Precios base por m² (USD) por barrio — EDITABLE
create table if not exists public.barrio_precios (
  barrio        text primary key,
  precio_m2_usd integer not null check (precio_m2_usd > 0),
  updated_at    timestamptz not null default now()
);

-- 2. Config del modelo (coeficientes) — una sola fila (id=1)
--    Si no existe fila, la app usa el default de lib/estimador/config.default.ts
create table if not exists public.estimador_config (
  id         smallint primary key default 1,
  config     jsonb not null,
  updated_at timestamptz not null default now(),
  constraint estimador_config_single check (id = 1)
);

-- 3. Log de estimaciones + leads
create table if not exists public.estimaciones (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  barrio        text,
  input         jsonb not null,
  resultado     jsonb not null,
  lead_nombre   text,
  lead_email    text,
  lead_telefono text
);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.barrio_precios   enable row level security;
alter table public.estimador_config enable row level security;
alter table public.estimaciones     enable row level security;

-- Lectura pública de precios y config (necesaria para estimar)
drop policy if exists "precios_read" on public.barrio_precios;
create policy "precios_read" on public.barrio_precios for select using (true);

drop policy if exists "config_read" on public.estimador_config;
create policy "config_read" on public.estimador_config for select using (true);

-- estimaciones: sin policies → solo el service role (admin client) escribe/lee.

-- ── Seed de precios (USD/m²) — valores orientativos, EDITABLES ──
insert into public.barrio_precios (barrio, precio_m2_usd) values
  ('Agronomía', 2150),
  ('Almagro', 2200),
  ('Balvanera', 1900),
  ('Barracas', 1900),
  ('Belgrano', 2900),
  ('Boedo', 2000),
  ('Caballito', 2450),
  ('Chacarita', 2300),
  ('Coghlan', 2600),
  ('Colegiales', 2700),
  ('Constitución', 1650),
  ('Flores', 1900),
  ('Floresta', 1900),
  ('La Boca', 1650),
  ('La Paternal', 2000),
  ('Liniers', 1700),
  ('Mataderos', 1700),
  ('Monte Castro', 2000),
  ('Montserrat', 1950),
  ('Nueva Pompeya', 1500),
  ('Núñez', 2900),
  ('Palermo', 3000),
  ('Parque Avellaneda', 1650),
  ('Parque Chacabuco', 2100),
  ('Parque Chas', 2200),
  ('Parque Patricios', 1900),
  ('Puerto Madero', 6000),
  ('Recoleta', 3200),
  ('Retiro', 2900),
  ('Saavedra', 2400),
  ('San Cristóbal', 1850),
  ('San Nicolás', 2050),
  ('San Telmo', 2050),
  ('Versalles', 1950),
  ('Villa Crespo', 2400),
  ('Villa del Parque', 2200),
  ('Villa Devoto', 2300),
  ('Villa General Mitre', 2000),
  ('Villa Lugano', 1300),
  ('Villa Luro', 2000),
  ('Villa Ortúzar', 2350),
  ('Villa Pueyrredón', 2200),
  ('Villa Real', 1950),
  ('Villa Riachuelo', 1400),
  ('Villa Santa Rita', 2000),
  ('Villa Soldati', 1200),
  ('Villa Urquiza', 2550),
  ('Vélez Sársfield', 1950)
on conflict (barrio) do nothing;
