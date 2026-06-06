-- ============================================================
-- Blog
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  titulo           text not null,
  resumen          text,
  contenido        text not null default '',          -- Markdown
  cover            text,                               -- URL de portada
  categoria        text,
  autor            text not null default 'Eugenio Nielsen',
  status           text not null default 'borrador' check (status in ('borrador','publicado')),
  meta_title       text,
  meta_description text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_posts_status on public.posts(status);
create index if not exists idx_posts_published on public.posts(published_at desc);

-- updated_at automático (reusa la función existente handle_updated_at)
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.posts enable row level security;

-- Lectura pública SOLO de notas publicadas
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts
  for select using (status = 'publicado');

-- Escritura: solo service role (admin client) → sin policies de insert/update/delete.

-- ── Storage: bucket para imágenes del blog ──────────────────
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;
