-- ============================================================
-- Nielsen Espacio Inmobiliario — Esquema completo de Supabase
-- Pegar todo en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Habilitar extensión para UUIDs (ya viene activa por defecto en Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABLA: profiles
--    Se crea automáticamente al registrarse un dueño.
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  telefono    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger para actualizar updated_at en profiles
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger para crear el profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    new.email
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. TABLA: properties
-- ============================================================
create table if not exists public.properties (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  slug              text not null unique,
  titulo            text not null,
  descripcion       text,
  tipo              text not null check (tipo in ('casa','departamento','terreno','local','oficina')),
  operacion         text not null check (operacion in ('venta','alquiler')),
  precio            numeric(14,2) not null,
  moneda            text not null default 'USD' check (moneda in ('USD','ARS')),
  provincia         text not null,
  ciudad            text not null,
  direccion         text,
  superficie_total  numeric(10,2),
  superficie_cubierta numeric(10,2),
  dormitorios       smallint,
  banos             smallint,
  cochera           boolean not null default false,
  status            text not null default 'activa' check (status in ('activa','pausada','vendida')),
  fotos             text[] default '{}',   -- array de URLs de Supabase Storage
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

-- Índices útiles para filtros y búsqueda
create index if not exists idx_properties_tipo      on public.properties(tipo);
create index if not exists idx_properties_operacion on public.properties(operacion);
create index if not exists idx_properties_provincia on public.properties(provincia);
create index if not exists idx_properties_status    on public.properties(status);
create index if not exists idx_properties_owner     on public.properties(owner_id);
create index if not exists idx_properties_slug      on public.properties(slug);

-- ============================================================
-- 3. TABLA: inquiries (consultas de interesados)
-- ============================================================
create table if not exists public.inquiries (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  nombre        text not null,
  email         text not null,
  telefono      text,
  mensaje       text not null,
  leida         boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_inquiries_property on public.inquiries(property_id);

-- ============================================================
-- 4. STORAGE — bucket para fotos de propiedades
-- ============================================================
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- --- profiles ---
alter table public.profiles enable row level security;

-- Cualquiera puede leer perfiles básicos (para mostrar datos del dueño)
create policy "Perfiles visibles públicamente"
  on public.profiles for select
  using (true);

-- Solo el propio usuario puede actualizar su perfil
create policy "Dueño edita su perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- properties ---
alter table public.properties enable row level security;

-- Listado y detalle público (solo propiedades activas)
create policy "Propiedades activas visibles públicamente"
  on public.properties for select
  using (status = 'activa');

-- El dueño ve TODAS sus propiedades (incluso pausadas/vendidas)
create policy "Dueño ve todas sus propiedades"
  on public.properties for select
  using (auth.uid() = owner_id);

-- Solo el dueño puede insertar propiedades (vinculadas a su id)
create policy "Dueño crea propiedades"
  on public.properties for insert
  with check (auth.uid() = owner_id);

-- Solo el dueño puede actualizar sus propiedades
create policy "Dueño actualiza sus propiedades"
  on public.properties for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Solo el dueño puede eliminar sus propiedades
create policy "Dueño elimina sus propiedades"
  on public.properties for delete
  using (auth.uid() = owner_id);

-- --- inquiries ---
alter table public.inquiries enable row level security;

-- Cualquiera puede enviar una consulta (anon)
create policy "Cualquiera puede enviar consulta"
  on public.inquiries for insert
  with check (true);

-- Solo el dueño de la propiedad puede leer sus consultas
create policy "Dueño lee consultas de sus propiedades"
  on public.inquiries for select
  using (
    auth.uid() = (
      select owner_id from public.properties
      where id = property_id
    )
  );

-- Solo el dueño puede marcar consultas como leídas
create policy "Dueño actualiza consultas de sus propiedades"
  on public.inquiries for update
  using (
    auth.uid() = (
      select owner_id from public.properties
      where id = property_id
    )
  );

-- --- Storage policies ---
-- Lectura pública de fotos
create policy "Fotos públicas"
  on storage.objects for select
  using (bucket_id = 'property-photos');

-- Solo usuarios autenticados pueden subir fotos
create policy "Usuarios autenticados suben fotos"
  on storage.objects for insert
  with check (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

-- Solo el propietario del archivo puede actualizarlo/borrarlo
-- (el path debe empezar con su user id: {owner_id}/...)
create policy "Usuarios borran sus propias fotos"
  on storage.objects for delete
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
