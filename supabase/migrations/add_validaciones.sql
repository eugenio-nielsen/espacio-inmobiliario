-- ============================================================
-- Migración: validación de identidad y de dominio
-- Correr en: Supabase Dashboard → SQL Editor
--
-- Dos validaciones distintas, con alcances distintos a propósito:
--
--   IDENTIDAD → va en el PERFIL. Es "esta persona es quien dice ser".
--               Se prueba una vez con DNI / pasaporte / registro.
--
--   DOMINIO   → va en la PROPIEDAD. Es "esta persona es dueña de ESTE
--               inmueble". La escritura es de una propiedad concreta,
--               así que la validación tiene que serlo también: si fuera
--               por usuario, alguien podría validar una propiedad real
--               y quedarse con el badge en publicaciones falsas, que es
--               justo lo que queremos evitar.
--
-- Ambas se aprueban a mano desde el panel de superadmin.
-- ============================================================

-- ── 1. Estados posibles ───────────────────────────────────────
-- sin_enviar → pendiente → aprobada | rechazada
do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_validacion') then
    create type public.estado_validacion as enum
      ('sin_enviar', 'pendiente', 'aprobada', 'rechazada');
  end if;
end $$;

-- ── 2. Identidad (perfil) ─────────────────────────────────────
alter table public.profiles
  add column if not exists identidad_estado      public.estado_validacion not null default 'sin_enviar',
  -- 'dni' | 'pasaporte' | 'registro'
  add column if not exists identidad_tipo_doc    text,
  -- rutas dentro del bucket privado `documentos` (no son URLs públicas)
  add column if not exists identidad_frente      text,
  add column if not exists identidad_dorso       text,
  add column if not exists identidad_enviada_at  timestamptz,
  add column if not exists identidad_revisada_at timestamptz,
  add column if not exists identidad_motivo      text;

-- ── 3. Dominio (propiedad) ────────────────────────────────────
alter table public.properties
  add column if not exists dominio_estado      public.estado_validacion not null default 'sin_enviar',
  add column if not exists dominio_archivo     text,
  add column if not exists dominio_enviada_at  timestamptz,
  add column if not exists dominio_revisada_at timestamptz,
  add column if not exists dominio_motivo      text;

-- Para que el superadmin encuentre rápido lo que falta revisar
create index if not exists idx_profiles_identidad_pendiente
  on public.profiles (identidad_enviada_at)
  where identidad_estado = 'pendiente';

create index if not exists idx_properties_dominio_pendiente
  on public.properties (dominio_enviada_at)
  where dominio_estado = 'pendiente';

-- ── 4. Bucket PRIVADO para los documentos ─────────────────────
-- Ojo: `property-photos` es público. Acá van documentos de identidad
-- y escrituras, así que el bucket NO puede ser público: se leen con
-- URLs firmadas de corta duración generadas en el servidor.
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do update set public = false;

-- Cada quien escribe y lee solo dentro de su propia carpeta ({user_id}/…).
-- El superadmin no usa estas policies: entra con service role.
drop policy if exists "Sube sus propios documentos" on storage.objects;
create policy "Sube sus propios documentos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Lee sus propios documentos" on storage.objects;
create policy "Lee sus propios documentos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Para poder reemplazar un documento rechazado
drop policy if exists "Borra sus propios documentos" on storage.objects;
create policy "Borra sus propios documentos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 5. El dueño NO puede aprobarse solo ───────────────────────
-- Las policies de UPDATE dejan al dueño editar sus propias filas, así
-- que sin esto podría marcarse 'aprobada' por su cuenta.
--
-- Lo que SÍ puede hacer el dueño: pasar de sin_enviar/rechazada a
-- 'pendiente' (es el envío) y limpiar el motivo del rechazo anterior.
-- Lo que NO: poner 'aprobada' o 'rechazada', o tocar la fecha de
-- revisión. Eso queda solo para el service role (el superadmin).
create or replace function public.proteger_validaciones()
returns trigger
language plpgsql
security definer
as $$
declare
  es_admin boolean;
begin
  -- Dos señales porque según la versión de Supabase/PostgREST puede
  -- estar una u otra: PostgREST hace SET LOCAL ROLE service_role, y
  -- auth.role() lo lee del JWT. Si alguna dice service_role, es el
  -- superadmin entrando con el service key.
  es_admin := (
    coalesce(current_setting('role', true), '') = 'service_role'
    or coalesce(auth.role()::text, '') = 'service_role'
  );

  if es_admin then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    -- Único cambio de estado permitido al dueño: enviar a revisión
    if not (new.identidad_estado = 'pendiente'
            and old.identidad_estado in ('sin_enviar', 'rechazada')) then
      new.identidad_estado := old.identidad_estado;
    end if;
    new.identidad_revisada_at := old.identidad_revisada_at;
    -- Al reenviar se limpia el motivo del rechazo anterior
    if new.identidad_estado = 'pendiente' and old.identidad_estado <> 'pendiente' then
      new.identidad_motivo := null;
    else
      new.identidad_motivo := old.identidad_motivo;
    end if;

  elsif tg_table_name = 'properties' then
    if not (new.dominio_estado = 'pendiente'
            and old.dominio_estado in ('sin_enviar', 'rechazada')) then
      new.dominio_estado := old.dominio_estado;
    end if;
    new.dominio_revisada_at := old.dominio_revisada_at;
    if new.dominio_estado = 'pendiente' and old.dominio_estado <> 'pendiente' then
      new.dominio_motivo := null;
    else
      new.dominio_motivo := old.dominio_motivo;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_proteger_identidad on public.profiles;
create trigger trg_proteger_identidad
  before update on public.profiles
  for each row execute function public.proteger_validaciones();

drop trigger if exists trg_proteger_dominio on public.properties;
create trigger trg_proteger_dominio
  before update on public.properties
  for each row execute function public.proteger_validaciones();
