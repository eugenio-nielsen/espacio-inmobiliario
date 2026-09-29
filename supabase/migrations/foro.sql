-- ============================================================
-- Tertulia Inmobiliaria · el foro (/foro)
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que la usa.
--
-- Criterios:
--   · Lectura pública de lo publicado (RLS). Escritura SOLO por el
--     service role, desde las Server Actions: ahí se validan sesión,
--     límites por hora, antispam y email confirmado. Si hubiera
--     policies de insert, cualquiera con la anon key podría saltearse
--     todo eso pegándole directo a la API.
--   · El perfil público del foro vive en foro_miembros y no en
--     profiles, para no exponer email ni teléfono. Las columnas
--     privadas (avisos, suspensión, matrícula) no se leen con la
--     anon key: el GRANT de SELECT es por columna.
--   · Los contadores (respuestas, votos, última actividad) los
--     mantienen triggers que recuentan: nunca se desfasan.
-- ============================================================

-- ── 1. Miembros ──────────────────────────────────────────────
create table if not exists public.foro_miembros (
  id                   uuid primary key references public.profiles(id) on delete cascade,
  alias                text not null check (char_length(alias) between 2 and 40),
  handle               text not null unique
                       check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(handle) between 2 and 48),
  rol                  text check (rol in ('compra','vende','profesional','estudiante','otro')),
  bio                  text check (char_length(bio) <= 280),
  avatar_url           text,
  -- "Profesional verificado": lo otorga solo el superadmin
  verificado           boolean not null default false,
  matricula            text check (char_length(matricula) <= 120),
  verificacion_estado  text not null default 'sin_pedir'
                       check (verificacion_estado in ('sin_pedir','pendiente','aprobada','rechazada')),
  -- Respuestas de Espacio Inmobiliario (la cuenta del superadmin)
  equipo               boolean not null default false,
  suspendido           boolean not null default false,
  avisos_email         boolean not null default true,
  email_verificado_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_foro_miembros_updated_at on public.foro_miembros;
create trigger trg_foro_miembros_updated_at
  before update on public.foro_miembros
  for each row execute function public.handle_updated_at();

-- ── 2. Temas ─────────────────────────────────────────────────
create table if not exists public.foro_temas (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  categoria              text not null check (categoria in (
                           'comprar','vender','creditos-hipotecarios','escrituras-y-tramites',
                           'tasaciones','propiedad-horizontal','consorcio-y-expensas','reformas')),
  autor_id               uuid not null references public.foro_miembros(id) on delete cascade,
  titulo                 text not null check (char_length(titulo) between 10 and 140),
  cuerpo                 text not null check (char_length(cuerpo) between 20 and 10000),
  fotos                  text[] not null default '{}' check (cardinality(fotos) <= 4),
  -- pendiente: espera que el autor confirme su email
  estado                 text not null default 'publicado' check (estado in ('pendiente','publicado','oculto')),
  fijado                 boolean not null default false,
  respuesta_aceptada_id  uuid,
  votos                  integer not null default 0,
  respuestas             integer not null default 0,
  vistas                 integer not null default 0,
  ultima_actividad_at    timestamptz not null default now(),
  editado_at             timestamptz,
  created_at             timestamptz not null default now(),
  busqueda               tsvector
);

create index if not exists idx_foro_temas_actividad on public.foro_temas (estado, fijado desc, ultima_actividad_at desc);
create index if not exists idx_foro_temas_categoria on public.foro_temas (categoria, estado, ultima_actividad_at desc);
create index if not exists idx_foro_temas_creado    on public.foro_temas (estado, created_at desc);
create index if not exists idx_foro_temas_autor     on public.foro_temas (autor_id);
create index if not exists idx_foro_temas_busqueda  on public.foro_temas using gin (busqueda);

-- ── 3. Respuestas ────────────────────────────────────────────
create table if not exists public.foro_respuestas (
  id          uuid primary key default gen_random_uuid(),
  tema_id     uuid not null references public.foro_temas(id) on delete cascade,
  autor_id    uuid not null references public.foro_miembros(id) on delete cascade,
  cuerpo      text not null check (char_length(cuerpo) between 2 and 10000),
  fotos       text[] not null default '{}' check (cardinality(fotos) <= 4),
  estado      text not null default 'publicado' check (estado in ('pendiente','publicado','oculto')),
  votos       integer not null default 0,
  editado_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_foro_respuestas_tema  on public.foro_respuestas (tema_id, created_at);
create index if not exists idx_foro_respuestas_autor on public.foro_respuestas (autor_id);

-- La respuesta elegida como solución. Si se borra, el tema vuelve a "sin resolver".
alter table public.foro_temas drop constraint if exists foro_temas_respuesta_aceptada_fkey;
alter table public.foro_temas
  add constraint foro_temas_respuesta_aceptada_fkey
  foreign key (respuesta_aceptada_id) references public.foro_respuestas(id) on delete set null;

-- ── 4. Comentarios (un nivel, debajo de cada respuesta) ──────
create table if not exists public.foro_comentarios (
  id            uuid primary key default gen_random_uuid(),
  respuesta_id  uuid not null references public.foro_respuestas(id) on delete cascade,
  tema_id       uuid not null references public.foro_temas(id) on delete cascade,
  autor_id      uuid not null references public.foro_miembros(id) on delete cascade,
  cuerpo        text not null check (char_length(cuerpo) between 2 and 800),
  estado        text not null default 'publicado' check (estado in ('pendiente','publicado','oculto')),
  editado_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_foro_comentarios_respuesta on public.foro_comentarios (respuesta_id, created_at);
create index if not exists idx_foro_comentarios_tema      on public.foro_comentarios (tema_id);
create index if not exists idx_foro_comentarios_autor     on public.foro_comentarios (autor_id);

-- ── 5. Votos (solo "flechita arriba") ────────────────────────
create table if not exists public.foro_votos (
  miembro_id    uuid not null references public.foro_miembros(id) on delete cascade,
  tema_id       uuid references public.foro_temas(id) on delete cascade,
  respuesta_id  uuid references public.foro_respuestas(id) on delete cascade,
  created_at    timestamptz not null default now(),
  check ((tema_id is null) <> (respuesta_id is null))
);

create unique index if not exists uq_foro_votos_tema      on public.foro_votos (miembro_id, tema_id) where tema_id is not null;
create unique index if not exists uq_foro_votos_respuesta on public.foro_votos (miembro_id, respuesta_id) where respuesta_id is not null;
create index if not exists idx_foro_votos_tema      on public.foro_votos (tema_id);
create index if not exists idx_foro_votos_respuesta on public.foro_votos (respuesta_id);

-- ── 6. Reportes ──────────────────────────────────────────────
create table if not exists public.foro_reportes (
  id             uuid primary key default gen_random_uuid(),
  reportante_id  uuid references public.foro_miembros(id) on delete set null,
  tipo           text not null check (tipo in ('tema','respuesta','comentario')),
  objetivo_id    uuid not null,
  motivo         text not null check (motivo in ('spam','ofensivo','publicidad','datos_personales','otro')),
  detalle        text check (char_length(detalle) <= 500),
  estado         text not null default 'abierto' check (estado in ('abierto','resuelto','descartado')),
  created_at     timestamptz not null default now(),
  unique (reportante_id, tipo, objetivo_id)
);

create index if not exists idx_foro_reportes_estado on public.foro_reportes (estado, created_at desc);

-- ============================================================
-- Triggers
-- ============================================================

-- Búsqueda: título (peso A) + cuerpo (peso B), en español y sin tildes.
-- Las tildes se sacan con translate() para no depender de la extensión
-- unaccent; el buscador hace lo mismo con la consulta antes de enviarla.
create or replace function public.foro_sin_tildes(t text)
returns text language sql immutable parallel safe as $$
  select translate(lower(coalesce(t, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc');
$$;

create or replace function public.foro_tr_busqueda()
returns trigger language plpgsql as $$
begin
  new.busqueda :=
    setweight(to_tsvector('spanish', public.foro_sin_tildes(new.titulo)), 'A') ||
    setweight(to_tsvector('spanish', public.foro_sin_tildes(new.cuerpo)), 'B');
  return new;
end $$;

drop trigger if exists trg_foro_temas_busqueda on public.foro_temas;
create trigger trg_foro_temas_busqueda
  before insert or update of titulo, cuerpo on public.foro_temas
  for each row execute function public.foro_tr_busqueda();

-- Recuento de respuestas y última actividad del tema (solo lo publicado)
create or replace function public.foro_recalcular_tema(p_tema uuid)
returns void language sql security definer set search_path = public as $$
  update public.foro_temas t set
    respuestas = (
      select count(*) from public.foro_respuestas r
      where r.tema_id = t.id and r.estado = 'publicado'
    ),
    ultima_actividad_at = greatest(
      t.created_at,
      coalesce((select max(r.created_at) from public.foro_respuestas r
                where r.tema_id = t.id and r.estado = 'publicado'), t.created_at),
      coalesce((select max(c.created_at) from public.foro_comentarios c
                where c.tema_id = t.id and c.estado = 'publicado'), t.created_at)
    )
  where t.id = p_tema;
$$;

create or replace function public.foro_tr_recalcular()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.foro_recalcular_tema(old.tema_id);
    return old;
  end if;
  perform public.foro_recalcular_tema(new.tema_id);
  return new;
end $$;

drop trigger if exists trg_foro_respuestas_recalcular on public.foro_respuestas;
create trigger trg_foro_respuestas_recalcular
  after insert or update of estado, created_at or delete on public.foro_respuestas
  for each row execute function public.foro_tr_recalcular();

drop trigger if exists trg_foro_comentarios_recalcular on public.foro_comentarios;
create trigger trg_foro_comentarios_recalcular
  after insert or update of estado, created_at or delete on public.foro_comentarios
  for each row execute function public.foro_tr_recalcular();

-- Recuento de votos del tema o la respuesta
create or replace function public.foro_tr_votos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tema uuid;
  v_respuesta uuid;
begin
  if tg_op = 'DELETE' then
    v_tema := old.tema_id; v_respuesta := old.respuesta_id;
  else
    v_tema := new.tema_id; v_respuesta := new.respuesta_id;
  end if;

  if v_tema is not null then
    update public.foro_temas
      set votos = (select count(*) from public.foro_votos where tema_id = v_tema)
      where id = v_tema;
  else
    update public.foro_respuestas
      set votos = (select count(*) from public.foro_votos where respuesta_id = v_respuesta)
      where id = v_respuesta;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_foro_votos on public.foro_votos;
create trigger trg_foro_votos
  after insert or delete on public.foro_votos
  for each row execute function public.foro_tr_votos();

-- ============================================================
-- Funciones que usa el sitio (solo el service role las llama)
-- ============================================================

create or replace function public.foro_sumar_vista(p_tema uuid)
returns void language sql security definer set search_path = public as $$
  update public.foro_temas set vistas = vistas + 1
  where id = p_tema and estado = 'publicado';
$$;

-- Temas publicados por categoría, para el índice de la portada
create or replace function public.foro_conteo_categorias()
returns table (categoria text, temas bigint)
language sql stable security definer set search_path = public as $$
  select categoria, count(*) from public.foro_temas
  where estado = 'publicado'
  group by categoria;
$$;

revoke execute on function public.foro_sumar_vista(uuid) from public, anon, authenticated;
revoke execute on function public.foro_recalcular_tema(uuid) from public, anon, authenticated;
grant execute on function public.foro_conteo_categorias() to anon, authenticated;

-- ============================================================
-- RLS
-- ============================================================
alter table public.foro_miembros    enable row level security;
alter table public.foro_temas       enable row level security;
alter table public.foro_respuestas  enable row level security;
alter table public.foro_comentarios enable row level security;
alter table public.foro_votos       enable row level security;
alter table public.foro_reportes    enable row level security;

-- Nadie escribe con la anon key: todo pasa por el service role
revoke insert, update, delete on
  public.foro_miembros, public.foro_temas, public.foro_respuestas,
  public.foro_comentarios, public.foro_votos, public.foro_reportes
  from anon, authenticated;

-- Miembros: perfil público, columna por columna
drop policy if exists "foro_miembros_lectura" on public.foro_miembros;
create policy "foro_miembros_lectura" on public.foro_miembros
  for select using (true);
revoke select on public.foro_miembros from anon, authenticated;
grant select (id, alias, handle, rol, bio, avatar_url, verificado, equipo, created_at)
  on public.foro_miembros to anon, authenticated;

-- Temas, respuestas y comentarios: solo lo publicado, y dentro de un tema publicado
drop policy if exists "foro_temas_lectura" on public.foro_temas;
create policy "foro_temas_lectura" on public.foro_temas
  for select using (estado = 'publicado');

drop policy if exists "foro_respuestas_lectura" on public.foro_respuestas;
create policy "foro_respuestas_lectura" on public.foro_respuestas
  for select using (
    estado = 'publicado'
    and exists (select 1 from public.foro_temas t where t.id = tema_id and t.estado = 'publicado')
  );

drop policy if exists "foro_comentarios_lectura" on public.foro_comentarios;
create policy "foro_comentarios_lectura" on public.foro_comentarios
  for select using (
    estado = 'publicado'
    and exists (select 1 from public.foro_temas t where t.id = tema_id and t.estado = 'publicado')
  );

-- Votos: cada uno ve los suyos
drop policy if exists "foro_votos_propios" on public.foro_votos;
create policy "foro_votos_propios" on public.foro_votos
  for select using (miembro_id = auth.uid());

-- Reportes: sin policies → solo el service role

-- ============================================================
-- Storage: fotos de temas y respuestas, y avatares
-- Público para leer; se sube solo desde el servidor (service role).
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foro-imagenes', 'foro-imagenes', true, 5242880,
        array['image/webp','image/jpeg','image/png','image/gif'])
on conflict (id) do nothing;

-- ============================================================
-- FIN
-- ============================================================
